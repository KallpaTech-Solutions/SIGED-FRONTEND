import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ChevronLeft,
  GitBranch,
  LayoutGrid,
  Loader2,
  Shuffle,
  Trophy,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  fetchCompetitionAdminById,
  fetchPhasesByCompetition,
  fetchTournamentById,
  generatePlayoffsFromGroups,
  promoteKnockoutWinners,
  setupCompetitionFormat,
} from "../../api/tournamentsAdminService";
import { fetchCompetitionPublicDashboard } from "../../api/tournamentsPublicService";
import CompetitionDashboard from "../../components/tournaments/CompetitionDashboard";
import { genderLabel } from "../../utils/tournamentEnums";

/** Vista previa de tamaños de grupo (misma lógica que el backend). */
function previewGroupSizes(totalTeams, maxPerGroup) {
  if (totalTeams < 2 || maxPerGroup < 2) return [];
  const g = Math.ceil(totalTeams / maxPerGroup);
  const q = Math.floor(totalTeams / g);
  const r = totalTeams % g;
  const sizes = [];
  for (let i = 0; i < g; i += 1) sizes.push(q + (i < r ? 1 : 0));
  return sizes;
}

function phaseOrder(p) {
  return p.order ?? p.Order ?? 0;
}

function isDirectEliminationPhase(p) {
  return !!(p.isDirectElimination ?? p.IsDirectElimination);
}

function phaseId(p) {
  return String(p.id ?? p.Id ?? "");
}

function phaseLabel(p) {
  return p.name ?? p.Name ?? "Fase";
}

/** Clasificados actuales según tablas del dashboard público (mismo criterio que el backend). */
function buildQualifiedFromDashboard(dashboard) {
  if (!dashboard) return [];
  const phList = dashboard.phases ?? dashboard.Phases ?? [];
  const rr = phList.find((x) => (x.mode ?? x.Mode) === "roundRobin");
  if (!rr) return [];
  const groups = rr.groups ?? rr.Groups ?? [];
  const out = [];
  for (const g of groups) {
    const q = g.qualifiedCount ?? g.QualifiedCount ?? 2;
    const standings = g.standings ?? g.Standings ?? [];
    for (let i = 0; i < Math.min(q, standings.length); i += 1) {
      const row = standings[i];
      const tid = row.teamId ?? row.TeamId;
      const name = row.teamName ?? row.TeamName ?? "—";
      const gname = g.name ?? g.Name ?? "";
      out.push({ teamId: String(tid), teamName: name, groupName: gname });
    }
  }
  return out;
}

function suggestedSnakePairings(qualified) {
  const n = qualified.length;
  const pairs = [];
  for (let i = 0; i < Math.floor(n / 2); i += 1) {
    pairs.push({
      localId: qualified[i].teamId,
      visitorId: qualified[n - 1 - i].teamId,
    });
  }
  return pairs;
}

/** Competencias sin reglas FORMAT_SETUP_*: aproximamos desde tablero y fases. */
function inferFormatFromDashboard(dashboard, phasesList) {
  if (!dashboard) return null;
  const phList = dashboard.phases ?? dashboard.Phases ?? [];
  const rr = phList.find((x) => (x.mode ?? x.Mode) === "roundRobin");
  if (rr) {
    const groups = rr.groups ?? rr.Groups ?? [];
    const sizes = groups
      .map((g) => (g.standings ?? g.Standings ?? []).length)
      .filter((n) => n > 0);
    if (sizes.length === 0) return null;
    const q0 = groups[0]?.qualifiedCount ?? groups[0]?.QualifiedCount ?? 2;
    return {
      mode: "groups",
      maxTeamsPerGroup: Math.max(2, ...sizes),
      qualifiedPerGroup: Math.max(1, q0),
      groupPhaseName: rr.name ?? rr.Name ?? "Fase de grupos",
    };
  }
  const allElim =
    Array.isArray(phasesList) &&
    phasesList.length > 0 &&
    phasesList.every(isDirectEliminationPhase);
  if (allElim) {
    const ordered = [...phasesList].sort(
      (a, b) => phaseOrder(a) - phaseOrder(b)
    );
    return {
      mode: "knockout",
      knockoutPhaseName: phaseLabel(ordered[0]) || "Eliminatoria",
    };
  }
  const ko = phList.find((x) => (x.mode ?? x.Mode) === "knockout");
  if (ko) {
    return {
      mode: "knockout",
      knockoutPhaseName: ko.name ?? ko.Name ?? "Eliminatoria",
    };
  }
  return null;
}

/** Mensaje claro para 401/403 en acciones que exigen JWT (a diferencia de GET públicos). */
function toastFixtureActionError(err, fallback, toastFn) {
  const status = err?.response?.status;
  if (status === 401) {
    toastFn(
      "No estás autenticado o la sesión expiró. Iniciá sesión de nuevo y reintentá.",
      "error"
    );
    return;
  }
  if (status === 403) {
    toastFn(
      "No tenés permiso para esta acción (se requiere gestión, configuración de fases o fixture).",
      "error"
    );
    return;
  }
  const raw = err?.response?.data;
  const msg =
    (typeof raw === "string" ? raw : null) ??
    raw?.message ??
    raw?.detail ??
    err?.message ??
    fallback;
  toastFn(typeof msg === "string" ? msg : fallback, "error");
}

function normTeamIds(competition) {
  const rows =
    competition?.competitionTeams ?? competition?.CompetitionTeams ?? [];
  if (!Array.isArray(rows)) return [];
  const ids = [];
  for (const ct of rows) {
    const team = ct.team ?? ct.Team;
    const tid = team?.id ?? team?.Id ?? ct.teamId ?? ct.TeamId;
    const active = team?.isActive ?? team?.IsActive ?? true;
    if (tid && active) ids.push(String(tid));
  }
  return [...new Set(ids)];
}

export default function CompetenciaFixtureSetupPage() {
  const { tournamentId, competitionId } = useParams();
  const { can } = useAuth();
  const { toast } = useToast();
  const canFixtureSetup =
    can("tourn.manage") || can("tourn.config") || can("tourn.fixture");

  const [loading, setLoading] = useState(true);
  const [competition, setCompetition] = useState(null);
  const [tournamentName, setTournamentName] = useState("");
  const [phases, setPhases] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [mode, setMode] = useState("groups"); // groups | knockout
  const [maxTeamsPerGroup, setMaxTeamsPerGroup] = useState(4);
  const [shuffleTeams, setShuffleTeams] = useState(true);
  const [qualifiedPerGroup, setQualifiedPerGroup] = useState(2);
  const [groupPhaseName, setGroupPhaseName] = useState("Fase de grupos");
  const [autoRR, setAutoRR] = useState(true);
  const [knockoutPhaseName, setKnockoutPhaseName] = useState("Eliminatoria");
  const [knockoutRandom, setKnockoutRandom] = useState(true);

  const [playoffPhaseName, setPlayoffPhaseName] = useState("Eliminatoria");
  const [playoffPairingMode, setPlayoffPairingMode] = useState("auto");
  const [manualPairs, setManualPairs] = useState([]);
  const [sourceGroupPhaseId, setSourceGroupPhaseId] = useState("");
  const [playoffSubmitting, setPlayoffSubmitting] = useState(false);

  const [promotePhaseId, setPromotePhaseId] = useState("");
  const [promoteNextName, setPromoteNextName] = useState("Semifinales");
  const [promoteSubmitting, setPromoteSubmitting] = useState(false);

  /** null | "snapshot" (guardado en servidor) | "inferred" (competencias viejas) */
  const [formatSetupSource, setFormatSetupSource] = useState(null);

  const load = useCallback(async () => {
    if (!competitionId || !tournamentId) return;
    setLoading(true);
    try {
      const [comp, tourn, ph] = await Promise.all([
        fetchCompetitionAdminById(competitionId),
        fetchTournamentById(tournamentId),
        fetchPhasesByCompetition(competitionId),
      ]);
      setCompetition(comp);
      setTournamentName(tourn?.name ?? tourn?.Name ?? "");
      setPhases(Array.isArray(ph) ? ph : []);
    } catch (e) {
      toast(
        e?.response?.data?.message ||
          "No se pudo cargar la competencia.",
        "error"
      );
      setCompetition(null);
    } finally {
      setLoading(false);
    }
  }, [competitionId, tournamentId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!competitionId || phases.length === 0) {
      setDashboard(null);
      setDashboardLoading(false);
      return undefined;
    }
    let cancelled = false;
    setDashboardLoading(true);
    (async () => {
      try {
        const dash = await fetchCompetitionPublicDashboard(competitionId);
        if (!cancelled) setDashboard(dash);
      } catch {
        if (!cancelled) setDashboard(null);
      } finally {
        if (!cancelled) setDashboardLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [competitionId, phases]);

  const teamIds = useMemo(
    () => (competition ? normTeamIds(competition) : []),
    [competition]
  );
  const teamCount = teamIds.length;

  const groupPhases = useMemo(
    () =>
      [...phases]
        .filter((p) => !isDirectEliminationPhase(p))
        .sort((a, b) => phaseOrder(a) - phaseOrder(b)),
    [phases]
  );

  const elimPhases = useMemo(
    () =>
      [...phases]
        .filter(isDirectEliminationPhase)
        .sort((a, b) => phaseOrder(a) - phaseOrder(b)),
    [phases]
  );

  const hasPhases = phases.length > 0;
  const showGeneratePlayoff = groupPhases.length > 0 && elimPhases.length === 0;
  const showPromote = elimPhases.length > 0;

  const qualifiedPreview = useMemo(
    () => buildQualifiedFromDashboard(dashboard),
    [dashboard]
  );

  const oddQualifiedCount =
    qualifiedPreview.length > 0 && qualifiedPreview.length % 2 === 1;

  const autoPairPreview = useMemo(() => {
    if (qualifiedPreview.length < 2) return [];
    return suggestedSnakePairings(qualifiedPreview).map((pair, idx) => {
      const loc = qualifiedPreview.find((t) => t.teamId === pair.localId);
      const vis = qualifiedPreview.find((t) => t.teamId === pair.visitorId);
      return {
        key: idx,
        localLabel: loc
          ? `${loc.teamName} (${loc.groupName})`
          : pair.localId,
        visitorLabel: vis
          ? `${vis.teamName} (${vis.groupName})`
          : pair.visitorId,
      };
    });
  }, [qualifiedPreview]);

  useEffect(() => {
    if (!showGeneratePlayoff || groupPhases.length === 0) return;
    setSourceGroupPhaseId((prev) => {
      if (prev && groupPhases.some((p) => phaseId(p) === prev)) return prev;
      return phaseId(groupPhases[0]);
    });
  }, [showGeneratePlayoff, groupPhases]);

  useEffect(() => {
    if (elimPhases.length === 0) return;
    setPromotePhaseId((prev) => {
      const last = phaseId(elimPhases[elimPhases.length - 1]);
      if (prev && elimPhases.some((p) => phaseId(p) === prev)) return prev;
      return last;
    });
  }, [elimPhases]);

  useEffect(() => {
    if (playoffPairingMode !== "manual") return;
    if (qualifiedPreview.length < 2 || oddQualifiedCount) return;
    setManualPairs(suggestedSnakePairings(qualifiedPreview));
  }, [playoffPairingMode, qualifiedPreview, oddQualifiedCount]);

  useEffect(() => {
    if (oddQualifiedCount && playoffPairingMode === "manual") {
      setPlayoffPairingMode("auto");
    }
  }, [oddQualifiedCount, playoffPairingMode]);

  useEffect(() => {
    if (!competition) return;
    if (phases.length === 0) {
      setFormatSetupSource(null);
      return;
    }

    const fs = competition.formatSetup ?? competition.FormatSetup;
    if (fs && typeof fs === "object" && Object.keys(fs).length > 0) {
      const modeStr =
        fs.FORMAT_SETUP_MODE ?? fs["FORMAT_SETUP_MODE"];
      if (modeStr === "DirectElimination") {
        setMode("knockout");
        const name = fs.FORMAT_SETUP_KNOCKOUT_PHASE_NAME;
        if (typeof name === "string" && name.trim())
          setKnockoutPhaseName(name.trim());
        setKnockoutRandom(
          String(
            fs.FORMAT_SETUP_KNOCKOUT_RANDOM ??
              fs["FORMAT_SETUP_KNOCKOUT_RANDOM"]
          )
            .toLowerCase() === "true"
        );
      } else if (modeStr === "GroupStageRoundRobin") {
        setMode("groups");
        const mx = parseInt(
          String(
            fs.FORMAT_SETUP_GROUPS_MAX_PER_GROUP ??
              fs["FORMAT_SETUP_GROUPS_MAX_PER_GROUP"]
          ),
          10
        );
        if (!Number.isNaN(mx) && mx >= 2) setMaxTeamsPerGroup(mx);
        const q = parseInt(
          String(
            fs.FORMAT_SETUP_GROUPS_QUALIFIED_PER_GROUP ??
              fs["FORMAT_SETUP_GROUPS_QUALIFIED_PER_GROUP"]
          ),
          10
        );
        if (!Number.isNaN(q) && q >= 1) setQualifiedPerGroup(q);
        setShuffleTeams(
          String(
            fs.FORMAT_SETUP_GROUPS_SHUFFLE ?? fs["FORMAT_SETUP_GROUPS_SHUFFLE"]
          )
            .toLowerCase() === "true"
        );
        setAutoRR(
          String(
            fs.FORMAT_SETUP_GROUPS_AUTO_RR ??
              fs["FORMAT_SETUP_GROUPS_AUTO_RR"]
          )
            .toLowerCase() === "true"
        );
        const gname = fs.FORMAT_SETUP_GROUPS_PHASE_NAME;
        if (typeof gname === "string" && gname.trim())
          setGroupPhaseName(gname.trim());
      }
      setFormatSetupSource("snapshot");
      return;
    }

    if (!dashboard) {
      setFormatSetupSource(null);
      return;
    }

    const inferred = inferFormatFromDashboard(dashboard, phases);
    if (!inferred) {
      setFormatSetupSource(null);
      return;
    }

    if (inferred.mode === "knockout") {
      setMode("knockout");
      if (inferred.knockoutPhaseName)
        setKnockoutPhaseName(inferred.knockoutPhaseName);
      setFormatSetupSource("inferred");
      return;
    }

    setMode("groups");
    setMaxTeamsPerGroup(inferred.maxTeamsPerGroup);
    setQualifiedPerGroup(inferred.qualifiedPerGroup);
    setGroupPhaseName(inferred.groupPhaseName);
    setFormatSetupSource("inferred");
  }, [competition, phases, dashboard]);

  const sizesPreview = useMemo(
    () => previewGroupSizes(teamCount, maxTeamsPerGroup),
    [teamCount, maxTeamsPerGroup]
  );

  const title = useMemo(() => {
    if (!competition) return "Competencia";
    const d =
      competition.discipline ?? competition.Discipline ?? {};
    const dname = d.name ?? d.Name ?? "—";
    const cat = competition.categoryName ?? competition.CategoryName;
    return cat ? `${dname} · ${cat}` : dname;
  }, [competition]);

  const gender = competition?.gender ?? competition?.Gender;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canFixtureSetup || !competitionId || teamCount < 2) return;
    if (phases.length > 0) {
      toast("Esta competencia ya tiene fases. No se puede volver a armar desde cero aquí.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const body =
        mode === "knockout"
          ? {
              mode: 1,
              teamIds,
              knockoutPhaseName: knockoutPhaseName.trim() || "Eliminatoria",
              knockoutRandomSeed: knockoutRandom,
            }
          : {
              mode: 0,
              teamIds,
              maxTeamsPerGroup: Number(maxTeamsPerGroup),
              shuffleTeams,
              qualifiedPerGroup: Number(qualifiedPerGroup),
              groupPhaseName: groupPhaseName.trim() || "Fase de grupos",
              autoGenerateRoundRobinFixtures: autoRR,
            };
      const result = await setupCompetitionFormat(competitionId, body);
      const msgs = result?.messages ?? result?.Messages;
      if (Array.isArray(msgs) && msgs.length) {
        toast(msgs.map((m) => String(m)).join(" · "), "success");
      } else {
        toast("Formato y fixture generados correctamente.", "success");
      }
      await load();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        "No se pudo generar el fixture.";
      toast(typeof msg === "string" ? msg : "Error al guardar.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGeneratePlayoff = async (e) => {
    e.preventDefault();
    if (!canFixtureSetup || !competitionId || !sourceGroupPhaseId) return;
    if (qualifiedPreview.length < 2) {
      toast(
        "Hacen falta al menos 2 clasificados según las tablas actuales.",
        "error"
      );
      return;
    }
    if (playoffPairingMode === "manual") {
      if (oddQualifiedCount) {
        toast(
          "Con clasificados impares usá modo automático (incluye tanda libre).",
          "error"
        );
        return;
      }
      const used = new Set();
      for (const row of manualPairs) {
        if (!row.localId || !row.visitorId) {
          toast("Completá todos los cruces manuales.", "error");
          return;
        }
        if (row.localId === row.visitorId) {
          toast("Local y visitante no pueden ser el mismo equipo.", "error");
          return;
        }
        if (used.has(row.localId) || used.has(row.visitorId)) {
          toast("Cada equipo solo puede aparecer en un cruce.", "error");
          return;
        }
        used.add(row.localId);
        used.add(row.visitorId);
      }
      if (used.size !== qualifiedPreview.length) {
        toast(
          "Debés incluir todos los clasificados exactamente una vez.",
          "error"
        );
        return;
      }
    }
    setPlayoffSubmitting(true);
    try {
      const body = {
        competitionId,
        sourcePhaseId: sourceGroupPhaseId,
        newPhaseName: playoffPhaseName.trim() || "Eliminatoria",
        isDoubleLeg: false,
      };
      if (playoffPairingMode === "manual") {
        body.manualPairings = manualPairs.map((x) => ({
          localTeamId: x.localId,
          visitorTeamId: x.visitorId,
        }));
      }
      const res = await generatePlayoffsFromGroups(body);
      toast(res?.message ?? "Eliminatoria generada.", "success");
      await load();
      try {
        const dash = await fetchCompetitionPublicDashboard(competitionId);
        setDashboard(dash);
      } catch {
        /* ignore */
      }
    } catch (err) {
      toastFixtureActionError(err, "No se pudo generar la llave.", toast);
    } finally {
      setPlayoffSubmitting(false);
    }
  };

  const handlePromoteWinners = async (e) => {
    e.preventDefault();
    if (!canFixtureSetup || !competitionId || !promotePhaseId) return;
    setPromoteSubmitting(true);
    try {
      const body = {
        competitionId,
        currentPhaseId: promotePhaseId,
        nextPhaseName: promoteNextName.trim() || "Siguiente ronda",
      };
      const res = await promoteKnockoutWinners(body);
      toast(res?.message ?? "Ronda generada.", "success");
      await load();
      try {
        const dash = await fetchCompetitionPublicDashboard(competitionId);
        setDashboard(dash);
      } catch {
        /* ignore */
      }
    } catch (err) {
      toastFixtureActionError(err, "No se pudo promover ganadores.", toast);
    } finally {
      setPromoteSubmitting(false);
    }
  };

  if (!canFixtureSetup) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-6 text-amber-900 text-sm">
        No tenés permiso para configurar grupos o fixture (se requiere gestión de torneo,
        configuración de fases o fixture).
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-slate-500">
        <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
        <span className="text-sm font-semibold">Cargando competencia…</span>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-red-800 text-sm">
        No se encontró la competencia.
        <Link
          to={`/PanelControl/torneos/${tournamentId}`}
          className="block mt-3 font-bold text-emerald-800 underline"
        >
          Volver al torneo
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-inter pb-10">
      <div className="max-w-2xl mx-auto space-y-6">
      <Link
        to={`/PanelControl/torneos/${tournamentId}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:underline"
      >
        <ChevronLeft className="w-4 h-4" />
        Volver a {tournamentName || "torneo"}
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Configuración de formato
            </p>
            <h1 className="text-xl font-bold text-slate-900">{title}</h1>
            <p className="text-sm text-slate-600 mt-1">
              {genderLabel(gender)} ·{" "}
              <span className="font-semibold text-slate-800">
                {teamCount} equipo{teamCount === 1 ? "" : "s"} inscripto
                {teamCount === 1 ? "" : "s"}
              </span>
            </p>
          </div>
        </div>

        {teamCount < 2 && (
          <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm mb-4">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>
              Hacen falta al menos <strong>2 equipos inscriptos</strong> para
              generar el fixture. Inscribí equipos desde la vitrina o el panel
              de delegados.
            </p>
          </div>
        )}

        {hasPhases && (
          <div className="flex gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 text-sm mb-4">
            <Trophy className="w-5 h-5 shrink-0 text-emerald-700" />
            <div>
              <p className="font-semibold">Esta competencia ya tiene fases</p>
              <p className="text-xs text-slate-600 mt-1">
                El armado automático no se puede repetir desde aquí. Debajo tenés
                grupos, tablas y llaves tal como quedaron. También podés abrir la{" "}
                <Link
                  to={`/torneos/${competitionId}`}
                  className="font-bold text-emerald-700 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  vitrina pública
                </Link>
                .
              </p>
              {formatSetupSource === "snapshot" && (
                <p className="text-xs text-emerald-900 font-medium mt-2">
                  Los valores del formulario de abajo son los que guardamos al
                  generar el formato (referencia).
                </p>
              )}
              {formatSetupSource === "inferred" && (
                <p className="text-xs text-amber-900 mt-2">
                  Los valores del formulario se estiman desde los grupos
                  actuales. El tope &quot;máximo por grupo&quot; puede no coincidir
                  con el que ingresaste si la competencia es anterior; sorteo y
                  fixture Berger no se recuperan en ese caso.
                </p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <fieldset className="space-y-3">
            <legend className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              Modalidad
            </legend>
            <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 has-[:checked]:border-emerald-400 has-[:checked]:bg-emerald-50/50">
              <input
                type="radio"
                name="mode"
                checked={mode === "groups"}
                onChange={() => setMode("groups")}
                className="mt-1"
                disabled={hasPhases || teamCount < 2}
              />
              <div>
                <p className="font-bold text-slate-900">Fase de grupos (todos contra todos)</p>
                <p className="text-xs text-slate-600 mt-1">
                  Reparto equilibrado en Grupo A, B, C… (ej. 15 equipos y máx. 4
                  por grupo → 4+4+4+3). Podés sortear equipos y definir cuántos
                  pasan por grupo.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 has-[:checked]:border-emerald-400 has-[:checked]:bg-emerald-50/50">
              <input
                type="radio"
                name="mode"
                checked={mode === "knockout"}
                onChange={() => setMode("knockout")}
                className="mt-1"
                disabled={hasPhases || teamCount < 2}
              />
              <div>
                <p className="font-bold text-slate-900">Eliminación directa</p>
                <p className="text-xs text-slate-600 mt-1">
                  Llave desde el inicio con todos los equipos. Sorteo aleatorio
                  o orden manual según la lista actual de inscriptos.
                </p>
              </div>
            </label>
          </fieldset>

          {mode === "groups" && teamCount >= 2 && (
            <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Máximo de equipos por grupo
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={32}
                    value={maxTeamsPerGroup}
                    onChange={(e) =>
                      setMaxTeamsPerGroup(
                        Math.max(2, Math.min(32, Number(e.target.value) || 2))
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    disabled={hasPhases}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Clasificados por grupo
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={32}
                    value={qualifiedPerGroup}
                    onChange={(e) =>
                      setQualifiedPerGroup(
                        Math.max(1, Math.min(32, Number(e.target.value) || 1))
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    disabled={hasPhases}
                  />
                </div>
              </div>
              {sizesPreview.length > 0 && (
                <p className="text-xs text-slate-700">
                  <span className="font-semibold">Vista previa:</span>{" "}
                  {sizesPreview.length} grupo
                  {sizesPreview.length === 1 ? "" : "s"} con tamaños{" "}
                  <span className="font-mono">
                    {sizesPreview.join(" + ")}
                  </span>{" "}
                  (total {teamCount} equipos).
                </p>
              )}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Nombre de la fase
                </label>
                <input
                  type="text"
                  value={groupPhaseName}
                  onChange={(e) => setGroupPhaseName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  disabled={hasPhases}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleTeams}
                  onChange={(e) => setShuffleTeams(e.target.checked)}
                  disabled={hasPhases}
                />
                <Shuffle className="w-4 h-4 text-slate-500" />
                Sortear equipos al azar antes de armar grupos
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRR}
                  onChange={(e) => setAutoRR(e.target.checked)}
                  disabled={hasPhases}
                />
                Generar fixture round robin (Berger) en cada grupo al guardar
              </label>
            </div>
          )}

          {mode === "knockout" && teamCount >= 2 && (
            <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Nombre de la fase eliminatoria
                </label>
                <input
                  type="text"
                  value={knockoutPhaseName}
                  onChange={(e) => setKnockoutPhaseName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  disabled={hasPhases}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={knockoutRandom}
                  onChange={(e) => setKnockoutRandom(e.target.checked)}
                  disabled={hasPhases}
                />
                Cruces aleatorios (si no, se respeta el orden de la lista de
                inscriptos)
              </label>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={
                submitting || hasPhases || teamCount < 2
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Users className="w-4 h-4" />
              )}
              {submitting ? "Generando…" : "Generar formato y fixture"}
            </button>
            <Link
              to={`/torneos/${competitionId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Ver vitrina pública
            </Link>
          </div>
        </form>
      </div>
      </div>

      {hasPhases && (
        <div className="max-w-5xl mx-auto px-4 space-y-4 w-full">
          {(showGeneratePlayoff || showPromote) && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 space-y-6 shadow-sm">
              {showGeneratePlayoff && (
                <form onSubmit={handleGeneratePlayoff} className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-white text-emerald-800 border border-emerald-100">
                      <GitBranch className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Primera eliminatoria desde grupos
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Tomamos los primeros puestos de cada grupo según la tabla
                        actual. Automático: cruce estilo 1° vs último clasificado
                        en el orden Grupo A, B, C… (con dos grupos equivale a 1A
                        vs 2B y 2A vs 1B). Manual: elegís cada rival.
                      </p>
                    </div>
                  </div>

                  {groupPhases.length > 1 && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        Fase de grupos origen
                      </label>
                      <select
                        value={sourceGroupPhaseId}
                        onChange={(e) => setSourceGroupPhaseId(e.target.value)}
                        className="w-full max-w-md rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                      >
                        {groupPhases.map((p) => (
                          <option key={phaseId(p)} value={phaseId(p)}>
                            {phaseLabel(p)} (orden {phaseOrder(p)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Nombre de la fase eliminatoria
                    </label>
                    <input
                      type="text"
                      value={playoffPhaseName}
                      onChange={(e) => setPlayoffPhaseName(e.target.value)}
                      className="w-full max-w-md rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      Cruces
                    </p>
                    <label className="flex items-start gap-2 text-sm text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="playoffPairing"
                        checked={playoffPairingMode === "auto"}
                        onChange={() => setPlayoffPairingMode("auto")}
                        className="mt-0.5"
                      />
                      <span>
                        <span className="font-semibold">Automático</span>
                        {oddQualifiedCount && (
                          <span className="block text-xs text-amber-800 mt-0.5">
                            Hay cantidad impar de clasificados: se creará una tanda
                            libre automática.
                          </span>
                        )}
                      </span>
                    </label>
                    <label
                      className={`flex items-start gap-2 text-sm cursor-pointer ${
                        oddQualifiedCount
                          ? "text-slate-400"
                          : "text-slate-800"
                      }`}
                    >
                      <input
                        type="radio"
                        name="playoffPairing"
                        checked={playoffPairingMode === "manual"}
                        onChange={() => setPlayoffPairingMode("manual")}
                        disabled={oddQualifiedCount}
                        className="mt-0.5"
                      />
                      <span>
                        <span className="font-semibold">Manual</span>
                        <span className="block text-xs font-normal mt-0.5">
                          {oddQualifiedCount
                            ? "No disponible con clasificados impares."
                            : "Definí local y visitante en cada partido."}
                        </span>
                      </span>
                    </label>
                  </div>

                  {playoffPairingMode === "auto" && autoPairPreview.length > 0 && (
                    <ul className="text-xs text-slate-700 space-y-1 rounded-xl bg-white/80 border border-emerald-100 px-3 py-2">
                      {autoPairPreview.map((row) => (
                        <li key={row.key}>
                          <span className="font-semibold">{row.localLabel}</span>
                          {" vs "}
                          <span className="font-semibold">{row.visitorLabel}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {playoffPairingMode === "manual" &&
                    manualPairs.length > 0 &&
                    !oddQualifiedCount && (
                      <div className="space-y-3">
                        {manualPairs.map((pair, idx) => (
                          <div
                            key={`pair-${idx}`}
                            className="flex flex-wrap items-center gap-2 text-sm"
                          >
                            <select
                              value={pair.localId}
                              onChange={(e) => {
                                const v = e.target.value;
                                setManualPairs((rows) =>
                                  rows.map((r, j) =>
                                    j === idx ? { ...r, localId: v } : r
                                  )
                                );
                              }}
                              className="flex-1 min-w-[140px] rounded-xl border border-slate-200 px-2 py-1.5 bg-white"
                            >
                              <option value="">Local…</option>
                              {qualifiedPreview.map((t) => (
                                <option key={`${idx}-l-${t.teamId}`} value={t.teamId}>
                                  {t.teamName} ({t.groupName})
                                </option>
                              ))}
                            </select>
                            <span className="text-slate-500 font-bold">vs</span>
                            <select
                              value={pair.visitorId}
                              onChange={(e) => {
                                const v = e.target.value;
                                setManualPairs((rows) =>
                                  rows.map((r, j) =>
                                    j === idx ? { ...r, visitorId: v } : r
                                  )
                                );
                              }}
                              className="flex-1 min-w-[140px] rounded-xl border border-slate-200 px-2 py-1.5 bg-white"
                            >
                              <option value="">Visitante…</option>
                              {qualifiedPreview.map((t) => (
                                <option key={`${idx}-v-${t.teamId}`} value={t.teamId}>
                                  {t.teamName} ({t.groupName})
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}

                  {qualifiedPreview.length < 2 && (
                    <p className="text-xs text-amber-800">
                      Aún no hay suficientes clasificados en las tablas (revisá
                      cupos por grupo y partidos jugados).
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={
                      playoffSubmitting ||
                      qualifiedPreview.length < 2 ||
                      !sourceGroupPhaseId
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white text-sm font-bold hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {playoffSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trophy className="w-4 h-4" />
                    )}
                    {playoffSubmitting ? "Generando…" : "Generar llave"}
                  </button>
                </form>
              )}

              {showPromote && (
                <form
                  onSubmit={handlePromoteWinners}
                  className={`space-y-4 ${
                    showGeneratePlayoff
                      ? "border-t border-emerald-200/90 pt-5 mt-1"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-white text-emerald-800 border border-emerald-100">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Siguiente ronda (promover ganadores)
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Usá esto cuando todos los partidos de la ronda elegida
                        estén <strong>finalizados</strong> con ganador. Se crean
                        los cruces ganador vs ganador en orden.
                      </p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        Ronda completada (origen)
                      </label>
                      <select
                        value={promotePhaseId}
                        onChange={(e) => setPromotePhaseId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                      >
                        {elimPhases.map((p) => (
                          <option key={phaseId(p)} value={phaseId(p)}>
                            {phaseLabel(p)} (orden {phaseOrder(p)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        Nombre de la nueva ronda
                      </label>
                      <input
                        type="text"
                        value={promoteNextName}
                        onChange={(e) => setPromoteNextName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                        placeholder="Semifinales, Final…"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={promoteSubmitting || !promotePhaseId}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-900 disabled:opacity-50"
                  >
                    {promoteSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <GitBranch className="w-4 h-4" />
                    )}
                    {promoteSubmitting ? "Promoviendo…" : "Promover ganadores"}
                  </button>
                </form>
              )}
            </div>
          )}

          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-2">
            Grupos y llaves
          </h2>
          {dashboardLoading && (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 flex flex-wrap items-center gap-3 text-slate-600 text-sm">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-slate-800">
                  Cargando fases, tablas y llave…
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Misma información que en la vitrina pública.
                </p>
              </div>
            </div>
          )}
          {!dashboardLoading && dashboard && (
            <CompetitionDashboard dashboard={dashboard} />
          )}
          {!dashboardLoading && !dashboard && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900 text-sm">
              No se pudo cargar el tablero de la competencia. Probá recargar la
              página o abrir la{" "}
              <Link
                to={`/torneos/${competitionId}`}
                className="font-bold underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                vitrina pública
              </Link>
              .
            </div>
          )}
        </div>
      )}
    </div>
  );
}

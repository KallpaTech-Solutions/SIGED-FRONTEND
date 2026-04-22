import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import {
  Loader2,
  ChevronLeft,
  Trophy,
  UserPlus,
  Users,
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  ClipboardList,
  Pencil,
  Trash2,
  X,
  UserX,
  UserCheck,
} from "lucide-react";
import { fetchTournamentPublicDetail } from "../../api/tournamentsPublicService";
import {
  fetchTeamsMeContext,
  postInscription,
  createTeamMultipart,
  createPlayerMultipart,
  updatePlayerMultipart,
  deletePlayer,
  fetchTeamDetail,
  togglePlayerStatus,
} from "../../api/tournamentInscriptionService";
import {
  tournamentPublicLabel,
  isInscripcionesAbiertas,
} from "../../utils/tournamentPublicStatus";
import { POST_LOGIN_REDIRECT_KEY } from "../../utils/returnUrl";
import { useAuth } from "../../context/AuthContext";

const PERM_DELEGATE = "tourn.team.manage";
const PERM_ADMIN = "tourn.manage";

function normCompetitions(raw) {
  return raw?.competitions ?? raw?.Competitions ?? [];
}

/** Evita "undefined" en pantalla cuando el API envía categoría vacía o sin campo. */
function competitionOptionLabel(c) {
  const seg = (v) =>
    v != null && String(v).trim() !== "" ? String(v).trim() : "—";
  const dn = seg(c.disciplineName ?? c.DisciplineName);
  const cat = seg(c.categoryName ?? c.CategoryName);
  const g = seg(c.gender ?? c.Gender);
  return `${dn} · ${cat} · ${g}`;
}

/** Valores alineados con PlayerPosition (API). */
const PLAYER_POSITIONS = [
  { value: "0", label: "Sin definir" },
  { value: "1", label: "Portero" },
  { value: "2", label: "Defensa" },
  { value: "3", label: "Mediocampista" },
  { value: "4", label: "Delantero" },
  { value: "5", label: "Líbero (vóley)" },
  { value: "6", label: "Armador" },
  { value: "7", label: "Central" },
  { value: "8", label: "Capitán" },
];

function positionLabelFromApi(pos) {
  const s = String(pos ?? 0);
  return PLAYER_POSITIONS.find((p) => p.value === s)?.label ?? "—";
}

function sortPlayersForDisplay(raw) {
  const list = Array.isArray(raw) ? [...raw] : [];
  return list.sort((a, b) => {
    const actA = a.isActive ?? a.IsActive ?? true;
    const actB = b.isActive ?? b.IsActive ?? true;
    if (actA !== actB) return actA ? -1 : 1;
    const na = a.number ?? a.Number;
    const nb = b.number ?? b.Number;
    if (na != null && nb != null && na !== nb) return Number(na) - Number(nb);
    if (na != null && nb == null) return -1;
    if (na == null && nb != null) return 1;
    const nameA = String(a.name ?? a.Name ?? "").toLowerCase();
    const nameB = String(b.name ?? b.Name ?? "").toLowerCase();
    return nameA.localeCompare(nameB, "es");
  });
}

async function buildRosterMap(teamsList) {
  if (!teamsList?.length) return {};
  const entries = await Promise.all(
    teamsList.map(async (t) => {
      const id = t.id ?? t.Id;
      const detail = await fetchTeamDetail(id, { includeInactive: true });
      return [String(id), detail];
    })
  );
  return Object.fromEntries(entries);
}

function formatBirthForInput(v) {
  if (v == null || v === "") return "";
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function TorneoInscripcionPage() {
  const { tournamentId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  /** Inscripción abierta desde el panel (ruta anidada) vs. vitrina pública. */
  const fromPanelGestion = location.pathname.includes(
    "/PanelControl/gestion-equipos"
  );
  const presetCompetitionId = searchParams.get("competitionId")?.trim() || "";

  const { user, loading: authLoading, can } = useAuth();

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [ctx, setCtx] = useState(null);
  const [ctxError, setCtxError] = useState(null);
  const [ctxLoading, setCtxLoading] = useState(false);

  const [competitionId, setCompetitionId] = useState("");

  const [newName, setNewName] = useState("");
  const [newInitials, setNewInitials] = useState("");
  const [newRep, setNewRep] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [creatingTeam, setCreatingTeam] = useState(false);

  const [submitMsg, setSubmitMsg] = useState(null);
  const [submitErr, setSubmitErr] = useState(null);

  const [playerTeamId, setPlayerTeamId] = useState("");
  const [plName, setPlName] = useState("");
  const [plDni, setPlDni] = useState("");
  const [plBirth, setPlBirth] = useState("");
  const [plNumber, setPlNumber] = useState("");
  const [plPosition, setPlPosition] = useState("0");
  const [plPhoto, setPlPhoto] = useState(null);
  const [savingPlayer, setSavingPlayer] = useState(false);
  const [playerMsg, setPlayerMsg] = useState(null);
  const [playerErr, setPlayerErr] = useState(null);

  const inscriptionPath = useMemo(() => {
    const base = fromPanelGestion
      ? `/PanelControl/gestion-equipos/torneo/${tournamentId}/inscripcion`
      : `/torneos/torneo/${tournamentId}/inscripcion`;
    if (!presetCompetitionId) return base;
    return `${base}?competitionId=${encodeURIComponent(presetCompetitionId)}`;
  }, [tournamentId, presetCompetitionId, fromPanelGestion]);

  const returnLoginUrl = `/login?returnUrl=${encodeURIComponent(inscriptionPath)}`;

  const puedeInscribir = can(PERM_DELEGATE) || can(PERM_ADMIN);
  /** Borrado físico: solo quien administra torneos (no delegados de escuela). */
  const puedeEliminarJugador = can(PERM_ADMIN);

  const competitions = useMemo(() => normCompetitions(data), [data]);
  const statusRaw =
    data?.statusValue ??
    data?.StatusValue ??
    data?.status ??
    data?.Status;
  const inscripcionesOk = isInscripcionesAbiertas(statusRaw);

  const presetValid = useMemo(() => {
    if (!presetCompetitionId || !competitions.length) return true;
    return competitions.some(
      (c) => String(c.id ?? c.Id) === String(presetCompetitionId)
    );
  }, [presetCompetitionId, competitions]);

  const presetCompetition = useMemo(() => {
    if (!presetCompetitionId || !competitions.length) return null;
    return (
      competitions.find(
        (c) => String(c.id ?? c.Id) === String(presetCompetitionId)
      ) ?? null
    );
  }, [presetCompetitionId, competitions]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!tournamentId) {
        setLoading(false);
        setError(
          "No se encontró el torneo en la ruta. Volvé a gestión de equipos e intentá de nuevo."
        );
        setData(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const t = await fetchTournamentPublicDetail(tournamentId);
        if (!cancelled) setData(t);
      } catch (e) {
        if (!cancelled) {
          setError(
            e?.response?.status === 404
              ? "No encontramos este torneo o no está disponible públicamente."
              : "No se pudo cargar el torneo."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tournamentId]);

  useEffect(() => {
    if (user || !tournamentId) return;
    try {
      sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, inscriptionPath);
    } catch {
      /* ignore */
    }
  }, [user, tournamentId, inscriptionPath]);

  useEffect(() => {
    if (!user || !puedeInscribir || !tournamentId) {
      setCtx(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setCtxLoading(true);
      setCtxError(null);
      try {
        const c = await fetchTeamsMeContext();
        if (!cancelled) setCtx(c);
      } catch (e) {
        if (!cancelled) {
          setCtxError(
            e?.response?.data?.message ||
              e?.response?.data ||
              "No se pudo cargar tu escuela y equipos."
          );
        }
      } finally {
        if (!cancelled) setCtxLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, puedeInscribir, tournamentId]);

  const teams = useMemo(() => {
    const raw = ctx?.teams ?? ctx?.Teams;
    return Array.isArray(raw) ? raw : [];
  }, [ctx]);

  const nombreEscuela = ctx?.nombreEscuela ?? ctx?.NombreEscuela;

  const [rosterByTeamId, setRosterByTeamId] = useState({});
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState(null);
  const [rosterMutateErr, setRosterMutateErr] = useState(null);

  const [playerEdit, setPlayerEdit] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr] = useState(null);
  const [deletingPlayerId, setDeletingPlayerId] = useState(null);
  const [togglingPlayerId, setTogglingPlayerId] = useState(null);

  useEffect(() => {
    if (!user || !puedeInscribir || !teams.length) {
      setRosterByTeamId({});
      return;
    }
    let cancelled = false;
    (async () => {
      setRosterLoading(true);
      setRosterError(null);
      try {
        const map = await buildRosterMap(teams);
        if (!cancelled) setRosterByTeamId(map);
      } catch (e) {
        if (!cancelled) {
          setRosterError(
            e?.response?.data?.message ||
              (typeof e?.response?.data === "string"
                ? e.response.data
                : null) ||
              "No se pudo cargar los planteles."
          );
        }
      } finally {
        if (!cancelled) setRosterLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, puedeInscribir, teams]);

  /** ID numérico válido desde GET /Teams/me/context (el API de delegados ignora el del formulario y usa el del usuario). */
  const resolvedOrganizacionId = useMemo(() => {
    const v = ctx?.organizacionId ?? ctx?.OrganizacionId;
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [ctx]);

  /** Sincroniza competencia elegida: URL > primera de la lista. */
  useEffect(() => {
    if (!competitions.length) return;
    if (presetCompetitionId && presetValid) {
      setCompetitionId(String(presetCompetitionId));
      return;
    }
    setCompetitionId((prev) => {
      if (prev && competitions.some((c) => String(c.id ?? c.Id) === prev)) {
        return prev;
      }
      return String(competitions[0].id ?? competitions[0].Id ?? "");
    });
  }, [competitions, presetCompetitionId, presetValid]);

  useEffect(() => {
    if (!teams.length) {
      setPlayerTeamId("");
      return;
    }
    const first = teams[0];
    const id = first?.id ?? first?.Id;
    setPlayerTeamId(String(id ?? ""));
  }, [teams]);

  const tryInscribeAfterCreate = async (newTeamGuid) => {
    const cid = competitionId || presetCompetitionId;
    if (!cid || !newTeamGuid) return;
    try {
      await postInscription({
        competitionId: cid,
        teamId: newTeamGuid,
      });
      setSubmitMsg(
        "Equipo creado e inscripción en la competencia registrada correctamente."
      );
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string"
          ? e.response.data
          : null) ||
        "El equipo se creó, pero no se pudo completar la inscripción en la competencia.";
      setSubmitErr(msg);
      setSubmitMsg(
        "Equipo creado. Revisá la inscripción o contactá a OTI si el torneo ya cerró inscripciones."
      );
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newName.trim() || resolvedOrganizacionId == null) return;
    const cid = competitionId || presetCompetitionId;
    if (!cid) {
      setSubmitErr("Elegí una competencia antes de crear el equipo.");
      return;
    }
    setCreatingTeam(true);
    setSubmitErr(null);
    setSubmitMsg(null);
    try {
      const fd = new FormData();
      fd.append("Name", newName.trim());
      fd.append("Initials", (newInitials || "").trim());
      if (newRep.trim()) fd.append("RepresentativeName", newRep.trim());
      fd.append("OrganizacionId", String(resolvedOrganizacionId));
      if (logoFile) fd.append("LogoFile", logoFile);
      const created = await createTeamMultipart(fd);
      const tid = created?.id ?? created?.Id;
      if (tid) {
        const c = await fetchTeamsMeContext();
        setCtx(c);
        setNewName("");
        setNewInitials("");
        setNewRep("");
        setLogoFile(null);
        await tryInscribeAfterCreate(tid);
      }
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string"
          ? e.response.data
          : null) ||
        "No se pudo crear el equipo.";
      setSubmitErr(msg);
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!playerTeamId || !plName.trim() || !plDni.trim()) return;
    setSavingPlayer(true);
    setPlayerErr(null);
    setPlayerMsg(null);
    try {
      const fd = new FormData();
      fd.append("TeamId", playerTeamId);
      fd.append("Name", plName.trim());
      fd.append("Dni", plDni.trim().replace(/\s/g, ""));
      if (plBirth) fd.append("BirthDate", plBirth);
      if (plNumber !== "" && plNumber != null) {
        const n = parseInt(plNumber, 10);
        if (!Number.isNaN(n)) fd.append("Number", String(n));
      }
      if (plPosition && plPosition !== "0") fd.append("Position", plPosition);
      if (plPhoto) fd.append("PhotoFile", plPhoto);
      await createPlayerMultipart(fd);
      setPlayerMsg("Jugador registrado.");
      setPlName("");
      setPlDni("");
      setPlBirth("");
      setPlNumber("");
      setPlPosition("0");
      setPlPhoto(null);
      try {
        const map = await buildRosterMap(teams);
        setRosterByTeamId(map);
      } catch {
        /* el plantel se puede volver a cargar al recargar la página */
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string"
          ? err.response.data
          : null) ||
        "No se pudo registrar el jugador.";
      setPlayerErr(msg);
    } finally {
      setSavingPlayer(false);
    }
  };

  const openPlayerEdit = (p, teamGuid) => {
    setRosterMutateErr(null);
    setEditErr(null);
    const numRaw = p.number ?? p.Number;
    setPlayerEdit({
      id: p.id ?? p.Id,
      teamId: String(teamGuid),
      name: String(p.name ?? p.Name ?? ""),
      dni: String(p.dni ?? p.Dni ?? "")
        .replace(/\D/g, "")
        .slice(0, 10),
      birth: formatBirthForInput(p.birthDate ?? p.BirthDate),
      number:
        numRaw != null && numRaw !== "" ? String(numRaw) : "",
      position: String(p.position ?? p.Position ?? 0),
      photoFile: null,
    });
  };

  const closePlayerEdit = () => {
    setPlayerEdit(null);
    setEditErr(null);
  };

  const handlePlayerEditSubmit = async (e) => {
    e.preventDefault();
    if (!playerEdit || !playerEdit.name.trim() || !playerEdit.dni.trim()) return;
    setEditSaving(true);
    setEditErr(null);
    try {
      const fd = new FormData();
      fd.append("TeamId", playerEdit.teamId);
      fd.append("Name", playerEdit.name.trim());
      fd.append("Dni", playerEdit.dni.trim().replace(/\s/g, ""));
      if (playerEdit.birth) fd.append("BirthDate", playerEdit.birth);
      if (playerEdit.number !== "" && playerEdit.number != null) {
        const n = parseInt(playerEdit.number, 10);
        if (!Number.isNaN(n)) fd.append("Number", String(n));
      }
      fd.append("Position", playerEdit.position || "0");
      if (playerEdit.photoFile) fd.append("PhotoFile", playerEdit.photoFile);
      await updatePlayerMultipart(playerEdit.id, fd);
      closePlayerEdit();
      try {
        const map = await buildRosterMap(teams);
        setRosterByTeamId(map);
      } catch {
        /* ignore */
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string"
          ? err.response.data
          : null) ||
        "No se pudo actualizar el jugador.";
      setEditErr(msg);
    } finally {
      setEditSaving(false);
    }
  };

  const handlePlayerDelete = async (p, displayName) => {
    if (!puedeEliminarJugador) return;
    const pid = p.id ?? p.Id;
    if (
      !window.confirm(
        `¿Eliminar a ${displayName}? No se puede recuperar. Si ya participó en partidos con goles o tarjetas, el sistema no permitirá borrarlo.`
      )
    ) {
      return;
    }
    setRosterMutateErr(null);
    setDeletingPlayerId(pid);
    try {
      await deletePlayer(pid);
      try {
        const map = await buildRosterMap(teams);
        setRosterByTeamId(map);
      } catch {
        /* ignore */
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string"
          ? err.response.data
          : null) ||
        "No se pudo eliminar el jugador.";
      setRosterMutateErr(msg);
    } finally {
      setDeletingPlayerId(null);
    }
  };

  const handlePlayerToggleActive = async (p) => {
    const pid = p.id ?? p.Id;
    const active = p.isActive ?? p.IsActive;
    const nextLabel = active ? "desactivar" : "reactivar";
    if (
      !window.confirm(
        `¿${active ? "Desactivar" : "Reactivar"} a este jugador en el plantel?`
      )
    ) {
      return;
    }
    setRosterMutateErr(null);
    setTogglingPlayerId(pid);
    try {
      await togglePlayerStatus(pid);
      try {
        const map = await buildRosterMap(teams);
        setRosterByTeamId(map);
      } catch {
        /* ignore */
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string"
          ? err.response.data
          : null) ||
        `No se pudo ${nextLabel} al jugador.`;
      setRosterMutateErr(msg);
    } finally {
      setTogglingPlayerId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-inter">
      <section className="bg-gradient-to-r from-slate-900 via-emerald-900 to-emerald-700 border-b border-border/20 py-8 md:py-10">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex flex-col gap-2 mb-6">
            {fromPanelGestion ? (
              <Link
                to="/PanelControl/gestion-equipos"
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
                Volver a gestión de equipos (panel)
              </Link>
            ) : null}
            <Link
              to={`/torneos/torneo/${tournamentId}`}
              className={`inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 hover:text-white ${
                fromPanelGestion ? "opacity-90" : ""
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              {fromPanelGestion
                ? "Ver torneo en la vitrina pública"
                : "Volver al torneo"}
            </Link>
          </div>

          {loading && (
            <div className="flex items-center gap-3 text-emerald-100/80 py-6">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-300" />
              Cargando…
            </div>
          )}

          {error && !loading && (
            <p className="text-red-200 text-sm py-6">{error}</p>
          )}

          {!loading && data && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-200/90 mb-2">
                Inscripción de equipo
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                {data.name}
              </h1>
              <p className="mt-2 text-sm text-emerald-100/90">
                Estado del torneo:{" "}
                <span className="font-semibold text-white">
                  {tournamentPublicLabel(statusRaw)}
                </span>
              </p>
            </>
          )}
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-3xl py-10 space-y-8">
        {!loading && data && !inscripcionesOk && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex gap-3 text-amber-900 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Inscripciones no disponibles</p>
              <p className="mt-1 text-amber-800/90">
                Solo se puede inscribir cuando el torneo está en{" "}
                <strong>Inscripciones abiertas</strong>.
              </p>
            </div>
          </div>
        )}

        {!loading && data && inscripcionesOk && !user && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-8 space-y-4">
            <div className="flex items-start gap-3">
              <UserPlus className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Iniciá sesión para inscribir a tu equipo
                </h2>
                <ol className="mt-3 text-sm text-slate-600 space-y-2 list-decimal list-inside">
                  <li>Ingresá con tu cuenta institucional (DNI y contraseña).</li>
                  <li>
                    Completá los datos del equipo (nombre, siglas, logo
                    opcional) y la competencia.
                  </li>
                  <li>
                    El sistema guarda el equipo y luego la inscripción en la
                    competencia.
                  </li>
                </ol>
                <p className="mt-4 text-xs text-slate-500">
                  Quien inscribe debe tener el permiso de delegado.
                </p>
                <Link
                  to={returnLoginUrl}
                  className="mt-6 inline-flex items-center justify-center px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700"
                >
                  Iniciar sesión
                </Link>
              </div>
            </div>
          </div>
        )}

        {!loading && data && inscripcionesOk && user && !puedeInscribir && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 flex gap-3 text-rose-900 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Tu cuenta no puede inscribir equipos</p>
              <p className="mt-1 text-rose-800/90">
                Hace falta rol de <strong>delegado de escuela</strong> o de{" "}
                <strong>administración de torneos</strong>, con escuela vinculada
                al usuario. Contactá a OTI para que revisen tu cuenta.
              </p>
            </div>
          </div>
        )}

        {!loading &&
          data &&
          inscripcionesOk &&
          user &&
          puedeInscribir &&
          !competitions.length && (
            <p className="text-slate-600 text-sm">
              Este torneo no tiene competencias activas para inscribir.
            </p>
          )}

        {!loading &&
          data &&
          inscripcionesOk &&
          user &&
          puedeInscribir &&
          competitions.length > 0 &&
          presetCompetitionId &&
          !presetValid && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900 text-sm">
              <p className="font-bold">Competencia no válida en este torneo</p>
              <p className="mt-1 text-amber-800/90">
                El enlace incluye una competencia que no corresponde a este
                torneo. Elegí la competencia en el listado abajo.
              </p>
            </div>
          )}

        {!loading &&
          data &&
          inscripcionesOk &&
          user &&
          puedeInscribir &&
          competitions.length > 0 && (
            <>
              {ctxLoading && (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando datos de tu escuela…
                </div>
              )}

              {ctxError && (
                <p className="text-sm text-red-600">{String(ctxError)}</p>
              )}

              {!ctxLoading && ctx && resolvedOrganizacionId == null && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900 text-sm">
                  <p className="font-bold">Sin escuela asignada</p>
                  <p className="mt-1">
                    Tu usuario no tiene una organización (escuela) vinculada.
                    Pedí a un administrador que actualice tu perfil.
                  </p>
                </div>
              )}

              {!ctxLoading && ctx && resolvedOrganizacionId != null && (
                <div className="space-y-8">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4 text-sm text-slate-700">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Escuela
                    </p>
                    <p className="font-semibold text-slate-900 text-base">
                      {nombreEscuela || "—"}
                    </p>
                    
                    <p className="mt-2 text-xs text-slate-500">
                      El equipo queda asociado a esta organización.
                    </p>
                  </div>

                  {submitMsg && (
                    <div className="flex items-start gap-2 text-emerald-800 text-sm bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                      <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                      <span>{submitMsg}</span>
                    </div>
                  )}
                  {submitErr && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                      {submitErr}
                    </p>
                  )}

                  {teams.length === 0 && (
                    <form
                      onSubmit={handleCreateTeam}
                      className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/40 px-5 py-6 space-y-5"
                    >
                      <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                        <Trophy className="w-6 h-6 text-emerald-700" />
                        Registrar equipo e inscribir en la competencia
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Primero se guarda el equipo en el sistema; acto seguido
                        se registra la inscripción en la competencia elegida (dos
                        operaciones en el API, como en el backend). Solo ves
                        equipos de tu organización.
                      </p>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                          Competencia
                        </label>
                        {presetCompetitionId && presetValid && presetCompetition ? (
                          <div className="w-full px-3 py-2.5 rounded-lg border border-emerald-200 bg-white text-sm text-slate-800">
                            {competitionOptionLabel(presetCompetition)}
                          </div>
                        ) : (
                          <select
                            required
                            value={competitionId}
                            onChange={(e) => setCompetitionId(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                          >
                            <option value="">Seleccioná la competencia…</option>
                            {competitions.map((c) => {
                              const id = c.id ?? c.Id;
                              return (
                                <option key={String(id)} value={String(id)}>
                                  {competitionOptionLabel(c)}
                                </option>
                              );
                            })}
                          </select>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                          Nombre del equipo
                        </label>
                        <input
                          required
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                          placeholder="Ej. Selección FIIIS"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                            Siglas del equipo (opcional)
                          </label>
                          <input
                            maxLength={5}
                            value={newInitials}
                            onChange={(e) => setNewInitials(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                            placeholder="Ej. FII"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                            Sub-delegado / representante (opcional)
                          </label>
                          <input
                            value={newRep}
                            onChange={(e) => setNewRep(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                            placeholder="Nombre y apellido"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 uppercase mb-1">
                          <ImagePlus className="w-4 h-4" />
                          Logo del equipo (opcional)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setLogoFile(e.target.files?.[0] ?? null)
                          }
                          className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                        />
                        <p className="mt-1 text-[11px] text-slate-500">
                          Imagen cuadrada recomendada; se sube al crear el
                          equipo.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={creatingTeam || !newName.trim()}
                        className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {creatingTeam
                          ? "Guardando equipo e inscripción…"
                          : "Crear equipo e inscribir en la competencia"}
                      </button>
                    </form>
                  )}

                  {teams.length > 0 && (
                    <form
                      onSubmit={handleCreateTeam}
                      className="rounded-2xl border border-dashed border-sky-300 bg-sky-50/50 px-5 py-6 space-y-5"
                    >
                      <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                        <Trophy className="w-6 h-6 text-sky-700" />
                        Registrar otro equipo de tu escuela
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Para <strong>otra disciplina</strong> (ej. básquet si ya
                        tenés fútbol) creá un equipo con otro nombre y
                        elegí la competencia. Siguen siendo solo equipos de tu
                        organización.
                      </p>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                          Competencia
                        </label>
                        {presetCompetitionId && presetValid && presetCompetition ? (
                          <div className="w-full px-3 py-2.5 rounded-lg border border-sky-200 bg-white text-sm text-slate-800">
                            {competitionOptionLabel(presetCompetition)}
                          </div>
                        ) : (
                          <select
                            required
                            value={competitionId}
                            onChange={(e) => setCompetitionId(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                          >
                            <option value="">Seleccioná la competencia…</option>
                            {competitions.map((c) => {
                              const id = c.id ?? c.Id;
                              return (
                                <option key={String(id)} value={String(id)}>
                                  {competitionOptionLabel(c)}
                                </option>
                              );
                            })}
                          </select>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                          Nombre del equipo
                        </label>
                        <input
                          required
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                          placeholder="Ej. FIIS Básquet Masculino"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                            Siglas del equipo (opcional)
                          </label>
                          <input
                            maxLength={5}
                            value={newInitials}
                            onChange={(e) => setNewInitials(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                            Sub-delegado / representante (opcional)
                          </label>
                          <input
                            value={newRep}
                            onChange={(e) => setNewRep(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 uppercase mb-1">
                          <ImagePlus className="w-4 h-4" />
                          Logo del equipo (opcional)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setLogoFile(e.target.files?.[0] ?? null)
                          }
                          className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={creatingTeam || !newName.trim()}
                        className="w-full py-3 rounded-xl bg-sky-700 text-white font-bold text-sm hover:bg-sky-800 disabled:opacity-50"
                      >
                        {creatingTeam
                          ? "Guardando…"
                          : "Crear otro equipo e inscribir"}
                      </button>
                    </form>
                  )}

                  {teams.length > 0 && (
                    <form
                      onSubmit={handleAddPlayer}
                      className="rounded-2xl border border-violet-200 bg-violet-50/40 px-5 py-6 space-y-4"
                    >
                      <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                        <Users className="w-6 h-6 text-violet-700" />
                        Registrar jugadores
                      </h3>
                      <p className="text-xs text-slate-600">
                        Elegí el equipo y completá los datos. El código de
                        estudiante debe ser único en el sistema (se envía al
                        campo de identificación del servidor).
                      </p>

                      {playerMsg && (
                        <div className="flex items-start gap-2 text-violet-900 text-sm bg-white border border-violet-200 rounded-lg px-3 py-2">
                          <CheckCircle2 className="w-5 h-5 shrink-0" />
                          <span>{playerMsg}</span>
                        </div>
                      )}
                      {playerErr && (
                        <p className="text-sm text-red-600">{playerErr}</p>
                      )}

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                          Equipo
                        </label>
                        <select
                          required
                          value={playerTeamId}
                          onChange={(e) => setPlayerTeamId(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                        >
                          <option value="">Seleccioná el equipo…</option>
                          {teams.map((t) => {
                            const id = t.id ?? t.Id;
                            const name = t.name ?? t.Name;
                            return (
                              <option key={String(id)} value={String(id)}>
                                {name}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                          Nombre completo
                        </label>
                        <input
                          required
                          value={plName}
                          onChange={(e) => setPlName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                            Código de estudiante (hasta 10 dígitos)
                          </label>
                          <input
                            required
                            maxLength={10}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Ej. 0020260123"
                            value={plDni}
                            onChange={(e) =>
                              setPlDni(
                                e.target.value.replace(/\D/g, "").slice(0, 10)
                              )
                            }
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                            Fecha de nacimiento (opcional)
                          </label>
                          <input
                            type="date"
                            value={plBirth}
                            onChange={(e) => setPlBirth(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                            N° de camiseta (opcional)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={99}
                            value={plNumber}
                            onChange={(e) => setPlNumber(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                            Puesto (opcional)
                          </label>
                          <select
                            value={plPosition}
                            onChange={(e) => setPlPosition(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                          >
                            {PLAYER_POSITIONS.map((p) => (
                              <option key={p.value} value={p.value}>
                                {p.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 uppercase mb-1">
                          <ImagePlus className="w-4 h-4" />
                          Foto (opcional)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setPlPhoto(e.target.files?.[0] ?? null)
                          }
                          className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={
                          savingPlayer ||
                          !playerTeamId ||
                          !plName.trim() ||
                          !plDni.trim()
                        }
                        className="w-full py-3 rounded-xl bg-violet-700 text-white font-bold text-sm hover:bg-violet-800 disabled:opacity-50"
                      >
                        {savingPlayer
                          ? "Guardando jugador…"
                          : "Registrar jugador"}
                      </button>
                    </form>
                  )}

                  {teams.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-6 space-y-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <ClipboardList className="w-6 h-6 text-slate-600 shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">
                            Equipos y planteles
                          </h3>
                          <p className="text-xs text-slate-600 mt-1">
                            Vista de los equipos de tu escuela y los jugadores
                            dados de alta hasta ahora. Podés editar datos o
                            eliminar un jugador si aún no tiene historial en
                            partidos.
                          </p>
                        </div>
                      </div>

                      {rosterMutateErr && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                          {rosterMutateErr}
                        </p>
                      )}

                      {rosterLoading && (
                        <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Cargando planteles…
                        </div>
                      )}
                      {rosterError && (
                        <p className="text-sm text-red-600">{rosterError}</p>
                      )}

                      {!rosterLoading &&
                        !rosterError &&
                        teams.map((t) => {
                          const tid = String(t.id ?? t.Id);
                          const detail = rosterByTeamId[tid];
                          const teamName =
                            detail?.name ??
                            detail?.Name ??
                            t.name ??
                            t.Name ??
                            "Equipo";
                          const initials =
                            detail?.initials ?? detail?.Initials ?? t.initials ?? t.Initials;
                          const rawPlayers =
                            detail?.players ?? detail?.Players ?? [];
                          const players = sortPlayersForDisplay(rawPlayers);

                          return (
                            <div
                              key={tid}
                              className="rounded-xl border border-slate-100 bg-slate-50/80 overflow-hidden"
                            >
                              <div className="px-4 py-3 border-b border-slate-100 bg-slate-100/60 flex flex-wrap items-baseline justify-between gap-2">
                                <p className="font-semibold text-slate-900">
                                  {teamName}
                                  {initials ? (
                                    <span className="text-slate-500 font-normal text-sm ml-2">
                                      ({initials})
                                    </span>
                                  ) : null}
                                </p>
                                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                                  {players.length}{" "}
                                  {players.length === 1
                                    ? "jugador"
                                    : "jugadores"}
                                </span>
                              </div>
                              {players.length === 0 ? (
                                <p className="px-4 py-4 text-sm text-slate-500">
                                  Aún no hay jugadores registrados en este
                                  equipo.
                                </p>
                              ) : (
                                <ul className="divide-y divide-slate-100">
                                  {players.map((p) => {
                                    const pid = p.id ?? p.Id;
                                    const pname = p.name ?? p.Name ?? "—";
                                    const code = p.dni ?? p.Dni ?? "—";
                                    const num = p.number ?? p.Number;
                                    const pos = p.position ?? p.Position;
                                    const isPlActive =
                                      p.isActive ?? p.IsActive ?? true;
                                    return (
                                      <li
                                        key={String(pid)}
                                        className={`px-4 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm justify-between ${
                                          !isPlActive ? "bg-slate-100/80" : ""
                                        }`}
                                      >
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 min-w-0 flex-1">
                                          <span className="font-medium text-slate-900 min-w-0">
                                            {num != null && num !== "" ? (
                                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-white border border-slate-200 text-xs font-bold text-slate-700 mr-2 align-middle">
                                                {num}
                                              </span>
                                            ) : null}
                                            {pname}
                                            {!isPlActive ? (
                                              <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-amber-800 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
                                                Inactivo
                                              </span>
                                            ) : null}
                                          </span>
                                          <span className="text-xs text-slate-600">
                                            Cód. estudiante:{" "}
                                            <span className="font-mono font-medium text-slate-800">
                                              {code}
                                            </span>
                                          </span>
                                          <span className="text-xs text-slate-500">
                                            {positionLabelFromApi(pos)}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              openPlayerEdit(p, tid)
                                            }
                                            disabled={
                                              !!playerEdit ||
                                              !!deletingPlayerId ||
                                              !!togglingPlayerId ||
                                              editSaving
                                            }
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50"
                                          >
                                            <Pencil className="w-3.5 h-3.5" />
                                            Editar
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handlePlayerToggleActive(p)
                                            }
                                            disabled={
                                              !!playerEdit ||
                                              !!deletingPlayerId ||
                                              togglingPlayerId === pid ||
                                              editSaving
                                            }
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-900 bg-white border border-amber-200 hover:bg-amber-50 disabled:opacity-50"
                                          >
                                            {togglingPlayerId === pid ? (
                                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : isPlActive ? (
                                              <UserX className="w-3.5 h-3.5" />
                                            ) : (
                                              <UserCheck className="w-3.5 h-3.5" />
                                            )}
                                            {isPlActive
                                              ? "Desactivar"
                                              : "Reactivar"}
                                          </button>
                                          {puedeEliminarJugador ? (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handlePlayerDelete(p, pname)
                                              }
                                              disabled={
                                                !!playerEdit ||
                                                deletingPlayerId === pid ||
                                                !!togglingPlayerId ||
                                                editSaving
                                              }
                                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-800 bg-white border border-rose-200 hover:bg-rose-50 disabled:opacity-50"
                                              title="Solo administración de torneos puede eliminar del sistema"
                                            >
                                              {deletingPlayerId === pid ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                              ) : (
                                                <Trash2 className="w-3.5 h-3.5" />
                                              )}
                                              Eliminar
                                            </button>
                                          ) : null}
                                        </div>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
      </div>

      {playerEdit && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/45"
          role="presentation"
          onClick={closePlayerEdit}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="player-edit-title"
            className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-white rounded-t-2xl">
              <h2
                id="player-edit-title"
                className="text-lg font-bold text-slate-900"
              >
                Editar jugador
              </h2>
              <button
                type="button"
                onClick={closePlayerEdit}
                disabled={editSaving}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handlePlayerEditSubmit}
              className="px-5 py-4 space-y-4"
            >
              {editErr && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {editErr}
                </p>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Nombre completo
                </label>
                <input
                  required
                  value={playerEdit.name}
                  onChange={(e) =>
                    setPlayerEdit((prev) =>
                      prev ? { ...prev, name: e.target.value } : prev
                    )
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Código de estudiante (hasta 10 dígitos)
                  </label>
                  <input
                    required
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Ej. 0020180314"
                    value={playerEdit.dni}
                    onChange={(e) =>
                      setPlayerEdit((prev) =>
                        prev
                          ? {
                              ...prev,
                              dni: e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 10),
                            }
                          : prev
                      )
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Fecha de nacimiento (opcional)
                  </label>
                  <input
                    type="date"
                    value={playerEdit.birth}
                    onChange={(e) =>
                      setPlayerEdit((prev) =>
                        prev ? { ...prev, birth: e.target.value } : prev
                      )
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    N° de camiseta (opcional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={playerEdit.number}
                    onChange={(e) =>
                      setPlayerEdit((prev) =>
                        prev ? { ...prev, number: e.target.value } : prev
                      )
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Puesto
                  </label>
                  <select
                    value={playerEdit.position}
                    onChange={(e) =>
                      setPlayerEdit((prev) =>
                        prev
                          ? { ...prev, position: e.target.value }
                          : prev
                      )
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {PLAYER_POSITIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  <ImagePlus className="w-4 h-4" />
                  Nueva foto (opcional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setPlayerEdit((prev) =>
                      prev
                        ? {
                            ...prev,
                            photoFile: e.target.files?.[0] ?? null,
                          }
                        : prev
                    )
                  }
                  className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Si no elegís archivo, se mantiene la foto actual.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={closePlayerEdit}
                  disabled={editSaving}
                  className="flex-1 min-w-[120px] py-2.5 rounded-xl border border-slate-200 text-slate-800 font-semibold text-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    editSaving ||
                    !playerEdit.name.trim() ||
                    !playerEdit.dni.trim()
                  }
                  className="flex-1 min-w-[120px] py-2.5 rounded-xl bg-violet-700 text-white font-bold text-sm hover:bg-violet-800 disabled:opacity-50"
                >
                  {editSaving ? "Guardando…" : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

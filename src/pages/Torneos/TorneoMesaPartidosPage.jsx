import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  Loader2,
  MapPin,
  Radio,
  Trophy,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { fetchTournamentById } from "../../api/tournamentsAdminService";
import { fetchCompetitionPublicDashboard } from "../../api/tournamentsPublicService";
import { genderLabel } from "../../utils/tournamentEnums";
import {
  isTournamentActivoCompetencia,
  tournamentPublicLabel,
} from "../../utils/tournamentPublicStatus";

function matchStatusLabel(s) {
  const x = String(s ?? "");
  const map = {
    Programado: "Programado",
    EnVivo: "En vivo",
    Finalizado: "Finalizado",
    Suspendido: "Suspendido",
    0: "Programado",
    1: "En vivo",
    2: "Finalizado",
    3: "Suspendido",
  };
  return map[x] ?? map[Number(x)] ?? x;
}

function isLiveStatus(s) {
  const x = String(s ?? "");
  return x === "EnVivo" || x === "1" || s === 1;
}

function isFinishedStatus(s) {
  const x = String(s ?? "");
  return x === "Finalizado" || x === "2" || s === 2;
}

/** Aplana partidos del public-dashboard de una competencia. */
function matchesFromDashboard(dashboard, competitionLabel, competitionId) {
  if (!dashboard) return [];
  const phases = dashboard.phases ?? dashboard.Phases ?? [];
  const rows = [];
  for (const phase of phases) {
    const mode = phase.mode ?? phase.Mode;
    const phaseName = phase.name ?? phase.Name ?? "";
    if (mode === "roundRobin") {
      const groups = phase.groups ?? phase.Groups ?? [];
      for (const g of groups) {
        const gname = g.name ?? g.Name ?? "";
        const matches = g.matches ?? g.Matches ?? [];
        for (const m of matches) {
          const mid = m.id ?? m.Id;
          if (!mid) continue;
          rows.push({
            id: mid,
            status: m.status ?? m.Status,
            scheduledAt: m.scheduledAt ?? m.ScheduledAt,
            venueName: m.venueName ?? m.VenueName,
            localTeamName: m.localTeamName ?? m.LocalTeamName,
            visitorTeamName: m.visitorTeamName ?? m.VisitorTeamName,
            localScore: m.localScore ?? m.LocalScore,
            visitorScore: m.visitorScore ?? m.VisitorScore,
            phaseName,
            groupName: gname,
            competitionLabel,
            competitionId,
          });
        }
      }
    } else {
      const flat = phase.matches ?? phase.Matches ?? [];
      for (const m of flat) {
        const mid = m.id ?? m.Id;
        if (!mid) continue;
        rows.push({
          id: mid,
          status: m.status ?? m.Status,
          scheduledAt: m.scheduledAt ?? m.ScheduledAt,
          venueName: m.venueName ?? m.VenueName,
          localTeamName: m.localTeamName ?? m.LocalTeamName,
          visitorTeamName: m.visitorTeamName ?? m.VisitorTeamName,
          localScore: m.localScore ?? m.LocalScore,
          visitorScore: m.visitorScore ?? m.VisitorScore,
          phaseName,
          groupName: null,
          competitionLabel,
          competitionId,
        });
      }
    }
  }
  return rows;
}

export default function TorneoMesaPartidosPage() {
  const { tournamentId } = useParams();
  const { can } = useAuth();
  const canMesa = can("tourn.match.control");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tournamentName, setTournamentName] = useState("");
  const [tournamentStatus, setTournamentStatus] = useState(null);
  const [rows, setRows] = useState([]);

  const load = useCallback(async () => {
    if (!tournamentId || !canMesa) return;
    setLoading(true);
    setError(null);
    try {
      const t = await fetchTournamentById(tournamentId);
      const name = t?.name ?? t?.Name ?? "Torneo";
      setTournamentName(name);
      setTournamentStatus(t?.status ?? t?.Status ?? null);
      const comps = t?.competitions ?? t?.Competitions ?? [];
      const dashboards = await Promise.all(
        comps.map(async (c) => {
          const cid = c.id ?? c.Id;
          const d = c.discipline ?? c.Discipline ?? {};
          const dname = d?.name ?? d?.Name ?? "—";
          const cat = c.categoryName ?? c.CategoryName;
          const g = c.gender ?? c.Gender;
          const label = `${dname}${cat ? ` · ${cat}` : ""} (${genderLabel(g)})`;
          try {
            const dash = await fetchCompetitionPublicDashboard(cid);
            return matchesFromDashboard(dash, label, cid);
          } catch {
            return [];
          }
        })
      );
      const flat = dashboards.flat();
      const byId = new Map();
      for (const r of flat) {
        if (!byId.has(String(r.id))) byId.set(String(r.id), r);
      }
      const unique = [...byId.values()];
      unique.sort((a, b) => {
        const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
        const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
        return ta - tb;
      });
      setRows(unique);
    } catch (e) {
      setError(
        e?.response?.status === 404
          ? "Torneo no encontrado."
          : e?.response?.data?.message ||
              e?.message ||
              "No se pudieron cargar los partidos."
      );
      setRows([]);
      setTournamentStatus(null);
    } finally {
      setLoading(false);
    }
  }, [tournamentId, canMesa]);

  useEffect(() => {
    load();
  }, [load]);

  const liveCount = useMemo(
    () => rows.filter((r) => isLiveStatus(r.status)).length,
    [rows]
  );

  const transmissionEnabled = isTournamentActivoCompetencia(tournamentStatus);

  if (!canMesa) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-6 text-amber-900 text-sm">
        Necesitás el permiso de{" "}
        <strong>control de mesa / transmisión</strong> (
        <code className="text-xs">tourn.match.control</code>) para ver esta
        pantalla.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-slate-500">
        <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
        <span className="text-sm font-semibold">Cargando partidos…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-red-800 text-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p>{error}</p>
            <Link
              to="/PanelControl/torneos"
              className="inline-flex items-center gap-1 mt-3 font-bold text-emerald-800 hover:underline"
            >
              <ChevronLeft className="w-4 h-4" />
              Volver a torneos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <Link
          to={`/PanelControl/torneos/${tournamentId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700 mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver al torneo
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Radio className="w-6 h-6 text-red-600 shrink-0" />
              Partidos y transmisión
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              <span className="font-semibold text-slate-800">{tournamentName}</span>
              {" · "}
              {transmissionEnabled ? (
                <>
                  Elegí un partido para abrir la vista de mesa e{" "}
                  <strong>iniciar transmisión en vivo</strong>.
                </>
              ) : (
                <>
                  Estado del torneo:{" "}
                  <strong>{tournamentPublicLabel(tournamentStatus)}</strong>. Los
                  botones de transmisión se habilitan en{" "}
                  <strong>Activo (en competencia)</strong>.
                </>
              )}
            </p>
          </div>
          {liveCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">
              <Radio className="w-3.5 h-3.5" />
              {liveCount} en vivo
            </span>
          )}
        </div>
      </div>

      {transmissionEnabled ? (
        <div className="rounded-xl border border-slate-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
          Abrís cada partido en la <strong>vista pública</strong>: allí, si estás
          logueado, aparece la barra de mesa para poner el encuentro{" "}
          <strong>En vivo</strong> (la vitrina y SignalR lo toman automático).
        </div>
      ) : (
        <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-950">
          Con el torneo fuera de <strong>Activo (en competencia)</strong> no se puede
          iniciar transmisión en vivo (tampoco el servidor lo permitirá). Cuando el
          administrador active esa etapa, los botones rojos quedarán operativos.
        </div>
      )}

      {!rows.length ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-8 py-14 text-center">
          <Trophy className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">
            No hay partidos en el calendario de este torneo todavía.
          </p>
          <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
            Cuando existan fases y fixture en las competencias, los encuentros
            aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => {
              const live = isLiveStatus(r.status);
              const finished = isFinishedStatus(r.status);
              return (
                <li
                  key={String(r.id)}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 hover:bg-slate-50/80"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      {r.competitionLabel}
                      {r.phaseName ? ` · ${r.phaseName}` : ""}
                      {r.groupName ? ` · ${r.groupName}` : ""}
                    </p>
                    <p className="font-semibold text-slate-900 mt-0.5">
                      {r.localTeamName ?? "—"}{" "}
                      <span className="tabular-nums text-slate-600">
                        {r.localScore ?? 0} — {r.visitorScore ?? 0}
                      </span>{" "}
                      {r.visitorTeamName ?? "—"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                      <span>{matchStatusLabel(r.status)}</span>
                      {r.scheduledAt &&
                        new Date(r.scheduledAt).getFullYear() > 1 && (
                          <span>
                            {new Date(r.scheduledAt).toLocaleString("es-PE", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      {r.venueName && (
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          {r.venueName}
                        </span>
                      )}
                      {live && (
                        <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                          <Radio className="w-3 h-3" />
                          EN VIVO
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {finished ? (
                      <Link
                        to={`/torneos/partido/${r.id}`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold"
                      >
                        Ver detalles de transmisión
                        <ArrowRight className="w-4 h-4 opacity-90" />
                      </Link>
                    ) : transmissionEnabled ? (
                      <Link
                        to={`/torneos/partido/${r.id}`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold"
                      >
                        Mesa / transmitir
                        <ArrowRight className="w-4 h-4 opacity-90" />
                      </Link>
                    ) : (
                      <span
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-200 text-slate-500 text-sm font-bold cursor-not-allowed"
                        title="Requiere torneo Activo (en competencia)."
                      >
                        Mesa / transmitir
                        <ArrowRight className="w-4 h-4 opacity-90" />
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  Trophy,
  Users,
  ExternalLink,
  UserX,
  UserCheck,
  ChevronRight,
} from "lucide-react";
import {
  fetchDelegateSummary,
  togglePlayerStatus,
} from "../../api/tournamentInscriptionService";

const POSITIONS = [
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

function positionLabel(pos) {
  const s = String(pos ?? 0);
  return POSITIONS.find((p) => p.value === s)?.label ?? "—";
}

function sortPlayers(list) {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => {
    const aa = a.isActive ?? a.IsActive ?? true;
    const bb = b.isActive ?? b.IsActive ?? true;
    if (aa !== bb) return aa ? -1 : 1;
    const na = a.number ?? a.Number;
    const nb = b.number ?? b.Number;
    if (na != null && nb != null && na !== nb) return Number(na) - Number(nb);
    if (na != null && nb == null) return -1;
    if (na == null && nb != null) return 1;
    return String(a.name ?? a.Name ?? "").localeCompare(
      String(b.name ?? b.Name ?? ""),
      "es"
    );
  });
}

export default function DelegadoSummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await fetchDelegateSummary();
      setData(d);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          (typeof e?.response?.data === "string"
            ? e.response.data
            : null) ||
          "No se pudo cargar el resumen de tu escuela."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = async (p) => {
    const pid = p.id ?? p.Id;
    const active = p.isActive ?? p.IsActive;
    if (
      !window.confirm(
        `${active ? "¿Desactivar" : "¿Reactivar"} a este jugador en el plantel?`
      )
    ) {
      return;
    }
    setTogglingId(pid);
    try {
      await togglePlayerStatus(pid);
      await load();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string"
          ? e.response.data
          : null) ||
        "No se pudo cambiar el estado del jugador.";
      window.alert(msg);
    } finally {
      setTogglingId(null);
    }
  };

  const nombreEscuela =
    data?.nombreEscuela ?? data?.NombreEscuela ?? "Tu escuela";
  const teams = data?.teams ?? data?.Teams ?? [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium">Cargando equipos y planteles…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-emerald-600" />
          Tu escuela y torneos
        </h2>
        <p className="mt-2 text-sm text-slate-600 max-w-2xl">
          Equipos que gestionás, competencias en las que están inscritos y
          jugadores. Podés{" "}
          <strong>desactivar o reactivar</strong> jugadores; la eliminación
          definitiva del sistema la realiza la administración de torneos.
        </p>
        <p className="mt-3 text-sm font-semibold text-slate-800">
          {nombreEscuela}
        </p>
        <div className="mt-4 flex flex-wrap gap-3 items-center">
          <Link
            to="/PanelControl/gestion-equipos"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 shadow-sm"
          >
            Gestión de equipos (inscribir y planteles)
          </Link>
          <Link
            to="/torneos"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            <ExternalLink className="w-4 h-4" />
            Vitrina de torneos
          </Link>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <Link
            to="/PanelControl/torneos"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            Torneos (panel administrativo)
          </Link>
        </div>
      </div>

      {teams.length === 0 ? (
        <p className="text-sm text-slate-500 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
          Todavía no hay equipos registrados para esta escuela. Entrá a un
          torneo con inscripciones abiertas y creá el primero.
        </p>
      ) : (
        teams.map((team) => {
          const tid = String(team.id ?? team.Id);
          const tname = team.name ?? team.Name ?? "Equipo";
          const initials = team.initials ?? team.Initials;
          const inscriptions =
            team.inscriptions ?? team.Inscriptions ?? [];
          const players = sortPlayers(team.players ?? team.Players ?? []);

          return (
            <div
              key={tid}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm"
            >
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900">
                    {tname}
                    {initials ? (
                      <span className="text-slate-500 font-normal text-sm ml-2">
                        ({initials})
                      </span>
                    ) : null}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {players.length}{" "}
                    {players.length === 1 ? "jugador" : "jugadores"} en el
                    plantel
                  </p>
                </div>
              </div>

              <div className="px-5 py-3 border-b border-slate-100 bg-white">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                  Inscripciones en competencias
                </p>
                {inscriptions.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Este equipo aún no está inscrito en ninguna competencia.
                    Podés hacerlo desde la página del torneo.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {inscriptions.map((ins) => {
                      const cid = String(
                        ins.competitionId ?? ins.CompetitionId
                      );
                      const tourId = String(
                        ins.tournamentId ?? ins.TournamentId
                      );
                      const label =
                        ins.competitionLabel ??
                        ins.CompetitionLabel ??
                        "Competencia";
                      const tourName =
                        ins.tournamentName ?? ins.TournamentName ?? "Torneo";
                      return (
                        <li key={cid} className="text-sm">
                          <span className="text-slate-800 font-medium">
                            {tourName}
                          </span>
                          <span className="text-slate-500"> — {label}</span>
                          <div className="mt-1">
                            <Link
                              to={`/PanelControl/gestion-equipos/torneo/${tourId}/inscripcion?competitionId=${encodeURIComponent(cid)}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                            >
                              Inscribir / gestionar jugadores (panel)
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  Planteles
                </p>
                {players.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">
                    Sin jugadores cargados.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                    {players.map((p) => {
                      const pid = p.id ?? p.Id;
                      const pname = p.name ?? p.Name ?? "—";
                      const code = p.dni ?? p.Dni ?? "—";
                      const num = p.number ?? p.Number;
                      const pos = p.position ?? p.Position;
                      const active = p.isActive ?? p.IsActive ?? true;
                      return (
                        <li
                          key={String(pid)}
                          className={`px-3 py-2.5 flex flex-wrap items-center gap-2 text-sm justify-between ${
                            !active ? "bg-slate-50" : ""
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
                            {num != null && num !== "" ? (
                              <span className="inline-flex w-6 h-6 items-center justify-center rounded bg-white border text-[10px] font-bold text-slate-700">
                                {num}
                              </span>
                            ) : null}
                            <span className="font-medium text-slate-900">
                              {pname}
                            </span>
                            {!active ? (
                              <span className="text-[10px] font-bold uppercase text-amber-800 bg-amber-100 px-1.5 rounded">
                                Inactivo
                              </span>
                            ) : null}
                            <span className="text-xs text-slate-500 font-mono">
                              {code}
                            </span>
                            <span className="text-xs text-slate-400">
                              {positionLabel(pos)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggle(p)}
                              disabled={togglingId === pid}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-amber-900 border border-amber-200 bg-white hover:bg-amber-50 disabled:opacity-50"
                            >
                              {togglingId === pid ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : active ? (
                                <UserX className="w-3 h-3" />
                              ) : (
                                <UserCheck className="w-3 h-3" />
                              )}
                              {active ? "Desactivar" : "Reactivar"}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

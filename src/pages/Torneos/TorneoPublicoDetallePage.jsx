import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Loader2,
  ChevronLeft,
  CalendarRange,
  Trophy,
  Users,
  ChevronRight,
  Building2,
  FileText,
  CalendarClock,
} from "lucide-react";
import { fetchTournamentPublicDetail } from "../../api/tournamentsPublicService";
import {
  tournamentPublicLabel,
  tournamentPublicBadgeClassOnDark,
  isInscripcionesAbiertas,
} from "../../utils/tournamentPublicStatus";

function formatRange(start, end) {
  if (!start || !end) return "—";
  const a = new Date(start);
  const b = new Date(end);
  const opts = { day: "2-digit", month: "short", year: "numeric" };
  return `${a.toLocaleDateString("es-PE", opts)} — ${b.toLocaleDateString("es-PE", opts)}`;
}

function genderLabel(g) {
  const map = {
    Masculino: "Masculino",
    Femenino: "Femenino",
    Mixto: "Mixto",
    0: "Masculino",
    1: "Femenino",
    2: "Mixto",
  };
  return map[g] ?? map[String(g)] ?? String(g ?? "—");
}

/** Mensaje cuando aún no hay partidos programados a nivel torneo. */
function fixtureEmptyMessage(statusStr) {
  const s = String(statusStr ?? "");
  if (s === "Borrador")
    return "La organización está preparando el torneo. El fixture y los horarios se publicarán más adelante.";
  if (s === "InscripcionesAbiertas")
    return "Inscripciones abiertas: cuando cierre el registro y se armen los grupos, aquí verás el calendario y los horarios por competencia.";
  if (s === "Programado")
    return "Inscripciones cerradas. Estamos armando el fixture y los horarios; pronto podrás verlos por fecha y hora en cada competencia.";
  if (s === "Activo")
    return "Aún no hay partidos registrados en el sistema. Revisá cada competencia o volvé pronto.";
  if (s === "Finalizado") return "Torneo finalizado.";
  return "El calendario detallado se publicará cuando esté disponible.";
}

export default function TorneoPublicoDetallePage() {
  const { tournamentId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!tournamentId) return;
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

  const totals = useMemo(() => {
    const comps = data?.competitions ?? [];
    let teams = 0;
    comps.forEach((c) => {
      teams += (c.teams ?? []).length;
    });
    return { competitions: comps.length, teams };
  }, [data]);

  const rulesUrl = data?.rulesUrl ?? data?.RulesUrl;
  const scheduledMatchCount =
    data?.scheduledMatchCount ?? data?.ScheduledMatchCount ?? 0;
  const statusForInscripcion =
    data?.statusValue ??
    data?.StatusValue ??
    data?.status ??
    data?.Status;
  const mostrarBtnInscripcion =
    data && isInscripcionesAbiertas(statusForInscripcion);

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 bg-white text-slate-900 font-inter">
      <section className="bg-gradient-to-r from-slate-900 via-emerald-900 to-emerald-700 border-b border-border/20 py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link
            to="/torneos"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 hover:text-white mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver a torneos
          </Link>

          {loading && (
            <div className="flex items-center gap-3 text-emerald-100/80 py-8">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-300" />
              Cargando torneo…
            </div>
          )}

          {error && !loading && (
            <p className="text-red-200 text-sm py-8">{error}</p>
          )}

          {!loading && data && (
            <div className="flex flex-col md:flex-row gap-8 md:gap-10 items-start">
              <div className="shrink-0 w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center shadow-lg">
                {data.logoUrl ? (
                  <img
                    src={data.logoUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Trophy className="w-14 h-14 text-emerald-200/80" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-200/90 mb-2">
                  Torneo · Temporada {data.year}
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight">
                  {data.name}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-emerald-50/90">
                  <span className="inline-flex items-center gap-2">
                    <CalendarRange className="w-4 h-4 shrink-0" />
                    {formatRange(data.startDate, data.endDate)}
                  </span>
                  {data.status !== undefined && data.status !== null && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${tournamentPublicBadgeClassOnDark(
                        data.status
                      )}`}
                    >
                      {tournamentPublicLabel(data.status)}
                    </span>
                  )}
                </div>
                {data.organizer && (
                  <p className="mt-2 text-sm text-emerald-100/85">
                    <span className="font-semibold text-white/80">Organiza:</span>{" "}
                    {data.organizer}
                  </p>
                )}
                {data.description && (
                  <p className="mt-4 text-sm text-emerald-50/90 leading-relaxed max-w-3xl">
                    {data.description}
                  </p>
                )}
                <div className="mt-6 flex flex-wrap gap-4 text-xs text-emerald-100/80">
                  <span className="inline-flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    {totals.competitions} competencia
                    {totals.competitions === 1 ? "" : "s"}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {totals.teams} equipo{totals.teams === 1 ? "" : "s"}
                  </span>
                </div>
                {mostrarBtnInscripcion && tournamentId && (
                  <div className="mt-8">
                    <Link
                      to={`/torneos/torneo/${tournamentId}/inscripcion`}
                      className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-white text-emerald-900 text-sm font-bold border-2 border-emerald-200 hover:bg-emerald-50 shadow-md transition-colors"
                    >
                      Inscribí a tu equipo
                    </Link>
                    <p className="mt-2 text-[11px] text-emerald-100/80 max-w-md">
                      Vas a poder elegir la competencia y confirmar con tu cuenta
                      de delegado de escuela.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {!loading && data && rulesUrl ? (
        <section className="bg-white border-t border-slate-100">
          <div className="container mx-auto px-4 max-w-5xl py-8">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">
              Reglamento
            </h2>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">
                    Bases y reglamento oficial
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Documento en PDF para consulta y descarga.
                  </p>
                </div>
              </div>
              <a
                href={rulesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 shrink-0"
              >
                Descargar PDF
              </a>
            </div>
          </div>
        </section>
      ) : null}

      {!loading && data && (
        <div className="bg-slate-50 border-t border-slate-100">
          <div className="container mx-auto px-4 max-w-5xl py-10">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-6">
              Competencias y equipos
            </h2>

            {!data.competitions?.length ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-slate-500 text-sm">
                Aún no hay competencias activas publicadas en este torneo.
              </div>
            ) : (
              <div className="space-y-8">
                {data.competitions.map((comp) => (
                  <section
                    key={comp.id}
                    className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                  >
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">
                          {comp.disciplineName}
                          {comp.categoryName ? (
                            <span className="text-slate-800">
                              {" "}
                              · {comp.categoryName}
                            </span>
                          ) : null}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {genderLabel(comp.gender)}
                        </p>
                      </div>
                      <Link
                        to={`/torneos/${comp.id}`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 shrink-0"
                      >
                        Ver competencia
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>

                    <div className="p-5">
                      {!comp.teams?.length ? (
                        <p className="text-sm text-slate-500">
                          Sin equipos inscritos aún.
                        </p>
                      ) : (
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {comp.teams.map((row) => {
                            const tid = row.teamId ?? row.TeamId;
                            const compTitle = [comp.disciplineName, comp.categoryName]
                              .filter(Boolean)
                              .join(" · ");
                            const rosterTo = tid
                              ? `/torneos/equipo/${tid}?competitionId=${encodeURIComponent(comp.id)}&tournamentId=${encodeURIComponent(tournamentId)}`
                              : null;
                            const inner = (
                              <>
                                <div className="w-11 h-11 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 text-[10px] font-bold text-slate-500">
                                  {row.logoUrl ? (
                                    <img
                                      src={row.logoUrl}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    row.initials ??
                                    row.teamName?.slice(0, 3) ??
                                    "—"
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-slate-900 text-sm truncate">
                                    {row.teamName}
                                  </p>
                                  {row.escuela && (
                                    <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                                      <Building2 className="w-3 h-3 shrink-0" />
                                      {row.escuela}
                                    </p>
                                  )}
                                </div>
                                {(row.puntos > 0 || row.partidosJugados > 0) && (
                                  <div className="text-[10px] font-mono text-slate-500 text-right shrink-0">
                                    {row.puntos} pts · {row.partidosJugados} PJ
                                  </div>
                                )}
                                {row.estaDescalificado && (
                                  <span className="text-[10px] font-bold text-red-600 uppercase">
                                    Desc.
                                  </span>
                                )}
                                {rosterTo && (
                                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                                )}
                              </>
                            );
                            return (
                              <li key={row.id ?? tid}>
                                {rosterTo ? (
                                  <Link
                                    to={rosterTo}
                                    state={{
                                      backPath: `/torneos/torneo/${tournamentId}`,
                                      backLabel: "Volver al torneo",
                                      competitionTitle: compTitle,
                                    }}
                                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5 hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors"
                                  >
                                    {inner}
                                  </Link>
                                ) : (
                                  <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5">
                                    {inner}
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && data && (
        <section className="bg-white border-t border-slate-200">
          <div className="container mx-auto px-4 max-w-5xl py-10">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-slate-400" />
              Fixture y calendario
            </h2>
            {scheduledMatchCount > 0 ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 px-5 py-4 text-sm text-emerald-900">
                <p className="font-semibold">
                  Hay {scheduledMatchCount} partido
                  {scheduledMatchCount === 1 ? "" : "s"} programado
                  {scheduledMatchCount === 1 ? "" : "s"} en este torneo.
                </p>
                <p className="text-emerald-800/90 mt-2 text-xs leading-relaxed">
                  Entrá a cada competencia para ver fechas, horas y sedes en detalle.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(data.competitions ?? []).map((comp) => (
                    <Link
                      key={comp.id}
                      to={`/torneos/${comp.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:underline"
                    >
                      {comp.disciplineName}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-5 py-6 text-sm text-slate-600 leading-relaxed">
                {fixtureEmptyMessage(data.status)}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

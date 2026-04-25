import React from "react";
import { Link } from "react-router-dom";
import {
  Radio,
  CheckCircle2,
  Clock,
  CalendarClock,
  AlertCircle,
  Trophy,
  MapPin,
} from "lucide-react";

function phaseTypeBadge(type, mode) {
  const t = String(type ?? "");
  if (mode === "roundRobin" || t === "RoundRobin")
    return "Todos contra todos (grupos)";
  if (t === "EliminacionSimple") return "Eliminación directa";
  if (t === "EliminacionDoble") return "Doble eliminación";
  if (t === "Suizo") return "Sistema suizo";
  return t || "—";
}

function matchStatusLabel(s) {
  const x = String(s ?? "");
  if (x === "EnVivo" || x === "1") return { text: "En vivo", className: "text-red-700 bg-red-50 border-red-100" };
  if (x === "Finalizado" || x === "2")
    return { text: "Finalizado", className: "text-slate-700 bg-slate-100 border-slate-200" };
  if (x === "Suspendido" || x === "3")
    return { text: "Suspendido", className: "text-amber-800 bg-amber-50 border-amber-100" };
  if (x === "Programado" || x === "0")
    return { text: "Programado", className: "text-slate-600 bg-slate-50 border-slate-200" };
  return { text: "Pendiente", className: "text-sky-800 bg-sky-50 border-sky-100" };
}

function splitMatches(matches) {
  const list = Array.isArray(matches) ? matches : [];
  const live = [];
  const done = [];
  const pend = [];
  for (const m of list) {
    const st = String(m.status ?? "");
    if (st === "EnVivo" || m.status === 1) live.push(m);
    else if (st === "Finalizado" || m.status === 2) done.push(m);
    else if (st === "Suspendido" || m.status === 3) pend.push(m);
    else pend.push(m);
  }
  return { live, done, pending: pend };
}

/** Misma fila que envía el dashboard en `phase.matches` (fecha/sede vía SQL). */
function findPhaseMatchRow(phaseMatches, matchId) {
  if (matchId == null || matchId === "") return null;
  const key = String(matchId).toLowerCase();
  const list = Array.isArray(phaseMatches) ? phaseMatches : [];
  return (
    list.find((m) => String(m.id ?? m.Id ?? "").toLowerCase() === key) ?? null
  );
}

function MatchCard({ m, venueByMatchId }) {
  const st = matchStatusLabel(m.status);
  const dt =
    m.scheduledAt && new Date(m.scheduledAt).getFullYear() > 1
      ? new Date(m.scheduledAt).toLocaleString("es-PE", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;
  const midRaw = m.id ?? m.Id;
  const midKey =
    midRaw != null && midRaw !== "" ? String(midRaw).toLowerCase() : "";
  const venueFromLanding =
    midKey && venueByMatchId?.get ? venueByMatchId.get(midKey) : null;
  const venue =
    m.venueName ??
    m.VenueName ??
    m.venue?.name ??
    m.Venue?.Name ??
    venueFromLanding ??
    null;
  const mid = midRaw;

  return (
    <Link
      to={`/torneos/partido/${mid}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all"
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.className}`}
        >
          {st.text}
        </span>
        {dt && (
          <span className="text-[10px] text-slate-500 flex items-center gap-1 text-right">
            <CalendarClock className="w-3 h-3 shrink-0" />
            {dt}
          </span>
        )}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center text-sm">
        <div className="min-w-0 text-right font-semibold text-slate-900 truncate">
          {m.localTeamName}
        </div>
        <div className="tabular-nums font-black text-lg text-slate-900 px-2 shrink-0">
          {m.localScore ?? 0} — {m.visitorScore ?? 0}
        </div>
        <div className="min-w-0 text-left font-semibold text-slate-900 truncate">
          {m.visitorTeamName}
        </div>
      </div>
      <p className="mt-2 text-[10px] flex items-start gap-1 border-t border-slate-100 pt-2">
        <MapPin className="w-3 h-3 shrink-0 text-emerald-600 mt-0.5" />
        {venue ? (
          <span className="text-slate-600 font-medium truncate" title={venue}>
            Campo: {venue}
          </span>
        ) : (
          <span className="text-amber-800/90">
            Campo: sin asignar — programá fecha y sede en la vista del partido
            (mesa).
          </span>
        )}
      </p>
    </Link>
  );
}

function MatchBlock({ title, items, icon: Icon, emptyText, venueByMatchId }) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) {
    if (emptyText === "" || emptyText == null) return null;
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
        {emptyText}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-emerald-600" />}
        {title}
      </h4>
      <div className="grid gap-2 sm:grid-cols-2">
        {list.map((m) => (
          <MatchCard
            key={m.id ?? m.Id}
            m={m}
            venueByMatchId={venueByMatchId}
          />
        ))}
      </div>
    </div>
  );
}

function StandingsTable({ standings }) {
  const rows = Array.isArray(standings) ? standings : [];
  if (!rows.length) return null;
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-600">
          <tr>
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Equipo</th>
            <th className="px-2 py-2 text-center">PJ</th>
            <th className="px-2 py-2 text-center">G</th>
            <th className="px-2 py-2 text-center">E</th>
            <th className="px-2 py-2 text-center">P</th>
            <th className="px-2 py-2 text-center">GF</th>
            <th className="px-2 py-2 text-center">GC</th>
            <th className="px-2 py-2 text-center">DG</th>
            <th className="px-3 py-2 text-center font-bold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.teamId ?? i}
              className="border-t border-slate-100 bg-white hover:bg-slate-50/80"
            >
              <td className="px-3 py-2 text-slate-500">{i + 1}</td>
              <td className="px-3 py-2 font-medium text-slate-900">{r.teamName}</td>
              <td className="px-2 py-2 text-center tabular-nums">{r.matchesPlayed}</td>
              <td className="px-2 py-2 text-center tabular-nums">{r.won}</td>
              <td className="px-2 py-2 text-center tabular-nums">{r.drawn}</td>
              <td className="px-2 py-2 text-center tabular-nums">{r.lost}</td>
              <td className="px-2 py-2 text-center tabular-nums">{r.goalsFor}</td>
              <td className="px-2 py-2 text-center tabular-nums">{r.goalsAgainst}</td>
              <td className="px-2 py-2 text-center tabular-nums">{r.goalDifference ?? r.goalsFor - r.goalsAgainst}</td>
              <td className="px-3 py-2 text-center font-bold tabular-nums text-emerald-800">
                {r.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KnockoutRounds({ bracket, venueByMatchId, phaseMatches }) {
  const rounds = bracket?.rounds ?? bracket?.Rounds ?? [];
  if (!rounds.length) return null;
  return (
    <div className="space-y-6">
      {rounds.map((round, ri) => {
        const matches = round.matches ?? round.Matches ?? [];
        const title = round.title ?? round.Title ?? `Ronda ${ri + 1}`;
        return (
          <div key={ri}>
            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-600" />
              {title}
            </h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {matches.map((bm) => {
                const mid = bm.matchId ?? bm.MatchId;
                const local = bm.localName ?? bm.LocalName ?? "";
                const visitor = bm.visitorName ?? bm.VisitorName ?? "";
                const ls = bm.localScore ?? bm.LocalScore ?? 0;
                const vs = bm.visitorScore ?? bm.VisitorScore ?? 0;
                const st = bm.status ?? bm.Status ?? "";
                const row = findPhaseMatchRow(phaseMatches, mid);
                const sched =
                  row?.scheduledAt ??
                  row?.ScheduledAt ??
                  bm.scheduledAt ??
                  bm.ScheduledAt;
                const venue =
                  row?.venueName ??
                  row?.VenueName ??
                  bm.venueName ??
                  bm.VenueName;
                const cardPayload = {
                  id: mid,
                  Id: mid,
                  status: st,
                  scheduledAt: sched,
                  localTeamName: local,
                  visitorTeamName: visitor,
                  localScore: ls,
                  visitorScore: vs,
                  venueName: venue,
                };
                return (
                  <MatchCard
                    key={mid}
                    m={cardPayload}
                    venueByMatchId={venueByMatchId}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CompetitionDashboard({ dashboard, venueByMatchId }) {
  if (!dashboard) return null;

  const sum = dashboard.matchSummary ?? dashboard.MatchSummary ?? {};
  const phases = dashboard.phases ?? dashboard.Phases ?? [];

  return (
    <div className="space-y-10">
      {(sum.total > 0 || sum.Total > 0) && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">
            Resumen de partidos
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-3 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Total</p>
              <p className="text-2xl font-black text-slate-900">{sum.total ?? sum.Total ?? 0}</p>
            </div>
            <div className="rounded-xl bg-sky-50 border border-sky-100 px-3 py-3 text-center">
              <p className="text-[10px] font-bold text-sky-700 uppercase flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" /> Pendientes
              </p>
              <p className="text-2xl font-black text-sky-900">{sum.programado ?? sum.Programado ?? 0}</p>
            </div>
            <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-3 text-center">
              <p className="text-[10px] font-bold text-red-700 uppercase flex items-center justify-center gap-1">
                <Radio className="w-3 h-3" /> En vivo
              </p>
              <p className="text-2xl font-black text-red-900">{sum.enVivo ?? sum.EnVivo ?? 0}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-3 text-center">
              <p className="text-[10px] font-bold text-emerald-800 uppercase flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Finalizados
              </p>
              <p className="text-2xl font-black text-emerald-900">{sum.finalizado ?? sum.Finalizado ?? 0}</p>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-3 text-center">
              <p className="text-[10px] font-bold text-amber-800 uppercase flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" /> Susp.
              </p>
              <p className="text-2xl font-black text-amber-900">{sum.suspendido ?? sum.Suspendido ?? 0}</p>
            </div>
          </div>
        </section>
      )}

      {phases.map((phase) => {
        const mode = phase.mode ?? phase.Mode;
        const type = phase.type ?? phase.Type;
        const name = phase.name ?? phase.Name;
        const order = phase.order ?? phase.Order ?? 0;
        const badge = phaseTypeBadge(type, mode);

        if (mode === "roundRobin") {
          const groups = phase.groups ?? phase.Groups ?? [];
          return (
            <section
              key={phase.id ?? name + order}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm"
            >
              <div className="bg-slate-100/90 border-b border-slate-200 px-5 py-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Fase {order}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <h3 className="text-lg font-bold text-slate-900">{name}</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                    {badge}
                  </span>
                </div>
              </div>
              <div className="p-5 space-y-8">
                {!groups.length ? (
                  <p className="text-sm text-slate-500">Sin grupos configurados en esta fase.</p>
                ) : (
                  groups.map((g) => {
                    const gname = g.name ?? g.Name;
                    const standings = g.standings ?? g.Standings ?? [];
                    const matches = g.matches ?? g.Matches ?? [];
                    const { live, done, pending } = splitMatches(matches);
                    return (
                      <div key={g.id ?? gname} className="space-y-4">
                        <h4 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2">
                          {gname}
                        </h4>
                        {standings.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-600 mb-2">
                              Tabla de posiciones
                            </p>
                            <StandingsTable standings={standings} />
                          </div>
                        )}
                        {matches.length > 0 && (
                          <div className="space-y-6 pt-2">
                            <MatchBlock
                              title="En juego"
                              items={live}
                              icon={Radio}
                              emptyText="Ningún partido en juego."
                              venueByMatchId={venueByMatchId}
                            />
                            <MatchBlock
                              title="Pendientes"
                              items={pending}
                              icon={Clock}
                              emptyText="Sin partidos pendientes."
                              venueByMatchId={venueByMatchId}
                            />
                            <MatchBlock
                              title="Resultados"
                              items={done}
                              icon={CheckCircle2}
                              emptyText="Sin partidos finalizados."
                              venueByMatchId={venueByMatchId}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          );
        }

        const bracket = phase.bracket ?? phase.Bracket;
        const flat = phase.matches ?? phase.Matches ?? [];
        const { live, done, pending } = splitMatches(flat);
        const roundsCount =
          (bracket?.rounds?.length ?? 0) || (bracket?.Rounds?.length ?? 0);
        const hasBracketRounds = roundsCount > 0;

        return (
          <section
            key={phase.id ?? name + order}
            className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm"
          >
            <div className="bg-slate-100/90 border-b border-slate-200 px-5 py-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Fase {order}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <h3 className="text-lg font-bold text-slate-900">{name}</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-900 border border-violet-200">
                  {badge}
                </span>
              </div>
            </div>
            <div className="p-5 space-y-8">
              {hasBracketRounds ? (
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-3">
                    Llave (eliminatoria)
                  </p>
                  <KnockoutRounds
                    bracket={bracket}
                    venueByMatchId={venueByMatchId}
                    phaseMatches={flat}
                  />
                </div>
              ) : flat.length > 0 ? (
                <div className="space-y-6">
                  <p className="text-xs font-semibold text-slate-600 mb-2">
                    Partidos de la fase
                  </p>
                  <MatchBlock
                    title="En juego"
                    items={live}
                    icon={Radio}
                    emptyText=""
                    venueByMatchId={venueByMatchId}
                  />
                  <MatchBlock
                    title="Pendientes"
                    items={pending}
                    icon={Clock}
                    emptyText=""
                    venueByMatchId={venueByMatchId}
                  />
                  <MatchBlock
                    title="Resultados"
                    items={done}
                    icon={CheckCircle2}
                    emptyText=""
                    venueByMatchId={venueByMatchId}
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Aún no hay llave ni partidos cargados en esta fase.
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

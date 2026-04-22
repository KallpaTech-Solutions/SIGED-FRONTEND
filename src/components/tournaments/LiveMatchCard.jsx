import React from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";

/** En API: MatchStatus.EnVivo = 1 */
function isLiveStatus(status) {
  return status === 1 || status === "EnVivo";
}

function isScheduled(status) {
  return status === 0 || status === "Programado";
}

function statusShort(status) {
  if (status === 2 || status === "Finalizado") return "FT";
  if (status === 3 || status === "Suspendido") return "Susp.";
  return null;
}

/**
 * Tarjeta compacta estilo scoreboard (fondo claro, coherente con noticias).
 */
export default function LiveMatchCard({ match }) {
  const live = isLiveStatus(match.status);
  const scheduled = isScheduled(match.status);
  const localName = match.localTeam?.name ?? "Por definir";
  const visitorName = match.visitorTeam?.name ?? "Por definir";
  const time = match.scheduledAt
    ? new Date(match.scheduledAt).toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const ft = statusShort(match.status);
  const venue =
    match.venueName ??
    match.VenueName ??
    match.venue?.name ??
    match.Venue?.name;

  const mid = match.id ?? match.Id;

  /** Detalle del partido (marcador + eventos), no la competencia. */
  const to = mid ? `/torneos/partido/${mid}` : "/torneos";

  return (
    <Link
      to={to}
      state={{ fromMatchCard: true, matchId: mid }}
      className="min-w-[min(100%,280px)] max-w-[280px] shrink-0 bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-emerald-300/80 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
    >
      <div className="flex justify-between items-center mb-3 gap-2">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">
          {match.disciplineName ?? "Disciplina"}
        </span>
        {live && (
          <span className="flex items-center gap-1.5 bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full border border-red-100 shrink-0">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            VIVO
          </span>
        )}
        {!live && scheduled && time && (
          <span className="text-[10px] font-mono text-slate-500">{time}</span>
        )}
        {!live && ft && (
          <span className="text-[10px] font-bold text-slate-400 uppercase">{ft}</span>
        )}
      </div>

      <div className="space-y-2.5">
        <div className="flex justify-between items-center gap-3">
          <span className="text-slate-800 font-semibold text-sm truncate">
            {localName}
          </span>
          <span className="text-slate-900 font-black text-lg tabular-nums shrink-0">
            {match.localScore ?? 0}
          </span>
        </div>
        <div className="flex justify-between items-center gap-3">
          <span className="text-slate-800 font-semibold text-sm truncate">
            {visitorName}
          </span>
          <span className="text-slate-900 font-black text-lg tabular-nums shrink-0">
            {match.visitorScore ?? 0}
          </span>
        </div>
        <p className="text-[10px] flex items-start gap-1 pt-1 border-t border-slate-100 mt-1">
          <MapPin className="w-3 h-3 shrink-0 text-emerald-600 mt-0.5" />
          {venue ? (
            <span className="text-slate-600 font-medium truncate" title={venue}>
              Campo: {venue}
            </span>
          ) : (
            <span className="text-amber-800/85 leading-snug">
              Campo: sin asignar
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}

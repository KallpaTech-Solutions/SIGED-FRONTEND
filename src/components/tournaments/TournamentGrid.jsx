import React from "react";
import { Link } from "react-router-dom";
import { CalendarRange, Trophy, ChevronRight } from "lucide-react";
import {
  tournamentPublicLabel,
  tournamentPublicBadgeClass,
} from "../../utils/tournamentPublicStatus";

function formatRange(start, end) {
  if (!start || !end) return "—";
  const a = new Date(start);
  const b = new Date(end);
  const opts = { day: "2-digit", month: "short", year: "numeric" };
  return `${a.toLocaleDateString("es-PE", opts)} — ${b.toLocaleDateString("es-PE", opts)}`;
}

/**
 * Tarjetas de torneo con datos del GET /api/Tournaments.
 */
export default function TournamentGrid({ tournaments }) {
  if (!tournaments?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center">
        <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          No hay torneos activos listados. Cuando se publiquen en el sistema,
          aparecerán aquí con fechas y estado.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {tournaments.map((t) => (
        <Link
          key={t.id}
          to={`/torneos/torneo/${t.id}`}
          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-emerald-300/90 transition-all text-left block focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-lg leading-snug group-hover:text-emerald-800 transition-colors">
                {t.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                Temporada {t.year}
              </p>
            </div>
            <span
              className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border ${tournamentPublicBadgeClass(
                t.status
              )}`}
            >
              {tournamentPublicLabel(t.status)}
            </span>
          </div>
          <div className="flex items-start gap-2 text-xs text-slate-600">
            <CalendarRange className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{formatRange(t.startDate, t.endDate)}</span>
          </div>
          {t.organizer && (
            <p className="mt-3 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-600">Organiza:</span>{" "}
              {t.organizer}
            </p>
          )}
          <p className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-700 group-hover:text-emerald-800">
            Ver detalle completo
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </p>
        </Link>
      ))}
    </div>
  );
}

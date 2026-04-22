import React from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, ChevronRight } from "lucide-react";

const defaultBanner =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 128'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%23ecfdf5'/%3E%3Cstop offset='1' stop-color='%23d1fae5'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='400' height='128'/%3E%3Ctext x='50%25' y='54%25' fill='%23059669' font-family='system-ui' font-size='14' font-weight='600' text-anchor='middle'%3EUNAS%3C/text%3E%3C/svg%3E";

function statusStyle(statusName) {
  const s = (statusName || "").toLowerCase();
  if (s.includes("activo"))
    return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (s.includes("final"))
    return "bg-slate-100 text-slate-700 border-slate-200";
  if (s.includes("inscripc"))
    return "bg-sky-50 text-sky-800 border-sky-200";
  return "bg-amber-50 text-amber-900 border-amber-200";
}

/**
 * Competencias del GET /api/Competitions/public/catalog — datos mostrados tal cual vienen del API.
 */
export default function CompetitionGrid({ competitions }) {
  const navigate = useNavigate();

  if (!competitions?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
        <Trophy className="w-11 h-11 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Aún no hay competencias activas publicadas. Cuando el comité cargue
          torneos y competencias, aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {competitions.map((comp) => (
        <button
          key={comp.id}
          type="button"
          onClick={() => navigate(`/torneos/${comp.id}`)}
          className="group text-left rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-200 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        >
          <div className="h-28 bg-slate-100 flex items-center justify-center overflow-hidden relative">
            <img
              src={comp.bannerUrl || defaultBanner}
              alt=""
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
          </div>
          <div className="p-4 md:p-5">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-emerald-800 transition-colors pr-2">
                {comp.name}
              </h3>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 shrink-0 mt-0.5" />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-600 font-medium">{comp.discipline}</span>
              {comp.gender && (
                <span className="text-slate-400">· {comp.gender}</span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap justify-between items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded-full border ${statusStyle(comp.statusName)}`}
              >
                Torneo: {comp.statusName}
              </span>
            </div>
            {comp.tournamentName && (
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                {comp.tournamentName} · {comp.year}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

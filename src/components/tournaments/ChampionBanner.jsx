import React from "react";

/**
 * Banner de campeón reciente (solo si el API devuelve datos).
 * @param {{ champion: { name: string, logoUrl?: string, competitionName: string, tournamentName?: string, year?: number } | null }} props
 */
export default function ChampionBanner({ champion }) {
  if (!champion?.name) return null;

  const badge =
    champion.tournamentName && champion.year
      ? `${champion.tournamentName} ${champion.year}`
      : champion.tournamentName || "";

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-400 p-[3px] shadow-md shadow-amber-900/10 border border-amber-200/50">
      <div className="relative rounded-[13px] bg-white px-5 py-6 md:px-8 md:py-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center gap-5 md:gap-7">
          <div className="shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
            {champion.logoUrl ? (
              <img
                src={champion.logoUrl}
                alt=""
                className="w-full h-full object-contain p-2 drop-shadow"
              />
            ) : (
              <span className="text-4xl">🏆</span>
            )}
          </div>
          <div>
            <span className="text-amber-800 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs">
              Campeón reciente
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight uppercase mt-1">
              {champion.name}
            </h2>
            <p className="text-slate-600 font-medium text-sm mt-1">
              {champion.competitionName}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1 text-right shrink-0">
          <span className="text-5xl leading-none" aria-hidden>
            🏆
          </span>
          {badge && (
            <div className="mt-2 text-[10px] font-mono font-semibold text-amber-900/80 uppercase tracking-wider max-w-[14rem]">
              {badge}
            </div>
          )}
        </div>
        <div
          className="pointer-events-none absolute inset-0 rounded-[13px] overflow-hidden"
          aria-hidden
        >
          <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-70 animate-hub-shimmer" />
        </div>
      </div>
    </div>
  );
}

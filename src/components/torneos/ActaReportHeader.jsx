/**
 * Encabezado del acta (modal vista previa, PDF vía API, reglas): logos + título + campeonato + disciplina + marcador.
 */
export default function ActaReportHeader({
  leftLogoUrl,
  rightLogoUrl,
  tournamentName,
  disciplineName,
  localTeamName = "Local",
  visitorTeamName = "Visitante",
  localScore = 0,
  visitorScore = 0,
  /** "modal" más alto; "compact" para reglas */
  variant = "modal",
}) {
  const hLogo = variant === "modal" ? "h-[4.25rem] w-[4.25rem]" : "h-14 w-[4.5rem]";
  const ls = Number.isFinite(Number(localScore)) ? Number(localScore) : 0;
  const vs = Number.isFinite(Number(visitorScore)) ? Number(visitorScore) : 0;

  return (
    <div className="rounded-xl border border-slate-700 overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900 shadow-inner">
      <div
        className={`px-3 ${variant === "modal" ? "py-4" : "py-2.5"} flex items-stretch gap-3`}
      >
        <div
          className={`${hLogo} shrink-0 flex items-center justify-center bg-slate-950/60 rounded-xl border border-white/10 p-1.5`}
        >
          {leftLogoUrl ? (
            <img src={leftLogoUrl} alt="" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-[9px] text-slate-500 text-center leading-tight px-0.5">
              Sin logo
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center text-white min-w-0">
          <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">
            SIGED — ACTA DE PARTIDO
          </p>
          <p className="mt-1.5 text-sm sm:text-base font-bold text-white leading-tight line-clamp-2 px-1">
            {tournamentName?.trim() || "—"}
          </p>
          <p className="mt-0.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-emerald-100/90">
            {disciplineName?.trim() || "—"}
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full">
            <div className="flex items-center gap-2 rounded-xl bg-black/25 px-2.5 sm:px-3 py-2 border border-white/10 shadow-sm max-w-[min(100%,220px)]">
              <span className="text-[11px] sm:text-xs font-bold text-white/95 truncate text-right flex-1 min-w-0">
                {localTeamName}
              </span>
              <span className="shrink-0 text-base sm:text-lg font-black tabular-nums text-emerald-200 bg-emerald-950/70 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                {ls}
              </span>
            </div>
            <span className="text-white/40 font-light text-xl sm:text-2xl select-none">—</span>
            <div className="flex items-center gap-2 rounded-xl bg-black/25 px-2.5 sm:px-3 py-2 border border-white/10 shadow-sm max-w-[min(100%,220px)]">
              <span className="shrink-0 text-base sm:text-lg font-black tabular-nums text-emerald-200 bg-emerald-950/70 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                {vs}
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-white/95 truncate text-left flex-1 min-w-0">
                {visitorTeamName}
              </span>
            </div>
          </div>
        </div>

        <div
          className={`${hLogo} shrink-0 flex items-center justify-center bg-slate-950/60 rounded-xl border border-white/10 p-1.5`}
        >
          {rightLogoUrl ? (
            <img src={rightLogoUrl} alt="" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-[9px] text-slate-500 text-center leading-tight px-0.5">
              Sin logo
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Timer, Hourglass } from "lucide-react";
import {
  describePublicZonaHorariaView,
  formatDurationMs,
  getChronoElapsedMs,
  getCountdownRemainingMs,
  loadZonaHorariaState,
  subscribeZonaHoraria,
} from "../../utils/zonaHorariaTestSync";

/**
 * Franja de prueba: refleja cronómetro y cuenta regresiva que configura SUPERADMIN en ZonaHoraria
 * (misma app/origen: localStorage + BroadcastChannel + evento de ventana).
 */
export function ZonaHorariaPublicBanner() {
  const [state, setState] = useState(loadZonaHorariaState);

  useEffect(() => subscribeZonaHoraria(setState), []);

  useEffect(() => {
    if (!state.publicBannerEnabled) return undefined;
    const id = window.setInterval(() => setState(loadZonaHorariaState()), 100);
    return () => window.clearInterval(id);
  }, [state.publicBannerEnabled]);

  if (!state.publicBannerEnabled) return null;

  const now = Date.now();
  const chMs = getChronoElapsedMs(state, now);
  const cdMs = getCountdownRemainingMs(state, now);
  const showMs = state.publicShowMs;
  const mode = state.publicShowMode;

  const cdLow = cdMs <= 10_000 && state.countdown.running;

  return (
    <div
      className="pointer-events-none fixed top-0 left-0 right-0 z-[10030] flex justify-center px-2 pt-2"
      aria-hidden="false"
    >
      <div
        className={`pointer-events-auto max-w-3xl w-full rounded-xl border px-4 py-2.5 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-mono font-bold tabular-nums ${
          cdLow
            ? "border-red-400/70 bg-red-950/90 text-red-100 animate-pulse"
            : "border-violet-500/50 bg-slate-950/92 text-violet-50"
        }`}
      >
        <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-violet-300/90 w-full text-center opacity-90">
          ZonaHoraria · solo lectura · controlado por SUPERADMIN (no es el cronómetro del partido)
        </span>
        <span className="text-[10px] font-sans font-semibold text-violet-200/80 w-full text-center -mt-1 pb-0.5 border-b border-violet-500/20">
          Configuración que ve el público: {describePublicZonaHorariaView(mode, showMs)}
        </span>
        {(mode === "chrono" || mode === "both") && (
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="text-sky-200/80 text-[10px] uppercase">Cronómetro</span>
            <span className="text-white min-w-[8.5rem] text-center sm:text-base">
              {formatDurationMs(chMs, showMs)}
            </span>
          </div>
        )}
        {(mode === "countdown" || mode === "both") && (
          <div className="flex items-center gap-2">
            <Hourglass className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-amber-200/80 text-[10px] uppercase">Cuenta regresiva</span>
            <span className="text-white min-w-[8.5rem] text-center sm:text-base">
              {formatDurationMs(cdMs, showMs)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

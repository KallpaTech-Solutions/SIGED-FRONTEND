import React, { useEffect, useState } from "react";
import { BROADCAST_TEMPLATE } from "../../utils/matchBroadcastWidget";
import { buildSoccerStatsRows, parseStatsPanel } from "../../utils/matchBroadcastStatsPanel";

/**
 * Panel de estadísticas debajo del tablero (solo si querés duplicar vista; el tablero LED ya integra stats).
 * @param {{ widgetState: import('../../utils/matchBroadcastWidget').MatchBroadcastWidgetState, live: boolean, inPeriodBreak: boolean, homeName: string, awayName: string }} props
 */
export function SoccerStatsPanelHero({ widgetState, live, inPeriodBreak, homeName, awayName }) {
  if (widgetState.template !== BROADCAST_TEMPLATE.Soccer) return null;

  const sp = parseStatsPanel(widgetState.statsPanel);
  if (!sp.enabled) return null;

  const showPanel = sp.showDuringPeriodBreak ? inPeriodBreak || sp.forceStatsOverlay : true;
  if (!showPanel) return null;

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    if (!live) return undefined;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [live]);

  const sport = widgetState.sport;
  const hName = (sport.labelHome || "").trim() || homeName || "Local";
  const aName = (sport.labelAway || "").trim() || awayName || "Visita";
  const rows = buildSoccerStatsRows(sp, sport, nowMs);

  if (rows.length === 0) return null;

  return (
    <div className="mb-4 rounded-2xl border-2 border-white/25 bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 px-3 py-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <p className="text-center font-black italic text-lg md:text-xl tracking-wide text-white mb-3">
        ESTADÍSTICAS
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
        <span className="rounded-full border border-white/40 bg-black px-3 py-1 text-[10px] md:text-xs font-bold uppercase tracking-wide">
          {hName}
        </span>
        <span className="rounded-full border border-white/40 bg-black px-3 py-1 text-[10px] md:text-xs font-bold uppercase tracking-wide">
          {aName}
        </span>
      </div>
      <div className="divide-y divide-slate-700/90 border-t border-b border-slate-700/90">
        {rows.map((r) => (
          <div
            key={r.label}
            className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center py-2 text-xs md:text-sm"
          >
            <span
              className={`text-right font-mono font-bold tabular-nums ${
                r.highlight ? "text-yellow-300" : "text-slate-100"
              }`}
            >
              {r.left}
            </span>
            <span className="text-center text-[10px] md:text-xs font-semibold uppercase tracking-wide text-slate-300 px-1">
              {r.label}
            </span>
            <span
              className={`text-left font-mono font-bold tabular-nums ${
                r.highlight ? "text-yellow-300" : "text-slate-100"
              }`}
            >
              {r.right}
            </span>
          </div>
        ))}
      </div>
      {sp.showDuringPeriodBreak && (
        <p className="text-[9px] text-center text-slate-500 mt-2">
          {sp.forceStatsOverlay
            ? "Panel forzado desde mesa (entretiempo). Apagá «Tablero entretiempo» en widgets para volver al modo automático."
            : "Visible en descanso entre periodos (registrá «Fin de periodo» en el acta; desaparece al iniciar el siguiente)."}
        </p>
      )}
    </div>
  );
}

import React from "react";
import { Clock } from "lucide-react";

/** Vista pública del cronómetro por periodo; en el futuro se puede ramificar por `matchClock.widgetKind`. */
export function MatchClockLiveWidget({ matchClock }) {
  if (!matchClock?.visible) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-950/40 px-4 py-3 text-emerald-50">
      <div className="flex items-center gap-2 text-emerald-200/90">
        <Clock className="w-5 h-5 shrink-0" />
        <span className="text-[11px] font-bold uppercase tracking-wider">
          {matchClock.periodLabel ?? `Periodo ${matchClock.period ?? "—"}`}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold tabular-nums tracking-tight text-white">
          {matchClock.line}
        </p>
        {matchClock.hint ? (
          <p className="text-[11px] text-emerald-200/70 mt-0.5 max-w-md">{matchClock.hint}</p>
        ) : null}
      </div>
    </div>
  );
}

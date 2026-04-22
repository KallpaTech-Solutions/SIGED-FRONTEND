import React from "react";

/**
 * Vista previa estilo broadcast cuando no hay ningún partido con estado EnVivo.
 * No enlaza a competencia real (es ilustrativa).
 */
export default function LiveMatchMockCard({
  discipline = "Fútbol",
  localName = "Facultad A",
  visitorName = "Facultad B",
  localScore = 1,
  visitorScore = 1,
  badge = "Vista previa",
}) {
  return (
    <div
      className="min-w-[min(100%,280px)] max-w-[280px] shrink-0 rounded-xl border border-dashed border-slate-300 bg-gradient-to-b from-slate-50 to-white p-4 shadow-sm opacity-95"
      aria-hidden
    >
      <div className="flex justify-between items-center mb-3 gap-2">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">
          {discipline}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
          {badge}
        </span>
      </div>
      <div className="space-y-2.5">
        <div className="flex justify-between items-center gap-3">
          <span className="text-slate-800 font-semibold text-sm truncate">
            {localName}
          </span>
          <span className="text-slate-900 font-black text-lg tabular-nums shrink-0">
            {localScore}
          </span>
        </div>
        <div className="flex justify-between items-center gap-3">
          <span className="text-slate-800 font-semibold text-sm truncate">
            {visitorName}
          </span>
          <span className="text-slate-900 font-black text-lg tabular-nums shrink-0">
            {visitorScore}
          </span>
        </div>
      </div>
      <p className="mt-3 text-[10px] text-slate-400 leading-snug">
        Así se verá el marcador cuando haya encuentros en vivo.
      </p>
    </div>
  );
}

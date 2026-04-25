import React from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import {
  formatDurationMs,
  getChronoElapsedMs,
  getCountdownRemainingMs,
} from "../../utils/matchBroadcastWidget";
import { defaultZonaHorariaTestState } from "../../utils/zonaHorariaTestSync";

/**
 * Controles solo para plantilla «Tiempos»: visibilidad + cronómetro + cuenta regresiva.
 * No se usa en tableros deportivos (evita mostrar cuenta regresiva si el público no la ve en otro modo).
 */
export function MatchBroadcastTimeOnlyControls({
  local,
  localRef,
  setLocal,
  commit,
  mesaBusy,
  live,
  nowMs,
}) {
  const chronoMs = getChronoElapsedMs(
    { ...defaultZonaHorariaTestState(), chrono: local.chrono, countdown: local.countdown },
    nowMs
  );
  const countdownMs = getCountdownRemainingMs(
    { ...defaultZonaHorariaTestState(), chrono: local.chrono, countdown: local.countdown },
    nowMs
  );

  return (
    <>
      <div className="flex flex-wrap gap-3 text-xs">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-emerald-600"
            checked={local.heroShowChrono}
            disabled={mesaBusy || !live}
            onChange={(e) =>
              void commit({ ...localRef.current, heroShowChrono: e.target.checked })
            }
          />
          Cronómetro
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-emerald-600"
            checked={local.heroShowSystemClock}
            disabled={mesaBusy || !live}
            onChange={(e) =>
              void commit({
                ...localRef.current,
                heroShowSystemClock: e.target.checked,
              })
            }
          />
          Reloj (hora)
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-emerald-600"
            checked={local.heroShowCountdown}
            disabled={mesaBusy || !live}
            onChange={(e) =>
              void commit({
                ...localRef.current,
                heroShowCountdown: e.target.checked,
              })
            }
          />
          Cuenta regresiva
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-emerald-600"
            checked={local.publicShowMs}
            disabled={mesaBusy || !live}
            onChange={(e) =>
              void commit({ ...localRef.current, publicShowMs: e.target.checked })
            }
          />
          Mostrar ms
        </label>
      </div>
      <label className="flex items-center gap-2 text-xs">
        Periodo para eventos
        <input
          type="number"
          min={1}
          max={99}
          className="w-16 rounded bg-slate-900 border border-emerald-700 px-2 py-1 text-white"
          value={local.eventPeriod}
          disabled={mesaBusy || !live}
          onChange={(e) => {
            const n = Math.max(1, Math.min(99, Number(e.target.value) || 1));
            setLocal((s) => ({
              ...s,
              eventPeriod: n,
              sport: { ...s.sport, period: n },
            }));
          }}
          onBlur={() => void commit(localRef.current)}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2 border-t border-emerald-800/60 pt-3">
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase text-emerald-300/90">Cronómetro</p>
          <p className="text-2xl font-mono font-bold tabular-nums text-center">
            {formatDurationMs(chronoMs, local.publicShowMs)}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {!local.chrono.running ? (
              <button
                type="button"
                disabled={mesaBusy || !live}
                onClick={() =>
                  void commit({
                    ...localRef.current,
                    chrono: {
                      ...localRef.current.chrono,
                      running: true,
                      startedAt: Date.now(),
                    },
                  })
                }
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                Iniciar
              </button>
            ) : (
              <button
                type="button"
                disabled={mesaBusy || !live}
                onClick={() => {
                  const b = localRef.current;
                  const elapsed = getChronoElapsedMs(
                    {
                      ...defaultZonaHorariaTestState(),
                      chrono: b.chrono,
                      countdown: b.countdown,
                    },
                    Date.now()
                  );
                  void commit({
                    ...b,
                    chrono: {
                      running: false,
                      baseMs: elapsed,
                      startedAt: null,
                    },
                  });
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-amber-600 hover:bg-amber-500 px-2 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
              >
                <Pause className="w-3.5 h-3.5" />
                Pausar
              </button>
            )}
            <button
              type="button"
              disabled={mesaBusy || !live}
              onClick={() =>
                void commit({
                  ...localRef.current,
                  chrono: { running: false, baseMs: 0, startedAt: null },
                })
              }
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-700 bg-slate-900 px-2 py-1.5 text-[11px] font-bold text-emerald-100 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reiniciar
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase text-amber-300/90">Cuenta regresiva</p>
          <p className="text-2xl font-mono font-bold tabular-nums text-center text-amber-100">
            {formatDurationMs(countdownMs, local.publicShowMs)}
          </p>
          <div className="flex flex-wrap gap-2 justify-center items-end">
            <label className="flex flex-col gap-0.5 text-[10px] text-emerald-200/80">
              Segs
              <input
                type="number"
                min={1}
                max={86400}
                className="w-20 rounded bg-slate-900 border border-amber-800/60 px-2 py-1 text-sm text-white"
                defaultValue={local.countdown.configuredSec}
                key={local.countdown.configuredSec}
                disabled={mesaBusy || !live}
                onBlur={(ev) => {
                  const n = Math.max(1, Math.min(86400, Number(ev.target.value) || 60));
                  const b = localRef.current;
                  void commit({
                    ...b,
                    countdown: {
                      ...b.countdown,
                      configuredSec: n,
                      running: false,
                      endAt: null,
                      remainingMsFrozen: n * 1000,
                    },
                  });
                }}
              />
            </label>
            {!local.countdown.running ? (
              <button
                type="button"
                disabled={mesaBusy || !live}
                onClick={() => {
                  const b = localRef.current;
                  const rem = getCountdownRemainingMs(
                    {
                      ...defaultZonaHorariaTestState(),
                      chrono: b.chrono,
                      countdown: b.countdown,
                    },
                    Date.now()
                  );
                  if (rem <= 0) return;
                  void commit({
                    ...b,
                    countdown: {
                      ...b.countdown,
                      running: true,
                      endAt: Date.now() + rem,
                    },
                  });
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-amber-600 hover:bg-amber-500 px-2 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                Iniciar
              </button>
            ) : (
              <button
                type="button"
                disabled={mesaBusy || !live}
                onClick={() => {
                  const b = localRef.current;
                  const rem = getCountdownRemainingMs(
                    {
                      ...defaultZonaHorariaTestState(),
                      chrono: b.chrono,
                      countdown: b.countdown,
                    },
                    Date.now()
                  );
                  void commit({
                    ...b,
                    countdown: {
                      ...b.countdown,
                      running: false,
                      endAt: null,
                      remainingMsFrozen: rem,
                    },
                  });
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-700 px-2 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
              >
                <Pause className="w-3.5 h-3.5" />
                Pausar
              </button>
            )}
            <button
              type="button"
              disabled={mesaBusy || !live}
              onClick={() => {
                const b = localRef.current;
                void commit({
                  ...b,
                  countdown: {
                    ...b.countdown,
                    running: false,
                    endAt: null,
                    remainingMsFrozen: b.countdown.configuredSec * 1000,
                  },
                });
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-800/50 bg-slate-900 px-2 py-1.5 text-[11px] font-bold text-amber-100 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reiniciar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

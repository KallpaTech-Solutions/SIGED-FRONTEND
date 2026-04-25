import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Clock,
  Globe,
  GripVertical,
  X,
  RotateCcw,
  LayoutGrid,
  CircleDot,
  Binary,
  Play,
  Pause,
  Eye,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  defaultZonaHorariaTestState,
  describePublicZonaHorariaView,
  formatDurationMs,
  getChronoElapsedMs,
  getCountdownRemainingMs,
  loadZonaHorariaState,
  saveZonaHorariaState,
  subscribeZonaHoraria,
} from "../../utils/zonaHorariaTestSync";

const CX = 100;
const CY = 100;

function pad2(n) {
  return String(Math.floor(n)).padStart(2, "0");
}

function formatHmsMs(ms) {
  const d = new Date(ms);
  const h = d.getHours();
  const m = d.getMinutes();
  const s = d.getSeconds();
  const x = d.getMilliseconds();
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}.${String(x).padStart(3, "0")}`;
}

function handAngles(ms) {
  const d = new Date(ms);
  const h =
    (d.getHours() % 12) +
    d.getMinutes() / 60 +
    d.getSeconds() / 3600 +
    d.getMilliseconds() / 3_600_000;
  const m = d.getMinutes() + d.getSeconds() / 60 + d.getMilliseconds() / 60_000;
  const s = d.getSeconds() + d.getMilliseconds() / 1000;
  return {
    hour: h * 30 - 90,
    minute: m * 6 - 90,
    second: s * 6 - 90,
  };
}

function AnalogFace({ nowMs }) {
  const { hour, minute, second } = useMemo(() => handAngles(nowMs), [nowMs]);
  const ticks = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);

  return (
    <div className="relative mx-auto w-[200px] h-[200px] animate-in fade-in duration-300">
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-lg">
        <defs>
          <radialGradient id="zh-dial" cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
        </defs>
        <circle cx={CX} cy={CY} r="92" fill="url(#zh-dial)" stroke="#334155" strokeWidth="3" />
        {ticks.map((i) => {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const x1 = CX + Math.cos(a) * 78;
          const y1 = CY + Math.sin(a) * 78;
          const x2 = CX + Math.cos(a) * 88;
          const y2 = CY + Math.sin(a) * 88;
          const thick = i % 3 === 0;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#94a3b8"
              strokeWidth={thick ? 3 : 1.5}
              strokeLinecap="round"
            />
          );
        })}
        <circle cx={CX} cy={CY} r="6" fill="#0ea5e9" />
        <line
          x1={CX}
          y1={CY}
          x2={CX}
          y2={CY - 42}
          stroke="#e2e8f0"
          strokeWidth="5"
          strokeLinecap="round"
          transform={`rotate(${hour} ${CX} ${CY})`}
          style={{ transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
        <line
          x1={CX}
          y1={CY}
          x2={CX}
          y2={CY - 62}
          stroke="#38bdf8"
          strokeWidth="3.5"
          strokeLinecap="round"
          transform={`rotate(${minute} ${CX} ${CY})`}
          style={{ transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
        <line
          x1={CX}
          y1={CY + 12}
          x2={CX}
          y2={CY - 72}
          stroke="#f472b6"
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${second} ${CX} ${CY})`}
          style={{ transition: "transform 0.08s linear" }}
        />
      </svg>
    </div>
  );
}

function useIsSuperAdmin() {
  const { user } = useAuth();
  return (
    String(user?.rol ?? "")
      .replace(/\s+/g, "")
      .toUpperCase() === "SUPERADMIN"
  );
}

const ZH_FAB_POS_KEY = "siged:zonaHorariaFabPos:v1";

function defaultFabPos() {
  const margin = 20;
  const approxW = 210;
  const approxH = 46;
  return {
    x: Math.max(margin, window.innerWidth - approxW - margin),
    y: Math.max(margin, window.innerHeight - approxH - margin),
  };
}

function loadFabPos() {
  try {
    const raw = localStorage.getItem(ZH_FAB_POS_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (typeof o.x !== "number" || typeof o.y !== "number") return null;
    return { x: o.x, y: o.y };
  } catch {
    return null;
  }
}

function saveFabPos(p) {
  try {
    localStorage.setItem(ZH_FAB_POS_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

function clampFabPos(p, w, h) {
  const m = 8;
  const maxX = Math.max(m, window.innerWidth - w - m);
  const maxY = Math.max(m, window.innerHeight - h - m);
  return {
    x: Math.min(maxX, Math.max(m, p.x)),
    y: Math.min(maxY, Math.max(m, p.y)),
  };
}

/**
 * Widget de prueba: reloj sistema, cronómetro en marcha, cuenta regresiva, sync a vista pública (super admin).
 */
export function ZonaHorariaWidget() {
  const isSuperAdmin = useIsSuperAdmin();
  const [open, setOpen] = useState(false);
  const [syncState, setSyncState] = useState(loadZonaHorariaState);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [view, setView] = useState("both");
  const [countdownInput, setCountdownInput] = useState("60");
  const [fabPos, setFabPos] = useState(() => loadFabPos() ?? defaultFabPos());
  const fabWrapRef = useRef(null);
  const fabDragRef = useRef(null);
  const fabPosRef = useRef(fabPos);
  fabPosRef.current = fabPos;

  const measureFab = () => {
    const el = fabWrapRef.current;
    if (!el) return { w: 210, h: 46 };
    const r = el.getBoundingClientRect();
    return { w: r.width, h: r.height };
  };

  useLayoutEffect(() => {
    setFabPos((p) => clampFabPos(p, measureFab().w, measureFab().h));
  }, []);

  useEffect(() => {
    const onResize = () => {
      const { w, h } = measureFab();
      setFabPos((p) => clampFabPos(p, w, h));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onFabGripDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const { w, h } = measureFab();
    fabDragRef.current = {
      id: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      x0: fabPosRef.current.x,
      y0: fabPosRef.current.y,
      w,
      h,
    };
  };

  const onFabGripMove = (e) => {
    const d = fabDragRef.current;
    if (!d || e.pointerId !== d.id) return;
    const nx = d.x0 + (e.clientX - d.sx);
    const ny = d.y0 + (e.clientY - d.sy);
    setFabPos(clampFabPos({ x: nx, y: ny }, d.w, d.h));
  };

  const endFabDrag = (e) => {
    const d = fabDragRef.current;
    if (!d || e.pointerId !== d.id) return;
    fabDragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    setFabPos((p) => {
      const { w, h } = measureFab();
      const c = clampFabPos(p, w, h);
      saveFabPos(c);
      return c;
    });
  };

  useEffect(() => subscribeZonaHoraria(setSyncState), []);

  const commit = (mutator) => {
    setSyncState((prev) => {
      const base = prev && prev.v === 1 ? prev : defaultZonaHorariaTestState();
      const next = mutator(base);
      return saveZonaHorariaState(next);
    });
  };

  /**
   * Con el panel abierto: tick del reloj + estado fresco desde localStorage cada 100 ms.
   * Así la vista solo lectura ve el cronómetro/cuenta avanzar aunque falle BroadcastChannel
   * o subscribeZonaHoraria no replique al instante.
   */
  useEffect(() => {
    if (!open) return undefined;
    const id = window.setInterval(() => {
      const now = Date.now();
      setNowMs(now);
      setSyncState(loadZonaHorariaState());
    }, 100);
    return () => window.clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (!syncState.countdown.running) return undefined;
    const id = window.setInterval(() => {
      const s = loadZonaHorariaState();
      if (!s.countdown.running) return;
      const r = getCountdownRemainingMs(s);
      if (r <= 0) {
        const next = {
          ...s,
          countdown: {
            ...s.countdown,
            running: false,
            endAt: null,
            remainingMsFrozen: 0,
          },
        };
        setSyncState(saveZonaHorariaState(next));
      }
    }, 150);
    return () => window.clearInterval(id);
  }, [syncState.countdown.running]);

  const secondPulse = useMemo(() => new Date(nowMs).getSeconds(), [nowMs]);

  const tickNow = open ? nowMs : Date.now();
  const chronoMs = getChronoElapsedMs(syncState, tickNow);
  const countdownMs = getCountdownRemainingMs(syncState, tickNow);

  const applyCountdownSec = () => {
    const n = Math.max(1, Math.min(86400, Number(countdownInput) || 60));
    commit((s) => ({
      ...s,
      countdown: {
        ...s.countdown,
        configuredSec: n,
        running: false,
        endAt: null,
        remainingMsFrozen: n * 1000,
      },
    }));
    setCountdownInput(String(n));
  };

  return (
    <>
      <div
        ref={fabWrapRef}
        className="fixed z-[10040] flex items-stretch rounded-full border border-sky-500/50 bg-slate-900/95 shadow-xl backdrop-blur-sm overflow-hidden touch-manipulation"
        style={{ left: fabPos.x, top: fabPos.y }}
      >
        <button
          type="button"
          aria-label="Arrastrar posición de ZonaHoraria"
          title="Arrastrar"
          className="flex items-center justify-center px-1.5 text-slate-500 hover:text-sky-300 hover:bg-slate-800/90 cursor-grab active:cursor-grabbing touch-none select-none border-r border-slate-600/60"
          onPointerDown={onFabGripDown}
          onPointerMove={onFabGripMove}
          onPointerUp={endFabDrag}
          onPointerCancel={endFabDrag}
        >
          <GripVertical className="w-4 h-4 shrink-0" />
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 pl-1 pr-4 py-2.5 text-xs font-bold uppercase tracking-wide text-sky-100 hover:bg-slate-800 hover:border-sky-400 transition-colors border-l border-transparent"
          title="Zona horaria — reloj de prueba (no ligado al partido)"
        >
          <Globe className="w-4 h-4 text-sky-400 shrink-0" />
          ZonaHoraria
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[10050] flex items-start justify-center pt-16 sm:pt-10 px-3 pointer-events-none">
          <div
            className="pointer-events-auto w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-600/80 bg-slate-950/95 text-slate-100 shadow-2xl backdrop-blur-md animate-in zoom-in-95 fade-in duration-200"
            role="dialog"
            aria-label="Zona horaria de prueba"
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 px-4 py-3 bg-slate-900/90 sticky top-0 z-10">
              <div className="flex items-center gap-2 min-w-0">
                <Clock className="w-5 h-5 text-sky-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">ZonaHoraria</p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {isSuperAdmin
                      ? "Control total · lo que el público ve lo definís acá"
                      : "Reloj local · el cronómetro público lo maneja SUPERADMIN"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {isSuperAdmin ? (
                <div className="rounded-xl border border-violet-500/40 bg-violet-950/25 px-3 py-3 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-violet-200 flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5" />
                    Vista pública (partido)
                  </p>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-slate-500"
                      checked={syncState.publicBannerEnabled}
                      onChange={(e) =>
                        commit((s) => ({ ...s, publicBannerEnabled: e.target.checked }))
                      }
                    />
                    Mostrar franja flotante (todas las rutas de esta app; mismo origen que el público)
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-slate-500"
                      checked={syncState.publicShowMs}
                      onChange={(e) =>
                        commit((s) => ({ ...s, publicShowMs: e.target.checked }))
                      }
                    />
                    Incluir milisegundos en público
                  </label>
                  <div>
                    <p className="text-[10px] text-violet-200/70 mb-1">
                      Tipo de reloj que ve el público
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "chrono", label: "Cronómetro" },
                        { id: "countdown", label: "Cuenta regresiva" },
                        { id: "both", label: "Ambos" },
                      ].map(({ id, label }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => commit((s) => ({ ...s, publicShowMode: id }))}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                            syncState.publicShowMode === id
                              ? "bg-violet-600 text-white"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-violet-200/85 rounded-md bg-violet-950/40 px-2 py-1.5 border border-violet-500/25">
                    Así verá el público (con franja activa):{" "}
                    <span className="font-semibold text-violet-100">
                      {describePublicZonaHorariaView(
                        syncState.publicShowMode,
                        syncState.publicShowMs
                      )}
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-500">
                    El público solo observa. Misma URL de origen en todas las pestañas (ej. no mezclar
                    localhost con 127.0.0.1).
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-3 space-y-2 text-[11px] text-slate-400">
                  <p>
                    Solo <strong className="text-slate-300">SUPERADMIN</strong> elige qué reloj
                    ve el público y puede iniciar o pausar el cronómetro y la cuenta regresiva.
                  </p>
                  <p className="text-[10px] text-slate-300 rounded-md bg-slate-950/60 px-2 py-1.5 border border-slate-700/80">
                    Configuración pública actual:{" "}
                    <span className="font-semibold text-slate-100">
                      {describePublicZonaHorariaView(
                        syncState.publicShowMode,
                        syncState.publicShowMs
                      )}
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Valores actuales (solo lectura):
                  </p>
                  <div className="font-mono text-sm text-slate-200 space-y-1">
                    <p>
                      <span className="text-emerald-400/90">Cronómetro:</span>{" "}
                      {formatDurationMs(chronoMs, true)}
                    </p>
                    <p>
                      <span className="text-rose-400/90">Cuenta regresiva:</span>{" "}
                      {formatDurationMs(countdownMs, true)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] font-bold uppercase text-slate-500 w-full">
                  Vista reloj sistema
                </span>
                {[
                  { id: "digital", label: "Digital", Icon: Binary },
                  { id: "analog", label: "Analógico", Icon: CircleDot },
                  { id: "both", label: "Ambos", Icon: LayoutGrid },
                ].map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setView(id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      view === id
                        ? "bg-sky-600 text-white shadow-md scale-[1.02]"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {(view === "digital" || view === "both") && (
                <div className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-6 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                    Hora del sistema
                  </p>
                  <p
                    key={secondPulse}
                    className="text-4xl sm:text-5xl font-mono font-bold tabular-nums tracking-tight text-white animate-in zoom-in-95 duration-150"
                  >
                    {formatHmsMs(nowMs).slice(0, 8)}
                  </p>
                  <p className="mt-1 text-lg font-mono tabular-nums text-sky-300/90">
                    .{String(new Date(nowMs).getMilliseconds()).padStart(3, "0")}
                  </p>
                </div>
              )}

              {(view === "analog" || view === "both") && (
                <div className="rounded-xl border border-slate-700 bg-slate-900/50 py-4">
                  <AnalogFace nowMs={nowMs} />
                </div>
              )}

              {isSuperAdmin ? (
                <>
                  <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/20 px-4 py-3 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200/90">
                      Cronómetro (solo SUPERADMIN)
                    </p>
                    <p className="text-3xl font-mono font-bold tabular-nums text-emerald-100 text-center">
                      {formatDurationMs(chronoMs, true)}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {!syncState.chrono.running ? (
                        <button
                          type="button"
                          onClick={() =>
                            commit((s) => ({
                              ...s,
                              chrono: {
                                ...s.chrono,
                                running: true,
                                startedAt: Date.now(),
                              },
                            }))
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-bold text-white"
                        >
                          <Play className="w-4 h-4" />
                          Iniciar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            commit((s) => {
                              const elapsed = getChronoElapsedMs(s);
                              return {
                                ...s,
                                chrono: {
                                  running: false,
                                  baseMs: elapsed,
                                  startedAt: null,
                                },
                              };
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 px-3 py-2 text-xs font-bold text-white"
                        >
                          <Pause className="w-4 h-4" />
                          Pausar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          commit((s) => ({
                            ...s,
                            chrono: { running: false, baseMs: 0, startedAt: null },
                          }))
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reiniciar
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-rose-500/35 bg-rose-950/15 px-4 py-3 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-rose-200/90">
                      Cuenta regresiva (solo SUPERADMIN)
                    </p>
                    <div className="flex flex-wrap items-end gap-2">
                      <label className="flex flex-col gap-1 text-[10px] text-slate-400">
                        Segundos iniciales
                        <input
                          type="number"
                          min={1}
                          max={86400}
                          value={countdownInput}
                          onChange={(e) => setCountdownInput(e.target.value)}
                          className="w-24 rounded-lg bg-slate-900 border border-slate-600 px-2 py-1.5 text-sm text-white"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={applyCountdownSec}
                        className="rounded-lg bg-slate-700 hover:bg-slate-600 px-3 py-2 text-xs font-bold"
                      >
                        Aplicar
                      </button>
                    </div>
                    <p className="text-3xl font-mono font-bold tabular-nums text-rose-100 text-center">
                      {formatDurationMs(countdownMs, true)}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {!syncState.countdown.running ? (
                        <button
                          type="button"
                          onClick={() =>
                            commit((s) => {
                              const rem = getCountdownRemainingMs(s);
                              if (rem <= 0) return s;
                              return {
                                ...s,
                                countdown: {
                                  ...s.countdown,
                                  running: true,
                                  endAt: Date.now() + rem,
                                },
                              };
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 px-3 py-2 text-xs font-bold text-white"
                        >
                          <Play className="w-4 h-4" />
                          Iniciar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            commit((s) => ({
                              ...s,
                              countdown: {
                                ...s.countdown,
                                running: false,
                                endAt: null,
                                remainingMsFrozen: getCountdownRemainingMs(s),
                              },
                            }))
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 px-3 py-2 text-xs font-bold text-white"
                        >
                          <Pause className="w-4 h-4" />
                          Pausar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          commit((s) => ({
                            ...s,
                            countdown: {
                              ...s.countdown,
                              running: false,
                              endAt: null,
                              remainingMsFrozen: s.countdown.configuredSec * 1000,
                            },
                          }))
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reiniciar
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

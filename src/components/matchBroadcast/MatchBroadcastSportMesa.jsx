import React from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import {
  BROADCAST_TEMPLATE,
  formatDurationMs,
  getChronoElapsedMs,
  parseSoccerSubstitution,
} from "../../utils/matchBroadcastWidget";
import {
  defaultStatsPanel,
  livePossessionHomePct,
  parseStatsPanel,
} from "../../utils/matchBroadcastStatsPanel";
import { defaultZonaHorariaTestState } from "../../utils/zonaHorariaTestSync";

function Btn({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="min-w-[2rem] rounded-lg bg-slate-800 border border-emerald-800/50 px-2 py-1 text-sm font-bold text-emerald-100 hover:bg-slate-700 disabled:opacity-45"
    >
      {children}
    </button>
  );
}

/**
 * Controles de tablero deportivo + reloj de juego (sin cuenta regresiva genérica).
 */
export function MatchBroadcastSportMesa({
  template,
  local,
  localRef,
  commit,
  mesaBusy,
  live,
  nowMs,
  homeName,
  awayName,
}) {
  const chronoMs = getChronoElapsedMs(
    { ...defaultZonaHorariaTestState(), chrono: local.chrono, countdown: local.countdown },
    nowMs
  );

  const sportPatch = (patch) => {
    const b = localRef.current;
    const sport = { ...b.sport, ...patch };
    void commit({ ...b, sport, eventPeriod: sport.period });
  };

  const bumpScore = (side, d) => {
    const b = localRef.current;
    const key = side === "home" ? "scoreHome" : "scoreAway";
    const v = Math.max(0, Math.min(999, (b.sport[key] || 0) + d));
    sportPatch({ [key]: v });
  };

  const bumpPeriod = (d) => {
    const b = localRef.current;
    const p = Math.max(1, Math.min(99, (b.sport.period || 1) + d));
    sportPatch({ period: p });
  };

  const bumpFoul = (side, d) => {
    const key = side === "home" ? "foulsHome" : "foulsAway";
    const b = localRef.current;
    const v = Math.max(0, Math.min(99, (b.sport[key] || 0) + d));
    sportPatch({ [key]: v });
  };

  const bumpSet = (side, d) => {
    const key = side === "home" ? "setsHome" : "setsAway";
    const b = localRef.current;
    const v = Math.max(0, Math.min(9, (b.sport[key] || 0) + d));
    sportPatch({ [key]: v });
  };

  const bumpShot = (d) => {
    const b = localRef.current;
    const v = Math.max(0, Math.min(24, (b.sport.shotSec || 0) + d));
    sportPatch({ shotSec: v });
  };

  const bumpSoccerStat = (field, d) => {
    const b = localRef.current;
    const v = Math.max(0, Math.min(99, (b.sport[field] || 0) + d));
    sportPatch({ [field]: v });
  };

  const statsPatch = (patch) => {
    const b = localRef.current;
    const base = parseStatsPanel(b.statsPanel);
    void commit({ ...b, statsPanel: { ...base, ...patch } });
  };

  const bumpPanelStat = (key, delta) => {
    const sp = parseStatsPanel(localRef.current.statsPanel);
    const cur = Number(sp[key]) || 0;
    const v = Math.max(0, Math.min(999, cur + delta));
    statsPatch({ [key]: v });
  };

  /** Cierra el tramo actual, acumula tiempo y (si hay lado) abre un tramo nuevo. */
  const setPossessionBallSide = (newSide) => {
    const b = localRef.current;
    const sp = parseStatsPanel(b.statsPanel);
    const now = Date.now();
    const cur = sp.possessionBallSide;
    if (newSide !== null && newSide === cur) return;
    let hAcc = Number(sp.possessionHomeAccumSec) || 0;
    let aAcc = Number(sp.possessionAwayAccumSec) || 0;
    const since = Number(sp.possessionSinceMs) || 0;
    if (since > 0 && cur === "home") hAcc += (now - since) / 1000;
    else if (since > 0 && cur === "away") aAcc += (now - since) / 1000;
    const nextBase = {
      possessionHomeAccumSec: hAcc,
      possessionAwayAccumSec: aAcc,
      possessionBallSide: newSide,
      possessionSinceMs: newSide ? now : 0,
    };
    const merged = { ...sp, ...nextBase };
    const pct = livePossessionHomePct(merged, now);
    statsPatch({ ...nextBase, possessionHomePct: pct });
  };

  const subPatch = (patch) => {
    const b = localRef.current;
    const s = parseSoccerSubstitution(b.soccerSubstitution);
    const merged = { ...s, ...patch };
    merged.substitutionOverlayHidden = !merged.substitutionPublicVisible;
    void commit({ ...b, soccerSubstitution: merged });
  };

  const spMesa = parseStatsPanel(local.statsPanel);
  const possLiveMesa =
    template === BROADCAST_TEMPLATE.Soccer
      ? livePossessionHomePct(spMesa, nowMs)
      : spMesa.possessionHomePct;

  return (
    <div className="space-y-3 border-t border-emerald-800/60 pt-3">
      <p className="text-[10px] text-emerald-200/80">
        Tablero deportivo: los datos se muestran en la vitrina según la plantilla. El reloj
        de juego es el cronómetro compartido (minuto para eventos).
        {template === BROADCAST_TEMPLATE.Soccer && (
          <>
            {" "}
            En <strong>fútbol</strong>, al registrar eventos en el acta el marcador y las tarjetas del
            tablero se sincronizan solos; corners y tiros libres los ajustás acá para la TV.
          </>
        )}
      </p>

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
          Mostrar reloj de juego en tablero
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
          Reloj hora (esquina)
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

      <div className="grid gap-2 sm:grid-cols-2 text-xs">
        <label className="flex flex-col gap-1">
          Nombre local (opcional)
          <input
            type="text"
            className="rounded bg-slate-900 border border-emerald-800 px-2 py-1 text-white"
            placeholder={homeName || "Local"}
            value={local.sport.labelHome}
            disabled={mesaBusy || !live}
            onChange={(e) =>
              void commit({
                ...localRef.current,
                sport: { ...localRef.current.sport, labelHome: e.target.value },
              })
            }
          />
        </label>
        <label className="flex flex-col gap-1">
          Nombre visita (opcional)
          <input
            type="text"
            className="rounded bg-slate-900 border border-emerald-800 px-2 py-1 text-white"
            placeholder={awayName || "Visita"}
            value={local.sport.labelAway}
            disabled={mesaBusy || !live}
            onChange={(e) =>
              void commit({
                ...localRef.current,
                sport: { ...localRef.current.sport, labelAway: e.target.value },
              })
            }
          />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          Descuento del árbitro (+ min en cartel, ej. 4)
          <input
            type="number"
            min={0}
            max={30}
            className="rounded bg-slate-900 border border-emerald-800 px-2 py-1 text-white max-w-[8rem]"
            value={local.sport.addedMinutesAnnounced ?? 0}
            disabled={mesaBusy || !live}
            onChange={(e) => {
              const v = Math.max(0, Math.min(30, Number(e.target.value) || 0));
              void commit({
                ...localRef.current,
                sport: { ...localRef.current.sport, addedMinutesAnnounced: v },
              });
            }}
          />
          <span className="text-[9px] text-slate-500 font-normal">
            En vitrina: se muestra junto al tiempo reglamentario (ej. 20:00 +4) mientras corre el + del
            cronómetro en descuento.
          </span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="text-emerald-300/90 font-bold uppercase text-[10px]">
          {template === BROADCAST_TEMPLATE.Volleyball ? "Set actual" : "Periodo"}
        </span>
        <Btn disabled={mesaBusy || !live} onClick={() => bumpPeriod(-1)}>
          −
        </Btn>
        <span className="font-mono text-lg w-8 text-center">{local.sport.period}</span>
        <Btn disabled={mesaBusy || !live} onClick={() => bumpPeriod(1)}>
          +
        </Btn>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-2">
          <p className="text-[10px] uppercase text-slate-500 mb-2">Local</p>
          <div className="flex items-center justify-center gap-2">
            <Btn disabled={mesaBusy || !live} onClick={() => bumpScore("home", -1)}>
              −
            </Btn>
            <span className="font-mono text-2xl w-12 text-center">
              {local.sport.scoreHome}
            </span>
            <Btn disabled={mesaBusy || !live} onClick={() => bumpScore("home", 1)}>
              +
            </Btn>
          </div>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-2">
          <p className="text-[10px] uppercase text-slate-500 mb-2">Visita</p>
          <div className="flex items-center justify-center gap-2">
            <Btn disabled={mesaBusy || !live} onClick={() => bumpScore("away", -1)}>
              −
            </Btn>
            <span className="font-mono text-2xl w-12 text-center">
              {local.sport.scoreAway}
            </span>
            <Btn disabled={mesaBusy || !live} onClick={() => bumpScore("away", 1)}>
              +
            </Btn>
          </div>
        </div>
      </div>

      {template === BROADCAST_TEMPLATE.Soccer && (
        <div className="space-y-3 rounded-lg border border-amber-800/35 bg-amber-950/20 p-3">
          <p className="text-[10px] font-bold uppercase text-amber-200/90">
            Tarjetas (desde el acta)
          </p>
          <p className="text-[10px] text-amber-100/70">
            Registrá amarillas y rojas abajo en «Registrar evento». Los totales se actualizan al
            guardar o anular un evento.
          </p>
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="rounded bg-slate-900/70 py-2">
              <p className="text-[9px] text-slate-500 uppercase">Amarillas</p>
              <p className="font-mono text-lg text-yellow-300 tabular-nums">
                {local.sport.yellowHome} — {local.sport.yellowAway}
              </p>
            </div>
            <div className="rounded bg-slate-900/70 py-2">
              <p className="text-[9px] text-slate-500 uppercase">Rojas</p>
              <p className="font-mono text-lg text-red-400 tabular-nums">
                {local.sport.redHome} — {local.sport.redAway}
              </p>
            </div>
          </div>
          <p className="text-[10px] font-bold uppercase text-emerald-200/90">
            Corners y tiros libres (vitrina)
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[10px] uppercase text-slate-500 mb-1">Corners local</p>
              <div className="flex items-center gap-2">
                <Btn disabled={mesaBusy || !live} onClick={() => bumpSoccerStat("cornersHome", -1)}>
                  −
                </Btn>
                <span className="font-mono text-xl w-8 text-center">
                  {local.sport.cornersHome}
                </span>
                <Btn disabled={mesaBusy || !live} onClick={() => bumpSoccerStat("cornersHome", 1)}>
                  +
                </Btn>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-500 mb-1">Corners visita</p>
              <div className="flex items-center gap-2">
                <Btn disabled={mesaBusy || !live} onClick={() => bumpSoccerStat("cornersAway", -1)}>
                  −
                </Btn>
                <span className="font-mono text-xl w-8 text-center">
                  {local.sport.cornersAway}
                </span>
                <Btn disabled={mesaBusy || !live} onClick={() => bumpSoccerStat("cornersAway", 1)}>
                  +
                </Btn>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-500 mb-1">Tiros libres local</p>
              <div className="flex items-center gap-2">
                <Btn disabled={mesaBusy || !live} onClick={() => bumpSoccerStat("freeKicksHome", -1)}>
                  −
                </Btn>
                <span className="font-mono text-xl w-8 text-center">
                  {local.sport.freeKicksHome}
                </span>
                <Btn disabled={mesaBusy || !live} onClick={() => bumpSoccerStat("freeKicksHome", 1)}>
                  +
                </Btn>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-500 mb-1">Tiros libres visita</p>
              <div className="flex items-center gap-2">
                <Btn disabled={mesaBusy || !live} onClick={() => bumpSoccerStat("freeKicksAway", -1)}>
                  −
                </Btn>
                <span className="font-mono text-xl w-8 text-center">
                  {local.sport.freeKicksAway}
                </span>
                <Btn disabled={mesaBusy || !live} onClick={() => bumpSoccerStat("freeKicksAway", 1)}>
                  +
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {template === BROADCAST_TEMPLATE.Soccer && (
        <div className="space-y-3 rounded-lg border border-sky-800/45 bg-slate-950/50 p-3">
          <p className="text-[10px] font-bold uppercase text-sky-200/90">
            Panel «estadísticas» en vitrina
          </p>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Elegí qué filas mostrar y los números por equipo. Con sincronización al acta activada, al
            guardar eventos el servidor puede actualizar esos totales; desactivala si querés control
            exclusivo desde acá. «Tablero entretiempo» fuerza el panel completo en pantalla (como en
            descanso) sin esperar «Fin de periodo».
          </p>
          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              className="rounded border-sky-600"
              checked={!!local.statsPanel?.enabled}
              disabled={mesaBusy || !live}
              onChange={(e) => statsPatch({ enabled: e.target.checked })}
            />
            Mostrar panel de estadísticas
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              className="rounded border-sky-600"
              checked={!!local.statsPanel?.showDuringPeriodBreak}
              disabled={mesaBusy || !live || !local.statsPanel?.enabled}
              onChange={(e) => statsPatch({ showDuringPeriodBreak: e.target.checked })}
            />
            Solo en descanso entre periodos (automático con «Fin de periodo» en el acta)
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              className="rounded border-sky-600"
              checked={spMesa.forceStatsOverlay}
              disabled={mesaBusy || !live || !local.statsPanel?.enabled}
              onChange={(e) => statsPatch({ forceStatsOverlay: e.target.checked })}
            />
            Tablero entretiempo — forzar estadísticas completas en vitrina ahora
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              className="rounded border-sky-600"
              checked={spMesa.syncStatsFromActa}
              disabled={mesaBusy || !live || !local.statsPanel?.enabled}
              onChange={(e) => statsPatch({ syncStatsFromActa: e.target.checked })}
            />
            Sincronizar contadores con el acta al guardar eventos
          </label>
          <div className="grid sm:grid-cols-2 gap-2 text-[11px]">
            {[
              ["showShots", "Tiros"],
              ["showShotsOnTarget", "Tiros a puerta"],
              ["showFouls", "Faltas"],
              ["showOffsides", "Offside"],
              ["showYellows", "Amarillas"],
              ["showReds", "Rojas"],
              ["showCorners", "Corners"],
              ["showPossession", "Posesión"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-sky-600"
                  checked={local.statsPanel?.[key] !== false}
                  disabled={mesaBusy || !live || !local.statsPanel?.enabled}
                  onChange={(e) => statsPatch({ [key]: e.target.checked })}
                />
                {label}
              </label>
            ))}
          </div>
          <label className="block text-xs text-slate-300">
            Posesión local — ajuste manual ({local.statsPanel?.possessionHomePct ?? 50}%) · reinicia el
            control del balón
            <input
              type="range"
              min={0}
              max={100}
              disabled={mesaBusy || !live || !local.statsPanel?.enabled}
              value={local.statsPanel?.possessionHomePct ?? 50}
              onChange={(e) =>
                statsPatch({
                  possessionHomePct: Number(e.target.value),
                  possessionBallSide: null,
                  possessionSinceMs: 0,
                  possessionHomeAccumSec: 0,
                  possessionAwayAccumSec: 0,
                })
              }
              className="w-full mt-1 accent-sky-500"
            />
          </label>
          <div className="rounded border border-slate-800/80 bg-slate-900/40 p-2 space-y-2">
            <p className="text-[10px] font-bold uppercase text-sky-300/90">Control del balón</p>
            <p className="text-[9px] text-slate-500 leading-snug">
              Indicá quién tiene el balón; el tiempo en cada bando calcula la posesión. Volvé a tocar el
              mismo equipo si el balón sigue ahí (no hace falta). «Neutro» detiene el reloj de posesión
              sin borrar lo acumulado.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={mesaBusy || !live || !local.statsPanel?.enabled}
                onClick={() => setPossessionBallSide("home")}
                className={`flex-1 min-w-[7rem] rounded-lg px-2 py-2 text-[10px] font-bold border transition-colors ${
                  spMesa.possessionBallSide === "home"
                    ? "border-emerald-400 bg-emerald-900/40 text-emerald-100"
                    : "border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500"
                }`}
              >
                Balón · {(homeName || "Local").slice(0, 22)}
                {(homeName || "").length > 22 ? "…" : ""}
              </button>
              <button
                type="button"
                disabled={mesaBusy || !live || !local.statsPanel?.enabled}
                onClick={() => setPossessionBallSide("away")}
                className={`flex-1 min-w-[7rem] rounded-lg px-2 py-2 text-[10px] font-bold border transition-colors ${
                  spMesa.possessionBallSide === "away"
                    ? "border-emerald-400 bg-emerald-900/40 text-emerald-100"
                    : "border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500"
                }`}
              >
                Balón · {(awayName || "Visita").slice(0, 22)}
                {(awayName || "").length > 22 ? "…" : ""}
              </button>
              <button
                type="button"
                disabled={mesaBusy || !live || !local.statsPanel?.enabled}
                onClick={() => setPossessionBallSide(null)}
                className="flex-1 min-w-[6rem] rounded-lg border border-slate-600 bg-slate-900 px-2 py-2 text-[10px] font-bold text-slate-400 hover:bg-slate-800"
              >
                Neutro (pausa)
              </button>
            </div>
          </div>
          <div className="space-y-2 rounded border border-slate-800/80 bg-slate-900/40 p-2">
            <p className="text-[10px] font-bold uppercase text-sky-300/90">Contadores por equipo</p>
            {[
              ["shotsHome", "shotsAway", "Tiros"],
              ["shotsOnTargetHome", "shotsOnTargetAway", "A puerta"],
              ["foulsHome", "foulsAway", "Faltas"],
              ["offsidesHome", "offsidesAway", "Offside"],
              ["yellowsHome", "yellowsAway", "Amarillas"],
              ["redsHome", "redsAway", "Rojas"],
            ].map(([hk, ak, label]) => (
              <div
                key={label}
                className="grid grid-cols-[minmax(4.5rem,1fr)_auto_minmax(4.5rem,1fr)] gap-x-1 gap-y-0 items-center text-[10px]"
              >
                <div className="flex items-center justify-center gap-1">
                  <Btn
                    disabled={mesaBusy || !live || !local.statsPanel?.enabled}
                    onClick={() => bumpPanelStat(hk, -1)}
                  >
                    −
                  </Btn>
                  <span className="font-mono w-8 text-center text-emerald-200">
                    {spMesa[hk]}
                  </span>
                  <Btn
                    disabled={mesaBusy || !live || !local.statsPanel?.enabled}
                    onClick={() => bumpPanelStat(hk, 1)}
                  >
                    +
                  </Btn>
                </div>
                <span className="text-center text-slate-500 uppercase px-1 min-w-[4.5rem] leading-tight">
                  {label}
                </span>
                <div className="flex items-center justify-center gap-1">
                  <Btn
                    disabled={mesaBusy || !live || !local.statsPanel?.enabled}
                    onClick={() => bumpPanelStat(ak, -1)}
                  >
                    −
                  </Btn>
                  <span className="font-mono w-8 text-center text-emerald-200">
                    {spMesa[ak]}
                  </span>
                  <Btn
                    disabled={mesaBusy || !live || !local.statsPanel?.enabled}
                    onClick={() => bumpPanelStat(ak, 1)}
                  >
                    +
                  </Btn>
                </div>
              </div>
            ))}
            <div className="grid grid-cols-[minmax(4.5rem,1fr)_auto_minmax(4.5rem,1fr)] gap-x-1 items-center text-[10px] pt-2 mt-1 border-t border-slate-800/70">
              <span className="text-center font-mono text-emerald-200 tabular-nums">
                {possLiveMesa}%
              </span>
              <span className="text-center text-slate-500 uppercase px-1 min-w-[4.5rem]">Posesión</span>
              <span className="text-center font-mono text-emerald-200 tabular-nums">
                {Math.max(0, Math.min(100, 100 - possLiveMesa))}%
              </span>
            </div>
            <p className="text-[9px] text-slate-500 text-center">
              Posesión en vivo según control del balón o el deslizador manual.
            </p>
          </div>
          <div className="space-y-2 rounded border border-violet-900/40 bg-violet-950/20 p-2">
            <p className="text-[10px] font-bold uppercase text-violet-200/90">Cambio en vitrina</p>
            <p className="text-[9px] text-slate-500 leading-relaxed">
              Los nombres salen del acta (última sustitución). Por defecto el cartel está oculto en la
              vitrina pública hasta que pulses «Mostrar en vitrina».
            </p>
            <div className="flex flex-wrap gap-2 justify-center pt-1">
              <button
                type="button"
                disabled={mesaBusy || !live}
                onClick={() =>
                  subPatch({
                    active: true,
                    substitutionPublicVisible: true,
                    hiddenSnapshotEventId: null,
                  })
                }
                className="rounded-lg bg-violet-700 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-violet-600 disabled:opacity-45"
              >
                Mostrar en vitrina
              </button>
              <button
                type="button"
                disabled={mesaBusy || !live}
                onClick={() =>
                  subPatch({
                    active: false,
                    substitutionPublicVisible: false,
                  })
                }
                className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-[11px] font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-45"
              >
                Ocultar cambio
              </button>
            </div>
          </div>
        </div>
      )}

      {(template === BROADCAST_TEMPLATE.Futsal ||
        template === BROADCAST_TEMPLATE.Basketball) && (
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-[10px] uppercase text-slate-500 mb-1">Faltas local</p>
            <div className="flex items-center gap-2">
              <Btn disabled={mesaBusy || !live} onClick={() => bumpFoul("home", -1)}>
                −
              </Btn>
              <span className="font-mono text-xl w-8 text-center">
                {local.sport.foulsHome}
              </span>
              <Btn disabled={mesaBusy || !live} onClick={() => bumpFoul("home", 1)}>
                +
              </Btn>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500 mb-1">Faltas visita</p>
            <div className="flex items-center gap-2">
              <Btn disabled={mesaBusy || !live} onClick={() => bumpFoul("away", -1)}>
                −
              </Btn>
              <span className="font-mono text-xl w-8 text-center">
                {local.sport.foulsAway}
              </span>
              <Btn disabled={mesaBusy || !live} onClick={() => bumpFoul("away", 1)}>
                +
              </Btn>
            </div>
          </div>
        </div>
      )}

      {template === BROADCAST_TEMPLATE.Basketball && (
        <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-2">
          <p className="text-[10px] uppercase text-amber-200/90 mb-2">Tiempo de tiro (24s)</p>
          <div className="flex flex-wrap items-center gap-2">
            <Btn disabled={mesaBusy || !live} onClick={() => bumpShot(-1)}>
              −1
            </Btn>
            <span className="font-mono text-xl w-10 text-center">{local.sport.shotSec}</span>
            <Btn disabled={mesaBusy || !live} onClick={() => bumpShot(1)}>
              +1
            </Btn>
            <button
              type="button"
              disabled={mesaBusy || !live}
              onClick={() => sportPatch({ shotSec: 24 })}
              className="rounded-lg bg-amber-700 px-2 py-1 text-[11px] font-bold text-white disabled:opacity-45"
            >
              24
            </button>
            <button
              type="button"
              disabled={mesaBusy || !live}
              onClick={() => sportPatch({ shotSec: 14 })}
              className="rounded-lg bg-amber-800 px-2 py-1 text-[11px] font-bold text-white disabled:opacity-45"
            >
              14
            </button>
          </div>
        </div>
      )}

      {template === BROADCAST_TEMPLATE.Volleyball && (
        <>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[10px] uppercase text-slate-500 mb-1">Sets ganados local</p>
              <div className="flex items-center gap-2">
                <Btn disabled={mesaBusy || !live} onClick={() => bumpSet("home", -1)}>
                  −
                </Btn>
                <span className="font-mono text-xl w-8 text-center">
                  {local.sport.setsHome}
                </span>
                <Btn disabled={mesaBusy || !live} onClick={() => bumpSet("home", 1)}>
                  +
                </Btn>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-500 mb-1">Sets ganados visita</p>
              <div className="flex items-center gap-2">
                <Btn disabled={mesaBusy || !live} onClick={() => bumpSet("away", -1)}>
                  −
                </Btn>
                <span className="font-mono text-xl w-8 text-center">
                  {local.sport.setsAway}
                </span>
                <Btn disabled={mesaBusy || !live} onClick={() => bumpSet("away", 1)}>
                  +
                </Btn>
              </div>
            </div>
          </div>
          <button
            type="button"
            disabled={mesaBusy || !live}
            onClick={() =>
              sportPatch({ serveHome: !localRef.current.sport.serveHome })
            }
            className="w-full rounded-lg border border-red-800/50 bg-slate-900 py-2 text-xs font-bold text-red-200 hover:bg-slate-800 disabled:opacity-45"
          >
            Cambiar saque (actual: {local.sport.serveHome ? "Local" : "Visita"})
          </button>
        </>
      )}

      <div className="space-y-2 border-t border-emerald-800/50 pt-3">
        <p className="text-[10px] font-bold uppercase text-emerald-300/90">Reloj de juego</p>
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
    </div>
  );
}

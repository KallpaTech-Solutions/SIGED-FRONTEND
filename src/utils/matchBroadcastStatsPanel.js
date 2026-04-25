/**
 * Panel de estadísticas de vitrina (fútbol), opcional y con filas configurables.
 * Varios contadores se sincronizan desde el acta vía API; posesión y visibilidad los controla la mesa.
 */

/** @returns {import('./matchBroadcastStatsPanel').StatsPanelState} */
export function defaultStatsPanel() {
  return {
    enabled: false,
    /**
     * Si es true, el panel solo se muestra en descanso entre periodos (ej. entretiempo), con el partido en vivo,
     * según el acta: último evento de periodo sea «Fin de periodo» hasta el próximo «Inicio de periodo».
     */
    showDuringPeriodBreak: false,
    /** Mesa: fuerza el tablero completo de estadísticas (como entretiempo) sin depender del acta. */
    forceStatsOverlay: false,
    /** Si es true, al guardar eventos el API actualiza tiros/faltas/tarjetas del panel desde el acta. Desactivá para control solo desde mesa. */
    syncStatsFromActa: true,
    showShots: true,
    showShotsOnTarget: true,
    showFouls: true,
    showOffsides: true,
    showYellows: true,
    showReds: true,
    showPossession: true,
    showCorners: true,
    possessionHomePct: 50,
    /** Control del balón: tiempo acumulado (s) y tramo actual (mesa). */
    possessionBallSide: null,
    possessionSinceMs: 0,
    possessionHomeAccumSec: 0,
    possessionAwayAccumSec: 0,
    shotsHome: 0,
    shotsAway: 0,
    shotsOnTargetHome: 0,
    shotsOnTargetAway: 0,
    foulsHome: 0,
    foulsAway: 0,
    offsidesHome: 0,
    offsidesAway: 0,
    yellowsHome: 0,
    yellowsAway: 0,
    redsHome: 0,
    redsAway: 0,
  };
}

/** @param {unknown} raw */
export function parseStatsPanel(raw) {
  const b = defaultStatsPanel();
  if (!raw || typeof raw !== "object") return b;
  const o = /** @type {Record<string, unknown>} */ (raw);
  const clampPct = (n) => Math.max(0, Math.min(100, Number(n) || 0));
  const clamp99 = (n) => Math.max(0, Math.min(999, Number(n) || 0));
  const clampAccumSec = (n) => Math.max(0, Math.min(1_000_000, Number(n) || 0));
  const sideRaw = o.possessionBallSide ?? o.PossessionBallSide;
  const possessionBallSide =
    sideRaw === "home" || sideRaw === "away" ? sideRaw : null;
  const legacyOnlyWhenNotLive = !!o.showWhenNotLive;
  const showDuringPeriodBreak =
    typeof o.showDuringPeriodBreak === "boolean"
      ? o.showDuringPeriodBreak
      : legacyOnlyWhenNotLive;

  return {
    enabled: !!o.enabled,
    showDuringPeriodBreak,
    forceStatsOverlay: !!o.forceStatsOverlay,
    syncStatsFromActa: o.syncStatsFromActa !== false,
    showShots: o.showShots !== false,
    showShotsOnTarget: o.showShotsOnTarget !== false,
    showFouls: o.showFouls !== false,
    showOffsides: o.showOffsides !== false,
    showYellows: o.showYellows !== false,
    showReds: o.showReds !== false,
    showPossession: o.showPossession !== false,
    showCorners: o.showCorners !== false,
    possessionHomePct: clampPct(o.possessionHomePct ?? 50),
    possessionBallSide,
    possessionSinceMs: Math.max(0, Number(o.possessionSinceMs ?? o.PossessionSinceMs) || 0),
    possessionHomeAccumSec: clampAccumSec(
      o.possessionHomeAccumSec ?? o.PossessionHomeAccumSec
    ),
    possessionAwayAccumSec: clampAccumSec(
      o.possessionAwayAccumSec ?? o.PossessionAwayAccumSec
    ),
    shotsHome: clamp99(o.shotsHome),
    shotsAway: clamp99(o.shotsAway),
    shotsOnTargetHome: clamp99(o.shotsOnTargetHome),
    shotsOnTargetAway: clamp99(o.shotsOnTargetAway),
    foulsHome: clamp99(o.foulsHome),
    foulsAway: clamp99(o.foulsAway),
    offsidesHome: clamp99(o.offsidesHome),
    offsidesAway: clamp99(o.offsidesAway),
    yellowsHome: clamp99(o.yellowsHome),
    yellowsAway: clamp99(o.yellowsAway),
    redsHome: clamp99(o.redsHome),
    redsAway: clamp99(o.redsAway),
  };
}

/**
 * % local en vivo según acumuladores + tramo actual (balón).
 * @param {ReturnType<parseStatsPanel>} sp
 * @param {number} [nowMs]
 */
export function livePossessionHomePct(sp, nowMs = Date.now()) {
  const basePct = Math.max(0, Math.min(100, Number(sp.possessionHomePct) || 50));
  let h = Math.max(0, Math.min(1_000_000, Number(sp.possessionHomeAccumSec) || 0));
  let a = Math.max(0, Math.min(1_000_000, Number(sp.possessionAwayAccumSec) || 0));
  const since = Number(sp.possessionSinceMs) || 0;
  const side = sp.possessionBallSide;
  if (since > 0 && (side === "home" || side === "away") && nowMs >= since) {
    const add = (nowMs - since) / 1000;
    if (side === "home") h += add;
    else a += add;
  }
  const tot = h + a;
  if (tot < 0.25) return Math.round(basePct);
  return Math.max(0, Math.min(100, Math.round((h / tot) * 100)));
}

/**
 * Filas para tablero / panel de estadísticas de fútbol.
 * @param {ReturnType<parseStatsPanel>} sp
 * @param {{ cornersHome?: number, cornersAway?: number }} sport
 * @param {number} [nowMs] — para posesión en tiempo real
 * @returns {{ label: string, left: string|number, right: string|number, highlight?: boolean }[]}
 */
export function buildSoccerStatsRows(sp, sport, nowMs = Date.now()) {
  const possPct = livePossessionHomePct(sp, nowMs);
  const awayPoss = Math.max(0, Math.min(100, 100 - possPct));
  /** @type {{ label: string, left: string|number, right: string|number, highlight?: boolean }[]} */
  const rows = [];
  if (sp.showShots) {
    rows.push({ label: "Tiros", left: sp.shotsHome, right: sp.shotsAway });
  }
  if (sp.showFouls) {
    rows.push({ label: "Faltas", left: sp.foulsHome, right: sp.foulsAway });
  }
  if (sp.showShotsOnTarget) {
    rows.push({
      label: "Tiros a puerta",
      left: sp.shotsOnTargetHome,
      right: sp.shotsOnTargetAway,
    });
  }
  if (sp.showOffsides) {
    rows.push({ label: "Offside", left: sp.offsidesHome, right: sp.offsidesAway });
  }
  if (sp.showYellows) {
    rows.push({ label: "Amarillas", left: sp.yellowsHome, right: sp.yellowsAway });
  }
  if (sp.showReds) {
    rows.push({ label: "Rojas", left: sp.redsHome, right: sp.redsAway });
  }
  if (sp.showCorners) {
    rows.push({
      label: "Corners",
      left: sport.cornersHome ?? 0,
      right: sport.cornersAway ?? 0,
    });
  }
  if (sp.showPossession) {
    rows.push({
      label: "Posesión",
      left: `${possPct}%`,
      right: `${awayPoss}%`,
      highlight: true,
    });
  }
  return rows;
}

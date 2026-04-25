/**
 * Widget de transmisión por partido (v2: plantillas tiempo + tableros deportivos).
 * v1 se normaliza a v2 con plantilla "time".
 */

import {
  defaultZonaHorariaTestState,
  formatDurationMs,
  getChronoElapsedMs,
  getCountdownRemainingMs,
  parseZonaHorariaState,
} from "./zonaHorariaTestSync";
import { defaultStatsPanel, parseStatsPanel } from "./matchBroadcastStatsPanel";

/**
 * @typedef {import('./matchBroadcastStatsPanel').StatsPanelState} StatsPanelState
 * @typedef {Object} MatchBroadcastWidgetState
 * @property {1|2} v
 * @property {string} template
 * @property {number} updatedAt
 * @property {boolean} heroShowChrono
 * @property {boolean} heroShowSystemClock
 * @property {boolean} heroShowCountdown
 * @property {boolean} publicShowMs
 * @property {number} eventPeriod
 * @property {object} chrono
 * @property {object} countdown
 * @property {SportBoardState} sport
 * @property {boolean} showZonaHorariaOnMatch — muestra ZonaHoraria (prueba) solo en la página del partido.
 * @property {StatsPanelState} statsPanel — panel de estadísticas (fútbol), opcional.
 * @property {{ active: boolean, side: 'home'|'away', outName: string, inName: string, substitutionPublicVisible?: boolean, substitutionOverlayHidden?: boolean, hiddenSnapshotEventId?: string|null }} soccerSubstitution — cambio mostrado en vitrina (fútbol).
 */

export const BROADCAST_TEMPLATE = {
  Time: "time",
  Soccer: "soccer",
  Basketball: "basketball",
  Futsal: "futsal",
  Volleyball: "volleyball",
};

/** @typedef {{ labelHome: string, labelAway: string, scoreHome: number, scoreAway: number, period: number, foulsHome: number, foulsAway: number, shotSec: number, setsHome: number, setsAway: number, serveHome: boolean, yellowHome: number, yellowAway: number, redHome: number, redAway: number, cornersHome: number, cornersAway: number, freeKicksHome: number, freeKicksAway: number, addedMinutesAnnounced: number }} SportBoardState */

/** @returns {SportBoardState} */
export function defaultSportBoard() {
  return {
    labelHome: "",
    labelAway: "",
    scoreHome: 0,
    scoreAway: 0,
    period: 1,
    foulsHome: 0,
    foulsAway: 0,
    shotSec: 24,
    setsHome: 0,
    setsAway: 0,
    serveHome: true,
    yellowHome: 0,
    yellowAway: 0,
    redHome: 0,
    redAway: 0,
    cornersHome: 0,
    cornersAway: 0,
    freeKicksHome: 0,
    freeKicksAway: 0,
    /** Minutos de descuento que mostró el árbitro (cartel +N); solo referencia en vitrina. */
    addedMinutesAnnounced: 0,
  };
}

/** @param {unknown} raw */
function parseSportBoard(raw) {
  const b = defaultSportBoard();
  if (!raw || typeof raw !== "object") return b;
  const o = /** @type {Record<string, unknown>} */ (raw);
  return {
    labelHome: typeof o.labelHome === "string" ? o.labelHome : "",
    labelAway: typeof o.labelAway === "string" ? o.labelAway : "",
    scoreHome: Math.max(0, Math.min(999, Number(o.scoreHome) || 0)),
    scoreAway: Math.max(0, Math.min(999, Number(o.scoreAway) || 0)),
    period: Math.max(1, Math.min(99, Number(o.period) || 1)),
    foulsHome: Math.max(0, Math.min(99, Number(o.foulsHome) || 0)),
    foulsAway: Math.max(0, Math.min(99, Number(o.foulsAway) || 0)),
    shotSec: Math.max(0, Math.min(24, Number(o.shotSec) || 24)),
    setsHome: Math.max(0, Math.min(9, Number(o.setsHome) || 0)),
    setsAway: Math.max(0, Math.min(9, Number(o.setsAway) || 0)),
    serveHome: o.serveHome !== false,
    yellowHome: Math.max(0, Math.min(99, Number(o.yellowHome) || 0)),
    yellowAway: Math.max(0, Math.min(99, Number(o.yellowAway) || 0)),
    redHome: Math.max(0, Math.min(99, Number(o.redHome) || 0)),
    redAway: Math.max(0, Math.min(99, Number(o.redAway) || 0)),
    cornersHome: Math.max(0, Math.min(99, Number(o.cornersHome) || 0)),
    cornersAway: Math.max(0, Math.min(99, Number(o.cornersAway) || 0)),
    freeKicksHome: Math.max(0, Math.min(99, Number(o.freeKicksHome) || 0)),
    freeKicksAway: Math.max(0, Math.min(99, Number(o.freeKicksAway) || 0)),
    addedMinutesAnnounced: Math.max(
      0,
      Math.min(30, Number(o.addedMinutesAnnounced ?? o.AddedMinutesAnnounced) || 0)
    ),
  };
}

/** @returns {{ active: boolean, side: 'home'|'away', outName: string, inName: string, substitutionPublicVisible: boolean, substitutionOverlayHidden: boolean, hiddenSnapshotEventId: string|null }} */
export function defaultSoccerSubstitution() {
  return {
    active: false,
    side: "home",
    outName: "",
    inName: "",
    /** Solo true si la mesa pulsó «Mostrar en vitrina» (persiste en JSON). */
    substitutionPublicVisible: false,
    substitutionOverlayHidden: true,
    hiddenSnapshotEventId: null,
  };
}

/** @param {unknown} raw */
export function parseSoccerSubstitution(raw) {
  const d = defaultSoccerSubstitution();
  if (!raw || typeof raw !== "object") return { ...d };
  const o = /** @type {Record<string, unknown>} */ (raw);
  const side = o.side === "away" ? "away" : "home";
  const clip = (s) => String(s ?? "").trim().slice(0, 80);
  const hidRaw = o.hiddenSnapshotEventId ?? o.HiddenSnapshotEventId;
  const hiddenSnapshotEventId =
    hidRaw != null && String(hidRaw).trim() !== ""
      ? String(hidRaw).trim()
      : null;
  const pubRaw = o.substitutionPublicVisible ?? o.SubstitutionPublicVisible;
  const hasPubKey =
    Object.prototype.hasOwnProperty.call(o, "substitutionPublicVisible") ||
    Object.prototype.hasOwnProperty.call(o, "SubstitutionPublicVisible");
  /** Sin clave en JSON: oculto (los guardados viejos traían overlayHidden:false por defecto y reaparecían al recargar). */
  const substitutionPublicVisible = hasPubKey ? pubRaw === true : false;

  const substitutionOverlayHidden = !substitutionPublicVisible;

  return {
    active: !!o.active,
    side,
    outName: clip(o.outName),
    inName: clip(o.inName),
    substitutionPublicVisible,
    substitutionOverlayHidden,
    hiddenSnapshotEventId,
  };
}

const TEMPLATE_SET = new Set(Object.values(BROADCAST_TEMPLATE));

function normalizeTemplate(t) {
  return TEMPLATE_SET.has(t) ? t : BROADCAST_TEMPLATE.Time;
}

/**
 * @param {unknown} raw
 * @returns {import('./matchBroadcastWidget').MatchBroadcastWidgetState}
 */
export function parseMatchBroadcastWidgetState(raw) {
  const zBase = defaultZonaHorariaTestState();
  if (!raw || typeof raw !== "object") {
    return {
      v: 2,
      template: BROADCAST_TEMPLATE.Time,
      updatedAt: 0,
      heroShowChrono: true,
      heroShowSystemClock: false,
      heroShowCountdown: false,
      publicShowMs: zBase.publicShowMs,
      eventPeriod: 1,
      chrono: zBase.chrono,
      countdown: zBase.countdown,
      sport: defaultSportBoard(),
      showZonaHorariaOnMatch: false,
      statsPanel: defaultStatsPanel(),
      soccerSubstitution: defaultSoccerSubstitution(),
    };
  }
  const o = /** @type {Record<string, unknown>} */ (raw);
  const v = Number(o.v);

  if (v === 1) {
    const z = parseZonaHorariaState({
      v: 1,
      updatedAt: o.updatedAt,
      publicBannerEnabled: false,
      publicShowMs: o.publicShowMs,
      publicShowMode: "both",
      chrono: o.chrono,
      countdown: o.countdown,
    });
    return {
      v: 2,
      template: BROADCAST_TEMPLATE.Time,
      updatedAt: typeof o.updatedAt === "number" ? o.updatedAt : 0,
      heroShowChrono: o.heroShowChrono !== false,
      heroShowSystemClock: !!o.heroShowSystemClock,
      heroShowCountdown: !!o.heroShowCountdown,
      publicShowMs: z.publicShowMs,
      eventPeriod: Math.max(1, Math.min(99, Number(o.eventPeriod) || 1)),
      chrono: z.chrono,
      countdown: z.countdown,
      sport: { ...defaultSportBoard(), period: Math.max(1, Math.min(99, Number(o.eventPeriod) || 1)) },
      showZonaHorariaOnMatch: !!o.showZonaHorariaOnMatch,
      statsPanel: parseStatsPanel(o.statsPanel),
      soccerSubstitution: parseSoccerSubstitution(o.soccerSubstitution),
    };
  }

  if (v !== 2) {
    return parseMatchBroadcastWidgetState(null);
  }

  const z = parseZonaHorariaState({
    v: 1,
    updatedAt: o.updatedAt,
    publicBannerEnabled: false,
    publicShowMs: o.publicShowMs,
    publicShowMode: "both",
    chrono: o.chrono,
    countdown: o.countdown,
  });

  const sport = parseSportBoard(o.sport);
  const eventPeriod = Math.max(1, Math.min(99, Number(o.eventPeriod) || sport.period));

  return {
    v: 2,
    template: normalizeTemplate(o.template),
    updatedAt: typeof o.updatedAt === "number" ? o.updatedAt : 0,
    heroShowChrono: o.heroShowChrono !== false,
    heroShowSystemClock: !!o.heroShowSystemClock,
    heroShowCountdown: !!o.heroShowCountdown,
    publicShowMs: z.publicShowMs,
    eventPeriod,
    chrono: z.chrono,
    countdown: z.countdown,
    sport: { ...sport, period: sport.period },
    showZonaHorariaOnMatch: !!o.showZonaHorariaOnMatch,
    statsPanel: parseStatsPanel(o.statsPanel),
    soccerSubstitution: parseSoccerSubstitution(o.soccerSubstitution),
  };
}

/** @returns {import('./matchBroadcastWidget').MatchBroadcastWidgetState} */
export function defaultMatchBroadcastWidgetState() {
  return parseMatchBroadcastWidgetState(null);
}

/**
 * Cambia plantilla conservando cronómetro; reinicia tablero deportivo con el periodo actual.
 * @param {import('./matchBroadcastWidget').MatchBroadcastWidgetState} prev
 * @param {string} nextTemplate
 */
export function switchBroadcastTemplate(prev, nextTemplate) {
  const t = normalizeTemplate(nextTemplate);
  const preserved = {
    showZonaHorariaOnMatch: !!prev.showZonaHorariaOnMatch,
    statsPanel: parseStatsPanel(prev.statsPanel),
  };
  if (t === BROADCAST_TEMPLATE.Time) {
    return { ...prev, v: 2, template: t, ...preserved };
  }
  const period = prev.sport?.period ?? prev.eventPeriod ?? 1;
  return {
    ...prev,
    v: 2,
    template: t,
    eventPeriod: period,
    sport: { ...defaultSportBoard(), period },
    ...preserved,
  };
}

export function parseMatchBroadcastWidgetFromDetail(detail) {
  const j = detail?.broadcastWidgetJson ?? detail?.BroadcastWidgetJson;
  if (j == null || j === "") return defaultMatchBroadcastWidgetState();
  try {
    const raw = typeof j === "string" ? JSON.parse(j) : j;
    return parseMatchBroadcastWidgetState(raw);
  } catch {
    return defaultMatchBroadcastWidgetState();
  }
}

function chronoSlice(state) {
  return {
    ...defaultZonaHorariaTestState(),
    chrono: state.chrono,
    countdown: state.countdown,
  };
}

/**
 * Minuto desde cronómetro; periodo desde eventPeriod (time) o sport.period (deportes).
 * @param {import('./matchBroadcastWidget').MatchBroadcastWidgetState} state
 * @param {number} nowMs
 */
export function eventMinutePeriodFromBroadcastWidget(state, nowMs = Date.now()) {
  const ch = getChronoElapsedMs(chronoSlice(state), nowMs);
  const minute = Math.min(999, Math.max(0, Math.floor(ch / 60_000)));
  const period =
    state.template === BROADCAST_TEMPLATE.Time
      ? state.eventPeriod ?? 1
      : state.sport?.period ?? state.eventPeriod ?? 1;
  return { minute, period };
}

/** Serializa estado para PUT (siempre v2). */
export function toBroadcastWidgetPayload(state, updatedAt = Date.now()) {
  const s = parseMatchBroadcastWidgetState(state);
  return {
    v: 2,
    template: s.template,
    updatedAt,
    heroShowChrono: s.heroShowChrono,
    heroShowSystemClock: s.heroShowSystemClock,
    heroShowCountdown: s.heroShowCountdown,
    publicShowMs: s.publicShowMs,
    eventPeriod: s.eventPeriod,
    chrono: s.chrono,
    countdown: s.countdown,
    sport: s.sport,
    showZonaHorariaOnMatch: !!s.showZonaHorariaOnMatch,
    statsPanel: parseStatsPanel(s.statsPanel),
    soccerSubstitution: parseSoccerSubstitution(s.soccerSubstitution),
  };
}

export { formatDurationMs, getChronoElapsedMs, getCountdownRemainingMs };

import api from "./axiosConfig";

/** Coincide con enum MatchStatus (backend). */
export const MATCH_STATUS = {
  Programado: 0,
  EnVivo: 1,
  Finalizado: 2,
  Suspendido: 3,
};

/**
 * Mesa / transmisión: cambiar estado del partido (requiere tourn.match.control).
 * @param {string} matchId
 * @param {number} status — MATCH_STATUS.*
 */
export async function patchMatchStatus(matchId, status) {
  const { data } = await api.patch(`/Matches/${matchId}/status`, {
    status,
  });
  return data;
}

/**
 * Pausar / reanudar solo el cronómetro (no cambia En vivo / Programado).
 * @param {string} matchId
 * @param {{ paused: boolean }} body
 */
export async function patchMatchClock(matchId, body) {
  const { data } = await api.patch(`/Matches/${matchId}/chronometer/run`, body);
  return data;
}

/**
 * Mesa: cerrar periodo en juego y abrir el siguiente (o solo inicio si está en descanso). Respeta PERIODS_COUNT en servidor.
 * @param {string} matchId
 */
export async function postAdvanceMatchPeriod(matchId) {
  const { data } = await api.post(`/Matches/${matchId}/chronometer/advance-period`);
  return data;
}

/**
 * Tipo de widget de cronómetro para esta transmisión (MatchClockWidgetKind numérico).
 * @param {string} matchId
 * @param {number} kind
 */
export async function patchMatchChronometerWidget(matchId, kind) {
  const { data } = await api.patch(`/Matches/${matchId}/chronometer/widget`, { kind });
  return data;
}

/**
 * Finalizar partido (marcador, ganador, standings).
 * @param {string} matchId
 */
export async function patchMatchFinish(matchId) {
  const { data } = await api.patch(`/Matches/${matchId}/finish`);
  return data;
}

/**
 * Eliminatoria (ida simple) empatada: goles de la tanda de penales (mesa).
 * @param {string} matchId
 * @param {{ localPenaltyScore: number, visitorPenaltyScore: number }} body
 */
export async function patchMatchPenaltyScore(matchId, body) {
  const { data } = await api.patch(
    `/Matches/${matchId}/penalty-score`,
    body
  );
  return data;
}

/**
 * Programar fecha/hora y sede del partido (requiere tourn.match.control).
 * El cuerpo debe ser un string ISO 8601 (JSON string), según el API.
 * @param {string} matchId
 * @param {string} venueId — Guid de la sede
 * @param {string} scheduledAtWallClock — `yyyy-MM-ddTHH:mm:ss` hora de reloj local (no usar toISOString).
 */
export async function patchMatchSchedule(matchId, venueId, scheduledAtWallClock) {
  const { data } = await api.patch(
    `/Matches/${matchId}/schedule?venueId=${encodeURIComponent(venueId)}`,
    scheduledAtWallClock,
    {
      transformRequest: [(body) => JSON.stringify(body)],
    }
  );
  return data;
}

/**
 * Coincide con enum MatchEventType (backend). Valores numéricos del contrato API.
 */
export const MATCH_EVENT_TYPE = {
  Puntaje: 1,
  Goal: 2,
  PenaltyGoal: 3,
  TarjetaAmarilla: 4,
  TarjetaRoja: 5,
  Sustitucion: 6,
  Falta: 7,
  InicioPeriodo: 8,
  FinPeriodo: 9,
  Offside: 10,
  Tiro: 11,
  TiroAPuerta: 12,
  SegundaAmarilla: 13,
  RojaPorDobleAmarilla: 14,
  PenaltyMiss: 15,
};

export const MATCH_LINEUP_ROLE = {
  Starter: 1,
  Substitute: 2,
};

/**
 * Widget de transmisión (vitrina). Requiere tourn.mesa.broadcast (mesa o tourn.match.widgets).
 * @param {string} matchId
 * @param {object} state — ver `matchBroadcastWidget.js`
 */
export async function putMatchBroadcastWidget(matchId, state) {
  const { data } = await api.put(`/Matches/${matchId}/broadcast-widget`, state);
  return data;
}

/**
 * Registrar evento en el partido (gol, tarjeta, etc.). Requiere tourn.match.control.
 * @param {string} matchId
 * @param {{ minute: number, type: number, teamId: string, period: number, value?: number, playerId?: string|null, note?: string|null }} body
 */
export async function postMatchEvent(matchId, body) {
  const { data } = await api.post(`/Matches/${matchId}/events`, body);
  return data;
}

/**
 * Corregir jugador/es o nota (JSON parcial: solo incluir claves a cambiar).
 * @param {string} eventId
 * @param {{ playerId?: string|null, relatedPlayerId?: string|null, note?: string|null }} body
 */
export async function patchMatchEvent(eventId, body) {
  const { data } = await api.patch(`/Matches/events/${eventId}`, body);
  return data;
}

/**
 * Anular evento (revierte gol/puntaje en marcador si aplica).
 * @param {string} eventId
 */
export async function deleteMatchEvent(eventId) {
  const { data } = await api.delete(`/Matches/events/${eventId}`);
  return data;
}

export async function fetchMatchLineups(matchId) {
  const { data } = await api.get(`/Matches/${matchId}/lineups`);
  return data;
}

export async function putMatchLineup(matchId, teamId, body) {
  const { data } = await api.put(`/Matches/${matchId}/lineups/${teamId}`, body);
  return data;
}

export async function openMatchLineupTemporaryWindow(matchId, teamId, minutes = 5) {
  const { data } = await api.post(
    `/Matches/${matchId}/lineups/${teamId}/temporary-open`,
    { minutes }
  );
  return data;
}

export async function openMatchLineupTemporaryWindowForAll(matchId, minutes = 5) {
  const { data } = await api.post(
    `/Matches/${matchId}/lineups/temporary-open-all`,
    { minutes }
  );
  return data;
}

export async function closeMatchLineupTemporaryWindowForAll(matchId) {
  const { data } = await api.post(
    `/Matches/${matchId}/lineups/temporary-close-all`
  );
  return data;
}

export async function fetchMatchReport(matchId) {
  const { data } = await api.get(`/Matches/${matchId}/report`);
  return data;
}

export async function downloadMatchReportCsv(matchId) {
  const { data } = await api.get(`/Matches/${matchId}/report.csv`, {
    responseType: "blob",
  });
  return data;
}

/**
 * Acta en PDF (mismo permiso que CSV / JSON de reporte).
 * @param {string} matchId
 * @returns {Promise<Blob>}
 */
export async function downloadMatchReportPdf(matchId) {
  const { data } = await api.get(`/Matches/${matchId}/report.pdf`, {
    responseType: "blob",
  });
  return data;
}

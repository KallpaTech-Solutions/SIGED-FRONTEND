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
 * Finalizar partido (marcador, ganador, standings).
 * @param {string} matchId
 */
export async function patchMatchFinish(matchId) {
  const { data } = await api.patch(`/Matches/${matchId}/finish`);
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
};

/**
 * Registrar evento en el partido (gol, tarjeta, etc.). Requiere tourn.match.control.
 * @param {string} matchId
 * @param {{ minute: number, type: number, teamId: string, period: number, value?: number, playerId?: string|null, note?: string|null }} body
 */
export async function postMatchEvent(matchId, body) {
  const { data } = await api.post(`/Matches/${matchId}/events`, body);
  return data;
}

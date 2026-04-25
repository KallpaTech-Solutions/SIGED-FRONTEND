import { MATCH_EVENT_TYPE } from "../api/matchesControlService";

/** @param {unknown} ev */
function normalizedPeriodMarkerType(ev) {
  if (!ev || typeof ev !== "object") return null;
  const o = /** @type {Record<string, unknown>} */ (ev);
  const t = o.type ?? o.Type;
  if (typeof t === "number") {
    if (t === MATCH_EVENT_TYPE.InicioPeriodo) return "inicio";
    if (t === MATCH_EVENT_TYPE.FinPeriodo) return "fin";
    return null;
  }
  const s = String(t ?? "").replace(/\s+/g, "");
  if (s === "InicioPeriodo") return "inicio";
  if (s === "FinPeriodo") return "fin";
  return null;
}

/**
 * Verdadero si el acta indica descanso entre periodos (p. ej. entretiempo):
 * el último marcador de periodo es «Fin de periodo» y aún no hubo «Inicio» del siguiente.
 * Requiere partido en vivo y eventos ordenados como en el API (OccurredAt, periodo, minuto).
 *
 * @param {boolean} live
 * @param {unknown[]|undefined|null} events
 */
export function isPublicMatchInPeriodBreak(live, events) {
  if (!live || !Array.isArray(events) || events.length === 0) return false;
  /** @type {'playing' | 'break' | null} */
  let last = null;
  for (const ev of events) {
    const m = normalizedPeriodMarkerType(ev);
    if (m === "inicio") last = "playing";
    if (m === "fin") last = "break";
  }
  return last === "break";
}

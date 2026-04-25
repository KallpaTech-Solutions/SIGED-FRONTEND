import { MATCH_EVENT_TYPE } from "../api/matchesControlService";

/**
 * Última sustitución del acta para la vitrina (jugador que sale = playerName, entra = relatedPlayerName).
 * @param {unknown[]} events
 * @param {string|null|undefined} localTeamId
 * @param {string|null|undefined} visitorTeamId
 * @returns {{ side: 'home'|'away', outName: string, inName: string, eventId?: string } | null}
 */
export function lastSubstitutionFromEvents(events, localTeamId, visitorTeamId) {
  if (!Array.isArray(events) || events.length === 0) return null;
  const vis = visitorTeamId != null ? String(visitorTeamId) : "";

  const isSub = (t) =>
    t === "Sustitucion" ||
    t === MATCH_EVENT_TYPE.Sustitucion ||
    Number(t) === MATCH_EVENT_TYPE.Sustitucion;

  const subs = events.filter((e) => isSub(e.type ?? e.Type));
  if (subs.length === 0) return null;

  const ev = subs[subs.length - 1];
  const tid = String(ev.teamId ?? ev.TeamId ?? "");
  const side = tid && vis && tid === vis ? "away" : "home";

  const outName = String(ev.playerName ?? ev.PlayerName ?? "").trim();
  const inName = String(ev.relatedPlayerName ?? ev.RelatedPlayerName ?? "").trim();
  if (!outName && !inName) return null;

  const id = ev.id ?? ev.Id;
  return {
    side,
    outName: outName || "—",
    inName: inName || "—",
    ...(id != null ? { eventId: String(id) } : {}),
  };
}

/** @param {unknown} p */
export function formatRosterPlayerLabel(p) {
  if (!p || typeof p !== "object") return "";
  const o = /** @type {Record<string, unknown>} */ (p);
  const num = o.number ?? o.Number;
  const name = String(o.name ?? o.Name ?? "").trim();
  const bit = num != null && num !== "" ? `#${num} ` : "";
  return `${bit}${name}`.trim() || "—";
}

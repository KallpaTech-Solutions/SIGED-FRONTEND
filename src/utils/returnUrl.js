/**
 * Ruta interna segura para post-login (evita open redirect).
 * @param {string|null|undefined} raw
 * @returns {string|null}
 */
export function parseSafeReturnUrl(raw) {
  if (raw == null || typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return null;
  return t;
}

export const POST_LOGIN_REDIRECT_KEY = "siged_post_login_redirect";

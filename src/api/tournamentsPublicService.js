import api from "./axiosConfig";

/**
 * - GET /api/Tournaments — torneos activos
 * - GET /api/Matches/public/landing — en vivo + partidos del día (UTC), vitrina principal
 * - GET /api/Competitions/:id — detalle competencia
 */

export async function fetchPublicTournaments() {
  const { data } = await api.get("/Tournaments");
  return Array.isArray(data) ? data : [];
}

/** Partidos para la página /torneos (en vivo o hoy). Opcional ?date=YYYY-MM-DD */
export async function fetchPublicLandingMatches(dateIso) {
  try {
    const params = dateIso ? { date: dateIso } : {};
    const { data } = await api.get("/Matches/public/landing", { params });
    return Array.isArray(data) ? data : [];
  } catch (e) {
    const s = e?.response?.status;
    if (s === 404 || s === 405) return [];
    throw e;
  }
}

/** Misma lista que landing global pero filtrada por competencia (página competencia pública). */
export async function fetchPublicLandingMatchesByCompetition(competitionId, dateIso) {
  try {
    const params = dateIso ? { date: dateIso } : {};
    const { data } = await api.get(
      `/Matches/public/by-competition/${competitionId}/landing`,
      { params }
    );
    return Array.isArray(data) ? data : [];
  } catch (e) {
    const s = e?.response?.status;
    if (s === 404 || s === 405) return [];
    throw e;
  }
}

export async function fetchCompetitionById(id) {
  const { data } = await api.get(`/Competitions/${id}`);
  return data;
}

/** Fases, partidos por estado, tablas RR y llaves (GET /api/Competitions/{id}/public-dashboard) */
export async function fetchCompetitionPublicDashboard(id) {
  try {
    const { data } = await api.get(`/Competitions/${id}/public-dashboard`);
    return data;
  } catch (e) {
    const s = e?.response?.status;
    if (s === 404 || s === 405) return null;
    throw e;
  }
}

/** Torneo + competencias activas + equipos por competencia (GET /api/Tournaments/{id}/public-detail) */
export async function fetchTournamentPublicDetail(id) {
  const { data } = await api.get(`/Tournaments/${id}/public-detail`);
  return data;
}

/** Partido público: marcador, torneo/competencia y eventos (GET /api/Matches/public/{id}/detail) */
export async function fetchMatchPublicDetail(id) {
  const { data } = await api.get(`/Matches/public/${id}/detail`);
  return data;
}

function matchDetailHasTournamentLifecycle(d) {
  if (!d) return false;
  if (d.tournamentStatus !== undefined && d.tournamentStatus !== null) return true;
  if (d.TournamentStatus !== undefined && d.TournamentStatus !== null) return true;
  const n = d.tournamentStatusName ?? d.TournamentStatusName;
  if (n !== undefined && n !== null && String(n).trim() !== "") return true;
  return false;
}

const TOURNAMENT_STATUS_NAMES = [
  "Borrador",
  "InscripcionesAbiertas",
  "Activo",
  "Finalizado",
  "Programado",
];

/**
 * Carga detalle de partido: operadores con JWT usan /Matches/{id}/mesa-detail (sin filtrar IsActive);
 * el resto usa el endpoint público.
 */
async function fetchMatchDetailForViewer(matchId, preferMesaDetail) {
  if (!preferMesaDetail) {
    return fetchMatchPublicDetail(matchId);
  }
  try {
    const { data } = await api.get(`/Matches/${matchId}/mesa-detail`);
    return data;
  } catch (e) {
    const s = e?.response?.status;
    // 404: API vieja sin ruta mesa-detail, o mismo criterio que público; intentar vitrina pública.
    if (s === 401 || s === 403 || s === 404) {
      return fetchMatchPublicDetail(matchId);
    }
    throw e;
  }
}

/**
 * Igual que fetchMatchPublicDetail pero, si faltan tournamentStatus / nombre,
 * completa con GET /Tournaments/{id} (público). Así la mesa ve "Activo" aunque
 * el API de partido venga sin esos campos o desactualizado.
 * @param {string} matchId
 * @param {{ preferMesaDetail?: boolean }} [options]
 */
export async function fetchMatchPublicDetailEnriched(matchId, options = {}) {
  const { preferMesaDetail = false } = options;
  const data = await fetchMatchDetailForViewer(matchId, preferMesaDetail);
  if (matchDetailHasTournamentLifecycle(data)) return data;
  const tid = data?.tournamentId ?? data?.TournamentId;
  if (!tid) return data;
  try {
    const { data: t } = await api.get(`/Tournaments/${tid}`);
    const st = t?.status ?? t?.Status;
    const merged = { ...data };
    if (merged.tournamentStatus == null && merged.TournamentStatus == null) {
      if (typeof st === "number" && !Number.isNaN(st)) merged.tournamentStatus = st;
    }
    if (
      !(merged.tournamentStatusName ?? merged.TournamentStatusName) &&
      typeof st === "string" &&
      st.trim() !== ""
    ) {
      merged.tournamentStatusName = st;
    }
    if (
      typeof st === "number" &&
      st >= 0 &&
      st < TOURNAMENT_STATUS_NAMES.length &&
      !(merged.tournamentStatusName ?? merged.TournamentStatusName)
    ) {
      merged.tournamentStatusName = TOURNAMENT_STATUS_NAMES[st];
    }
    return merged;
  } catch {
    return data;
  }
}

/**
 * Plantel del equipo (GET /api/Teams/{id}).
 * `includeInactive`: solo aplica si el usuario está autenticado; delegados ven inactivos
 * de su escuela y admins de torneo ven todos (ver TeamsController.GetById).
 */
export async function fetchPublicTeamRoster(
  teamId,
  { includeInactive = false } = {}
) {
  const { data } = await api.get(`/Teams/${teamId}`, {
    params: { includeInactive },
  });
  return data;
}

/** Catálogo de sedes (GET /api/Venues). Público. */
export async function fetchVenues() {
  const { data } = await api.get("/Venues");
  return Array.isArray(data) ? data : [];
}

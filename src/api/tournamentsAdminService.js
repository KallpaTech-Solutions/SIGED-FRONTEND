import api from "./axiosConfig";

/**
 * Panel de control — torneos (requiere JWT).
 * Crear torneo: POST /api/Tournaments (multipart/form-data).
 */

export async function fetchTournamentsAdmin({ includeInactive = true } = {}) {
  const { data } = await api.get("/Tournaments", {
    params: { includeInactive },
  });
  return Array.isArray(data) ? data : [];
}

/** Detalle admin: incluye competencias y disciplina por competencia. */
export async function fetchTournamentById(id) {
  const { data } = await api.get(`/Tournaments/${id}`);
  return data;
}

/** Lista de competencias de un torneo (también viene en fetchTournamentById). */
export async function fetchCompetitionsByTournament(tournamentId) {
  const { data } = await api.get(`/Competitions/tournament/${tournamentId}`);
  return Array.isArray(data) ? data : [];
}

/**
 * @param {{ tournamentId: string, disciplineId: string, gender: number, categoryName?: string }} body
 */
export async function createCompetition(body) {
  const { data } = await api.post("/Competitions", body);
  return data;
}

/**
 * @param {FormData} formData — Name, Year, StartDate, EndDate, Description?, Organizer?, LogoFile?
 */
export async function createTournament(formData) {
  const { data } = await api.post("/Tournaments", formData, {
    transformRequest: [
      (payload, headers) => {
        if (payload instanceof FormData) {
          delete headers["Content-Type"];
        }
        return payload;
      },
    ],
  });
  return data;
}

const formDataTransform = {
  transformRequest: [
    (payload, headers) => {
      if (payload instanceof FormData) {
        delete headers["Content-Type"];
      }
      return payload;
    },
  ],
};

/** @param {string} id @param {number} status — valor numérico del enum TournamentStatus */
export async function patchTournamentLifecycleStatus(id, status) {
  const { data } = await api.patch(`/Tournaments/${id}/lifecycle-status`, {
    status,
  });
  return data;
}

/** @param {string} id @param {File} file — PDF */
export async function patchTournamentRules(id, file) {
  const fd = new FormData();
  fd.append("rulesFile", file);
  const { data } = await api.patch(`/Tournaments/${id}/rules`, fd, formDataTransform);
  return data;
}

/** Fases de una competencia (GET /api/Phases/competition/{competitionId}). */
export async function fetchPhasesByCompetition(competitionId) {
  const { data } = await api.get(`/Phases/competition/${competitionId}`);
  return Array.isArray(data) ? data : [];
}

/** Detalle competencia con equipos (GET /api/Competitions/{id}). */
export async function fetchCompetitionAdminById(competitionId) {
  const { data } = await api.get(`/Competitions/${competitionId}`);
  return data;
}

/**
 * Armado automático de grupos + RR o eliminación directa (POST /api/Competitions/{id}/setup-format).
 * @param {string} competitionId
 * @param {{
 *   mode: number,
 *   teamIds: string[],
 *   maxTeamsPerGroup?: number,
 *   shuffleTeams?: boolean,
 *   qualifiedPerGroup?: number,
 *   groupPhaseName?: string,
 *   autoGenerateRoundRobinFixtures?: boolean,
 *   knockoutPhaseName?: string,
 *   knockoutRandomSeed?: boolean
 * }} body
 */
export async function setupCompetitionFormat(competitionId, body) {
  const { data } = await api.post(
    `/Competitions/${competitionId}/setup-format`,
    body
  );
  return data;
}

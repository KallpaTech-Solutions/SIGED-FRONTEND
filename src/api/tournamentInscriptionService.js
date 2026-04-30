import api from "./axiosConfig";

/**
 * Delegado / admin: escuela y equipos para inscribir (GET /api/Teams/me/context).
 */
export async function fetchTeamsMeContext() {
  const { data } = await api.get("/Teams/me/context");
  return data;
}

/**
 * Detalle de equipo (GET /api/Teams/{id}).
 * Con includeInactive y JWT de delegado/admin de la misma escuela, incluye jugadores dados de baja.
 */
export async function fetchTeamDetail(teamId, { includeInactive = false } = {}) {
  const { data } = await api.get(`/Teams/${teamId}`, {
    params: includeInactive ? { includeInactive: true } : {},
  });
  return data;
}

/** Resumen panel delegado: equipos, inscripciones y planteles (GET /api/Teams/me/summary). */
export async function fetchDelegateSummary() {
  const { data } = await api.get("/Teams/me/summary");
  return data;
}

/** Activa / desactiva jugador (PATCH /api/Players/{id}/status). */
export async function togglePlayerStatus(playerId) {
  const { data } = await api.patch(`/Players/${playerId}/status`);
  return data;
}

/** Habilita / inhabilita al jugador para jugar (PATCH /api/Players/{id}/eligibility). */
export async function setPlayerEligibility(playerId, isEligible) {
  const { data } = await api.patch(`/Players/${playerId}/eligibility`, {
    isEligible,
  });
  return data;
}

/** Listado global de equipos (GET /api/Teams). Solo lectura; usar para administración. */
export async function fetchTeamsList({ onlyActive = false } = {}) {
  const { data } = await api.get("/Teams", { params: { onlyActive } });
  return data;
}

/** Catálogo gestionable de equipos con escuela, creador, inscripciones y conteos. */
export async function fetchTeamsManagementCatalog({
  search = "",
  organizacionId = "",
  includeInactive = true,
} = {}) {
  const params = { includeInactive };
  if (search?.trim()) params.search = search.trim();
  if (organizacionId) params.organizacionId = organizacionId;
  const { data } = await api.get("/Teams/management-catalog", { params });
  return data;
}

/** Elimina equipo y plantel si no tiene historial deportivo. */
export async function deleteTeam(teamId) {
  await api.delete(`/Teams/${teamId}`);
}

/**
 * Inscribir equipo en competencia (POST /api/Inscriptions).
 * Body: { competitionId, teamId } (camelCase).
 */
export async function postInscription({ competitionId, teamId }) {
  const { data } = await api.post("/Inscriptions", {
    competitionId,
    teamId,
  });
  return data;
}

/** Quita la inscripción de un equipo en una competencia si aún no tiene fixture/historial. */
export async function deleteInscription({ competitionId, teamId }) {
  const { data } = await api.delete(
    `/Inscriptions/${competitionId}/teams/${teamId}`
  );
  return data;
}

/** Cierra/reabre la lista oficial de un equipo dentro de una competencia. */
export async function setCompetitionTeamRosterLock({ competitionId, teamId, locked }) {
  const { data } = await api.patch(
    `/Competitions/${competitionId}/teams/${teamId}/roster-lock`,
    { locked }
  );
  return data;
}

/**
 * Crear equipo (POST /api/Teams, multipart).
 * @param {FormData} formData — Name, Initials, RepresentativeName, OrganizacionId; LogoFile opcional
 */
export async function createTeamMultipart(formData) {
  const { data } = await api.post("/Teams", formData, {
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

/** Usuarios activos de tu escuela (delegado principal elige co-delegados). GET /Teams/me/org-users */
export async function fetchOrgUsersForTeamGestores() {
  const { data } = await api.get("/Teams/me/org-users");
  return data;
}

/** GET /Teams/{id}/gestores */
export async function fetchTeamGestores(teamId) {
  const { data } = await api.get(`/Teams/${teamId}/gestores`);
  return data;
}

/** POST /Teams/{id}/gestores — body { usuarioId } */
export async function postTeamGestor(teamId, usuarioId) {
  const { data } = await api.post(`/Teams/${teamId}/gestores`, { usuarioId });
  return data;
}

/** DELETE /Teams/{id}/gestores/{usuarioId} */
export async function deleteTeamGestor(teamId, usuarioId) {
  await api.delete(`/Teams/${teamId}/gestores/${usuarioId}`);
}

/**
 * Alta de jugador (POST /api/Players, multipart).
 */
const multipartTransform = [
  (payload, headers) => {
    if (payload instanceof FormData) {
      delete headers["Content-Type"];
    }
    return payload;
  },
];

export async function createPlayerMultipart(formData) {
  const { data } = await api.post("/Players", formData, {
    transformRequest: multipartTransform,
  });
  return data;
}

/**
 * Actualizar jugador (PUT /api/Players/{id}, multipart).
 */
export async function updatePlayerMultipart(playerId, formData) {
  const { data } = await api.put(`/Players/${playerId}`, formData, {
    transformRequest: multipartTransform,
  });
  return data;
}

/**
 * Eliminar jugador sin historial en partidos (DELETE /api/Players/{id}).
 */
export async function deletePlayer(playerId) {
  await api.delete(`/Players/${playerId}`);
}

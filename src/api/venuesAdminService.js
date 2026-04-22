import api from "./axiosConfig";

/** @param {{ complexId?: string }} [params] */
export async function fetchVenuesAdmin(params = {}) {
  const { data } = await api.get("/Venues", { params });
  return Array.isArray(data) ? data : [];
}

/**
 * @param {{ name: string, address?: string|null, capacity?: number, complexId?: string|null }} body
 */
export async function createVenue(body) {
  const { data } = await api.post("/Venues", body);
  return data;
}

/**
 * @param {string} id
 * @param {{ name: string, address?: string|null, capacity?: number, complexId?: string|null }} body
 */
export async function updateVenue(id, body) {
  const { data } = await api.put(`/Venues/${id}`, body);
  return data;
}

export async function deleteVenue(id) {
  await api.delete(`/Venues/${id}`);
}

/** @param {{ onlyActive?: boolean }} [params] */
export async function fetchVenueComplexesAdmin(params = {}) {
  const { data } = await api.get("/VenueComplexes", { params });
  return Array.isArray(data) ? data : [];
}

/**
 * @param {object} body — CreateVenueComplexDto (name obligatorio)
 */
export async function createVenueComplex(body) {
  const { data } = await api.post("/VenueComplexes", body);
  return data;
}

export async function deleteVenueComplex(id) {
  await api.delete(`/VenueComplexes/${id}`);
}

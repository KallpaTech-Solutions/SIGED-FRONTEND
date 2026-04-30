import api from "./axiosConfig";

/** Plantillas alineadas con Siged.Domain.Constants.SportRulesTemplates.OfficialTemplates */
export const DISCIPLINE_TEMPLATE_OPTIONS = [
  { key: "FIFA_FOOTBALL", label: "Fútbol (Reglamento FIFA)" },
  { key: "FIFA_FUTSAL", label: "Futsal (Reglamento FIFA)" },
  { key: "FIVB_VOLLEYBALL", label: "Voleibol (Reglamento FIVB)" },
  { key: "FIBA_BASKETBALL", label: "Básquetbol (Reglamento FIBA)" },
];

export function getDisciplineTemplateLabel(templateKey) {
  if (!templateKey) return null;
  const opt = DISCIPLINE_TEMPLATE_OPTIONS.find((o) => o.key === templateKey);
  return opt?.label ?? String(templateKey);
}

export async function fetchDisciplinesAdmin({ onlyActive = false } = {}) {
  const { data } = await api.get("/Disciplines", {
    params: { onlyActive },
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchDisciplineById(id) {
  const { data } = await api.get(`/Disciplines/${id}`);
  return data;
}

/**
 * @param {FormData} formData — Name, TemplateKey, IconFile?
 */
const formDataTransform = [
  (payload, headers) => {
    if (payload instanceof FormData) {
      delete headers["Content-Type"];
    }
    return payload;
  },
];

export async function createDiscipline(formData) {
  const { data } = await api.post("/Disciplines", formData, {
    transformRequest: formDataTransform,
  });
  return data;
}

/**
 * @param {FormData} formData — Name, IconFile? (sin plantilla: el API solo actualiza nombre e icono)
 */
export async function updateDiscipline(id, formData) {
  const { data } = await api.put(`/Disciplines/${id}`, formData, {
    transformRequest: formDataTransform,
  });
  return data;
}

export async function deleteDiscipline(id) {
  await api.delete(`/Disciplines/${id}`);
}

export async function toggleDisciplineStatus(id) {
  const { data } = await api.patch(`/Disciplines/${id}/status`);
  return data;
}

/** Reglas maestras de la disciplina (clonarán a competencias). */
export async function fetchDisciplineRules(disciplineId) {
  const { data } = await api.get(`/Disciplines/${disciplineId}/rules`);
  return Array.isArray(data) ? data : [];
}

/**
 * Reemplaza todas las reglas (mismo contrato que el API).
 * @param {Array<{ ruleKey: string, ruleValue: string }>} rules
 */
export async function updateDisciplineRules(disciplineId, rules) {
  const { data } = await api.put(`/Disciplines/${disciplineId}/rules`, rules);
  return data;
}

const reportAssetsFormTransform = [
  (payload, headers) => {
    if (payload instanceof FormData) {
      delete headers["Content-Type"];
    }
    return payload;
  },
];

export async function fetchDisciplineReportAssets(disciplineId) {
  const { data } = await api.get(`/Disciplines/${disciplineId}/report-assets`);
  return data;
}

export async function updateDisciplineReportAssets(disciplineId, formData) {
  const { data } = await api.put(
    `/Disciplines/${disciplineId}/report-assets`,
    formData,
    { transformRequest: reportAssetsFormTransform }
  );
  return data;
}

export async function fetchDefaultReportAssets() {
  const { data } = await api.get("/Disciplines/report-assets/default");
  return data;
}

export async function updateDefaultReportAssets(formData) {
  const { data } = await api.put("/Disciplines/report-assets/default", formData, {
    transformRequest: reportAssetsFormTransform,
  });
  return data;
}

/** Ayudas para claves frecuentes (plantillas FIFA/FIVB/FIBA). */
export const DISCIPLINE_RULE_KEY_HINTS = {
  POINTS_WIN: "Puntos por victoria",
  POINTS_DRAW: "Puntos por empate",
  POINTS_LOSS: "Puntos por derrota",
  PERIODS_COUNT: "Cantidad de tiempos / cuartos / sets",
  PERIOD_DURATION: "Duración por tiempo (min)",
  HAS_DRAW: "Permite empates (true/false)",
  MAX_SUBSTITUTIONS: "Máximo de cambios",
  FOUL_LIMIT: "Límite de faltas (futsal)",
  TIMEOUTS_PER_PERIOD: "Tiempos muertos por periodo",
  MAX_SETS: "Máximo de sets (vóley)",
  POINTS_REGULAR_SET: "Puntos para ganar set",
  POINTS_FINAL_SET: "Puntos set decisivo",
  MIN_POINTS_DIFF: "Diferencia mínima para cerrar set",
  POINTS_3_0_OR_3_1: "Puntos tabla 3-0 / 3-1",
  POINTS_3_2: "Puntos tabla 3-2",
  POINTS_2_3: "Puntos tabla 2-3",
  OVERTIME_DURATION: "Duración tiempo extra (min)",
  TIENE_TARJETAS: "Usa tarjetas (true/false)",
  PUNTOS_POR_VICTORIA: "Puntos por victoria (tabla)",
  USA_SETS: "Usa sets (true/false)",
  CANTIDAD_PERIODOS: "Cantidad de periodos",
  ACTA_LOGO_LEFT_URL: "Logo izquierdo para encabezado del acta",
  ACTA_LOGO_RIGHT_URL: "Logo derecho para encabezado del acta",
};

/**
 * Textos para la vitrina pública (no usar nombres técnicos como "Borrador").
 * API: TournamentStatus como entero 0–4 o string PascalCase.
 *
 * IsActive (bool): si el torneo aparece en listados administrados por visibilidad.
 * Status (enum): etapa del ciclo de vida para el mensaje al usuario.
 */

const LABELS = {
  0: "En planeamiento",
  1: "Inscripciones abiertas",
  2: "En curso",
  3: "Finalizado",
  4: "Programado · fixture en preparación",
  Borrador: "En planeamiento",
  Inscripciones: "Inscripciones abiertas",
  InscripcionesAbiertas: "Inscripciones abiertas",
  Activo: "En curso",
  Finalizado: "Finalizado",
  Programado: "Programado · fixture en preparación",
};

/**
 * True si el torneo está en competencia (enum Activo = 2 o string "Activo").
 * Mesa / transmisión en vivo solo aplica en esta etapa.
 */
export function isTournamentActivoCompetencia(status) {
  if (status === null || status === undefined) return false;
  const n = typeof status === "number" ? status : null;
  const s = String(status);
  return n === 2 || s === "Activo";
}

/** True si el torneo está en etapa de inscripciones (enum o string API). */
export function isInscripcionesAbiertas(status) {
  if (status === null || status === undefined) return false;
  const n = typeof status === "number" ? status : null;
  const s = String(status);
  return (
    n === 1 ||
    s === "Inscripciones" ||
    s === "InscripcionesAbiertas"
  );
}

export function tournamentPublicLabel(status) {
  if (status === null || status === undefined) return "—";
  const key = typeof status === "number" ? status : String(status);
  return LABELS[key] ?? LABELS[status] ?? String(status);
}

/** Clases Tailwind para badge en cards claras */
export function tournamentPublicBadgeClass(status) {
  const n = typeof status === "number" ? status : null;
  const s = String(status ?? "");
  const isActivo = n === 2 || s === "Activo";
  const isInsc =
    n === 1 || s === "Inscripciones" || s === "InscripcionesAbiertas";
  const isFin = n === 3 || s === "Finalizado";
  const isProg = n === 4 || s === "Programado";
  if (isActivo) return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (isInsc) return "bg-sky-50 text-sky-800 border-sky-200";
  if (isFin) return "bg-slate-100 text-slate-700 border-slate-200";
  if (isProg) return "bg-violet-50 text-violet-900 border-violet-200";
  return "bg-amber-50 text-amber-900 border-amber-200";
}

/** Badge sobre fondo oscuro (hero del detalle público) */
export function tournamentPublicBadgeClassOnDark(status) {
  const n = typeof status === "number" ? status : null;
  const s = String(status ?? "");
  const isActivo = n === 2 || s === "Activo";
  const isInsc =
    n === 1 || s === "Inscripciones" || s === "InscripcionesAbiertas";
  const isFin = n === 3 || s === "Finalizado";
  const isProg = n === 4 || s === "Programado";
  if (isActivo) return "bg-emerald-500/20 text-emerald-100 border-emerald-400/40";
  if (isInsc) return "bg-sky-500/20 text-sky-100 border-sky-400/40";
  if (isFin) return "bg-white/10 text-slate-100 border-white/25";
  if (isProg) return "bg-violet-500/20 text-violet-100 border-violet-400/40";
  return "bg-white/10 text-amber-100 border-amber-300/40";
}

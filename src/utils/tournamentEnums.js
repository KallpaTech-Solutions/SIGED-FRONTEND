/**
 * Etiquetas en español alineadas con Siged.Domain.Entities.Core.Tournaments.Enums
 * (valores numéricos por orden de declaración en C#, salvo donde el enum asigna explícito).
 */

/** ScoringType */
const SCORING_TYPE = {
  0: "Por puntos (fútbol, futsal)",
  1: "Por sets (vóley, tenis)",
  2: "Tabla básquet",
  3: "Por tiempo (carreras)",
  PointsBased: "Por puntos (fútbol, futsal)",
  SetsBased: "Por sets (vóley, tenis)",
  BasketBased: "Tabla básquet",
  TimedRace: "Por tiempo (carreras)",
};

/** Gender */
const GENDER = {
  0: "Masculino",
  1: "Femenino",
  2: "Mixto",
  Masculino: "Masculino",
  Femenino: "Femenino",
  Mixto: "Mixto",
};

/** Para selects de formulario (valor = índice del enum). */
export const GENDER_OPTIONS = [
  { value: 0, label: "Masculino" },
  { value: 1, label: "Femenino" },
  { value: 2, label: "Mixto" },
];

/** PhaseType */
const PHASE_TYPE = {
  0: "Todos contra todos",
  1: "Eliminación simple",
  2: "Eliminación doble",
  3: "Sistema suizo",
  RoundRobin: "Todos contra todos",
  EliminacionSimple: "Eliminación simple",
  EliminacionDoble: "Eliminación doble",
  Suizo: "Sistema suizo",
};

/** MatchStatus */
const MATCH_STATUS = {
  0: "Programado",
  1: "En vivo",
  2: "Finalizado",
  3: "Suspendido",
  Programado: "Programado",
  EnVivo: "En vivo",
  Finalizado: "Finalizado",
  Suspendido: "Suspendido",
};

/** MatchEventType (valores explícitos en C#) */
const MATCH_EVENT_TYPE = {
  1: "Puntaje",
  2: "Gol",
  3: "Gol de penal",
  4: "Tarjeta amarilla",
  5: "Tarjeta roja",
  6: "Sustitución",
  7: "Falta",
  8: "Inicio de periodo",
  9: "Fin de periodo",
  Puntaje: "Puntaje",
  Goal: "Gol",
  PenaltyGoal: "Gol de penal",
  TarjetaAmarilla: "Tarjeta amarilla",
  TarjetaRoja: "Tarjeta roja",
  Sustitucion: "Sustitución",
  Falta: "Falta",
  InicioPeriodo: "Inicio de periodo",
  FinPeriodo: "Fin de periodo",
};

/** PlayerPosition */
const PLAYER_POSITION = {
  0: "Sin posición",
  1: "Portero",
  2: "Defensa",
  3: "Mediocampista",
  4: "Delantero",
  5: "Líbero",
  6: "Armador",
  7: "Central",
  8: "Capitán",
  None: "Sin posición",
  Portero: "Portero",
  Defensa: "Defensa",
  Mediocampista: "Mediocampista",
  Delantero: "Delantero",
  Libero: "Líbero",
  Armador: "Armador",
  Central: "Central",
  Capitan: "Capitán",
};

function pick(map, v) {
  if (v === null || v === undefined || v === "") return "—";
  if (Object.prototype.hasOwnProperty.call(map, v)) return map[v];
  return String(v);
}

export function scoringTypeLabel(v) {
  return pick(SCORING_TYPE, v);
}

export function genderLabel(v) {
  return pick(GENDER, v);
}

export function phaseTypeLabel(v) {
  return pick(PHASE_TYPE, v);
}

export function matchStatusLabel(v) {
  return pick(MATCH_STATUS, v);
}

export function matchEventTypeLabel(v) {
  return pick(MATCH_EVENT_TYPE, v);
}

export function playerPositionLabel(v) {
  return pick(PLAYER_POSITION, v);
}

/** TournamentStatus (orden lógico de gestión). Valores = enum C#. */
export const TOURNAMENT_STATUS_OPTIONS = [
  { value: 0, label: "Planeamiento (borrador)" },
  { value: 1, label: "Inscripciones abiertas" },
  { value: 4, label: "Programado (fixture en armado)" },
  { value: 2, label: "Activo (en competencia)" },
  { value: 3, label: "Finalizado" },
];

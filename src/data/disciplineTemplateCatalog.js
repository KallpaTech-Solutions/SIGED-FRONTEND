/**
 * Vista previa alineada con Siged.Domain.Constants.SportRulesTemplates.OfficialTemplates
 * (mismo contenido que la plantilla usada al crear la disciplina).
 */
export const OFFICIAL_TEMPLATE_CATALOG = {
  FIFA_FOOTBALL: {
    name: "Fútbol (Reglamento FIFA)",
    rules: [
      { key: "POINTS_WIN", value: "3", description: "Puntos por victoria" },
      { key: "POINTS_DRAW", value: "1", description: "Puntos por empate" },
      { key: "POINTS_LOSS", value: "0", description: "Puntos por derrota" },
      { key: "PERIODS_COUNT", value: "2", description: "Número de tiempos" },
      { key: "PERIOD_DURATION", value: "45", description: "Duración de cada tiempo (min)" },
      { key: "HAS_DRAW", value: "true", description: "Permite empates en fase de grupos" },
      { key: "MAX_SUBSTITUTIONS", value: "5", description: "Máximo de cambios permitidos" },
    ],
  },
  FIFA_FUTSAL: {
    name: "Futsal (Reglamento FIFA)",
    rules: [
      { key: "POINTS_WIN", value: "3", description: "Puntos por victoria" },
      { key: "POINTS_DRAW", value: "1", description: "Puntos por empate" },
      { key: "PERIODS_COUNT", value: "2", description: "Número de tiempos" },
      { key: "PERIOD_DURATION", value: "20", description: "Duración de cada tiempo (min cronometrados)" },
      { key: "FOUL_LIMIT", value: "5", description: "Límite de faltas para tiro libre directo" },
      { key: "TIMEOUTS_PER_PERIOD", value: "1", description: "Tiempos muertos por equipo/periodo" },
    ],
  },
  FIVB_VOLLEYBALL: {
    name: "Voleibol (Reglamento FIVB)",
    rules: [
      { key: "MAX_SETS", value: "5", description: "Máximo de sets (gana quien gane 3)" },
      { key: "POINTS_REGULAR_SET", value: "25", description: "Puntos para ganar set normal" },
      { key: "POINTS_FINAL_SET", value: "15", description: "Puntos para el 5to set (Tie-break)" },
      { key: "MIN_POINTS_DIFF", value: "2", description: "Diferencia mínima para cerrar set" },
      { key: "POINTS_3_0_OR_3_1", value: "3", description: "Puntos en tabla por ganar 3-0 o 3-1" },
      { key: "POINTS_3_2", value: "2", description: "Puntos en tabla por ganar 3-2" },
      { key: "POINTS_2_3", value: "1", description: "Puntos en tabla por perder 2-3" },
    ],
  },
  FIBA_BASKETBALL: {
    name: "Básquetbol (Reglamento FIBA)",
    rules: [
      { key: "POINTS_WIN", value: "2", description: "Puntos por victoria" },
      { key: "POINTS_LOSS", value: "1", description: "Puntos por derrota (presentación)" },
      { key: "PERIODS_COUNT", value: "4", description: "Número de cuartos" },
      { key: "PERIOD_DURATION", value: "10", description: "Duración de cada cuarto (min)" },
      { key: "HAS_DRAW", value: "false", description: "No se permite el empate" },
      { key: "OVERTIME_DURATION", value: "5", description: "Duración de tiempo extra" },
    ],
  },
};

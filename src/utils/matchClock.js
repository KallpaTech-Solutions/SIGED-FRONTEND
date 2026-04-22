/**
 * Cronómetro de periodo según reglas (PERIOD_DURATION, futsal = reloj detenido).
 */

import { OFFICIAL_TEMPLATE_CATALOG } from "../data/disciplineTemplateCatalog";

/** Coincide con MATCH_EVENT_TYPE.InicioPeriodo / FinPeriodo */
const EVENT_INICIO_PERIODO = 8;
const EVENT_FIN_PERIODO = 9;

function pad2(n) {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

function normTypeRaw(t) {
  return String(t ?? "").trim();
}

function normType(t) {
  return normTypeRaw(t).replace(/\s+/g, "");
}

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** API puede mandar "InicioPeriodo" o 8 */
function isInicioType(t) {
  const s = normType(t);
  if (s === "InicioPeriodo" || s === "8") return true;
  const n = Number(normTypeRaw(t));
  return n === EVENT_INICIO_PERIODO;
}

function isFinType(t) {
  const s = normType(t);
  if (s === "FinPeriodo" || s === "9") return true;
  const n = Number(normTypeRaw(t));
  return n === EVENT_FIN_PERIODO;
}

/** Periodo efectivo del evento (inicio con 0 en BD cuenta como 1.º tiempo). */
function periodoEvento(ev) {
  const p = num(ev?.period ?? ev?.Period, 0);
  const t = ev?.type ?? ev?.Type;
  if (isInicioType(t) && p <= 0) return 1;
  return p > 0 ? p : 1;
}

/**
 * Fecha del evento (.NET a veces manda sin Z; timestamp inválido si no parseamos bien).
 * @returns {number | null} ms desde epoch
 */
export function parseOccurredMs(v) {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = String(v).trim();
  if (!s) return null;
  let t = new Date(s).getTime();
  if (!Number.isNaN(t)) return t;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s) && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) {
    t = new Date(`${s}Z`).getTime();
    if (!Number.isNaN(t)) return t;
  }
  return null;
}

function normalizeRuleMap(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    const key = String(k).trim().toUpperCase().replace(/\s+/g, "_");
    out[key] = v == null ? "" : String(v);
  }
  return out;
}

function catalogForTemplateKey(templateKey) {
  if (!templateKey) return null;
  const k = String(templateKey).trim();
  if (OFFICIAL_TEMPLATE_CATALOG[k]) return OFFICIAL_TEMPLATE_CATALOG[k];
  const found = Object.keys(OFFICIAL_TEMPLATE_CATALOG).find(
    (x) => x.toUpperCase() === k.toUpperCase()
  );
  return found ? OFFICIAL_TEMPLATE_CATALOG[found] : null;
}

/** @param {Record<string, string> | null | undefined} rules */
export function parseSportRulesFromDetail(detail) {
  const raw = detail?.sportRules ?? detail?.SportRules ?? {};
  const map = normalizeRuleMap(raw);
  const templateKey = detail?.disciplineTemplateKey ?? detail?.DisciplineTemplateKey ?? null;
  const tk = templateKey ? String(templateKey).trim() : null;

  let periodDuration = num(map.PERIOD_DURATION, NaN);
  let periodsCount = num(map.PERIODS_COUNT ?? map.CANTIDAD_PERIODOS, NaN);

  const cat = catalogForTemplateKey(tk);
  if (cat?.rules?.length) {
    if (!Number.isFinite(periodDuration) || periodDuration <= 0) {
      const row = cat.rules.find((r) => String(r.key).toUpperCase() === "PERIOD_DURATION");
      if (row) periodDuration = num(row.value, NaN);
    }
    if (!Number.isFinite(periodsCount) || periodsCount <= 0) {
      const row = cat.rules.find(
        (r) =>
          String(r.key).toUpperCase() === "PERIODS_COUNT" ||
          String(r.key).toUpperCase() === "CANTIDAD_PERIODOS"
      );
      if (row) periodsCount = num(row.value, NaN);
    }
  }

  const tkUpper = tk ? tk.toUpperCase() : "";
  const stoppedClock = tkUpper.includes("FUTSAL");

  return {
    templateKey: tk,
    periodDurationMin: Number.isFinite(periodDuration) && periodDuration > 0 ? periodDuration : null,
    periodsCount: Number.isFinite(periodsCount) && periodsCount > 0 ? Math.floor(periodsCount) : null,
    stoppedClock,
  };
}

function sortEventsChronologically(events) {
  const list = Array.isArray(events) ? [...events] : [];
  return list.sort((a, b) => {
    const ta = parseOccurredMs(a?.occurredAt ?? a?.OccurredAt) ?? 0;
    const tb = parseOccurredMs(b?.occurredAt ?? b?.OccurredAt) ?? 0;
    if (ta !== tb) return ta - tb;
    const pa = periodoEvento(a);
    const pb = periodoEvento(b);
    if (pa !== pb) return pa - pb;
    const ma = num(a?.minute ?? a?.Minute, 0);
    const mb = num(b?.minute ?? b?.Minute, 0);
    if (ma !== mb) return ma - mb;
    return String(a?.id ?? a?.Id ?? "").localeCompare(String(b?.id ?? b?.Id ?? ""));
  });
}

/**
 * @param {number} periodDurationMin
 * @param {number} elapsedSec
 */
export function formatPeriodClock(periodDurationMin, elapsedSec) {
  const D = Math.max(1, periodDurationMin);
  const secReg = D * 60;
  const e = Math.max(0, Math.floor(elapsedSec));
  if (e < secReg) {
    const m = Math.floor(e / 60);
    const s = e % 60;
    return { text: `${m}:${pad2(s)}`, isAdded: false, addedMinute: null };
  }
  const added = e - secReg;
  const addMin = Math.floor(added / 60) + 1;
  const s = added % 60;
  return { text: `+${addMin}:${pad2(s)}`, isAdded: true, addedMinute: addMin };
}

/**
 * @param {object} opts
 * @param {boolean} opts.isLive
 * @param {ReturnType<parseSportRulesFromDetail>} opts.rules
 * @param {unknown[]} opts.events
 * @param {number} opts.nowMs
 */
export function computeMatchClockDisplay({ isLive, rules, events, nowMs }) {
  const { periodDurationMin, periodsCount, stoppedClock, templateKey } = rules;

  if (!periodDurationMin) {
    return {
      visible: false,
      phase: "unsupported",
      period: null,
      line: "",
      hint: "",
      templateKey,
    };
  }

  const sorted = sortEventsChronologically(events);
  let activePeriod = null;
  let inPlay = false;

  for (const ev of sorted) {
    const t = ev?.type ?? ev?.Type;
    const p = periodoEvento(ev);
    if (isInicioType(t)) {
      activePeriod = p;
      inPlay = true;
    } else if (isFinType(t)) {
      const pFin = num(ev?.period ?? ev?.Period, 0);
      const finNorm = pFin > 0 ? pFin : activePeriod ?? 1;
      if (activePeriod != null && finNorm === activePeriod) inPlay = false;
    }
  }

  if (!isLive) {
    return {
      visible: false,
      phase: "not_live",
      period: activePeriod,
      line: "",
      hint: "",
      templateKey,
    };
  }

  if (activePeriod == null) {
    activePeriod = 1;
    inPlay = true;
  }

  const periodLabelBase = `Periodo ${activePeriod}${
    periodsCount ? ` / ${periodsCount}` : ""
  }`;

  if (!inPlay) {
    return {
      visible: true,
      phase: "interval",
      period: activePeriod,
      periodLabel: periodLabelBase,
      line: "Descanso",
      elapsedSec: 0,
      hint:
        periodsCount && activePeriod < periodsCount
          ? `Entre tiempos · hasta ${periodsCount} periodos`
          : "Entre tiempos",
      templateKey,
    };
  }

  let periodStartMs = null;
  for (const ev of sorted) {
    const t = ev?.type ?? ev?.Type;
    if (!isInicioType(t)) continue;
    const p = periodoEvento(ev);
    if (p !== activePeriod) continue;
    const ms = parseOccurredMs(ev?.occurredAt ?? ev?.OccurredAt);
    if (ms != null) {
      if (periodStartMs == null || ms > periodStartMs) periodStartMs = ms;
    }
  }

  let elapsedSec = 0;

  if (stoppedClock) {
    let maxMin = 0;
    for (const ev of sorted) {
      const p = periodoEvento(ev);
      if (p !== activePeriod) continue;
      const m = num(ev?.minute ?? ev?.Minute, 0);
      if (m > maxMin) maxMin = m;
    }
    elapsedSec = maxMin * 60;
  } else if (periodStartMs != null) {
    elapsedSec = Math.max(0, Math.floor((nowMs - periodStartMs) / 1000));
  } else {
    elapsedSec = 0;
  }

  const { text, isAdded } = formatPeriodClock(periodDurationMin, elapsedSec);

  let hint = "";
  if (stoppedClock) {
    hint = "Futsal: el reloj sigue el minuto que registrás en los eventos (no corre solo).";
  } else if (!periodStartMs) {
    hint =
      "Registrá «Inicio de periodo» en la mesa para arrancar el cronómetro en vivo.";
  } else if (isAdded) {
    hint = "Tiempo añadido respecto a la duración reglamentaria del periodo.";
  }

  return {
    visible: true,
    phase: "playing",
    period: activePeriod,
    periodLabel: periodLabelBase,
    line: text,
    isAdded,
    stoppedClock,
    elapsedSec,
    hint,
    templateKey,
  };
}

/**
 * Minuto y periodo que se envían al API al guardar un evento (según cronómetro actual).
 */
export function computeSuggestedEventMinutePeriod({ isLive, rules, events, nowMs, eventType }) {
  const et = Number(eventType);
  const display = computeMatchClockDisplay({ isLive, rules, events, nowMs });
  const D = rules.periodDurationMin;
  const periodsCount = rules.periodsCount;

  if (!D || !isLive) {
    return { minute: 0, period: 1 };
  }

  if (display.phase === "interval") {
    const ap = display.period ?? 1;
    if (et === EVENT_INICIO_PERIODO) {
      const next = periodsCount ? Math.min(ap + 1, periodsCount) : ap + 1;
      return { minute: 0, period: Math.max(1, next) };
    }
    return { minute: D, period: ap };
  }

  if (display.phase !== "playing") {
    return { minute: 0, period: 1 };
  }

  const elapsedSec = display.elapsedSec ?? 0;
  const minute = Math.floor(elapsedSec / 60);
  const period = display.period ?? 1;
  if (et === EVENT_INICIO_PERIODO) {
    return { minute: 0, period };
  }
  return { minute, period };
}

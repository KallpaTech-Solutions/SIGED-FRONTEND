import React, { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Clock } from "lucide-react";
import {
  BROADCAST_TEMPLATE,
  formatDurationMs,
  getChronoElapsedMs,
  parseSoccerSubstitution,
} from "../../utils/matchBroadcastWidget";
import {
  buildSoccerStatsRows,
  parseStatsPanel,
} from "../../utils/matchBroadcastStatsPanel";

function padScore(n, w = 2) {
  const x = Math.max(0, Math.min(999, Number(n) || 0));
  return String(x).padStart(w, "0");
}

function pad2(n) {
  return String(Math.floor(n)).padStart(2, "0");
}

function formatHms(ms) {
  const d = new Date(ms);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

const ledGreen =
  "font-mono font-black tabular-nums text-emerald-400 [text-shadow:0_0_10px_rgba(52,211,153,0.95),0_0_24px_rgba(16,185,129,0.45)]";
const ledRed =
  "font-mono font-black tabular-nums text-red-400 [text-shadow:0_0_10px_rgba(248,113,113,0.9),0_0_22px_rgba(239,68,68,0.4)]";
const ledAmber =
  "font-mono font-black tabular-nums text-amber-400 [text-shadow:0_0_10px_rgba(251,191,36,0.9),0_0_22px_rgba(245,158,11,0.4)]";
const ledYellow =
  "font-mono font-black tabular-nums text-yellow-300 [text-shadow:0_0_8px_rgba(253,224,71,0.85)]";

/** Una sola cadena para el formato del partido (sin repetir bajo el reloj). */
function formatRegulationBrief(rules) {
  if (!rules?.periodDurationMin || !rules?.periodsCount) return null;
  const d = rules.periodDurationMin;
  const n = rules.periodsCount;
  const parts = Array.from({ length: n }, () => `${d}'`).join(" + ");
  const word = n === 2 ? "dos tiempos" : `${n} periodos`;
  return `${parts} · ${word}`;
}

/** Escudo en tablero: imagen o marcador por defecto si falla la URL. */
function TeamShield({ url, abbrev, sizeClass = "h-12 w-12 md:h-14 md:w-14" }) {
  const [broken, setBroken] = useState(!url);
  useEffect(() => {
    setBroken(!url);
  }, [url]);
  if (!url || broken) {
    return (
      <div
        className={`shrink-0 rounded-xl border border-slate-600/90 bg-slate-800/95 ${sizeClass} flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]`}
        aria-hidden
      >
        <span className="text-[11px] font-black text-slate-500 tracking-tight">
          {abbrev}
        </span>
      </div>
    );
  }
  return (
    <div
      className={`shrink-0 rounded-xl border border-slate-600/60 bg-black overflow-hidden ${sizeClass} shadow-[0_0_12px_rgba(255,255,255,0.06)]`}
    >
      <img
        src={url}
        alt=""
        className="h-full w-full object-cover"
        onError={() => setBroken(true)}
      />
    </div>
  );
}

function BoardShell({ title, subtitle, children }) {
  return (
    <div className="mb-4 rounded-xl border border-slate-700/80 bg-black/85 px-3 py-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          {title}
        </p>
        {subtitle ? (
          <div className="text-[9px] text-slate-500 font-medium shrink-0">{subtitle}</div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function StatsTable({ rows, compact, title, hName, aName }) {
  if (!rows.length) return null;
  const rowCls = compact
    ? "grid grid-cols-[1fr_auto_1fr] gap-1 items-center py-1 text-[10px]"
    : "grid grid-cols-[1fr_auto_1fr] gap-2 items-center py-2 text-xs md:text-sm";
  return (
    <div className={compact ? "" : "mt-1"}>
      {!compact && title ? (
        <p className="text-center font-black italic text-base md:text-lg tracking-wide text-white mb-2">
          {title}
        </p>
      ) : null}
      {!compact && (hName || aName) ? (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
          <span className="rounded-full border border-white/40 bg-black px-2 py-0.5 text-[9px] font-bold uppercase">
            {hName}
          </span>
          <span className="rounded-full border border-white/40 bg-black px-2 py-0.5 text-[9px] font-bold uppercase">
            {aName}
          </span>
        </div>
      ) : null}
      <div
        className={
          compact
            ? "divide-y divide-slate-800 border-t border-b border-slate-800"
            : "divide-y divide-slate-700/90 border-t border-b border-slate-700/90"
        }
      >
        {rows.map((r) => (
          <div key={r.label} className={rowCls}>
            <span
              className={`text-right font-mono font-bold tabular-nums ${
                r.highlight ? "text-yellow-300" : "text-slate-100"
              }`}
            >
              {r.left}
            </span>
            <span className="text-center text-[9px] font-semibold uppercase tracking-wide text-slate-400 px-1">
              {r.label}
            </span>
            <span
              className={`text-left font-mono font-bold tabular-nums ${
                r.highlight ? "text-yellow-300" : "text-slate-100"
              }`}
            >
              {r.right}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Tablero deportivo vitrina. Fútbol: marcador acta, reloj de competencia (reglamento + añadido), estadísticas en tablero.
 */
export function SportBroadcastHero({
  widgetState,
  live,
  homeName,
  awayName,
  homeLogoUrl = "",
  awayLogoUrl = "",
  officialHomeScore,
  officialAwayScore,
  matchClockDisplay = null,
  sportRules = null,
  inPeriodBreak = false,
  /** @type {{ side: 'home'|'away', outName: string, inName: string } | null} */
  substitutionFromActa = null,
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const { template, sport, heroShowChrono, heroShowSystemClock, publicShowMs } =
    widgetState;

  useEffect(() => {
    if (!live) return undefined;
    const id = window.setInterval(() => setNowMs(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [live]);

  const hName = (sport.labelHome || "").trim() || homeName || "Local";
  const aName = (sport.labelAway || "").trim() || awayName || "Visita";
  const homeShieldUrl = (homeLogoUrl || "").trim();
  const awayShieldUrl = (awayLogoUrl || "").trim();
  const chMs = getChronoElapsedMs(widgetState, nowMs);
  const timeStr = formatDurationMs(chMs, publicShowMs);
  const sysClock =
    heroShowSystemClock && (
      <div className="flex items-center gap-1.5 text-[10px] text-sky-300/90 tabular-nums">
        <Clock className="w-3.5 h-3.5" />
        {formatHms(nowMs)}
        {publicShowMs ? (
          <span className="opacity-80">
            .{String(new Date(nowMs).getMilliseconds()).padStart(3, "0")}
          </span>
        ) : null}
      </div>
    );

  if (template === BROADCAST_TEMPLATE.Soccer) {
    const homeScore =
      officialHomeScore != null && Number.isFinite(Number(officialHomeScore))
        ? Number(officialHomeScore)
        : sport.scoreHome;
    const awayScore =
      officialAwayScore != null && Number.isFinite(Number(officialAwayScore))
        ? Number(officialAwayScore)
        : sport.scoreAway;

    const sp = parseStatsPanel(widgetState.statsPanel);
    const statsRows = buildSoccerStatsRows(sp, sport, nowMs);
    const regulationStr = formatRegulationBrief(sportRules);
    const subWidget = parseSoccerSubstitution(widgetState.soccerSubstitution);
    const acta = substitutionFromActa;
    const actaHasName =
      acta &&
      [acta.outName, acta.inName].some(
        (s) => String(s ?? "").trim() && String(s).trim() !== "—"
      );

    let sub;
    if (subWidget.substitutionOverlayHidden) {
      sub = { active: false, side: "home", outName: "", inName: "" };
    } else if (actaHasName) {
      sub = {
        active: true,
        side: acta.side,
        outName: acta.outName,
        inName: acta.inName,
      };
    } else if (subWidget.active && (subWidget.outName || subWidget.inName)) {
      sub = subWidget;
    } else {
      sub = { active: false, side: "home", outName: "", inName: "" };
    }

    const announcedMin = Math.max(
      0,
      Math.min(30, Number(sport.addedMinutesAnnounced) || 0)
    );

    const isFbTemplateKey = (u) =>
      !u.includes("FUTSAL") &&
      (u.includes("FUTBOL") || u.includes("FOOTBALL") || u.includes("SOCCER"));

    const useMatchClock =
      live &&
      matchClockDisplay &&
      matchClockDisplay.visible &&
      (matchClockDisplay.phase === "playing" || matchClockDisplay.phase === "interval");

    /** Reloj competencia sin ancla: mensaje explícito en hint. */
    const matchClockStuckUseMesa =
      useMatchClock &&
      matchClockDisplay?.phase === "playing" &&
      matchClockDisplay.hint &&
      /registrá|inicio de periodo|arrancar el cronómetro/i.test(String(matchClockDisplay.hint));

    /** Competencia calcula 0:00 pero la mesa ya corre o tiene tiempo acumulado (caso típico sin ancla API). */
    const mesaChronoRunning = widgetState.chrono?.running === true;
    const competenciaSigueEnCero =
      useMatchClock &&
      matchClockDisplay?.phase === "playing" &&
      (matchClockDisplay.elapsedSec ?? 0) === 0 &&
      !matchClockDisplay.isAdded;
    const usarRelojMesaPorCompetenciaQuieta =
      competenciaSigueEnCero && (mesaChronoRunning || chMs > 0);

    const preferRelojMesa =
      matchClockStuckUseMesa || usarRelojMesaPorCompetenciaQuieta;

    /** @type {string | null} */
    let clockMain = null;
    /** @type {string | null} */
    let clockHint = null;
    /** Referencia reglamentaria + cartel del árbitro (ej. 20:00 +4) */
    let clockRefereeBanner = null;

    const dMinRules = sportRules?.periodDurationMin;
    const fbClockRules =
      sportRules?.clockDisplayMode === "football" ||
      isFbTemplateKey(String(sportRules?.templateKey ?? "").toUpperCase());

    const setRefereeBannerIfFb = () => {
      if (
        fbClockRules &&
        dMinRules != null &&
        Number.isFinite(dMinRules) &&
        dMinRules > 0
      ) {
        clockRefereeBanner = `${Math.floor(dMinRules)}:00${
          announcedMin > 0 ? `  +${announcedMin}` : ""
        }`;
      }
    };

    if (heroShowChrono) {
      if (useMatchClock && matchClockDisplay) {
        if (matchClockDisplay.phase === "interval") {
          clockMain = matchClockDisplay.line || "Descanso";
          clockHint = matchClockDisplay.hint || "Descanso entre periodos";
        } else if (preferRelojMesa) {
          if (fbClockRules && dMinRules != null && Number.isFinite(dMinRules) && dMinRules > 0) {
            const regMs = dMinRules * 60 * 1000;
            if (chMs > regMs) {
              const addedMs = chMs - regMs;
              setRefereeBannerIfFb();
              clockMain = `+${formatDurationMs(addedMs, publicShowMs)}`;
              clockHint =
                "Descuento transcurrido (el reloj grande). Arriba: tiempo reglamentario y + minutos indicados por el árbitro.";
            } else {
              clockMain = timeStr;
              clockHint = null;
            }
          } else {
            clockMain = timeStr;
            clockHint = null;
          }
        } else {
          clockMain = matchClockDisplay.line || "—";
          if (matchClockDisplay.isAdded) {
            setRefereeBannerIfFb();
            clockHint = matchClockDisplay.hint || "Tiempo añadido";
          } else if (matchClockDisplay.hint) {
            clockHint = matchClockDisplay.hint;
          }
        }
      } else {
        clockMain = timeStr;
        clockHint = null;
      }
    }

    const periodShown = sport.period;

    const boardSubtitle = sysClock ? (
      <div className="flex flex-col items-end gap-0.5 text-right">{sysClock}</div>
    ) : null;

    return (
      <BoardShell title="Tablero · fútbol" subtitle={boardSubtitle}>
        {regulationStr ? (
          <p className="text-[10px] text-center text-amber-200/90 font-semibold mb-2 px-2 leading-snug">
            Formato: {regulationStr}
          </p>
        ) : null}

        {sub.active && (sub.outName || sub.inName) ? (
          <div className="mb-3 rounded-lg border border-white/15 bg-gradient-to-r from-slate-900/95 to-slate-900/80 overflow-hidden">
            <p className="text-[9px] uppercase text-center text-slate-500 tracking-wider py-1 border-b border-white/10">
              Cambio · {sub.side === "home" ? hName : aName}
            </p>
            <div className="grid grid-cols-2 gap-px bg-slate-800/80 text-[11px] leading-tight">
              <div className="flex items-center gap-2 bg-red-950/90 text-red-100 px-2 py-2 min-h-[2.5rem]">
                <ArrowDown className="w-4 h-4 text-red-400 shrink-0" aria-hidden />
                <span className="font-semibold truncate">{sub.outName || "—"}</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-950/90 text-emerald-100 px-2 py-2 min-h-[2.5rem]">
                <ArrowUp className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden />
                <span className="font-semibold truncate">{sub.inName || "—"}</span>
              </div>
            </div>
          </div>
        ) : null}

        {heroShowChrono && clockMain ? (
          <div className="text-center mb-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
              {useMatchClock && matchClockDisplay?.phase === "interval"
                ? "Estado"
                : "Tiempo de juego"}
            </p>
            {clockRefereeBanner ? (
              <p className="text-sm md:text-base font-mono font-black text-amber-200/95 tabular-nums tracking-tight mb-1 px-2">
                {clockRefereeBanner}
              </p>
            ) : null}
            <p className={`text-3xl md:text-4xl ${ledRed}`}>{clockMain}</p>
            {clockHint ? (
              <p className="text-[10px] text-slate-400 mt-1 leading-snug px-1">{clockHint}</p>
            ) : null}
          </div>
        ) : null}

        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end mb-3">
          <div className="flex flex-col items-center gap-2 min-w-0">
            <TeamShield url={homeShieldUrl} abbrev="LOC" />
            <p
              className={`text-center text-xs md:text-sm font-bold uppercase tracking-wide ${ledRed} !text-sm md:!text-base line-clamp-2 w-full`}
            >
              {hName}
            </p>
          </div>
          <div className="text-center px-2 self-end pb-1">
            <p className="text-[9px] uppercase text-slate-500 mb-0.5">Periodo</p>
            <p className={`text-xl ${ledYellow}`}>{periodShown}</p>
          </div>
          <div className="flex flex-col items-center gap-2 min-w-0">
            <TeamShield url={awayShieldUrl} abbrev="VIS" />
            <p
              className={`text-center text-xs md:text-sm font-bold uppercase tracking-wide ${ledRed} !text-sm md:!text-base line-clamp-2 w-full`}
            >
              {aName}
            </p>
          </div>
        </div>

        <div className="text-center mb-3 py-2 border-y border-slate-800/80">
          <p className="text-[9px] uppercase text-slate-500 mb-1">Marcador (acta)</p>
          <p className={`text-3xl md:text-4xl ${ledGreen}`}>
            {padScore(homeScore)} <span className="text-slate-600">—</span> {padScore(awayScore)}
          </p>
        </div>

        {sp.enabled && statsRows.length > 0 ? (
          <details
            className="group mb-3 rounded-lg border border-slate-700/90 bg-slate-950/40 overflow-hidden"
            defaultOpen={inPeriodBreak}
          >
            <summary className="cursor-pointer list-none flex items-center justify-center gap-2 px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 transition-colors">
              <ChevronDown className="w-4 h-4 shrink-0 transition-transform group-open:rotate-180 text-slate-500" />
              Estadísticas (desplegar / cerrar)
            </summary>
            <div className="border-t border-slate-800/80 px-1 pb-3 pt-2">
              <StatsTable
                rows={statsRows}
                compact={false}
                title=""
                hName=""
                aName=""
              />
            </div>
          </details>
        ) : null}

        {!sp.enabled ? (
          <div className="mt-3 border-t border-slate-800 pt-3">
            <p className="text-[9px] uppercase tracking-wider text-slate-500 text-center mb-2">
              Corners · tiros libres
            </p>
            <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
              <div>
                <p className="text-slate-500 mb-0.5">Corners</p>
                <p className={`text-base ${ledAmber}`}>
                  {sport.cornersHome} · {sport.cornersAway}
                </p>
              </div>
              <div>
                <p className="text-slate-500 mb-0.5">T. libres</p>
                <p className={`text-base ${ledAmber}`}>
                  {sport.freeKicksHome} · {sport.freeKicksAway}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </BoardShell>
    );
  }

  if (template === BROADCAST_TEMPLATE.Futsal) {
    return (
      <BoardShell title="Tablero · futsal" subtitle={sysClock || undefined}>
        {heroShowChrono ? (
          <div className="text-center mb-2">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
              Tiempo
            </p>
            <p className={`text-3xl md:text-4xl ${ledRed}`}>{timeStr}</p>
          </div>
        ) : null}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end mb-2">
          <p className="text-center text-xs font-bold uppercase text-red-300/90 line-clamp-2">
            {hName}
          </p>
          <div className="text-center px-2">
            <p className="text-[9px] uppercase text-slate-500">Per.</p>
            <p className={`text-lg ${ledYellow}`}>{sport.period}</p>
          </div>
          <p className="text-center text-xs font-bold uppercase text-red-300/90 line-clamp-2">
            {aName}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-center mb-2">
          <p className={`text-4xl ${ledGreen}`}>{padScore(sport.scoreHome)}</p>
          <p className={`text-4xl ${ledGreen}`}>{padScore(sport.scoreAway)}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-center border-t border-slate-800 pt-2">
          <div>
            <p className="text-[9px] uppercase text-slate-500">Faltas</p>
            <p className={`text-2xl ${ledAmber}`}>{padScore(sport.foulsHome, 2)}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase text-slate-500">Faltas</p>
            <p className={`text-2xl ${ledAmber}`}>{padScore(sport.foulsAway, 2)}</p>
          </div>
        </div>
      </BoardShell>
    );
  }

  if (template === BROADCAST_TEMPLATE.Basketball) {
    return (
      <BoardShell title="Tablero · básquet" subtitle={sysClock || undefined}>
        <div className="grid grid-cols-2 gap-2 text-center text-[11px] font-bold uppercase text-slate-400 mb-2">
          <span className="truncate px-1">{hName}</span>
          <span className="truncate px-1">{aName}</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-3">
          <p className={`text-center text-4xl md:text-5xl ${ledGreen}`}>
            {padScore(sport.scoreHome, 3)}
          </p>
          <div className="text-center px-1">
            <p className="text-[9px] uppercase text-slate-500">Periodo</p>
            <p className={`text-2xl ${ledAmber}`}>{sport.period}</p>
          </div>
          <p className={`text-center text-4xl md:text-5xl ${ledGreen}`}>
            {padScore(sport.scoreAway, 3)}
          </p>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="text-center">
            <p className="text-[9px] uppercase text-slate-500">Faltas</p>
            <p className={`text-2xl ${ledAmber}`}>{padScore(sport.foulsHome, 2)}</p>
          </div>
          <div className="text-center">
            {heroShowChrono ? (
              <>
                <p className="text-[9px] uppercase text-slate-500">Reloj</p>
                <p className={`text-3xl md:text-4xl ${ledAmber}`}>{timeStr}</p>
              </>
            ) : (
              <p className="text-slate-600 text-xs py-4">—</p>
            )}
          </div>
          <div className="text-center">
            <p className="text-[9px] uppercase text-slate-500">Faltas</p>
            <p className={`text-2xl ${ledAmber}`}>{padScore(sport.foulsAway, 2)}</p>
          </div>
        </div>
        <div className="mt-2 text-center border-t border-slate-800 pt-2">
          <p className="text-[9px] uppercase text-slate-500 mb-0.5">Tiempo de tiro</p>
          <p className={`text-2xl ${ledRed}`}>{padScore(sport.shotSec, 2)}</p>
        </div>
      </BoardShell>
    );
  }

  if (template === BROADCAST_TEMPLATE.Volleyball) {
    return (
      <BoardShell title="Tablero · vóley" subtitle={sysClock || undefined}>
        {heroShowChrono ? (
          <div className="text-center mb-2">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
              Tiempo
            </p>
            <p className={`text-2xl md:text-3xl ${ledGreen}`}>{timeStr}</p>
          </div>
        ) : null}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end mb-2">
          <div className="text-center">
            <p className="text-[9px] uppercase text-slate-500 mb-0.5">Local</p>
            <p className={`text-3xl md:text-4xl ${ledRed}`}>
              {padScore(sport.scoreHome)}
            </p>
          </div>
          <div className="text-center px-2">
            <p className="text-[9px] uppercase text-slate-500">Set</p>
            <p className={`text-xl ${ledYellow}`}>{sport.period}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] uppercase text-slate-500 mb-0.5">Visita</p>
            <p className={`text-3xl md:text-4xl ${ledRed}`}>
              {padScore(sport.scoreAway)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
          <p className={`text-center text-xl ${ledGreen}`}>{sport.setsHome}</p>
          <div className="flex flex-col items-center gap-1">
            <p className="text-[9px] uppercase text-slate-500">Saque</p>
            <div className="flex gap-3">
              <span
                className={`h-3 w-3 rounded-full border border-red-500/50 ${
                  sport.serveHome ? "bg-red-500 shadow-[0_0_10px_#ef4444]" : "bg-slate-800"
                }`}
                title="Local"
              />
              <span
                className={`h-3 w-3 rounded-full border border-red-500/50 ${
                  !sport.serveHome ? "bg-red-500 shadow-[0_0_10px_#ef4444]" : "bg-slate-800"
                }`}
                title="Visita"
              />
            </div>
          </div>
          <p className={`text-center text-xl ${ledGreen}`}>{sport.setsAway}</p>
        </div>
        <p className="text-[9px] text-center text-slate-600 mt-2">
          Sets ganados · puntos del set actual
        </p>
      </BoardShell>
    );
  }

  return null;
}

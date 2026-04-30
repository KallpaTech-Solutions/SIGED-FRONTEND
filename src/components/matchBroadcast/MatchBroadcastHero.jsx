import React, { useEffect, useState } from "react";
import { Clock, Hourglass, Timer } from "lucide-react";
import {
  BROADCAST_TEMPLATE,
  formatDurationMs,
  getChronoElapsedMs,
  getCountdownRemainingMs,
} from "../../utils/matchBroadcastWidget";
import { SportBroadcastHero } from "./SportBroadcastHero";

function pad2(n) {
  return String(Math.floor(n)).padStart(2, "0");
}

function formatHms(ms) {
  const d = new Date(ms);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

/**
 * Vitrina: plantilla «time» (tiempos) o tablero deportivo según `widgetState.template`.
 * Props opcionales en fútbol: marcador acta, penales (totales + tanda ✓/✗ desde acta), reloj, reglamento, entretiempo.
 */
export function MatchBroadcastHero({
  widgetState,
  live,
  homeName = "",
  awayName = "",
  homeLogoUrl = "",
  awayLogoUrl = "",
  officialHomeScore,
  officialAwayScore,
  matchClockDisplay = null,
  sportRules = null,
  inPeriodBreak = false,
  substitutionFromActa = null,
  officialPenaltyHome = null,
  officialPenaltyAway = null,
  penaltyShootoutHome = null,
  penaltyShootoutAway = null,
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!live) return undefined;
    const id = window.setInterval(() => setNowMs(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [live]);

  if (widgetState.template && widgetState.template !== BROADCAST_TEMPLATE.Time) {
    return (
      <SportBroadcastHero
        widgetState={widgetState}
        live={live}
        homeName={homeName}
        awayName={awayName}
        homeLogoUrl={homeLogoUrl}
        awayLogoUrl={awayLogoUrl}
        officialHomeScore={officialHomeScore}
        officialAwayScore={officialAwayScore}
        matchClockDisplay={matchClockDisplay}
        sportRules={sportRules}
        inPeriodBreak={inPeriodBreak}
        substitutionFromActa={substitutionFromActa}
        officialPenaltyHome={officialPenaltyHome}
        officialPenaltyAway={officialPenaltyAway}
        penaltyShootoutHome={penaltyShootoutHome}
        penaltyShootoutAway={penaltyShootoutAway}
      />
    );
  }

  const {
    heroShowChrono,
    heroShowSystemClock,
    heroShowCountdown,
    publicShowMs,
  } = widgetState;

  const any = heroShowChrono || heroShowSystemClock || heroShowCountdown;
  if (!any) return null;

  const chMs = getChronoElapsedMs(widgetState, nowMs);
  const cdMs = getCountdownRemainingMs(widgetState, nowMs);
  const showMs = publicShowMs;

  return (
    <div className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-950/40 px-4 py-3 text-emerald-50 space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200/80">
        Transmisión · tiempos (control mesa)
      </p>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        {heroShowSystemClock && (
          <div className="flex items-center gap-2 min-w-[7rem]">
            <Clock className="w-5 h-5 shrink-0 text-sky-300" />
            <div>
              <p className="text-[10px] uppercase text-sky-200/80 font-bold">Reloj</p>
              <p className="text-xl font-mono font-bold tabular-nums text-white">
                {formatHms(nowMs)}
                {showMs ? (
                  <span className="text-sm text-sky-200/90">
                    .{String(new Date(nowMs).getMilliseconds()).padStart(3, "0")}
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        )}
        {heroShowChrono && (
          <div className="flex items-center gap-2 min-w-[7rem]">
            <Timer className="w-5 h-5 shrink-0 text-emerald-300" />
            <div>
              <p className="text-[10px] uppercase text-emerald-200/80 font-bold">Cronómetro</p>
              <p className="text-xl font-mono font-bold tabular-nums text-white">
                {formatDurationMs(chMs, showMs)}
              </p>
            </div>
          </div>
        )}
        {heroShowCountdown && (
          <div className="flex items-center gap-2 min-w-[7rem]">
            <Hourglass className="w-5 h-5 shrink-0 text-amber-300" />
            <div>
              <p className="text-[10px] uppercase text-amber-200/80 font-bold">Cuenta regresiva</p>
              <p className="text-xl font-mono font-bold tabular-nums text-white">
                {formatDurationMs(cdMs, showMs)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

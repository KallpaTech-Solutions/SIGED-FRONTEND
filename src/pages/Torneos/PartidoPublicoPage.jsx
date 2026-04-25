import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Loader2,
  ChevronLeft,
  Radio,
  Clock,
  ListOrdered,
  Pause,
  VideoOff,
  StopCircle,
  ClipboardPlus,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  fetchMatchPublicDetailEnriched,
  fetchPublicTeamRoster,
  fetchVenues,
} from "../../api/tournamentsPublicService";
import {
  MATCH_EVENT_TYPE,
  MATCH_STATUS,
  deleteMatchEvent,
  patchMatchEvent,
  patchMatchFinish,
  patchMatchSchedule,
  patchMatchStatus,
  postMatchEvent,
} from "../../api/matchesControlService";
import { MatchBroadcastHero } from "../../components/matchBroadcast/MatchBroadcastHero";
import { MatchBroadcastMesaControls } from "../../components/matchBroadcast/MatchBroadcastMesaControls";
import { ZonaHorariaWidget } from "../../components/dev/ZonaHorariaWidget";
import { ZonaHorariaPublicBanner } from "../../components/dev/ZonaHorariaPublicBanner";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import { useMatchPublicDetailHub } from "../../hooks/useMatchPublicDetailHub";
import {
  isTournamentActivoCompetencia,
  tournamentPublicLabel,
} from "../../utils/tournamentPublicStatus";
import {
  BROADCAST_TEMPLATE,
  eventMinutePeriodFromBroadcastWidget,
  parseMatchBroadcastWidgetFromDetail,
} from "../../utils/matchBroadcastWidget";
import { isPublicMatchInPeriodBreak } from "../../utils/matchBroadcastPeriodBreak";
import {
  computeMatchClockDisplay,
  parseSportRulesFromDetail,
} from "../../utils/matchClock";
import { lastSubstitutionFromEvents } from "../../utils/matchSubstitutionFromEvents";

function eventTypeLabel(type) {
  const t = String(type ?? "");
  const map = {
    Goal: "Gol",
    Puntaje: "Punto",
    PenaltyGoal: "Penal",
    TarjetaAmarilla: "Tarjeta amarilla",
    TarjetaRoja: "Tarjeta roja",
    Sustitucion: "Cambio",
    Falta: "Falta",
    Offside: "Fuera de juego",
    Tiro: "Tiro",
    TiroAPuerta: "Tiro a puerta",
    InicioPeriodo: "Inicio de periodo",
    FinPeriodo: "Fin de periodo",
  };
  return map[t] ?? t.replace(/([A-Z])/g, " $1").trim();
}

function statusLabel(s) {
  const x = String(s ?? "");
  const map = {
    Programado: "Programado",
    EnVivo: "En vivo",
    Finalizado: "Finalizado",
    Suspendido: "Suspendido",
    0: "Programado",
    1: "En vivo",
    2: "Finalizado",
    3: "Suspendido",
  };
  return map[x] ?? map[Number(x)] ?? x;
}

function isLiveStatus(s) {
  if (s === 1) return true;
  const x = String(s ?? "").trim();
  if (x === "1") return true;
  const norm = x.replace(/\s+/g, "");
  return norm === "EnVivo" || norm.toLowerCase() === "envivo";
}

function isFinalStatus(s) {
  const x = String(s ?? "");
  return x === "Finalizado" || x === "2" || s === 2;
}

function isSuspendedStatus(s) {
  const x = String(s ?? "");
  return x === "Suspendido" || x === "3" || s === 3;
}

function detailTeamIds(d) {
  if (!d) return { localId: null, visitorId: null };
  return {
    localId: d.localTeamId ?? d.LocalTeamId ?? null,
    visitorId: d.visitorTeamId ?? d.VisitorTeamId ?? null,
  };
}

const EVENT_TYPE_OPTIONS = [
  { value: MATCH_EVENT_TYPE.Goal, label: "Gol" },
  { value: MATCH_EVENT_TYPE.Puntaje, label: "Punto / canasta (valor configurable)" },
  { value: MATCH_EVENT_TYPE.PenaltyGoal, label: "Penal" },
  { value: MATCH_EVENT_TYPE.TarjetaAmarilla, label: "Tarjeta amarilla" },
  { value: MATCH_EVENT_TYPE.TarjetaRoja, label: "Tarjeta roja" },
  { value: MATCH_EVENT_TYPE.Sustitucion, label: "Sustitución" },
  { value: MATCH_EVENT_TYPE.Falta, label: "Falta" },
  { value: MATCH_EVENT_TYPE.Offside, label: "Fuera de juego" },
  { value: MATCH_EVENT_TYPE.Tiro, label: "Tiro (estadística)" },
  { value: MATCH_EVENT_TYPE.TiroAPuerta, label: "Tiro a puerta" },
  { value: MATCH_EVENT_TYPE.InicioPeriodo, label: "Inicio de periodo" },
  { value: MATCH_EVENT_TYPE.FinPeriodo, label: "Fin de periodo" },
];

function eventTypeUsesScoreValue(type) {
  const t = Number(type);
  return t === MATCH_EVENT_TYPE.Goal || t === MATCH_EVENT_TYPE.Puntaje;
}

function eventTypeFromApi(evType) {
  if (typeof evType === "number" && Number.isFinite(evType)) return evType;
  const s = String(evType ?? "");
  const map = {
    Goal: MATCH_EVENT_TYPE.Goal,
    Puntaje: MATCH_EVENT_TYPE.Puntaje,
    PenaltyGoal: MATCH_EVENT_TYPE.PenaltyGoal,
    TarjetaAmarilla: MATCH_EVENT_TYPE.TarjetaAmarilla,
    TarjetaRoja: MATCH_EVENT_TYPE.TarjetaRoja,
    Sustitucion: MATCH_EVENT_TYPE.Sustitucion,
    Falta: MATCH_EVENT_TYPE.Falta,
    Offside: MATCH_EVENT_TYPE.Offside,
    Tiro: MATCH_EVENT_TYPE.Tiro,
    TiroAPuerta: MATCH_EVENT_TYPE.TiroAPuerta,
    InicioPeriodo: MATCH_EVENT_TYPE.InicioPeriodo,
    FinPeriodo: MATCH_EVENT_TYPE.FinPeriodo,
  };
  return map[s] ?? 0;
}

/** Fecha “fantasma” de .NET (DateTime.MinValue) u otra sentinela: no programación real. */
function isPlaceholderScheduledDate(iso) {
  if (iso == null || iso === "") return true;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return true;
  return d.getFullYear() < 1900;
}

/** Valor para input type="datetime-local" (exige año yyyy de 4 dígitos; evita "1-01-01T00:00"). */
function scheduledAtToDatetimeLocal(iso) {
  if (isPlaceholderScheduledDate(iso)) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  return `${String(y).padStart(4, "0")}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Cuerpo JSON para PATCH schedule: misma hora de reloj que el usuario eligió.
 * Evita toISOString() (UTC), que desplazaba +5 h respecto a Perú al re-mostrar.
 */
function datetimeLocalToScheduleApiString(localValue) {
  const s = String(localValue ?? "").trim();
  if (!s) return null;
  if (s.length === 16) return `${s}:00`;
  if (s.length === 19) return s;
  return null;
}

export default function PartidoPublicoPage() {
  const { matchId } = useParams();
  const { can } = useAuth();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const canMatchControl = can("tourn.match.control");
  const canBroadcastWidgets = can("tourn.match.widgets");
  const canManageTourn = can("tourn.manage");
  /** Mesa / admin: API con JWT evita 404 del endpoint público (p. ej. IsActive). */
  const preferMesaDetail =
    canMatchControl || canManageTourn || canBroadcastWidgets;

  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mesaBusy, setMesaBusy] = useState(false);

  const [eventBusy, setEventBusy] = useState(false);
  const [eventEditBusy, setEventEditBusy] = useState(false);
  const [eventForm, setEventForm] = useState({
    type: MATCH_EVENT_TYPE.Goal,
    teamSide: "local",
    value: 0,
    note: "",
    playerId: "",
    relatedPlayerId: "",
  });
  const [roster, setRoster] = useState([]);
  const [homeRoster, setHomeRoster] = useState([]);
  const [awayRoster, setAwayRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [dualRosterLoading, setDualRosterLoading] = useState(false);
  /** @type {null | { id: string, numericType: number, playerId: string, relatedPlayerId: string, note: string, teamId: string }} */
  const [eventEditDraft, setEventEditDraft] = useState(null);

  const [venues, setVenues] = useState([]);
  const [scheduleBusy, setScheduleBusy] = useState(false);
  const [scheduleVenueId, setScheduleVenueId] = useState("");
  const [scheduleDatetimeLocal, setScheduleDatetimeLocal] = useState("");
  const scheduleInitForMatchRef = useRef(null);

  const reloadDetail = useCallback(async () => {
    if (!matchId) return;
    try {
      const d = await fetchMatchPublicDetailEnriched(matchId, {
        preferMesaDetail,
      });
      setDetail(d);
    } catch {
      toast("No se pudo actualizar el partido.", "error");
    }
  }, [matchId, preferMesaDetail, toast]);

  /** Polling suave para vitrina (sin JWT): mismo criterio que ZonaHoraria si SignalR falla o se pierde un mensaje. */
  const pollDetailQuiet = useCallback(async () => {
    if (!matchId) return;
    try {
      const d = await fetchMatchPublicDetailEnriched(matchId, {
        preferMesaDetail,
      });
      setDetail(d);
    } catch {
      /* sin toast: evita spam en fondo */
    }
  }, [matchId, preferMesaDetail]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!matchId) return;
      setLoading(true);
      setError(null);
      try {
        const d = await fetchMatchPublicDetailEnriched(matchId, {
          preferMesaDetail,
        });
        if (!cancelled) setDetail(d);
      } catch (e) {
        if (!cancelled) {
          setError(
            e?.response?.status === 404
              ? "No encontramos este partido o no está disponible."
              : "No se pudo cargar el partido."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [matchId, preferMesaDetail]);

  const hubOk = !loading && !error && !!detail;
  useMatchPublicDetailHub(matchId, hubOk, setDetail, preferMesaDetail);

  const events = detail?.events ?? detail?.Events ?? [];
  const statusRaw = detail?.status ?? detail?.Status;
  const live = detail && isLiveStatus(statusRaw);

  useEffect(() => {
    if (!hubOk || !live || preferMesaDetail) return undefined;
    const id = window.setInterval(() => void pollDetailQuiet(), 8000);
    return () => window.clearInterval(id);
  }, [hubOk, live, preferMesaDetail, pollDetailQuiet]);

  const [eventClockMs, setEventClockMs] = useState(() => Date.now());
  const broadcastWidgetState = useMemo(
    () => parseMatchBroadcastWidgetFromDetail(detail),
    [detail]
  );

  useEffect(() => {
    if (!live) return undefined;
    const tick = () => setEventClockMs(Date.now());
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [live]);

  /** Al volver a la pestaña o recuperar red, refrescar detalle + eventos (otra máquina pudo cargar datos). */
  useEffect(() => {
    if (!live || !matchId) return undefined;
    const sync = () => {
      if (document.visibilityState !== "visible") return;
      reloadDetail();
    };
    const onOnline = () => reloadDetail();
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("online", onOnline);
    };
  }, [live, matchId, reloadDetail]);

  const eventTiming = useMemo(
    () => eventMinutePeriodFromBroadcastWidget(broadcastWidgetState, eventClockMs),
    [broadcastWidgetState, eventClockMs]
  );

  const inPeriodBreak = useMemo(
    () => isPublicMatchInPeriodBreak(!!live, events),
    [live, events]
  );

  const sportRules = useMemo(() => parseSportRulesFromDetail(detail), [detail]);

  const matchClockDisplay = useMemo(
    () =>
      computeMatchClockDisplay({
        isLive: !!live,
        rules: sportRules,
        events,
        nowMs: eventClockMs,
        clockAccumulatedSeconds:
          detail?.clockAccumulatedSeconds ?? detail?.ClockAccumulatedSeconds,
        clockPeriodAnchorUtc:
          detail?.clockPeriodAnchorUtc ?? detail?.ClockPeriodAnchorUtc,
        clockWidgetKind: detail?.clockWidgetKind ?? detail?.ClockWidgetKind,
      }),
    [live, sportRules, events, eventClockMs, detail]
  );

  const broadcastWidgetForVitrina = useMemo(() => {
    const w = broadcastWidgetState;
    if (!detail || w.template !== BROADCAST_TEMPLATE.Soccer) return w;
    const lh = Number(detail.localScore ?? detail.LocalScore ?? 0);
    const va = Number(detail.visitorScore ?? detail.VisitorScore ?? 0);
    return { ...w, sport: { ...w.sport, scoreHome: lh, scoreAway: va } };
  }, [broadcastWidgetState, detail]);

  const finished = detail && isFinalStatus(statusRaw);
  const suspended = detail && isSuspendedStatus(statusRaw);
  const tournamentStatusRaw =
    detail?.tournamentStatus ??
    detail?.TournamentStatus ??
    detail?.tournamentStatusName ??
    detail?.TournamentStatusName;
  const mesaTransmissionEnabled =
    !!detail && isTournamentActivoCompetencia(tournamentStatusRaw);

  const { localId, visitorId } = detailTeamIds(detail);
  const selectedTeamId =
    eventForm.teamSide === "local" ? localId : visitorId;

  useEffect(() => {
    if (!canMatchControl || !live || finished || !selectedTeamId) {
      setRoster([]);
      return;
    }
    let cancelled = false;
    setRosterLoading(true);
    (async () => {
      try {
        const team = await fetchPublicTeamRoster(selectedTeamId);
        const players = team?.players ?? team?.Players ?? [];
        if (!cancelled) setRoster(Array.isArray(players) ? players : []);
      } catch {
        if (!cancelled) setRoster([]);
      } finally {
        if (!cancelled) setRosterLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canMatchControl, live, finished, selectedTeamId]);

  useEffect(() => {
    if (!canMatchControl || !live || finished || !localId || !visitorId) {
      setHomeRoster([]);
      setAwayRoster([]);
      return;
    }
    let cancelled = false;
    setDualRosterLoading(true);
    (async () => {
      try {
        const [homeTeam, awayTeam] = await Promise.all([
          fetchPublicTeamRoster(localId),
          fetchPublicTeamRoster(visitorId),
        ]);
        const h = homeTeam?.players ?? homeTeam?.Players ?? [];
        const a = awayTeam?.players ?? awayTeam?.Players ?? [];
        if (!cancelled) {
          setHomeRoster(Array.isArray(h) ? h : []);
          setAwayRoster(Array.isArray(a) ? a : []);
        }
      } catch {
        if (!cancelled) {
          setHomeRoster([]);
          setAwayRoster([]);
        }
      } finally {
        if (!cancelled) setDualRosterLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canMatchControl, live, finished, localId, visitorId]);

  const substitutionFromActa = useMemo(
    () => lastSubstitutionFromEvents(events, localId, visitorId),
    [events, localId, visitorId]
  );

  const homeEvents = useMemo(() => {
    if (!localId) return [];
    const id = String(localId);
    return events.filter((ev) => String(ev.teamId ?? ev.TeamId ?? "") === id);
  }, [events, localId]);

  const awayEvents = useMemo(() => {
    if (!visitorId) return [];
    const id = String(visitorId);
    return events.filter((ev) => String(ev.teamId ?? ev.TeamId ?? "") === id);
  }, [events, visitorId]);

  const eventsSinEquipo = useMemo(() => {
    const known = new Set(
      [localId, visitorId].filter(Boolean).map((x) => String(x))
    );
    return events.filter((ev) => {
      const tid = String(ev.teamId ?? ev.TeamId ?? "");
      return tid !== "" && !known.has(tid);
    });
  }, [events, localId, visitorId]);

  useEffect(() => {
    scheduleInitForMatchRef.current = null;
  }, [matchId]);

  useEffect(() => {
    if (!canMatchControl || !matchId) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchVenues();
        if (!cancelled) setVenues(list);
      } catch {
        if (!cancelled) setVenues([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canMatchControl, matchId]);

  useEffect(() => {
    if (!detail || String(detail.id ?? detail.Id) !== String(matchId)) return;
    if (scheduleInitForMatchRef.current === matchId) return;
    scheduleInitForMatchRef.current = matchId;
    const vid = detail.venueId ?? detail.VenueId;
    setScheduleVenueId(vid ? String(vid) : "");
    setScheduleDatetimeLocal(
      scheduledAtToDatetimeLocal(detail.scheduledAt ?? detail.ScheduledAt)
    );
  }, [detail, matchId]);

  const handleGoLive = async () => {
    if (!matchId || mesaBusy) return;
    setMesaBusy(true);
    try {
      await patchMatchStatus(matchId, MATCH_STATUS.EnVivo);
      toast("Transmisión en vivo activada. La vitrina actualizará el listado.", "success");
      await reloadDetail();
    } catch (e) {
      toast(
        e?.response?.data?.message ||
          e?.response?.data ||
          "No se pudo poner el partido en vivo.",
        "error"
      );
    } finally {
      setMesaBusy(false);
    }
  };

  const handlePauseTransmission = async () => {
    if (!matchId || mesaBusy) return;
    const ok = await confirm({
      title: "Pausar transmisión",
      message:
        "El partido deja de estar en vivo y vuelve a Programado. ¿Confirmás?",
      confirmText: "Pausar",
      variant: "default",
    });
    if (!ok) return;
    setMesaBusy(true);
    try {
      await patchMatchStatus(matchId, MATCH_STATUS.Programado);
      toast("Transmisión pausada. El partido quedó programado.", "success");
      await reloadDetail();
    } catch (e) {
      toast(
        e?.response?.data?.message ||
          "No se pudo actualizar el estado.",
        "error"
      );
    } finally {
      setMesaBusy(false);
    }
  };

  const handleEndTransmission = async () => {
    if (!matchId || mesaBusy) return;
    const ok = await confirm({
      title: "Finalizar transmisión",
      message:
        "Se corta la transmisión en vivo y el partido pasa a Suspendido (sin cerrar el marcador ni la planilla). Usá «Finalizar partido» cuando el encuentro termine de verdad.",
      confirmText: "Finalizar transmisión",
      variant: "warning",
    });
    if (!ok) return;
    setMesaBusy(true);
    try {
      await patchMatchStatus(matchId, MATCH_STATUS.Suspendido);
      toast("Transmisión finalizada. Partido en estado suspendido.", "success");
      await reloadDetail();
    } catch (e) {
      toast(
        e?.response?.data?.message ||
          "No se pudo finalizar la transmisión.",
        "error"
      );
    } finally {
      setMesaBusy(false);
    }
  };

  const handleFinish = async () => {
    if (!matchId || mesaBusy) return;
    const ok = await confirm({
      title: "Finalizar partido",
      message:
        "Se cerrará el partido con el marcador actual y se actualizarán tablas si aplica. ¿Continuar?",
      confirmText: "Finalizar",
      variant: "danger",
    });
    if (!ok) return;
    setMesaBusy(true);
    try {
      await patchMatchFinish(matchId);
      toast("Partido finalizado.", "success");
      await reloadDetail();
    } catch (e) {
      toast(
        e?.response?.data?.message ||
          e?.response?.data ||
          "No se pudo finalizar el partido.",
        "error"
      );
    } finally {
      setMesaBusy(false);
    }
  };

  const handleRegisterEvent = async (e) => {
    e.preventDefault();
    if (!matchId || eventBusy || !live || finished) return;
    const { minute: minuteNum, period: periodNum } = eventTiming;
    if (!selectedTeamId) {
      toast("Faltan los equipos en el partido para registrar el evento.", "error");
      return;
    }
    let valueNum = 0;
    if (eventTypeUsesScoreValue(eventForm.type)) {
      valueNum = Number(eventForm.value);
      if (!Number.isFinite(valueNum) || valueNum < 0 || valueNum > 100) {
        toast("El valor a sumar al marcador debe estar entre 0 y 100.", "error");
        return;
      }
    }
    const payload = {
      minute: Math.floor(minuteNum),
      type: Number(eventForm.type),
      teamId: selectedTeamId,
      period: Math.floor(periodNum),
      value: valueNum,
      note: eventForm.note?.trim() ? eventForm.note.trim() : null,
      playerId: eventForm.playerId ? eventForm.playerId : null,
    };
    if (Number(eventForm.type) === MATCH_EVENT_TYPE.Sustitucion) {
      payload.relatedPlayerId = eventForm.relatedPlayerId
        ? eventForm.relatedPlayerId
        : null;
    }
    setEventBusy(true);
    try {
      await postMatchEvent(matchId, payload);
      toast("Evento registrado. Marcador y cronología actualizados.", "success");
      setEventForm((f) => ({
        ...f,
        note: "",
        playerId: "",
        relatedPlayerId: "",
        value: 0,
      }));
      await reloadDetail();
    } catch (err) {
      toast(
        err?.response?.data?.message ||
          err?.response?.data ||
          "No se pudo registrar el evento.",
        "error"
      );
    } finally {
      setEventBusy(false);
    }
  };

  const handleSaveEventEdit = async (e) => {
    e.preventDefault();
    if (!eventEditDraft?.id || eventEditBusy) return;
    setEventEditBusy(true);
    try {
      const body = {
        playerId: eventEditDraft.playerId || null,
        note: eventEditDraft.note?.trim() ? eventEditDraft.note.trim() : null,
      };
      if (eventEditDraft.numericType === MATCH_EVENT_TYPE.Sustitucion) {
        body.relatedPlayerId = eventEditDraft.relatedPlayerId || null;
      }
      await patchMatchEvent(eventEditDraft.id, body);
      toast("Evento actualizado.", "success");
      setEventEditDraft(null);
      await reloadDetail();
    } catch (err) {
      toast(
        err?.response?.data?.message ||
          err?.response?.data ||
          "No se pudo actualizar el evento.",
        "error"
      );
    } finally {
      setEventEditBusy(false);
    }
  };

  const handleDeleteEvent = async (ev) => {
    const eid = ev?.id ?? ev?.Id;
    if (!eid || eventBusy || eventEditBusy) return;
    const ok = await confirm({
      title: "Anular evento",
      message:
        "Se elimina del acta y, si era gol o punto, se corrige el marcador. ¿Continuar?",
      confirmText: "Anular",
      variant: "danger",
    });
    if (!ok) return;
    setEventBusy(true);
    try {
      await deleteMatchEvent(String(eid));
      toast("Evento anulado.", "success");
      setEventEditDraft(null);
      await reloadDetail();
    } catch (err) {
      toast(
        err?.response?.data?.message ||
          err?.response?.data ||
          "No se pudo anular el evento.",
        "error"
      );
    } finally {
      setEventBusy(false);
    }
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!matchId || scheduleBusy || finished) return;
    if (!scheduleVenueId) {
      toast("Elegí una sede (cancha / estadio).", "error");
      return;
    }
    if (!scheduleDatetimeLocal?.trim()) {
      toast("Indicá fecha y hora del partido.", "error");
      return;
    }
    const wallClock = datetimeLocalToScheduleApiString(scheduleDatetimeLocal);
    if (!wallClock || Number.isNaN(new Date(scheduleDatetimeLocal).getTime())) {
      toast("La fecha u hora no es válida.", "error");
      return;
    }
    setScheduleBusy(true);
    try {
      await patchMatchSchedule(matchId, scheduleVenueId, wallClock);
      toast("Fecha, hora y sede guardadas.", "success");
      await reloadDetail();
    } catch (err) {
      toast(
        err?.response?.data?.message ||
          err?.response?.data ||
          "No se pudo guardar la programación.",
        "error"
      );
    } finally {
      setScheduleBusy(false);
    }
  };

  const renderEventRow = (ev) => {
    const eid = ev.id ?? ev.Id;
    const isSub =
      eventTypeFromApi(ev.type ?? ev.Type) === MATCH_EVENT_TYPE.Sustitucion;
    return (
      <li
        key={eid}
        className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm shadow-sm"
      >
        <span className="text-[11px] font-mono font-bold text-slate-400 shrink-0">
          {ev.period ? `P${ev.period}` : ""} {ev.minute != null ? `${ev.minute}′` : "—"}
        </span>
        <span className="font-semibold text-emerald-800 shrink-0">
          {eventTypeLabel(ev.type)}
        </span>
        <span className="text-slate-700">{ev.teamName}</span>
        {isSub ? (
          <span className="text-slate-600 text-xs">
            Sale: {ev.playerName || "—"} · Entra:{" "}
            {(ev.relatedPlayerName ?? ev.RelatedPlayerName) || "—"}
          </span>
        ) : (
          ev.playerName && <span className="text-slate-600">· {ev.playerName}</span>
        )}
        {ev.value > 1 && (
          <span className="text-xs text-slate-500">(×{ev.value})</span>
        )}
        {ev.note && (
          <span className="text-slate-500 w-full text-xs italic">{ev.note}</span>
        )}
        {canMatchControl && live && !finished && (
          <span className="w-full flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={eventBusy || eventEditBusy}
              onClick={() => {
                const tid = String(ev.teamId ?? ev.TeamId ?? "");
                setEventEditDraft({
                  id: String(eid),
                  numericType: eventTypeFromApi(ev.type ?? ev.Type),
                  playerId: ev.playerId
                    ? String(ev.playerId)
                    : ev.PlayerId
                      ? String(ev.PlayerId)
                      : "",
                  relatedPlayerId: ev.relatedPlayerId
                    ? String(ev.relatedPlayerId)
                    : ev.RelatedPlayerId
                      ? String(ev.RelatedPlayerId)
                      : "",
                  note: ev.note ?? ev.Note ?? "",
                  teamId: tid,
                });
              }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </button>
            <button
              type="button"
              disabled={eventBusy || eventEditBusy}
              onClick={() => handleDeleteEvent(ev)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-red-200 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Anular
            </button>
          </span>
        )}
      </li>
    );
  };

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 bg-white text-slate-900 font-inter relative">
      <section className="bg-gradient-to-r from-slate-900 via-emerald-900 to-emerald-700 border-b border-border/20 py-8 md:py-10 pt-20 sm:pt-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6 text-sm font-semibold text-emerald-200">
            <Link
              to="/torneos"
              className="inline-flex items-center gap-2 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
              Torneos
            </Link>
            {detail?.tournamentId && (
              <>
                <span className="text-emerald-500/80">/</span>
                <Link
                  to={`/torneos/torneo/${detail.tournamentId}`}
                  className="hover:text-white truncate max-w-[200px]"
                >
                  {detail.tournamentName}
                </Link>
              </>
            )}
            {detail?.competitionId && (
              <>
                <span className="text-emerald-500/80">/</span>
                <Link
                  to={`/torneos/${detail.competitionId}`}
                  className="hover:text-white truncate max-w-[220px]"
                >
                  {detail.competitionLabel || "Competencia"}
                </Link>
              </>
            )}
          </div>

          {loading && (
            <div className="flex items-center gap-3 text-emerald-100/80 py-8">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-300" />
              Cargando partido…
            </div>
          )}

          {error && !loading && (
            <p className="text-red-200 text-sm py-8">{error}</p>
          )}

          {!loading && detail && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-200/90 mb-2">
                {detail.disciplineName}
                {detail.phaseName ? ` · ${detail.phaseName}` : ""}
              </p>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h1 className="text-xl md:text-2xl font-bold text-white">
                  {detail.localTeamName}{" "}
                  <span className="tabular-nums text-emerald-200">
                    {detail.localScore ?? 0} — {detail.visitorScore ?? 0}
                  </span>{" "}
                  {detail.visitorTeamName}
                </h1>
                {isLiveStatus(detail.status) && (
                  <span className="inline-flex items-center gap-1.5 bg-red-500/20 text-red-100 text-[10px] font-bold px-2 py-1 rounded-full border border-red-400/40">
                    <Radio className="w-3 h-3" />
                    EN VIVO
                  </span>
                )}
              </div>
              <MatchBroadcastHero
                widgetState={broadcastWidgetForVitrina}
                live={!!live}
                homeName={detail.localTeamName ?? ""}
                awayName={detail.visitorTeamName ?? ""}
                homeLogoUrl={detail.localTeamLogo ?? detail.LocalTeamLogo ?? ""}
                awayLogoUrl={detail.visitorTeamLogo ?? detail.VisitorTeamLogo ?? ""}
                officialHomeScore={detail.localScore ?? detail.LocalScore ?? 0}
                officialAwayScore={detail.visitorScore ?? detail.VisitorScore ?? 0}
                matchClockDisplay={matchClockDisplay}
                sportRules={sportRules}
                inPeriodBreak={inPeriodBreak}
                substitutionFromActa={substitutionFromActa}
              />
              <p className="text-sm text-emerald-100/85">
                {statusLabel(detail.status)}
                {!isPlaceholderScheduledDate(
                  detail.scheduledAt ?? detail.ScheduledAt
                ) && (
                  <span className="ml-2 inline-flex items-center gap-1 opacity-90">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(
                      detail.scheduledAt ?? detail.ScheduledAt
                    ).toLocaleString("es-PE", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
                {(detail.venueName ?? detail.VenueName) && (
                  <span className="ml-2 inline-flex items-center gap-1 opacity-90">
                    <MapPin className="w-3.5 h-3.5" />
                    {detail.venueName ?? detail.VenueName}
                  </span>
                )}
              </p>
            </>
          )}
        </div>
      </section>

      {!loading && detail && canMatchControl && (
        <div className="bg-slate-950 border-b border-slate-800 text-slate-100">
          <div className="container mx-auto px-4 max-w-3xl py-3 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
                Mesa
              </span>
              <span className="text-xs text-slate-400 truncate">
                {!mesaTransmissionEnabled && !live ? (
                  <>
                    Torneo: {tournamentPublicLabel(tournamentStatusRaw)} — la
                    transmisión opera con torneo{" "}
                    <strong className="text-slate-200">Activo (en competencia)</strong>
                  </>
                ) : live ? (
                  "En vivo — visible en portada y hub"
                ) : finished ? (
                  "Partido finalizado"
                ) : suspended ? (
                  "Suspendido — sin transmisión; podés reanudar o finalizar el partido"
                ) : (
                  "Listo para iniciar transmisión"
                )}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              {!finished && !live && !suspended && (
                <button
                  type="button"
                  onClick={handleGoLive}
                  disabled={mesaBusy || !mesaTransmissionEnabled}
                  title={
                    !mesaTransmissionEnabled
                      ? "El torneo debe estar Activo (en competencia)."
                      : undefined
                  }
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-45 disabled:cursor-not-allowed text-white text-sm font-bold shadow-sm border border-red-500/50"
                >
                  {mesaBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Radio className="w-4 h-4" />
                  )}
                  Iniciar transmisión en vivo
                </button>
              )}
              {live && (
                <>
                  <button
                    type="button"
                    onClick={handlePauseTransmission}
                    disabled={mesaBusy}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-500 bg-slate-800 text-slate-100 text-xs font-bold hover:bg-slate-700 disabled:opacity-50"
                  >
                    <Pause className="w-4 h-4" />
                    Pausar transmisión
                  </button>
                  <button
                    type="button"
                    onClick={handleEndTransmission}
                    disabled={mesaBusy}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-500/60 bg-amber-950/80 text-amber-100 text-xs font-bold hover:bg-amber-900/90 disabled:opacity-50"
                  >
                    <VideoOff className="w-4 h-4" />
                    Finalizar transmisión
                  </button>
                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={mesaBusy}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold"
                  >
                    {mesaBusy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <StopCircle className="w-4 h-4" />
                    )}
                    Finalizar partido
                  </button>
                </>
              )}
              {!finished && suspended && mesaTransmissionEnabled && (
                <button
                  type="button"
                  onClick={handleGoLive}
                  disabled={mesaBusy}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-bold border border-red-500/50"
                >
                  {mesaBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Radio className="w-4 h-4" />
                  )}
                  Reanudar transmisión en vivo
                </button>
              )}
              {!finished && suspended && mesaTransmissionEnabled && (
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={mesaBusy}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/50 bg-emerald-900/40 text-emerald-100 text-sm font-bold hover:bg-emerald-900/60 disabled:opacity-50"
                >
                  <StopCircle className="w-4 h-4" />
                  Finalizar partido
                </button>
              )}
            </div>

            {live && !finished && matchId && (canMatchControl || canBroadcastWidgets) && (
              <MatchBroadcastMesaControls
                matchId={matchId}
                detail={detail}
                live={live}
                mesaBusy={mesaBusy}
                onSaved={reloadDetail}
                toast={toast}
              />
            )}

            {!finished && (
              <form
                onSubmit={handleSaveSchedule}
                className="mt-4 pt-4 border-t border-slate-800/90 grid gap-3 sm:grid-cols-2 sm:items-end"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:col-span-2">
                  Programación — fecha, hora y sede
                </p>
                <label className="block text-xs sm:col-span-1">
                  <span className="text-slate-500">Fecha y hora</span>
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    value={scheduleDatetimeLocal}
                    onChange={(ev) => setScheduleDatetimeLocal(ev.target.value)}
                  />
                </label>
                <label className="block text-xs sm:col-span-1">
                  <span className="text-slate-500">Sede</span>
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    value={scheduleVenueId}
                    onChange={(ev) => setScheduleVenueId(ev.target.value)}
                    required
                  >
                    <option value="">— Elegir sede —</option>
                    {venues.map((v) => {
                      const vid = v.id ?? v.Id;
                      const vname = v.name ?? v.Name ?? String(vid);
                      return (
                        <option key={vid} value={String(vid)}>
                          {vname}
                        </option>
                      );
                    })}
                  </select>
                </label>
                <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
                  <button
                    type="submit"
                    disabled={scheduleBusy || !venues.length}
                    title={
                      !venues.length
                        ? "No hay sedes en el catálogo. Crealas en administración."
                        : undefined
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-45 text-white text-xs font-bold"
                  >
                    {scheduleBusy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    Guardar programación
                  </button>
                  {!venues.length && (
                    <span className="text-[11px] text-amber-200/90">
                      No hay sedes cargadas.
                      {canManageTourn ? (
                        <>
                          {" "}
                          <Link
                            to="/PanelControl/torneos/sedes"
                            className="underline font-bold text-white hover:text-amber-100"
                          >
                            Dar de alta sedes y canchas
                          </Link>
                        </>
                      ) : (
                        " Pedile al administrador de torneos que cargue el catálogo."
                      )}
                    </span>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {!loading && detail && (
        <div className="bg-slate-50 border-t border-slate-100">
          <div className="container mx-auto px-4 max-w-3xl py-10">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-emerald-600" />
              Eventos del partido
            </h2>

            {canMatchControl && live && !finished && (
              <form
                onSubmit={handleRegisterEvent}
                className="mb-8 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-5 shadow-sm"
              >
                <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                  <ClipboardPlus className="w-4 h-4" />
                  Registrar evento (transmisión)
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="text-slate-600 font-medium">Tipo</span>
                    <select
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      value={eventForm.type}
                      onChange={(ev) => {
                        const v = Number(ev.target.value);
                        setEventForm((f) => ({
                          ...f,
                          type: v,
                          value: eventTypeUsesScoreValue(v) ? f.value : 0,
                          relatedPlayerId:
                            v === MATCH_EVENT_TYPE.Sustitucion ? f.relatedPlayerId : "",
                          playerId: v === MATCH_EVENT_TYPE.Sustitucion ? f.playerId : f.playerId,
                        }));
                      }}
                    >
                      {EVENT_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm">
                    <span className="text-slate-600 font-medium">Equipo</span>
                    <select
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      value={eventForm.teamSide}
                      onChange={(ev) =>
                        setEventForm((f) => ({
                          ...f,
                          teamSide: ev.target.value,
                          playerId: "",
                          relatedPlayerId: "",
                        }))
                      }
                    >
                      <option value="local">{detail.localTeamName} (local)</option>
                      <option value="visitor">
                        {detail.visitorTeamName} (visitante)
                      </option>
                    </select>
                  </label>
                  <div className="block text-sm sm:col-span-2">
                    <span className="text-slate-600 font-medium">
                      Minuto y periodo (widget de transmisión)
                    </span>
                    <div className="mt-1 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200/80 bg-white px-3 py-2.5 text-sm tabular-nums">
                      <span className="font-bold text-slate-900">
                        Min. {eventTiming.minute}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-bold text-slate-900">
                        Periodo {eventTiming.period}
                      </span>
                      <span className="text-xs text-slate-600">
                        El minuto sigue el cronómetro del widget; el periodo se
                        edita en «Widget de transmisión».
                      </span>
                    </div>
                  </div>
                  {eventTypeUsesScoreValue(eventForm.type) && (
                    <label className="block text-sm sm:col-span-2">
                      <span className="text-slate-600 font-medium">
                        Valor (0 = sin suma al marcador, ej. tiro libre fallado)
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="mt-1 w-full max-w-[200px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums"
                        value={eventForm.value}
                        onChange={(ev) =>
                          setEventForm((f) => ({ ...f, value: ev.target.value }))
                        }
                      />
                    </label>
                  )}
                  {Number(eventForm.type) === MATCH_EVENT_TYPE.Sustitucion ? (
                    <>
                      <label className="block text-sm sm:col-span-2">
                        <span className="text-slate-600 font-medium">Sale (opcional)</span>
                        <select
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                          value={eventForm.playerId}
                          onChange={(ev) =>
                            setEventForm((f) => ({ ...f, playerId: ev.target.value }))
                          }
                          disabled={rosterLoading}
                        >
                          <option value="">— Sin asignar —</option>
                          {roster.map((p) => {
                            const pid = p.id ?? p.Id;
                            const pname = p.name ?? p.Name ?? "";
                            const num = p.number ?? p.Number;
                            return (
                              <option key={pid} value={pid}>
                                {num != null && num !== "" ? `#${num} ` : ""}
                                {pname}
                              </option>
                            );
                          })}
                        </select>
                      </label>
                      <label className="block text-sm sm:col-span-2">
                        <span className="text-slate-600 font-medium">Entra (opcional)</span>
                        <select
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                          value={eventForm.relatedPlayerId}
                          onChange={(ev) =>
                            setEventForm((f) => ({
                              ...f,
                              relatedPlayerId: ev.target.value,
                            }))
                          }
                          disabled={rosterLoading}
                        >
                          <option value="">— Sin asignar —</option>
                          {roster.map((p) => {
                            const pid = p.id ?? p.Id;
                            const pname = p.name ?? p.Name ?? "";
                            const num = p.number ?? p.Number;
                            return (
                              <option key={`in-${pid}`} value={pid}>
                                {num != null && num !== "" ? `#${num} ` : ""}
                                {pname}
                              </option>
                            );
                          })}
                        </select>
                      </label>
                    </>
                  ) : (
                    <label className="block text-sm sm:col-span-2">
                      <span className="text-slate-600 font-medium">
                        Jugador (opcional)
                      </span>
                      <select
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        value={eventForm.playerId}
                        onChange={(ev) =>
                          setEventForm((f) => ({ ...f, playerId: ev.target.value }))
                        }
                        disabled={rosterLoading}
                      >
                        <option value="">— Sin asignar —</option>
                        {roster.map((p) => {
                          const pid = p.id ?? p.Id;
                          const pname = p.name ?? p.Name ?? "";
                          const num = p.number ?? p.Number;
                          return (
                            <option key={pid} value={pid}>
                              {num != null && num !== "" ? `#${num} ` : ""}
                              {pname}
                            </option>
                          );
                        })}
                      </select>
                    </label>
                  )}
                  <label className="block text-sm sm:col-span-2">
                    <span className="text-slate-600 font-medium">Nota (opcional)</span>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      value={eventForm.note}
                      onChange={(ev) =>
                        setEventForm((f) => ({ ...f, note: ev.target.value }))
                      }
                      placeholder="Detalle breve…"
                    />
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={eventBusy}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold"
                  >
                    {eventBusy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ClipboardPlus className="w-4 h-4" />
                    )}
                    Guardar evento
                  </button>
                  {rosterLoading && (
                    <span className="text-xs text-slate-500">Cargando plantel…</span>
                  )}
                </div>
              </form>
            )}

            {!events.length ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-slate-500 text-sm">
                Aún no hay eventos registrados en este partido.
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                      <div className="h-9 w-9 rounded-lg border border-slate-200 bg-white overflow-hidden flex items-center justify-center shrink-0">
                        {detail.localTeamLogo ? (
                          <img
                            src={detail.localTeamLogo}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">LOC</span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-900 leading-tight">
                        {detail.localTeamName}
                      </p>
                    </div>
                    {homeEvents.length === 0 ? (
                      <p className="text-xs text-slate-500 py-2">Sin eventos de este equipo.</p>
                    ) : (
                      <ol className="space-y-2">{homeEvents.map(renderEventRow)}</ol>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                      <div className="h-9 w-9 rounded-lg border border-slate-200 bg-white overflow-hidden flex items-center justify-center shrink-0">
                        {detail.visitorTeamLogo ? (
                          <img
                            src={detail.visitorTeamLogo}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">VIS</span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-900 leading-tight">
                        {detail.visitorTeamName}
                      </p>
                    </div>
                    {awayEvents.length === 0 ? (
                      <p className="text-xs text-slate-500 py-2">Sin eventos de este equipo.</p>
                    ) : (
                      <ol className="space-y-2">{awayEvents.map(renderEventRow)}</ol>
                    )}
                  </div>
                </div>
                {eventsSinEquipo.length > 0 ? (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Otros eventos
                    </p>
                    <ol className="space-y-2">{eventsSinEquipo.map(renderEventRow)}</ol>
                  </div>
                ) : null}
              </div>
            )}
            {eventEditDraft && canMatchControl && live && !finished ? (
              <form
                onSubmit={handleSaveEventEdit}
                className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-3"
              >
                <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Corregir evento
                </p>
                {eventEditDraft.numericType === MATCH_EVENT_TYPE.Sustitucion ? (
                  <div className="grid gap-3 sm:grid-cols-2 text-sm">
                    <label className="block">
                      <span className="text-slate-600 text-xs font-medium">Sale</span>
                      <select
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
                        value={eventEditDraft.playerId}
                        onChange={(e) =>
                          setEventEditDraft((d) =>
                            d ? { ...d, playerId: e.target.value } : d
                          )
                        }
                        disabled={eventEditBusy || dualRosterLoading}
                      >
                        <option value="">—</option>
                        {(String(eventEditDraft.teamId) === String(localId)
                          ? homeRoster
                          : awayRoster
                        ).map((p) => {
                          const pid = p.id ?? p.Id;
                          const pname = p.name ?? p.Name ?? "";
                          const num = p.number ?? p.Number;
                          return (
                            <option key={pid} value={pid}>
                              {num != null && num !== "" ? `#${num} ` : ""}
                              {pname}
                            </option>
                          );
                        })}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-slate-600 text-xs font-medium">Entra</span>
                      <select
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
                        value={eventEditDraft.relatedPlayerId}
                        onChange={(e) =>
                          setEventEditDraft((d) =>
                            d ? { ...d, relatedPlayerId: e.target.value } : d
                          )
                        }
                        disabled={eventEditBusy || dualRosterLoading}
                      >
                        <option value="">—</option>
                        {(String(eventEditDraft.teamId) === String(localId)
                          ? homeRoster
                          : awayRoster
                        ).map((p) => {
                          const pid = p.id ?? p.Id;
                          const pname = p.name ?? p.Name ?? "";
                          const num = p.number ?? p.Number;
                          return (
                            <option key={`e-${pid}`} value={pid}>
                              {num != null && num !== "" ? `#${num} ` : ""}
                              {pname}
                            </option>
                          );
                        })}
                      </select>
                    </label>
                  </div>
                ) : (
                  <label className="block text-sm">
                    <span className="text-slate-600 text-xs font-medium">Jugador</span>
                    <select
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
                      value={eventEditDraft.playerId}
                      onChange={(e) =>
                        setEventEditDraft((d) =>
                          d ? { ...d, playerId: e.target.value } : d
                        )
                      }
                      disabled={eventEditBusy || dualRosterLoading}
                    >
                      <option value="">—</option>
                      {(String(eventEditDraft.teamId) === String(localId)
                        ? homeRoster
                        : awayRoster
                      ).map((p) => {
                        const pid = p.id ?? p.Id;
                        const pname = p.name ?? p.Name ?? "";
                        const num = p.number ?? p.Number;
                        return (
                          <option key={pid} value={pid}>
                            {num != null && num !== "" ? `#${num} ` : ""}
                            {pname}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                )}
                <label className="block text-sm">
                  <span className="text-slate-600 text-xs font-medium">Nota</span>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
                    value={eventEditDraft.note}
                    onChange={(e) =>
                      setEventEditDraft((d) =>
                        d ? { ...d, note: e.target.value } : d
                      )
                    }
                    disabled={eventEditBusy}
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={eventEditBusy}
                    className="px-3 py-2 rounded-xl bg-amber-700 text-white text-xs font-bold hover:bg-amber-600 disabled:opacity-50"
                  >
                    {eventEditBusy ? "Guardando…" : "Guardar cambios"}
                  </button>
                  <button
                    type="button"
                    disabled={eventEditBusy}
                    onClick={() => setEventEditDraft(null)}
                    className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      )}
      {broadcastWidgetState.showZonaHorariaOnMatch ? (
        <>
          <ZonaHorariaPublicBanner />
          <ZonaHorariaWidget />
        </>
      ) : null}
    </div>
  );
}

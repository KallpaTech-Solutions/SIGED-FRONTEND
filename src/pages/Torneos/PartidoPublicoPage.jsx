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
  Eye,
  FileDown,
  Check,
  X,
} from "lucide-react";
import {
  fetchMatchPublicDetailEnriched,
  fetchPublicTeamRoster,
  fetchVenues,
} from "../../api/tournamentsPublicService";
import {
  MATCH_EVENT_TYPE,
  MATCH_LINEUP_ROLE,
  MATCH_STATUS,
  deleteMatchEvent,
  downloadMatchReportCsv,
  downloadMatchReportPdf,
  fetchMatchReport,
  patchMatchEvent,
  patchMatchFinish,
  patchMatchPenaltyScore,
  patchMatchSchedule,
  patchMatchStatus,
  closeMatchLineupTemporaryWindowForAll,
  openMatchLineupTemporaryWindow,
  openMatchLineupTemporaryWindowForAll,
  putMatchLineup,
  postMatchEvent,
} from "../../api/matchesControlService";
import ActaReportHeader from "../../components/torneos/ActaReportHeader";
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
  if (t === "3" || t === "PenaltyGoal") return "Penal convertido (tanda)";
  if (t === "15" || t === "PenaltyMiss") return "Penal fallado (tanda)";
  const map = {
    Goal: "Gol",
    Puntaje: "Punto",
    PenaltyGoal: "Penal convertido (tanda)",
    PenaltyMiss: "Penal fallado (tanda)",
    TarjetaAmarilla: "Tarjeta amarilla",
    TarjetaRoja: "Tarjeta roja",
    SegundaAmarilla: "Segunda amarilla",
    RojaPorDobleAmarilla: "Roja por doble amarilla",
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
  { value: MATCH_EVENT_TYPE.PenaltyGoal, label: "Penal convertido (tanda)" },
  { value: MATCH_EVENT_TYPE.PenaltyMiss, label: "Penal fallado (tanda)" },
  { value: MATCH_EVENT_TYPE.TarjetaAmarilla, label: "Tarjeta amarilla" },
  { value: MATCH_EVENT_TYPE.TarjetaRoja, label: "Tarjeta roja" },
  { value: MATCH_EVENT_TYPE.SegundaAmarilla, label: "Segunda amarilla" },
  { value: MATCH_EVENT_TYPE.RojaPorDobleAmarilla, label: "Roja por doble amarilla" },
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
    PenaltyMiss: MATCH_EVENT_TYPE.PenaltyMiss,
    TarjetaAmarilla: MATCH_EVENT_TYPE.TarjetaAmarilla,
    TarjetaRoja: MATCH_EVENT_TYPE.TarjetaRoja,
    SegundaAmarilla: MATCH_EVENT_TYPE.SegundaAmarilla,
    RojaPorDobleAmarilla: MATCH_EVENT_TYPE.RojaPorDobleAmarilla,
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

function sortMatchEventsChronologically(a, b) {
  const isoA = a.occurredAt ?? a.OccurredAt;
  const isoB = b.occurredAt ?? b.OccurredAt;
  const ta = isoA ? new Date(isoA).getTime() : NaN;
  const tb = isoB ? new Date(isoB).getTime() : NaN;
  if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb) return ta - tb;
  const pa = Number(a.period ?? a.Period ?? 0) - Number(b.period ?? b.Period ?? 0);
  if (pa !== 0) return pa;
  const ma = Number(a.minute ?? a.Minute ?? 0) - Number(b.minute ?? b.Minute ?? 0);
  if (ma !== 0) return ma;
  return String(a.id ?? a.Id ?? "").localeCompare(String(b.id ?? b.Id ?? ""));
}

/** Marcas true = convertido, false = fallado, en orden del acta (por equipo). */
function derivePenaltyShootoutMarks(events, localTeamId, visitorTeamId) {
  if (!localTeamId || !visitorTeamId || !Array.isArray(events)) {
    return { local: [], visitor: [] };
  }
  const ls = String(localTeamId);
  const vs = String(visitorTeamId);
  const isShot = (ev) => {
    const ty = eventTypeFromApi(ev.type ?? ev.Type);
    return ty === MATCH_EVENT_TYPE.PenaltyGoal || ty === MATCH_EVENT_TYPE.PenaltyMiss;
  };
  const toMade = (ev) =>
    eventTypeFromApi(ev.type ?? ev.Type) === MATCH_EVENT_TYPE.PenaltyGoal;
  const local = events
    .filter((ev) => isShot(ev) && String(ev.teamId ?? ev.TeamId ?? "") === ls)
    .sort(sortMatchEventsChronologically)
    .map(toMade);
  const visitor = events
    .filter((ev) => isShot(ev) && String(ev.teamId ?? ev.TeamId ?? "") === vs)
    .sort(sortMatchEventsChronologically)
    .map(toMade);
  return { local, visitor };
}

function PenaltyShootoutStrip({ marks, teamLabel }) {
  if (!marks?.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs mt-1.5">
      <span
        className="text-emerald-200/90 font-medium shrink-0 max-w-[min(40%,12rem)] truncate"
        title={teamLabel}
      >
        {teamLabel}
      </span>
      <div
        className="flex flex-wrap gap-1.5"
        role="list"
        aria-label={`Penales de ${teamLabel}`}
      >
        {marks.map((made, i) => (
          <span
            key={i}
            role="listitem"
            className={`inline-flex h-7 w-7 items-center justify-center rounded-full border-2 shrink-0 ${
              made
                ? "border-emerald-400 bg-emerald-500 text-white shadow-sm"
                : "border-red-400/90 bg-slate-950/60 text-red-200"
            }`}
            title={made ? "Convertido" : "Fallado"}
            aria-label={made ? "Penal convertido" : "Penal fallado"}
          >
            {made ? (
              <Check className="h-3.5 w-3.5 stroke-3" aria-hidden />
            ) : (
              <X className="h-3.5 w-3.5 stroke-3" aria-hidden />
            )}
          </span>
        ))}
      </div>
    </div>
  );
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

/** Interpreta fechas del backend como UTC aunque vengan sin sufijo Z. */
function parseBackendUtcDate(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const iso = /z$/i.test(raw) ? raw : `${raw}Z`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function PartidoPublicoPage() {
  const { matchId } = useParams();
  const { can, user } = useAuth();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const canMatchControl = can("tourn.match.control");
  const canBroadcastWidgets = can("tourn.match.widgets");
  const canManageTourn = can("tourn.manage");
  const canLineupManage = can("tourn.lineup.manage");
  const canTeamManage = can("tourn.team.manage");
  /** Mesa / admin: API con JWT evita 404 del endpoint público (p. ej. IsActive). */
  const preferMesaDetail =
    canMatchControl || canManageTourn || canBroadcastWidgets || canTeamManage;

  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mesaBusy, setMesaBusy] = useState(false);

  const [eventBusy, setEventBusy] = useState(false);
  const [eventEditBusy, setEventEditBusy] = useState(false);
  const [lineupBusy, setLineupBusy] = useState(false);
  const [lineupWindowBusy, setLineupWindowBusy] = useState(false);
  const [lineupWindowMinutes, setLineupWindowMinutes] = useState(5);
  const [lineupSide, setLineupSide] = useState("local");
  const [lineupRoles, setLineupRoles] = useState({});
  const [lineupNumbers, setLineupNumbers] = useState({});
  const [reportBusy, setReportBusy] = useState(false);
  const [reportPdfBusy, setReportPdfBusy] = useState(false);
  const [actaPreviewOpen, setActaPreviewOpen] = useState(false);
  const [actaPreview, setActaPreview] = useState(null);
  const [actaPreviewBusy, setActaPreviewBusy] = useState(false);
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
  const [penaltyForm, setPenaltyForm] = useState({ local: 0, visitor: 0 });
  const [penaltyBusy, setPenaltyBusy] = useState(false);

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

  useEffect(() => {
    if (!detail) return;
    setPenaltyForm({
      local: Number(detail.localPenaltyScore ?? detail.LocalPenaltyScore ?? 0),
      visitor: Number(detail.visitorPenaltyScore ?? detail.VisitorPenaltyScore ?? 0),
    });
  }, [
    detail?.localPenaltyScore,
    detail?.LocalPenaltyScore,
    detail?.visitorPenaltyScore,
    detail?.VisitorPenaltyScore,
    matchId,
  ]);

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
  const phaseIsDirectElimination = !!(
    detail?.phaseIsDirectElimination ?? detail?.PhaseIsDirectElimination
  );
  const phaseIsDoubleLeg = !!(detail?.phaseIsDoubleLeg ?? detail?.PhaseIsDoubleLeg);
  const boardLocal = Number(detail?.localScore ?? detail?.LocalScore ?? 0);
  const boardVisitor = Number(detail?.visitorScore ?? detail?.VisitorScore ?? 0);
  const penL = Number(detail?.localPenaltyScore ?? detail?.LocalPenaltyScore ?? 0);
  const penV = Number(detail?.visitorPenaltyScore ?? detail?.VisitorPenaltyScore ?? 0);
  const showPenaltyPanel =
    !!detail &&
    canMatchControl &&
    !finished &&
    phaseIsDirectElimination &&
    !phaseIsDoubleLeg &&
    !!localId &&
    !!visitorId &&
    boardLocal === boardVisitor &&
    (live || suspended || boardLocal > 0 || boardVisitor > 0);
  const penaltyShootoutMarks = useMemo(
    () => derivePenaltyShootoutMarks(events, localId, visitorId),
    [events, localId, visitorId]
  );
  const hasPenaltyShootoutMarks =
    penaltyShootoutMarks.local.length > 0 || penaltyShootoutMarks.visitor.length > 0;
  const selectedTeamId =
    eventForm.teamSide === "local" ? localId : visitorId;
  const lineups = detail?.lineups ?? detail?.Lineups ?? [];
  const localLineupOpenUntilUtc =
    detail?.localLineupOpenUntilUtc ?? detail?.LocalLineupOpenUntilUtc ?? null;
  const visitorLineupOpenUntilUtc =
    detail?.visitorLineupOpenUntilUtc ?? detail?.VisitorLineupOpenUntilUtc ?? null;
  const localOpenUntilDate = parseBackendUtcDate(localLineupOpenUntilUtc);
  const visitorOpenUntilDate = parseBackendUtcDate(visitorLineupOpenUntilUtc);
  const localWindowOpen =
    !!localOpenUntilDate && localOpenUntilDate.getTime() > Date.now();
  const visitorWindowOpen =
    !!visitorOpenUntilDate && visitorOpenUntilDate.getTime() > Date.now();
  const localRosterLocked =
    !!(detail?.localRosterLocked ?? detail?.LocalRosterLocked);
  const visitorRosterLocked =
    !!(detail?.visitorRosterLocked ?? detail?.VisitorRosterLocked);
  const canBypassLineupLock = canMatchControl || canManageTourn || canLineupManage;
  const canSubmitLocalLineup =
    !!detail &&
    !!(detail.canSubmitLocalLineup ?? detail.CanSubmitLocalLineup) &&
    (canBypassLineupLock || localWindowOpen || !localRosterLocked);
  const canSubmitVisitorLineup =
    !!detail &&
    !!(detail.canSubmitVisitorLineup ?? detail.CanSubmitVisitorLineup) &&
    (canBypassLineupLock || visitorWindowOpen || !visitorRosterLocked);
  const canSubmitLineup =
    !!user &&
    !!detail &&
    !finished &&
    !!localId &&
    !!visitorId &&
    (canSubmitLocalLineup || canSubmitVisitorLineup);
  const localDelegateLabel =
    detail?.localLineupDelegate ?? detail?.LocalLineupDelegate ?? "No asignado";
  const visitorDelegateLabel =
    detail?.visitorLineupDelegate ?? detail?.VisitorLineupDelegate ?? "No asignado";
  const canDownloadReport =
    can("tourn.match.report.download") || canMatchControl || canManageTourn;
  const localLineupStateLabel = localWindowOpen
    ? "Planilla abierta (ventana temporal)"
    : localRosterLocked
      ? "Planilla cerrada"
      : "Planilla abierta";
  const visitorLineupStateLabel = visitorWindowOpen
    ? "Planilla abierta (ventana temporal)"
    : visitorRosterLocked
      ? "Planilla cerrada"
      : "Planilla abierta";
  const lineupTeamId = lineupSide === "local" ? localId : visitorId;
  const lineupRoster = lineupSide === "local" ? homeRoster : awayRoster;
  const currentLineup = Array.isArray(lineups)
    ? lineups.find((l) => String(l.teamId ?? l.TeamId) === String(lineupTeamId))
    : null;
  const hasExistingLineup = !!(currentLineup?.id ?? currentLineup?.Id);
  const lineupByTeamId = useMemo(() => {
    const map = new Map();
    if (Array.isArray(lineups)) {
      lineups.forEach((l) => {
        const tid = String(l.teamId ?? l.TeamId ?? "");
        if (tid) map.set(tid, l);
      });
    }
    return map;
  }, [lineups]);
  const selectedTeamLineup = useMemo(() => {
    const key = String(selectedTeamId ?? "");
    if (!key) return null;
    return lineupByTeamId.get(key) ?? null;
  }, [lineupByTeamId, selectedTeamId]);
  const selectedLineupPlayers = useMemo(() => {
    const players = selectedTeamLineup?.players ?? selectedTeamLineup?.Players ?? [];
    if (!Array.isArray(players)) return [];
    return players.map((p) => {
      const pid = String(p.playerId ?? p.PlayerId ?? "");
      return {
        id: pid,
        name: p.playerName ?? p.PlayerName ?? "Jugador",
        number: p.number ?? p.Number ?? null,
        role: String(p.role ?? p.Role ?? ""),
      };
    });
  }, [selectedTeamLineup]);
  const selectedLineupPlayersById = useMemo(() => {
    const map = new Map();
    selectedLineupPlayers.forEach((p) => {
      if (p.id) map.set(String(p.id), p);
    });
    return map;
  }, [selectedLineupPlayers]);
  const selectedTeamOnField = useMemo(() => {
    if (!selectedTeamId || selectedLineupPlayers.length === 0) {
      return { onField: [], bench: [] };
    }
    const starters = selectedLineupPlayers.filter((p) => p.role === "Starter");
    if (starters.length === 0) {
      return { onField: selectedLineupPlayers, bench: [] };
    }

    const onFieldById = new Map(starters.map((p) => [String(p.id), p]));
    const benchById = new Map(
      selectedLineupPlayers
        .filter((p) => p.role !== "Starter")
        .map((p) => [String(p.id), p])
    );

    const orderedSubs = (events ?? [])
      .filter((ev) => String(ev.teamId ?? ev.TeamId ?? "") === String(selectedTeamId))
      .filter((ev) => Number(eventTypeFromApi(ev.type ?? ev.Type)) === MATCH_EVENT_TYPE.Sustitucion)
      .sort((a, b) => {
        const p = Number(a.period ?? a.Period ?? 0) - Number(b.period ?? b.Period ?? 0);
        if (p !== 0) return p;
        const m = Number(a.minute ?? a.Minute ?? 0) - Number(b.minute ?? b.Minute ?? 0);
        if (m !== 0) return m;
        return String(a.id ?? a.Id ?? "").localeCompare(String(b.id ?? b.Id ?? ""));
      });

    orderedSubs.forEach((ev) => {
      const outId = String(ev.playerId ?? ev.PlayerId ?? "");
      const inId = String(ev.relatedPlayerId ?? ev.RelatedPlayerId ?? "");
      if (outId && selectedLineupPlayersById.has(outId)) {
        onFieldById.delete(outId);
        benchById.set(outId, selectedLineupPlayersById.get(outId));
      }
      if (inId && selectedLineupPlayersById.has(inId)) {
        benchById.delete(inId);
        onFieldById.set(inId, selectedLineupPlayersById.get(inId));
      }
    });

    const sortPlayers = (arr) =>
      arr
        .filter(Boolean)
        .sort(
          (a, b) =>
            (a.number ?? 999) - (b.number ?? 999) || a.name.localeCompare(b.name)
        );
    return {
      onField: sortPlayers([...onFieldById.values()]),
      bench: sortPlayers([...benchById.values()]),
    };
  }, [events, selectedLineupPlayers, selectedLineupPlayersById, selectedTeamId]);
  const substitutionOutOptions = useMemo(() => {
    if (selectedTeamOnField.onField.length > 0) return selectedTeamOnField.onField;
    return roster.map((p) => ({
      id: String(p.id ?? p.Id ?? ""),
      name: p.name ?? p.Name ?? "Jugador",
      number: p.number ?? p.Number ?? null,
      role: "Any",
    }));
  }, [selectedTeamOnField.onField, roster]);
  const substitutionInOptions = useMemo(() => {
    if (selectedTeamOnField.bench.length > 0) return selectedTeamOnField.bench;
    return roster.map((p) => ({
      id: String(p.id ?? p.Id ?? ""),
      name: p.name ?? p.Name ?? "Jugador",
      number: p.number ?? p.Number ?? null,
      role: "Any",
    }));
  }, [selectedTeamOnField.bench, roster]);
  const eventPlayerOptions = useMemo(() => {
    if (selectedTeamOnField.onField.length > 0) return selectedTeamOnField.onField;
    if (selectedLineupPlayers.length > 0) return selectedLineupPlayers;
    return roster.map((p) => ({
      id: String(p.id ?? p.Id ?? ""),
      name: p.name ?? p.Name ?? "Jugador",
      number: p.number ?? p.Number ?? null,
      role: "Any",
    }));
  }, [selectedLineupPlayers, selectedTeamOnField.onField, roster]);
  const getEventEditOptionsForTeam = useCallback(
    (teamId) => {
      const key = String(teamId ?? "");
      if (!key) return [];
      const lineup = lineupByTeamId.get(key);
      const lineupPlayers = lineup?.players ?? lineup?.Players ?? [];
      if (Array.isArray(lineupPlayers) && lineupPlayers.length > 0) {
        return lineupPlayers.map((p) => ({
          id: String(p.playerId ?? p.PlayerId ?? ""),
          name: p.playerName ?? p.PlayerName ?? "Jugador",
          number: p.number ?? p.Number ?? null,
          role: String(p.role ?? p.Role ?? ""),
        }));
      }
      const teamRoster = key === String(localId) ? homeRoster : awayRoster;
      return (teamRoster ?? []).map((p) => ({
        id: String(p.id ?? p.Id ?? ""),
        name: p.name ?? p.Name ?? "Jugador",
        number: p.number ?? p.Number ?? null,
        role: "Any",
      }));
    },
    [lineupByTeamId, localId, homeRoster, awayRoster]
  );

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
    const needsRoster = (canMatchControl && live && !finished) || canSubmitLineup;
    if (!needsRoster || !localId || !visitorId) {
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
  }, [canMatchControl, canSubmitLineup, live, finished, localId, visitorId]);

  const substitutionFromActa = useMemo(
    () => lastSubstitutionFromEvents(events, localId, visitorId),
    [events, localId, visitorId]
  );

  useEffect(() => {
    const next = {};
    const nextNumbers = {};
    const players = currentLineup?.players ?? currentLineup?.Players ?? [];
    if (Array.isArray(players)) {
      players.forEach((p) => {
        const pid = p.playerId ?? p.PlayerId;
        const role = String(p.role ?? p.Role ?? "");
        if (!pid) return;
        next[String(pid)] = role === "Starter" ? "starter" : "substitute";
        nextNumbers[String(pid)] = p.number ?? p.Number ?? "";
      });
    }
    setLineupRoles(next);
    setLineupNumbers(nextNumbers);
  }, [currentLineup?.id, currentLineup?.Id, lineupTeamId]);

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
    if (!canSubmitLineup) return;
    if (lineupSide === "local" && canSubmitLocalLineup) return;
    if (lineupSide === "visitor" && canSubmitVisitorLineup) return;
    if (canSubmitLocalLineup) setLineupSide("local");
    else if (canSubmitVisitorLineup) setLineupSide("visitor");
  }, [canSubmitLineup, canSubmitLocalLineup, canSubmitVisitorLineup, lineupSide]);

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

  const handleSavePenaltyScore = async () => {
    if (!matchId || penaltyBusy) return;
    const lo = Number(penaltyForm.local);
    const vi = Number(penaltyForm.visitor);
    if (!Number.isFinite(lo) || !Number.isFinite(vi) || lo < 0 || vi < 0) {
      toast("Valores de penales inválidos.", "error");
      return;
    }
    setPenaltyBusy(true);
    try {
      await patchMatchPenaltyScore(matchId, {
        localPenaltyScore: Math.floor(lo),
        visitorPenaltyScore: Math.floor(vi),
      });
      toast("Tanda de penales guardada.", "success");
      await reloadDetail();
    } catch (e) {
      const m =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        "No se pudo guardar penales.";
      toast(m, "error");
    } finally {
      setPenaltyBusy(false);
    }
  };

  const handleFinish = async () => {
    if (!matchId || mesaBusy) return;
    const ok = await confirm({
      title: "Finalizar partido",
      message:
        "Se cerrará el partido con el marcador actual (y penales si aplica) y se actualizarán tablas si aplica. ¿Continuar?",
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
      const d = e?.response?.data;
      const msg =
        (typeof d === "string" ? d : d?.message) ||
        "No se pudo finalizar el partido.";
      toast(msg, "error");
    } finally {
      setMesaBusy(false);
    }
  };

  const handleSubmitLineup = async (e) => {
    e.preventDefault();
    if (!matchId || !lineupTeamId || lineupBusy) return;
    const selectedRows = Object.entries(lineupRoles)
      .filter(([, role]) => role === "starter" || role === "substitute")
      .map(([playerId, role]) => {
        const p = lineupRoster.find((x) => String(x.id ?? x.Id) === String(playerId));
        const rawNum = lineupNumbers[playerId];
        const parsedNum =
          rawNum === "" || rawNum == null ? null : Number(rawNum);
        return {
          playerId,
          playerName: p?.name ?? p?.Name ?? "Jugador",
          role:
            role === "starter"
              ? MATCH_LINEUP_ROLE.Starter
              : MATCH_LINEUP_ROLE.Substitute,
          shirtNumber:
            parsedNum != null && Number.isFinite(parsedNum)
              ? parsedNum
              : p?.number ?? p?.Number ?? null,
          position: p?.position ?? p?.Position ?? null,
        };
      });
    const players = selectedRows.map(({ playerName, ...rest }) => rest);

    if (!players.some((p) => p.role === MATCH_LINEUP_ROLE.Starter)) {
      toast("La planilla debe tener al menos un titular.", "error");
      return;
    }

    const missingNumberNames = selectedRows
      .filter((p) => p.shirtNumber == null || !Number.isFinite(p.shirtNumber))
      .map((p) => p.playerName);
    if (missingNumberNames.length > 0) {
      const preview = missingNumberNames.slice(0, 3).join(", ");
      toast(
        `Todos los convocados deben tener número de camiseta. Faltan: ${preview}${
          missingNumberNames.length > 3 ? "..." : ""
        }.`,
        "error"
      );
      return;
    }

    const shirtCount = new Map();
    selectedRows.forEach((p) => {
      const n = Number(p.shirtNumber);
      shirtCount.set(n, (shirtCount.get(n) ?? 0) + 1);
    });
    const duplicated = [...shirtCount.entries()]
      .filter(([, count]) => count > 1)
      .map(([n]) => `#${n}`);
    if (duplicated.length > 0) {
      toast(
        `No se puede enviar: hay números de camiseta repetidos (${duplicated.join(
          ", "
        )}).`,
        "error"
      );
      return;
    }

    setLineupBusy(true);
    try {
      await putMatchLineup(matchId, lineupTeamId, {
        lock: false,
        players,
      });
      toast(
        hasExistingLineup
          ? "Planilla actualizada correctamente."
          : "Planilla enviada correctamente.",
        "success"
      );
      await reloadDetail();
    } catch (err) {
      toast(
        err?.response?.data?.message ||
          err?.response?.data ||
          "No se pudo guardar la planilla.",
        "error"
      );
    } finally {
      setLineupBusy(false);
    }
  };

  const handleOpenLineupTemporaryWindow = async (side) => {
    if (!matchId || !detail || lineupWindowBusy) return;
    const teamId = side === "local" ? localId : visitorId;
    if (!teamId) return;
    setLineupWindowBusy(true);
    try {
      await openMatchLineupTemporaryWindow(matchId, teamId, lineupWindowMinutes);
      toast(
        `Envío de planilla habilitado por ${lineupWindowMinutes} min para ${
          side === "local" ? detail.localTeamName : detail.visitorTeamName
        }.`,
        "success"
      );
      await reloadDetail();
    } catch (err) {
      toast(
        err?.response?.data?.message ||
          err?.response?.data ||
          "No se pudo habilitar la ventana temporal.",
        "error"
      );
    } finally {
      setLineupWindowBusy(false);
    }
  };

  const handleOpenLineupTemporaryWindowForAll = async () => {
    if (!matchId || !detail || lineupWindowBusy || !localId || !visitorId) return;
    setLineupWindowBusy(true);
    try {
      await openMatchLineupTemporaryWindowForAll(matchId, lineupWindowMinutes);
      toast(
        `Envío de planilla habilitado por ${lineupWindowMinutes} min para ambos equipos.`,
        "success"
      );
      await reloadDetail();
    } catch (err) {
      toast(
        err?.response?.data?.message ||
          err?.response?.data ||
          "No se pudo habilitar la ventana temporal.",
        "error"
      );
    } finally {
      setLineupWindowBusy(false);
    }
  };

  const handleCloseLineupTemporaryWindowForAll = async () => {
    if (!matchId || lineupWindowBusy) return;
    setLineupWindowBusy(true);
    try {
      await closeMatchLineupTemporaryWindowForAll(matchId);
      toast("Ventana temporal cerrada para ambos equipos.", "success");
      await reloadDetail();
    } catch (err) {
      toast(
        err?.response?.data?.message ||
          err?.response?.data ||
          "No se pudo cerrar la ventana temporal.",
        "error"
      );
    } finally {
      setLineupWindowBusy(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!matchId || reportBusy) return;
    setReportBusy(true);
    try {
      const blob = await downloadMatchReportCsv(matchId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `acta-partido-${matchId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast(
        err?.message ||
          err?.response?.data?.message ||
          "No se pudo descargar el acta.",
        "error"
      );
    } finally {
      setReportBusy(false);
    }
  };

  const handleDownloadReportPdf = async () => {
    if (!matchId || reportPdfBusy) return;
    setReportPdfBusy(true);
    try {
      const blob = await downloadMatchReportPdf(matchId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `acta-partido-${matchId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast(
        err?.message ||
          err?.response?.data?.message ||
          "No se pudo descargar el PDF del acta.",
        "error"
      );
    } finally {
      setReportPdfBusy(false);
    }
  };

  const handleOpenActaPreview = async () => {
    if (!matchId || actaPreviewBusy) return;
    setActaPreviewOpen(true);
    setActaPreview(null);
    setActaPreviewBusy(true);
    try {
      const data = await fetchMatchReport(matchId);
      setActaPreview(data);
    } catch (err) {
      toast(
        err?.response?.data?.message ||
          "No se pudo cargar la vista previa del acta.",
        "error"
      );
      setActaPreviewOpen(false);
    } finally {
      setActaPreviewBusy(false);
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

  const buildLineupAudit = (teamId, teamName) => {
    const key = String(teamId ?? "");
    const lineup = lineupByTeamId.get(key) ?? null;
    if (!lineup) {
      return {
        teamName,
        state: "missing",
        stateLabel: "Sin enviar",
        ok: false,
        issues: ["Aún no enviaron planilla."],
        players: [],
        starters: 0,
        subs: 0,
      };
    }
    const players = lineup.players ?? lineup.Players ?? [];
    const starters = players.filter(
      (p) => String(p.role ?? p.Role ?? "") === "Starter"
    ).length;
    const subs = players.filter(
      (p) => String(p.role ?? p.Role ?? "") === "Substitute"
    ).length;
    const missingNumber = players.filter((p) => {
      const n = p.number ?? p.Number;
      return n == null || String(n).trim() === "";
    }).length;
    const issues = [];
    if (starters === 0) issues.push("Sin titulares.");
    if (missingNumber > 0)
      issues.push(`${missingNumber} jugador(es) sin número.`);
    if (players.length === 0) issues.push("Planilla sin jugadores.");
    const statusRaw = String(lineup.status ?? lineup.Status ?? "");
    const stateLabel =
      statusRaw === "Locked"
        ? "Enviada y bloqueada"
        : statusRaw === "Submitted"
        ? "Enviada"
        : "Borrador";
    return {
      teamName,
      state: statusRaw || "Draft",
      stateLabel,
      ok: issues.length === 0,
      issues,
      players,
      starters,
      subs,
    };
  };

  const lineupAudit = useMemo(
    () => [
      buildLineupAudit(localId, detail?.localTeamName ?? "Local"),
      buildLineupAudit(visitorId, detail?.visitorTeamName ?? "Visitante"),
    ],
    [lineupByTeamId, localId, visitorId, detail?.localTeamName, detail?.visitorTeamName]
  );

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
              <div className="mb-4">
                <div className="flex flex-wrap items-center gap-3">
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
                {(penL > 0 || penV > 0 || hasPenaltyShootoutMarks) && (
                  <div className="mt-2 space-y-1">
                    {(penL > 0 || penV > 0) && (
                      <p className="text-sm font-semibold text-emerald-100/90">
                        Penales (tanda):{" "}
                        <span className="tabular-nums text-white">
                          {penL} — {penV}
                        </span>
                      </p>
                    )}
                    {hasPenaltyShootoutMarks && (
                      <div className="rounded-lg bg-black/15 px-2 py-2 ring-1 ring-emerald-500/25">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200/80 mb-1">
                          Tanda (orden del acta)
                        </p>
                        <PenaltyShootoutStrip
                          marks={penaltyShootoutMarks.local}
                          teamLabel={detail.localTeamName ?? "Local"}
                        />
                        <PenaltyShootoutStrip
                          marks={penaltyShootoutMarks.visitor}
                          teamLabel={detail.visitorTeamName ?? "Visitante"}
                        />
                      </div>
                    )}
                  </div>
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
                officialPenaltyHome={penL}
                officialPenaltyAway={penV}
                penaltyShootoutHome={penaltyShootoutMarks.local}
                penaltyShootoutAway={penaltyShootoutMarks.visitor}
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
              {!finished && !live && !suspended && showPenaltyPanel && (
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={mesaBusy}
                  title="Cuando la tanda ya definió ganador (marcador de penales distinto)"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/50 bg-emerald-900/40 text-emerald-100 text-sm font-bold hover:bg-emerald-900/60 disabled:opacity-50"
                >
                  {mesaBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <StopCircle className="w-4 h-4" />
                  )}
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

            {showPenaltyPanel && (
              <div className="mt-4 pt-4 border-t border-slate-800/90 rounded-xl ring-1 ring-amber-500/40 bg-amber-950/30 px-4 py-3 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-200/90">
                  Eliminación · empate en el marcador
                </p>
                <ul className="text-xs text-amber-100/85 leading-relaxed list-disc pl-4 space-y-1">
                  <li>
                    <strong className="text-amber-50">No</strong> hace falta «Finalizar partido» antes: con el
                    marcador empatado, cargá penales (o desempatá en suplementario sumando goles al marcador) y recién
                    después usá «Finalizar partido» (también disponible en Programado si ves este panel).
                  </li>
                  <li>
                    En el acta usá <strong className="text-amber-50">Penal convertido (tanda)</strong> o{" "}
                    <strong className="text-amber-50">Penal fallado (tanda)</strong>: el total de convertidos sube
                    solo; los fallados se ven como círculos con equis en la tanda.
                  </li>
                  <li>
                    O bien poné acá el <strong className="text-amber-50">total</strong> por equipo y «Guardar penales»
                    (sobrescribe el total; útil si no usaste eventos uno a uno; la fila de círculos solo refleja
                    eventos del acta).
                  </li>
                </ul>
                {hasPenaltyShootoutMarks && (
                  <div className="rounded-lg border border-amber-500/35 bg-black/25 px-2 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-200/90 mb-1">
                      Tanda (orden del acta)
                    </p>
                    <PenaltyShootoutStrip
                      marks={penaltyShootoutMarks.local}
                      teamLabel={detail.localTeamName ?? "Local"}
                    />
                    <PenaltyShootoutStrip
                      marks={penaltyShootoutMarks.visitor}
                      teamLabel={detail.visitorTeamName ?? "Visitante"}
                    />
                  </div>
                )}
                <div className="flex flex-wrap items-end gap-3">
                  <label className="text-xs text-slate-300">
                    <span className="block text-slate-500 mb-0.5">
                      Penales · {detail.localTeamName ?? "Local"}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      className="w-24 rounded-lg border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-white tabular-nums"
                      value={penaltyForm.local}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        setPenaltyForm((p) => ({
                          ...p,
                          local: Number.isFinite(n)
                            ? Math.min(99, Math.max(0, Math.floor(n)))
                            : 0,
                        }));
                      }}
                    />
                  </label>
                  <label className="text-xs text-slate-300">
                    <span className="block text-slate-500 mb-0.5">
                      Penales · {detail.visitorTeamName ?? "Visitante"}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      className="w-24 rounded-lg border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-white tabular-nums"
                      value={penaltyForm.visitor}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        setPenaltyForm((p) => ({
                          ...p,
                          visitor: Number.isFinite(n)
                            ? Math.min(99, Math.max(0, Math.floor(n)))
                            : 0,
                        }));
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleSavePenaltyScore}
                    disabled={penaltyBusy}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold"
                  >
                    {penaltyBusy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : null}
                    Guardar penales
                  </button>
                </div>
              </div>
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

            {(canSubmitLineup || lineups.length > 0 || canDownloadReport || canMatchControl) && (
              <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-[0.15em]">
                      Planillas y acta
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Titulares, suplentes, cronología y descarga en CSV o PDF.
                    </p>
                  </div>
                  {canDownloadReport && (
                    <div className="flex flex-wrap items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={handleOpenActaPreview}
                        disabled={actaPreviewBusy}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {actaPreviewBusy ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                        Vista previa acta
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadReport}
                        disabled={reportBusy}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {reportBusy ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ListOrdered className="w-4 h-4" />
                        )}
                        CSV
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadReportPdf}
                        disabled={reportPdfBusy}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
                      >
                        {reportPdfBusy ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FileDown className="w-4 h-4" />
                        )}
                        PDF
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-3 mb-5">
                  {lineupAudit.map((a) => (
                    <div
                      key={a.teamName}
                      className={`rounded-xl border p-3 ${
                        a.ok
                          ? "border-emerald-200 bg-emerald-50/40"
                          : "border-amber-200 bg-amber-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-slate-900">
                          {a.teamName}
                        </p>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            a.ok
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {a.stateLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        {a.starters} titulares · {a.subs} suplentes
                      </p>
                      {a.issues.length > 0 ? (
                        <ul className="mt-2 text-xs text-amber-800 list-disc pl-4 space-y-0.5">
                          {a.issues.map((it) => (
                            <li key={it}>{it}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-xs text-emerald-800 font-medium">
                          Planilla validada para mesa.
                        </p>
                      )}
                      {a.players.length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs font-semibold text-slate-700">
                            Ver lo enviado
                          </summary>
                          <div className="mt-2 max-h-40 overflow-auto rounded-lg border border-slate-200 bg-white p-2 space-y-1">
                            {a.players.map((p) => {
                              const pid = p.playerId ?? p.PlayerId;
                              const pname = p.playerName ?? p.PlayerName ?? "Jugador";
                              const n = p.number ?? p.Number;
                              const role = String(p.role ?? p.Role ?? "");
                              return (
                                <div key={String(pid)} className="text-xs text-slate-700 flex items-center justify-between gap-2">
                                  <span>{pname}</span>
                                  <span className="text-slate-500">
                                    {role === "Starter" ? "Titular" : "Suplente"} ·{" "}
                                    {n == null || String(n).trim() === "" ? "Sin #" : `#${n}`}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mb-4 grid sm:grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                    <span className="font-semibold">{detail.localTeamName}:</span>{" "}
                    {localLineupStateLabel}
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                    <span className="font-semibold">{detail.visitorTeamName}:</span>{" "}
                    {visitorLineupStateLabel}
                  </div>
                </div>

                {canMatchControl && !finished && (
                  <div className="mb-5 rounded-xl border border-sky-200 bg-sky-50/60 p-3 space-y-3">
                    <p className="text-xs text-sky-900 font-medium">
                      Habilitación temporal de planilla
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="text-xs text-slate-700">
                        Minutos
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={lineupWindowMinutes}
                          onChange={(e) =>
                            setLineupWindowMinutes(
                              Math.max(1, Math.min(60, Number(e.target.value) || 1))
                            )
                          }
                          className="ml-2 w-20 rounded-lg border border-slate-200 bg-white px-2 py-1"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleOpenLineupTemporaryWindowForAll}
                        disabled={lineupWindowBusy || !localId || !visitorId}
                        className="inline-flex items-center gap-1 rounded-lg bg-sky-700 text-white px-3 py-1.5 text-xs font-semibold hover:bg-sky-800 disabled:opacity-50"
                      >
                        Reabrir ambos
                      </button>
                      <button
                        type="button"
                        onClick={handleCloseLineupTemporaryWindowForAll}
                        disabled={lineupWindowBusy}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Cerrar ahora
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenLineupTemporaryWindow("local")}
                        disabled={lineupWindowBusy || !localId}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Abrir local
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenLineupTemporaryWindow("visitor")}
                        disabled={lineupWindowBusy || !visitorId}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Abrir visitante
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2 text-xs text-slate-700">
                      <p>
                        {detail.localTeamName}:{" "}
                        {localWindowOpen
                          ? `habilitado hasta ${localOpenUntilDate?.toLocaleTimeString(
                              "es-PE",
                              {
                              hour: "2-digit",
                              minute: "2-digit",
                              }
                            )}`
                          : "cerrado"}
                      </p>
                      <p>
                        {detail.visitorTeamName}:{" "}
                        {visitorWindowOpen
                          ? `habilitado hasta ${visitorOpenUntilDate?.toLocaleTimeString(
                              "es-PE",
                              {
                              hour: "2-digit",
                              minute: "2-digit",
                              }
                            )}`
                          : "cerrado"}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Usa "Reabrir ambos" para evitar favoritismos y dar el mismo tiempo a local y visitante.
                    </p>
                  </div>
                )}

                {canSubmitLineup && (
                  <form onSubmit={handleSubmitLineup} className="space-y-4">
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      Si sos delegado/gestor del equipo y aún no enviaste planilla,
                      debés enviarla antes del partido (o en una ventana temporal habilitada por mesa).
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                      <label className="block text-sm min-w-[14rem]">
                        <span className="text-slate-600 font-medium">
                          Equipo
                        </span>
                        <select
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                          value={lineupSide}
                          onChange={(ev) => setLineupSide(ev.target.value)}
                        >
                          <option value="local" disabled={!canSubmitLocalLineup}>
                            {detail.localTeamName} (local)
                            {!canSubmitLocalLineup ? " · sin permiso" : ""}
                          </option>
                          <option value="visitor" disabled={!canSubmitVisitorLineup}>
                            {detail.visitorTeamName} (visitante)
                            {!canSubmitVisitorLineup ? " · sin permiso" : ""}
                          </option>
                        </select>
                      </label>
                      <p className="text-xs text-slate-500">
                        Podés corregir la planilla mientras esté abierta. Si está cerrada,
                        mesa puede reabrir temporalmente.
                      </p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2 text-xs text-slate-600">
                      <p>
                        <span className="font-semibold text-slate-700">{detail.localTeamName}:</span>{" "}
                        delegado {localDelegateLabel}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-700">{detail.visitorTeamName}:</span>{" "}
                        delegado {visitorDelegateLabel}
                      </p>
                    </div>

                    <div className="max-h-72 overflow-auto rounded-xl border border-slate-100">
                      {dualRosterLoading ? (
                        <p className="px-4 py-6 text-sm text-slate-500">
                          Cargando jugadores…
                        </p>
                      ) : lineupRoster.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-slate-500">
                          Sin jugadores disponibles.
                        </p>
                      ) : (
                        lineupRoster.map((p) => {
                          const pid = String(p.id ?? p.Id);
                          const pname = p.name ?? p.Name ?? "Jugador";
                          const num = p.number ?? p.Number;
                          return (
                            <div
                              key={pid}
                              className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 last:border-0"
                            >
                              <span className="text-sm text-slate-800 min-w-[12rem]">
                                {num != null && num !== "" ? `#${num} ` : ""}
                                {pname}
                              </span>
                              <div className="flex items-center gap-2 ml-auto">
                                <input
                                  type="number"
                                  min={0}
                                  max={99}
                                  value={lineupNumbers[pid] ?? num ?? ""}
                                  onChange={(ev) =>
                                    setLineupNumbers((prev) => ({
                                      ...prev,
                                      [pid]: ev.target.value,
                                    }))
                                  }
                                  className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
                                  placeholder="#"
                                  title="Número de camiseta"
                                />
                                <select
                                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
                                  value={lineupRoles[pid] ?? ""}
                                  onChange={(ev) =>
                                    setLineupRoles((prev) => ({
                                      ...prev,
                                      [pid]: ev.target.value,
                                    }))
                                  }
                                >
                                  <option value="">No convocado</option>
                                  <option value="starter">Titular</option>
                                  <option value="substitute">Suplente</option>
                                </select>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="submit"
                        disabled={lineupBusy || dualRosterLoading}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                      >
                        {lineupBusy ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ClipboardPlus className="w-4 h-4" />
                        )}
                        {hasExistingLineup ? "Actualizar planilla" : "Enviar planilla"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

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
                          {substitutionOutOptions.map((p) => {
                            const pid = p.id;
                            const pname = p.name;
                            const num = p.number;
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
                          {substitutionInOptions.map((p) => {
                            const pid = p.id;
                            const pname = p.name;
                            const num = p.number;
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
                        {eventPlayerOptions.map((p) => {
                          const pid = p.id;
                          const pname = p.name;
                          const num = p.number;
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
                        {getEventEditOptionsForTeam(eventEditDraft.teamId).map((p) => {
                          const pid = p.id;
                          const pname = p.name;
                          const num = p.number;
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
                        {getEventEditOptionsForTeam(eventEditDraft.teamId).map((p) => {
                          const pid = p.id;
                          const pname = p.name;
                          const num = p.number;
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
                      {getEventEditOptionsForTeam(eventEditDraft.teamId).map((p) => {
                        const pid = p.id;
                        const pname = p.name;
                        const num = p.number;
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
      {actaPreviewOpen && (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-label="Vista previa del acta"
          onClick={() => {
            setActaPreviewOpen(false);
            setActaPreview(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Vista previa del acta</h3>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200"
                onClick={() => {
                  setActaPreviewOpen(false);
                  setActaPreview(null);
                }}
              >
                Cerrar
              </button>
            </div>
            <div className="overflow-y-auto p-4 text-slate-800">
              {actaPreviewBusy && (
                <div className="flex items-center justify-center py-16 text-slate-500 gap-2 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Cargando acta…
                </div>
              )}
              {!actaPreviewBusy && actaPreview && (
                <div className="space-y-6 text-sm">
                  <ActaReportHeader
                    variant="modal"
                    leftLogoUrl={
                      actaPreview.leftLogoUrl ??
                      actaPreview.LeftLogoUrl ??
                      null
                    }
                    rightLogoUrl={
                      actaPreview.rightLogoUrl ??
                      actaPreview.RightLogoUrl ??
                      null
                    }
                    tournamentName={(() => {
                      const t =
                        actaPreview.tournamentName ?? actaPreview.TournamentName ?? "";
                      const c =
                        actaPreview.competitionName ?? actaPreview.CompetitionName ?? "";
                      if (t && c) return `${t} · ${c}`;
                      return t || c || "—";
                    })()}
                    disciplineName={
                      actaPreview.disciplineName ??
                      actaPreview.DisciplineName ??
                      "—"
                    }
                    localTeamName={
                      actaPreview.localTeamName ?? actaPreview.LocalTeamName ?? "Local"
                    }
                    visitorTeamName={
                      actaPreview.visitorTeamName ??
                      actaPreview.VisitorTeamName ??
                      "Visitante"
                    }
                    localScore={actaPreview.localScore ?? actaPreview.LocalScore ?? 0}
                    visitorScore={
                      actaPreview.visitorScore ?? actaPreview.VisitorScore ?? 0
                    }
                  />
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1 text-xs">
                    {!isPlaceholderScheduledDate(
                      actaPreview.scheduledAt ?? actaPreview.ScheduledAt
                    ) && (
                      <p>
                        <span className="font-semibold text-slate-600">Fecha / hora: </span>
                        {new Date(
                          actaPreview.scheduledAt ?? actaPreview.ScheduledAt
                        ).toLocaleString("es-PE", {
                          weekday: "long",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                    {(actaPreview.venueName ?? actaPreview.VenueName) && (
                      <p>
                        <span className="font-semibold text-slate-600">Sede: </span>
                        {actaPreview.venueName ?? actaPreview.VenueName}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold text-slate-600">Estado: </span>
                      {actaPreview.statusLabel ?? actaPreview.StatusLabel ?? "—"}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-600">Definición: </span>
                      {actaPreview.decisionType ?? actaPreview.DecisionType ?? "—"}
                    </p>
                    {(actaPreview.localPenaltyScore > 0 ||
                      actaPreview.visitorPenaltyScore > 0 ||
                      (actaPreview.LocalPenaltyScore ?? 0) > 0 ||
                      (actaPreview.VisitorPenaltyScore ?? 0) > 0) && (
                      <p>
                        <span className="font-semibold text-slate-600">Penales: </span>
                        {actaPreview.localPenaltyScore ?? actaPreview.LocalPenaltyScore ?? 0} —{" "}
                        {actaPreview.visitorPenaltyScore ?? actaPreview.VisitorPenaltyScore ?? 0}
                      </p>
                    )}
                    {(actaPreview.matchNote ?? actaPreview.MatchNote) && (
                      <p>
                        <span className="font-semibold text-slate-600">Nota partido: </span>
                        {actaPreview.matchNote ?? actaPreview.MatchNote}
                      </p>
                    )}
                  </div>
                  {(actaPreview.teams ?? actaPreview.Teams ?? []).map((team) => {
                    const tName = team.teamName ?? team.TeamName ?? "Equipo";
                    const tId = String(team.teamId ?? team.TeamId ?? tName);
                    const players = team.players ?? team.Players ?? [];
                    const startersCount =
                      team.startersCount ?? team.StartersCount ?? players.filter((p) =>
                        String(p.role ?? p.Role ?? "").toLowerCase().includes("titular")
                      ).length;
                    const subsCount =
                      team.substitutesCount ??
                      team.SubstitutesCount ??
                      players.filter((p) =>
                        String(p.role ?? p.Role ?? "").toLowerCase().includes("suplente")
                      ).length;
                    return (
                      <div key={tId} className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                          {tName}
                        </h4>
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                          <table className="min-w-full text-xs">
                            <thead className="bg-slate-100 text-slate-700 font-semibold">
                              <tr>
                                <th className="px-2 py-2 text-left">#</th>
                                <th className="px-2 py-2 text-left">Jugador</th>
                                <th className="px-2 py-2 text-left">Condición</th>
                                <th className="px-2 py-2 text-right">G</th>
                                <th className="px-2 py-2 text-right">TA</th>
                                <th className="px-2 py-2 text-right">2A</th>
                                <th className="px-2 py-2 text-right">TR</th>
                                <th className="px-2 py-2 text-right">R2A</th>
                                <th className="px-2 py-2 text-right">↓</th>
                                <th className="px-2 py-2 text-right">↑</th>
                                <th className="px-2 py-2 text-left">Obs.</th>
                              </tr>
                            </thead>
                            <tbody>
                              {players.map((p, pIdx) => {
                                const pid = p.playerId ?? p.PlayerId;
                                const pname = p.playerName ?? p.PlayerName ?? "—";
                                const n = p.number ?? p.Number;
                                const role = p.role ?? p.Role ?? "—";
                                return (
                                  <tr
                                    key={pid != null ? String(pid) : `${tId}-p-${pIdx}`}
                                    className="border-t border-slate-100"
                                  >
                                    <td className="px-2 py-1.5 tabular-nums">{n ?? "—"}</td>
                                    <td className="px-2 py-1.5">{pname}</td>
                                    <td className="px-2 py-1.5">{role}</td>
                                    <td className="px-2 py-1.5 text-right tabular-nums">
                                      {p.goals ?? p.Goals ?? 0}
                                    </td>
                                    <td className="px-2 py-1.5 text-right tabular-nums">
                                      {p.yellowCards ?? p.YellowCards ?? 0}
                                    </td>
                                    <td className="px-2 py-1.5 text-right tabular-nums">
                                      {p.secondYellowCards ?? p.SecondYellowCards ?? 0}
                                    </td>
                                    <td className="px-2 py-1.5 text-right tabular-nums">
                                      {p.directRedCards ?? p.DirectRedCards ?? 0}
                                    </td>
                                    <td className="px-2 py-1.5 text-right tabular-nums">
                                      {p.doubleYellowRedCards ?? p.DoubleYellowRedCards ?? 0}
                                    </td>
                                    <td className="px-2 py-1.5 text-right tabular-nums">
                                      {p.substitutionsOut ?? p.SubstitutionsOut ?? 0}
                                    </td>
                                    <td className="px-2 py-1.5 text-right tabular-nums">
                                      {p.substitutionsIn ?? p.SubstitutionsIn ?? 0}
                                    </td>
                                    <td className="px-2 py-1.5 text-slate-600 max-w-[140px] truncate">
                                      {p.observation ?? p.Observation ?? "—"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot className="bg-slate-50 font-semibold text-slate-800">
                              <tr className="border-t border-slate-200">
                                <td colSpan={3} className="px-2 py-2">
                                  Resumen · Titulares {startersCount} · Suplentes {subsCount}
                                </td>
                                <td className="px-2 py-2 text-right tabular-nums">
                                  {team.totalGoals ?? team.TotalGoals ?? 0}
                                </td>
                                <td className="px-2 py-2 text-right tabular-nums">
                                  {team.totalYellowCards ?? team.TotalYellowCards ?? 0}
                                </td>
                                <td className="px-2 py-2 text-right tabular-nums">
                                  {team.totalSecondYellowCards ?? team.TotalSecondYellowCards ?? 0}
                                </td>
                                <td className="px-2 py-2 text-right tabular-nums">
                                  {team.totalDirectRedCards ?? team.TotalDirectRedCards ?? 0}
                                </td>
                                <td className="px-2 py-2 text-right tabular-nums">
                                  {team.totalDoubleYellowRedCards ??
                                    team.TotalDoubleYellowRedCards ??
                                    0}
                                </td>
                                <td className="px-2 py-2 text-right tabular-nums">
                                  {team.totalSubstitutionsOut ?? team.TotalSubstitutionsOut ?? 0}
                                </td>
                                <td className="px-2 py-2 text-right tabular-nums">
                                  {team.totalSubstitutionsIn ?? team.TotalSubstitutionsIn ?? 0}
                                </td>
                                <td />
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                  {(actaPreview.timeline ?? actaPreview.Timeline ?? []).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                        Cronología
                      </h4>
                      <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="min-w-full text-xs">
                          <thead className="bg-slate-100 text-slate-700 font-semibold">
                            <tr>
                              <th className="px-2 py-2 text-left">Per.</th>
                              <th className="px-2 py-2 text-left">Min</th>
                              <th className="px-2 py-2 text-left">Tipo</th>
                              <th className="px-2 py-2 text-left">Equipo</th>
                              <th className="px-2 py-2 text-left">Detalle</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(actaPreview.timeline ?? actaPreview.Timeline ?? []).map(
                              (row, idx) => (
                                <tr key={idx} className="border-t border-slate-100">
                                  <td className="px-2 py-1.5 tabular-nums">
                                    {row.period ?? row.Period ?? "—"}
                                  </td>
                                  <td className="px-2 py-1.5 tabular-nums">
                                    {row.minute ?? row.Minute ?? "—"}
                                  </td>
                                  <td className="px-2 py-1.5">
                                    {row.category ?? row.Category ?? "—"}
                                  </td>
                                  <td className="px-2 py-1.5">
                                    {row.teamName ?? row.TeamName ?? "—"}
                                  </td>
                                  <td className="px-2 py-1.5">{row.text ?? row.Text ?? ""}</td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
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

/**
 * ZonaHoraria: localStorage + BroadcastChannel + API (estado compartido para visitantes anónimos).
 */

import * as signalR from "@microsoft/signalr";
import api from "../api/axiosConfig";
import config from "../config";

export const ZONA_HORARIA_STORAGE_KEY = "siged:zonaHorariaTest:v1";
/** Misma pestaña: storage no dispara; BroadcastChannel a veces falla; esto notifica a todos los suscriptores. */
export const ZONA_HORARIA_WINDOW_EVENT = "siged-zona-horaria-update";
const BC_NAME = "siged-zona-horaria-test";

/** @returns {import('./zonaHorariaTestSync').ZonaHorariaTestState} */
export function defaultZonaHorariaTestState() {
  return {
    v: 1,
    /** 0 = nunca persistido; permite que el primer GET del API reemplace al estado local vacío. */
    updatedAt: 0,
    publicBannerEnabled: false,
    publicShowMs: true,
    /** 'chrono' | 'countdown' | 'both' */
    publicShowMode: "both",
    chrono: {
      running: false,
      baseMs: 0,
      startedAt: null,
    },
    countdown: {
      configuredSec: 60,
      running: false,
      endAt: null,
      remainingMsFrozen: 60_000,
    },
  };
}

/** Texto legible de la vista pública (modo + ms) para banner y panel admin. */
export function describePublicZonaHorariaView(mode, showMs) {
  const vista =
    mode === "chrono"
      ? "Solo cronómetro"
      : mode === "countdown"
        ? "Solo cuenta regresiva"
        : "Cronómetro y cuenta regresiva";
  return `${vista} · milisegundos ${showMs ? "sí" : "no"}`;
}

/** @param {unknown} raw */
export function parseZonaHorariaState(raw) {
  const base = defaultZonaHorariaTestState();
  if (!raw || typeof raw !== "object") return base;
  const o = /** @type {Record<string, unknown>} */ (raw);
  if (o.v !== 1) return base;
  const ch = o.chrono && typeof o.chrono === "object" ? o.chrono : {};
  const cd = o.countdown && typeof o.countdown === "object" ? o.countdown : {};
  return {
    v: 1,
    updatedAt: typeof o.updatedAt === "number" ? o.updatedAt : 0,
    publicBannerEnabled: !!o.publicBannerEnabled,
    publicShowMs: o.publicShowMs !== false,
    publicShowMode:
      o.publicShowMode === "chrono" || o.publicShowMode === "countdown"
        ? o.publicShowMode
        : "both",
    chrono: {
      running: !!ch.running,
      baseMs: Math.max(0, Number(ch.baseMs) || 0),
      startedAt: ch.startedAt != null ? Number(ch.startedAt) : null,
    },
    countdown: {
      configuredSec: Math.max(1, Math.min(86400, Number(cd.configuredSec) || 60)),
      running: !!cd.running,
      endAt: cd.endAt != null ? Number(cd.endAt) : null,
      remainingMsFrozen: Math.max(0, Number(cd.remainingMsFrozen) ?? 60_000),
    },
  };
}

export function loadZonaHorariaState() {
  try {
    const s = localStorage.getItem(ZONA_HORARIA_STORAGE_KEY);
    if (!s) return defaultZonaHorariaTestState();
    return parseZonaHorariaState(JSON.parse(s));
  } catch {
    return defaultZonaHorariaTestState();
  }
}

/** @returns {Promise<import('./zonaHorariaTestSync').ZonaHorariaTestState | null>} */
export async function pullZonaHorariaFromServer() {
  try {
    if (!config.API_URL) return null;
    const { data } = await api.get("/ZonaHoraria/public");
    return parseZonaHorariaState(data);
  } catch {
    return null;
  }
}

/** @param {import('./zonaHorariaTestSync').ZonaHorariaTestState} state */
export function pushZonaHorariaToServer(state) {
  if (!config.API_URL) return;
  api
    .put("/ZonaHoraria/public", state)
    .catch((e) => {
      if (import.meta.env.DEV) console.warn("[ZonaHoraria] PUT public", e?.response?.status, e?.message);
    });
}

/** @param {import('./zonaHorariaTestSync').ZonaHorariaTestState} state */
export function saveZonaHorariaState(state) {
  const next = { ...state, updatedAt: Date.now() };
  try {
    localStorage.setItem(ZONA_HORARIA_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  try {
    const bc = new BroadcastChannel(BC_NAME);
    bc.postMessage({ type: "update", payload: next });
    bc.close();
  } catch {
    /* ignore */
  }
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(ZONA_HORARIA_WINDOW_EVENT));
    }
  } catch {
    /* ignore */
  }
  pushZonaHorariaToServer(next);
  return next;
}

/** @param {import('./zonaHorariaTestSync').ZonaHorariaTestState} state */
export function getChronoElapsedMs(state, now = Date.now()) {
  const { running, baseMs, startedAt } = state.chrono;
  if (running && startedAt != null) return Math.max(0, baseMs + (now - startedAt));
  return Math.max(0, baseMs);
}

/** @param {import('./zonaHorariaTestSync').ZonaHorariaTestState} state */
export function getCountdownRemainingMs(state, now = Date.now()) {
  const { running, endAt, remainingMsFrozen } = state.countdown;
  if (running && endAt != null) return Math.max(0, endAt - now);
  return Math.max(0, remainingMsFrozen);
}

function pad2(n) {
  return String(Math.floor(n)).padStart(2, "0");
}

/** @param {number} ms @param {boolean} showMs */
export function formatDurationMs(ms, showMs) {
  const x = Math.max(0, Math.floor(ms));
  const h = Math.floor(x / 3_600_000);
  const m = Math.floor((x % 3_600_000) / 60_000);
  const s = Math.floor((x % 60_000) / 1000);
  const z = x % 1000;
  if (showMs) {
    if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}.${String(z).padStart(3, "0")}`;
    return `${pad2(m)}:${pad2(s)}.${String(z).padStart(3, "0")}`;
  }
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`;
  return `${pad2(m)}:${pad2(s)}`;
}

const remoteSubscribers = new Set();
/** @type {ReturnType<typeof setInterval> | null} */
let remotePollTimer = null;
/** @type {signalR.HubConnection | null} */
let zonaHorariaHub = null;
/** @type {Promise<void> | null} */
let zonaHorariaHubStart = null;

function notifyRemoteSubscribers(state) {
  remoteSubscribers.forEach((cb) => {
    try {
      cb(state);
    } catch {
      /* ignore */
    }
  });
}

function mergeRemoteIfNewer(remote) {
  if (!remote || typeof remote.updatedAt !== "number") return false;
  const local = loadZonaHorariaState();
  if (remote.updatedAt <= local.updatedAt) return false;
  try {
    localStorage.setItem(ZONA_HORARIA_STORAGE_KEY, JSON.stringify(remote));
  } catch {
    /* ignore */
  }
  return true;
}

async function syncFromServerOnce() {
  const remote = await pullZonaHorariaFromServer();
  if (remote && mergeRemoteIfNewer(remote)) {
    notifyRemoteSubscribers(remote);
  }
}

function ensureServerPolling() {
  if (remotePollTimer != null) return;
  remotePollTimer = window.setInterval(() => void syncFromServerOnce(), 2000);
  void syncFromServerOnce();
}

function stopServerPollingIfIdle() {
  if (remotePollTimer != null) {
    clearInterval(remotePollTimer);
    remotePollTimer = null;
  }
}

async function ensureZonaHorariaHub() {
  const apiUrl = String(config.API_URL || import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  if (!apiUrl || typeof window === "undefined") return;
  if (zonaHorariaHub) return;
  if (zonaHorariaHubStart) return zonaHorariaHubStart;

  zonaHorariaHubStart = (async () => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${apiUrl}/tournamentHub`, {
        withCredentials: true,
        transport:
          signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveZonaHorariaPublic", (payload) => {
      try {
        const raw = typeof payload === "string" ? JSON.parse(payload) : payload;
        const remote = parseZonaHorariaState(raw);
        if (mergeRemoteIfNewer(remote)) {
          notifyRemoteSubscribers(remote);
        }
      } catch {
        /* ignore */
      }
    });

    await connection.start();
    await connection.invoke("JoinZonaHorariaFeed");
    zonaHorariaHub = connection;
  })()
    .catch((err) => {
      if (import.meta.env.DEV) console.warn("[ZonaHoraria] SignalR", err);
    })
    .finally(() => {
      zonaHorariaHubStart = null;
    });

  return zonaHorariaHubStart;
}

function teardownRemoteIfIdle() {
  stopServerPollingIfIdle();
  if (zonaHorariaHub) {
    zonaHorariaHub.stop().catch(() => {});
    zonaHorariaHub = null;
  }
}

/**
 * Suscripción: local + servidor (GET periódico + SignalR) para que el público anónimo vea lo mismo que el SUPERADMIN.
 * @param {(state: import('./zonaHorariaTestSync').ZonaHorariaTestState) => void} fn
 */
export function subscribeZonaHoraria(fn) {
  fn(loadZonaHorariaState());

  remoteSubscribers.add(fn);
  if (remoteSubscribers.size === 1) {
    ensureServerPolling();
    void ensureZonaHorariaHub();
  }

  const push = () => fn(loadZonaHorariaState());

  const onStorage = (e) => {
    if (e.key !== ZONA_HORARIA_STORAGE_KEY) return;
    push();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(ZONA_HORARIA_WINDOW_EVENT, push);

  let bc = null;
  try {
    bc = new BroadcastChannel(BC_NAME);
    bc.onmessage = (ev) => {
      if (ev?.data?.type === "update" && ev.data.payload) {
        fn(parseZonaHorariaState(ev.data.payload));
      }
    };
  } catch {
    /* no BC */
  }

  return () => {
    remoteSubscribers.delete(fn);
    if (remoteSubscribers.size === 0) {
      teardownRemoteIfIdle();
    }
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(ZONA_HORARIA_WINDOW_EVENT, push);
    if (bc) bc.close();
  };
}

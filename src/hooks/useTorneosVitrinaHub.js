import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import config from "../config";
import {
  fetchPublicLandingMatches,
  fetchPublicTournaments,
} from "../api/tournamentsPublicService";

function normalizeId(v) {
  if (v == null) return "";
  return String(v).toLowerCase();
}

/** Clave estable por lista de IDs (no cambia si solo varían marcadores). */
export function buildLandingMatchIdsKey(matches) {
  if (!matches?.length) return "";
  return matches
    .map((m) => m?.id)
    .filter(Boolean)
    .map(String)
    .sort()
    .join("|");
}

/**
 * Hub /tournamentHub:
 * - JoinLandingFeed / JoinTournamentsFeed → refrescos de listados
 * - JoinMatchRoom por partido → ReceiveMatchUpdate (marcador)
 */
export function useTorneosVitrinaHub({
  enabled,
  landingIdsKey,
  setLandingMatches,
  setTournaments,
}) {
  const connRef = useRef(null);
  const landingIdsKeyRef = useRef(landingIdsKey);
  landingIdsKeyRef.current = landingIdsKey;

  useEffect(() => {
    if (!enabled) return undefined;

    const apiUrl = String(config.API_URL || import.meta.env.VITE_API_URL || "")
      .replace(/\/$/, "");
    if (!apiUrl) return undefined;

    const hubUrl = `${apiUrl}/tournamentHub`;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        withCredentials: true,
        transport:
          signalR.HttpTransportType.WebSockets |
          signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .build();

    connRef.current = connection;

    const joinMatchRoomsForIds = (conn, matchList) => {
      const ids = (matchList ?? [])
        .map((m) => m?.id)
        .filter(Boolean)
        .map(String);
      if (!ids.length) return Promise.resolve();
      return Promise.all(
        ids.map((id) => conn.invoke("JoinMatchRoom", id))
      ).catch((e) => {
        if (import.meta.env.DEV) console.warn("[SignalR] JoinMatchRoom", e);
      });
    };

    const joinMatchRooms = (conn) => {
      const ids = landingIdsKeyRef.current.split("|").filter(Boolean);
      return joinMatchRoomsForIds(
        conn,
        ids.map((id) => ({ id }))
      );
    };

    const joinFeeds = (conn) =>
      Promise.all([
        conn.invoke("JoinLandingFeed"),
        conn.invoke("JoinTournamentsFeed"),
      ]).catch((e) => {
        if (import.meta.env.DEV)
          console.warn("[SignalR] JoinLandingFeed / JoinTournamentsFeed", e);
      });

    let lastLandingRefreshAt = 0;
    const onLandingRefresh = async () => {
      const now = Date.now();
      if (now - lastLandingRefreshAt < 200) return;
      lastLandingRefreshAt = now;
      try {
        const data = await fetchPublicLandingMatches();
        setLandingMatches(data);
        if (connection.state === signalR.HubConnectionState.Connected) {
          await joinMatchRoomsForIds(connection, data);
        }
      } catch (e) {
        if (import.meta.env.DEV) console.warn("[SignalR] ReceiveLandingRefresh", e);
      }
    };

    /** PascalCase (C#) y camelCase (serialización JSON típica en el protocolo). */
    connection.on("ReceiveLandingRefresh", onLandingRefresh);
    connection.on("receiveLandingRefresh", onLandingRefresh);

    const onTournamentsRefresh = async () => {
      try {
        const data = await fetchPublicTournaments();
        setTournaments(data);
      } catch (e) {
        if (import.meta.env.DEV)
          console.warn("[SignalR] ReceiveTournamentsRefresh", e);
      }
    };

    connection.on("ReceiveTournamentsRefresh", onTournamentsRefresh);
    connection.on("receiveTournamentsRefresh", onTournamentsRefresh);

    const onMatchUpdate = (payload) => {
      const mid = payload?.matchId;
      if (mid == null) return;
      const n = normalizeId(mid);
      setLandingMatches((prev) =>
        prev.map((m) => {
          if (normalizeId(m.id) !== n) return m;
          const next = { ...m };
          if (payload.localScore !== undefined)
            next.localScore = payload.localScore;
          if (payload.visitorScore !== undefined)
            next.visitorScore = payload.visitorScore;
          if (payload.status === "Finalizado") next.status = 2;
          return next;
        })
      );
    };

    connection.on("ReceiveMatchUpdate", onMatchUpdate);
    connection.on("receiveMatchUpdate", onMatchUpdate);

    connection.onreconnected(() => {
      joinFeeds(connection).then(() => joinMatchRooms(connection));
    });

    let cancelled = false;
    connection
      .start()
      .then(() => {
        if (cancelled) return;
        return joinFeeds(connection).then(() => joinMatchRooms(connection));
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.warn("[SignalR] tournamentHub", err);
      });

    return () => {
      cancelled = true;
      connRef.current = null;
      connection.stop().catch(() => {});
    };
  }, [enabled, setLandingMatches, setTournaments]);

  useEffect(() => {
    if (!enabled) return undefined;
    const conn = connRef.current;
    if (!conn || conn.state !== signalR.HubConnectionState.Connected) return undefined;
    const ids = landingIdsKey.split("|").filter(Boolean);
    if (!ids.length) return undefined;
    Promise.all(ids.map((id) => conn.invoke("JoinMatchRoom", id))).catch(
      () => {}
    );
    return undefined;
  }, [enabled, landingIdsKey]);
}

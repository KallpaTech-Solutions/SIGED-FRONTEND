import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import config from "../config";
import { fetchPublicLandingMatchesByCompetition } from "../api/tournamentsPublicService";

function normalizeId(v) {
  if (v == null) return "";
  return String(v).toLowerCase();
}

/**
 * Igual que la vitrina /torneos pero solo lista y actualización de partidos de una competencia.
 * - JoinLandingFeed → ReceiveLandingRefresh vuelve a pedir GET .../by-competition/{id}/landing
 * - JoinMatchRoom por cada id → ReceiveMatchUpdate (marcador)
 */
export function useCompetitionVitrinaHub({
  enabled,
  competitionId,
  matchIdsKey,
  setLandingMatches,
  /** Tras refrescar landing (programación, vitrina): vuelve a cargar el public-dashboard (sedes, horarios). */
  onLandingRefetchComplete,
}) {
  const connRef = useRef(null);
  const matchIdsKeyRef = useRef(matchIdsKey);
  const competitionIdRef = useRef(competitionId);
  matchIdsKeyRef.current = matchIdsKey;
  competitionIdRef.current = competitionId;

  useEffect(() => {
    if (!enabled || !competitionId) return undefined;

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
      const ids = matchIdsKeyRef.current.split("|").filter(Boolean);
      return joinMatchRoomsForIds(
        conn,
        ids.map((id) => ({ id }))
      );
    };

    const joinLanding = (conn) =>
      conn.invoke("JoinLandingFeed").catch((e) => {
        if (import.meta.env.DEV)
          console.warn("[SignalR] JoinLandingFeed", e);
      });

    let lastLandingRefreshAt = 0;
    const onLandingRefresh = async () => {
      const now = Date.now();
      if (now - lastLandingRefreshAt < 200) return;
      lastLandingRefreshAt = now;
      const cid = competitionIdRef.current;
      if (!cid) return;
      try {
        const data = await fetchPublicLandingMatchesByCompetition(cid);
        setLandingMatches(data);
        if (onLandingRefetchComplete) {
          try {
            await onLandingRefetchComplete(cid);
          } catch {
            /* ignore */
          }
        }
        if (connection.state === signalR.HubConnectionState.Connected) {
          await joinMatchRoomsForIds(connection, data);
        }
      } catch (e) {
        if (import.meta.env.DEV)
          console.warn("[SignalR] ReceiveLandingRefresh (competition)", e);
      }
    };

    connection.on("ReceiveLandingRefresh", onLandingRefresh);
    connection.on("receiveLandingRefresh", onLandingRefresh);

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
      joinLanding(connection).then(() => joinMatchRooms(connection));
    });

    let cancelled = false;
    connection
      .start()
      .then(() => {
        if (cancelled) return;
        return joinLanding(connection).then(() => joinMatchRooms(connection));
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.warn("[SignalR] tournamentHub", err);
      });

    return () => {
      cancelled = true;
      connRef.current = null;
      connection.stop().catch(() => {});
    };
  }, [enabled, competitionId, setLandingMatches, onLandingRefetchComplete]);

  useEffect(() => {
    if (!enabled || !competitionId) return undefined;
    const conn = connRef.current;
    if (!conn || conn.state !== signalR.HubConnectionState.Connected)
      return undefined;
    const ids = matchIdsKey.split("|").filter(Boolean);
    if (!ids.length) return undefined;
    Promise.all(ids.map((id) => conn.invoke("JoinMatchRoom", id))).catch(
      () => {}
    );
    return undefined;
  }, [enabled, competitionId, matchIdsKey]);
}

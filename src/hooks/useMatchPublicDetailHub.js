import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import config from "../config";
import { fetchMatchPublicDetailEnriched } from "../api/tournamentsPublicService";

function normalizeId(v) {
  if (v == null) return "";
  return String(v).toLowerCase();
}

/**
 * Une el partido al hub y, tras cada actualización del marcador, vuelve a cargar detalle + eventos.
 */
export function useMatchPublicDetailHub(matchId, enabled, setDetail) {
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!enabled || !matchId) return undefined;

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

    const refresh = () => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          const data = await fetchMatchPublicDetailEnriched(matchId);
          setDetail(data);
        } catch {
          /* ignore */
        }
      }, 450);
    };

    const onMatchUpdate = (payload) => {
      const mid = payload?.matchId;
      if (mid == null) return;
      if (normalizeId(mid) !== normalizeId(matchId)) return;
      refresh();
    };

    connection.on("ReceiveMatchUpdate", onMatchUpdate);
    connection.on("receiveMatchUpdate", onMatchUpdate);

    let cancelled = false;
    connection
      .start()
      .then(() => {
        if (cancelled) return;
        return connection.invoke("JoinMatchRoom", String(matchId));
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.warn("[SignalR] partido", err);
      });

    return () => {
      cancelled = true;
      clearTimeout(debounceRef.current);
      connection.stop().catch(() => {});
    };
  }, [matchId, enabled, setDetail]);
}

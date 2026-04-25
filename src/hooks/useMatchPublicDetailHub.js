import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import config from "../config";
import { fetchMatchPublicDetailEnriched } from "../api/tournamentsPublicService";

function normalizeId(v) {
  if (v == null) return "";
  return String(v).toLowerCase();
}

/**
 * Une el partido al hub y sincroniza marcador / estado / reloj al instante.
 * Refetch completo solo cuando cambia la línea de tiempo (eventos).
 */
export function useMatchPublicDetailHub(
  matchId,
  enabled,
  setDetail,
  preferMesaDetail = false
) {
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

    const scheduleFullRefresh = () => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          const data = await fetchMatchPublicDetailEnriched(matchId, {
            preferMesaDetail,
          });
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

      setDetail((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        if ("status" in payload && payload.status != null) {
          next.status = payload.status;
        }
        if ("localScore" in payload) {
          next.localScore = payload.localScore;
        }
        if ("visitorScore" in payload) {
          next.visitorScore = payload.visitorScore;
        }
        if ("clockAccumulatedSeconds" in payload) {
          next.clockAccumulatedSeconds = payload.clockAccumulatedSeconds;
        }
        if ("clockPeriodAnchorUtc" in payload) {
          next.clockPeriodAnchorUtc = payload.clockPeriodAnchorUtc;
        }
        if ("clockWidgetKind" in payload && payload.clockWidgetKind != null) {
          next.clockWidgetKind = payload.clockWidgetKind;
        }
        if ("broadcastWidgetJson" in payload && payload.broadcastWidgetJson != null) {
          next.broadcastWidgetJson = payload.broadcastWidgetJson;
        }
        return next;
      });

      /**
       * Refetch completo siempre (debounced): el snapshot del hub no trae la lista de eventos,
       * y acciones como «siguiente periodo» o cronómetro solo mandan HubMatchSnapshot sin lastEvent.
       * Sin esto el público veía el acumulado/ancla bien pero periodo/eventos viejos.
       */
      scheduleFullRefresh();
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
  }, [matchId, enabled, setDetail, preferMesaDetail]);
}

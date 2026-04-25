import React, { useEffect, useRef, useState } from "react";
import { Radio } from "lucide-react";
import { putMatchBroadcastWidget } from "../../api/matchesControlService";
import {
  BROADCAST_TEMPLATE,
  parseMatchBroadcastWidgetFromDetail,
  parseMatchBroadcastWidgetState,
  switchBroadcastTemplate,
  toBroadcastWidgetPayload,
} from "../../utils/matchBroadcastWidget";
import { MatchBroadcastSportMesa } from "./MatchBroadcastSportMesa";
import { MatchBroadcastTimeOnlyControls } from "./MatchBroadcastTimeOnlyControls";

const TEMPLATE_OPTIONS = [
  { value: BROADCAST_TEMPLATE.Time, label: "Solo tiempos (cronómetro / reloj / cuenta regresiva)" },
  { value: BROADCAST_TEMPLATE.Soccer, label: "Fútbol — marcador + periodo" },
  { value: BROADCAST_TEMPLATE.Futsal, label: "Futsal — marcador, faltas, periodo" },
  { value: BROADCAST_TEMPLATE.Basketball, label: "Básquet — puntos, faltas, periodo, tiro" },
  { value: BROADCAST_TEMPLATE.Volleyball, label: "Vóley — set, puntos, sets ganados, saque" },
];

/**
 * Mesa: elige plantilla de vitrina y edita solo los controles que aplican a esa plantilla.
 */
export function MatchBroadcastMesaControls({
  matchId,
  detail,
  live,
  mesaBusy,
  onSaved,
  toast,
}) {
  const [local, setLocal] = useState(() => parseMatchBroadcastWidgetState(null));
  const [nowMs, setNowMs] = useState(() => Date.now());
  const localRef = useRef(local);

  useEffect(() => {
    localRef.current = local;
  }, [local]);

  useEffect(() => {
    setLocal(parseMatchBroadcastWidgetFromDetail(detail));
  }, [detail]);

  useEffect(() => {
    if (!live) return undefined;
    const id = window.setInterval(() => setNowMs(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [live]);

  const commit = async (next) => {
    const body = toBroadcastWidgetPayload(next, Date.now());
    try {
      await putMatchBroadcastWidget(matchId, body);
      setLocal(parseMatchBroadcastWidgetState(body));
      onSaved?.();
    } catch (e) {
      toast(
        e?.response?.data?.message ??
          e?.response?.data ??
          "No se pudo guardar el widget de transmisión.",
        "error"
      );
    }
  };

  const homeName = detail?.localTeamName ?? detail?.LocalTeamName ?? "";
  const awayName = detail?.visitorTeamName ?? detail?.VisitorTeamName ?? "";

  return (
    <div className="rounded-xl border border-emerald-700/50 bg-emerald-950/40 px-3 py-3 space-y-3 text-emerald-50">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-300/90">
        <Radio className="w-3.5 h-3.5" />
        Widgets de transmisión
      </div>
      <p className="text-[10px] text-emerald-200/70">
        Elegí una plantilla: cada una muestra solo lo necesario en la vitrina pública. Los eventos del
        acta siguen usando el cronómetro de juego y el periodo (o set) indicado en el tablero.
      </p>

      <label className="flex items-center gap-2 cursor-pointer text-xs text-emerald-100/90">
        <input
          type="checkbox"
          className="rounded border-emerald-600"
          checked={!!local.showZonaHorariaOnMatch}
          disabled={mesaBusy || !live}
          onChange={(e) =>
            void commit({
              ...localRef.current,
              showZonaHorariaOnMatch: e.target.checked,
            })
          }
        />
        Mostrar ZonaHoraria (prueba, no es el cronómetro del partido) en esta página
      </label>

      <label className="block text-xs font-medium text-emerald-100/90">
        Plantilla de vitrina
        <select
          className="mt-1 w-full rounded-lg bg-slate-900 border border-emerald-700 px-2 py-2 text-white text-xs"
          value={local.template}
          disabled={mesaBusy || !live}
          onChange={(e) =>
            void commit(switchBroadcastTemplate(localRef.current, e.target.value))
          }
        >
          {TEMPLATE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {local.template === BROADCAST_TEMPLATE.Time ? (
        <MatchBroadcastTimeOnlyControls
          local={local}
          localRef={localRef}
          setLocal={setLocal}
          commit={commit}
          mesaBusy={mesaBusy}
          live={live}
          nowMs={nowMs}
        />
      ) : (
        <MatchBroadcastSportMesa
          template={local.template}
          local={local}
          localRef={localRef}
          commit={commit}
          mesaBusy={mesaBusy}
          live={live}
          nowMs={nowMs}
          homeName={homeName}
          awayName={awayName}
        />
      )}
    </div>
  );
}

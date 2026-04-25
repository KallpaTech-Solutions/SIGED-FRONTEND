import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, Radio, ArrowRight, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  BROADCAST_TEMPLATE,
  parseMatchBroadcastWidgetState,
} from "../../utils/matchBroadcastWidget";
import { defaultStatsPanel } from "../../utils/matchBroadcastStatsPanel";
import { MatchBroadcastHero } from "../../components/matchBroadcast/MatchBroadcastHero";
import { SoccerStatsPanelHero } from "../../components/matchBroadcast/SoccerStatsPanelHero";

/** @param {string} template */
function buildDemoWidget(template) {
  const base = parseMatchBroadcastWidgetState(null);
  const sport = {
    ...base.sport,
    labelHome: "Local FC",
    labelAway: "Visita United",
    scoreHome: 2,
    scoreAway: 1,
    period: 2,
    foulsHome: 4,
    foulsAway: 5,
    yellowHome: 1,
    yellowAway: 2,
    redHome: 0,
    redAway: 0,
    cornersHome: 5,
    cornersAway: 3,
    freeKicksHome: 2,
    freeKicksAway: 4,
    shotSec: 18,
    setsHome: 1,
    setsAway: 0,
    serveHome: true,
  };
  let statsPanel = base.statsPanel;
  if (template === BROADCAST_TEMPLATE.Soccer) {
    statsPanel = {
      ...defaultStatsPanel(),
      enabled: true,
      showDuringPeriodBreak: true,
      shotsHome: 12,
      shotsAway: 11,
      shotsOnTargetHome: 4,
      shotsOnTargetAway: 3,
      foulsHome: 11,
      foulsAway: 10,
      offsidesHome: 1,
      offsidesAway: 3,
      yellowsHome: 0,
      yellowsAway: 2,
      redsHome: 0,
      redsAway: 0,
      possessionHomePct: 39,
    };
  }
  return {
    ...base,
    template,
    sport,
    eventPeriod: sport.period,
    heroShowChrono: true,
    heroShowSystemClock: true,
    statsPanel,
  };
}

const PLANTILLAS = [
  {
    key: BROADCAST_TEMPLATE.Time,
    titulo: "Solo tiempos",
    desc: "Cronómetro, reloj del sistema y cuenta regresiva. Ideal cuando no necesitás tablero con goles.",
    mesa:
      "En la mesa del partido: activá qué tiempos se muestran al público, iniciá/pausá el cronómetro y la cuenta regresiva.",
  },
  {
    key: BROADCAST_TEMPLATE.Soccer,
    titulo: "Fútbol",
    desc: "Tiempo de juego, nombres, goles y periodo (estilo tablero LED). Panel opcional de estadísticas.",
    mesa:
      "Plantilla fútbol: marcador y periodo desde la mesa; el panel de estadísticas puede limitarse al entretiempo (tras «Fin de periodo» en el acta). ZonaHoraria opcional solo en la página del partido.",
  },
  {
    key: BROADCAST_TEMPLATE.Futsal,
    titulo: "Futsal",
    desc: "Como fútbol más faltas por equipo y periodo.",
    mesa: "Ajustá goles, faltas y periodo; el reloj de juego es el mismo cronómetro compartido.",
  },
  {
    key: BROADCAST_TEMPLATE.Basketball,
    titulo: "Básquet",
    desc: "Puntos, periodo, faltas, reloj de juego y tiempo de tiro (24/14).",
    mesa: "Puntos, faltas, periodo y shot clock; el reloj de juego usa el cronómetro de la mesa.",
  },
  {
    key: BROADCAST_TEMPLATE.Volleyball,
    titulo: "Vóley",
    desc: "Puntos del set, set actual, sets ganados e indicador de saque.",
    mesa: "Puntos del set, sets ganados, set actual y botón de cambio de saque.",
  },
];

export default function WidgetsTransmisionPage() {
  const { can } = useAuth();
  const autorizado = can("tourn.match.widgets") || can("tourn.match.control");
  const [openKey, setOpenKey] = useState(/** @type {string | null} */ (null));

  const demoByKey = useMemo(() => {
    const m = {};
    for (const p of PLANTILLAS) {
      m[p.key] = buildDemoWidget(p.key);
    }
    return m;
  }, []);

  const openPlantilla = openKey ? PLANTILLAS.find((p) => p.key === openKey) : null;
  const demoState = openKey ? demoByKey[openKey] : null;

  if (!autorizado) {
    return (
      <div className="max-w-lg mx-auto rounded-2xl border border-amber-200 bg-amber-50/80 px-6 py-8 text-center">
        <p className="font-semibold text-amber-950">Sin permiso</p>
        <p className="text-sm text-amber-900/80 mt-2">
          Necesitás <code className="text-xs">tourn.match.widgets</code> o{" "}
          <code className="text-xs">tourn.match.control</code> para usar widgets de transmisión.
        </p>
        <Link
          to="/PanelControl"
          className="inline-flex mt-4 text-sm font-bold text-amber-800 underline"
        >
          Volver al panel
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
          <LayoutGrid className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Widgets de transmisión
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Elegí la plantilla en cada partido <strong>en vivo</strong>: la vitrina pública y la mesa
            comparten el mismo estado por API y SignalR. Hacé clic en una tarjeta para ver cómo se ve
            al público y un resumen de uso en mesa (sin salir de esta página).
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-600" />
          Dónde configurarlo
        </h2>
        <p className="text-sm text-slate-700 mb-4">
          Abrí un torneo, la mesa de partidos, y entrá al partido en vivo. En el panel{" "}
          <strong>Widgets de transmisión</strong> elegís plantilla y opciones (estadísticas, ZonaHoraria,
          etc.).
        </p>
        <Link
          to="/PanelControl/torneos"
          className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-800"
        >
          Ir a torneos
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Plantillas disponibles
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {PLANTILLAS.map((p) => (
            <li key={p.key}>
              <button
                type="button"
                onClick={() => setOpenKey(p.key)}
                className="w-full text-left rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm hover:border-emerald-400 hover:bg-white transition-colors"
              >
                <p className="font-bold text-slate-900">{p.titulo}</p>
                <p className="text-slate-600 text-xs mt-1 leading-relaxed">{p.desc}</p>
                <p className="text-[10px] text-emerald-700 font-semibold mt-2">
                  Clic para vista previa y uso →
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-slate-500">
        Permiso de API para guardar el widget: política{" "}
        <code className="bg-slate-100 px-1 rounded">tourn.mesa.broadcast</code> (mesa o widgets).
      </p>

      {openPlantilla && demoState ? (
        <div
          className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="widget-preview-title"
          onClick={() => setOpenKey(null)}
        >
          <div
            className="w-full sm:max-w-2xl max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3">
              <div>
                <h3 id="widget-preview-title" className="text-base font-bold text-slate-900">
                  {openPlantilla.titulo}
                </h3>
                <p className="text-xs text-slate-600 mt-1">{openPlantilla.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenKey(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-6 flex-1">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Cómo lo ve el público (vista previa estática)
                </p>
                <div className="rounded-xl border border-slate-200 bg-slate-900 p-3">
                  <MatchBroadcastHero
                    widgetState={demoState}
                    live
                    homeName="Local FC"
                    awayName="Visita United"
                  />
                  <SoccerStatsPanelHero
                    widgetState={demoState}
                    live
                    inPeriodBreak={demoState.template === BROADCAST_TEMPLATE.Soccer}
                    homeName="Local FC"
                    awayName="Visita United"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  Vista demo: en fútbol el ejemplo asume entretiempo si activaste «solo descanso entre
                  periodos». En vivo, el panel aparece tras registrar «Fin de periodo» hasta el inicio del
                  siguiente.
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Mesa de control
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">{openPlantilla.mesa}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

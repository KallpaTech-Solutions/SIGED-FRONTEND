import React from "react";
import { ChevronLeft, ChevronRight, Radio } from "lucide-react";
import LiveMatchCard from "./LiveMatchCard";
import LiveMatchMockCard from "./LiveMatchMockCard";

function isLiveStatus(status) {
  return status === 1 || status === "EnVivo";
}

export default function LiveMatchesCarousel({
  matches = [],
  titleLive = "En vivo",
  titleSchedule = "Agenda de hoy",
  /** En /torneos se muestran tarjetas de ejemplo si no hay en vivo; en competencia suele ocultarse. */
  showLiveMockWhenEmpty = true,
}) {
  const scrollerLiveRef = React.useRef(null);
  const scrollerDayRef = React.useRef(null);

  const liveMatches = matches.filter((m) => isLiveStatus(m.status));
  const dayMatches = matches.filter((m) => !isLiveStatus(m.status));

  const showMock = showLiveMockWhenEmpty && liveMatches.length === 0;

  const scroll = (ref, dir) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir === "next" ? 320 : -320, behavior: "smooth" });
  };

  return (
    <div className="space-y-8">
      {/* En vivo o mockup (fila oculta si no hay en vivo y no se usan mocks) */}
      {(showMock || liveMatches.length > 0) && (
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 ${showMock ? "bg-amber-400" : "bg-red-400"}`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${showMock ? "bg-amber-500" : "bg-red-500"}`}
              />
            </span>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.18em]">
              {showMock ? "Centro de juego (vista previa)" : titleLive}
            </h2>
          </div>
          {!showMock && (
            <div className="hidden sm:flex gap-1">
              <button
                type="button"
                onClick={() => scroll(scrollerLiveRef, "prev")}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll(scrollerLiveRef, "next")}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                aria-label="Siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {showMock ? (
          <div className="flex flex-wrap gap-4">
            <LiveMatchMockCard
              discipline="Fútbol"
              localName="Ingeniería Agrícola"
              visitorName="Medicina Veterinaria"
              localScore={2}
              visitorScore={1}
            />
            <LiveMatchMockCard
              discipline="Vóley"
              localName="Forestal"
              visitorName="Agronomía"
              localScore={25}
              visitorScore={22}
              badge="Ejemplo"
            />
          </div>
        ) : (
          <div
            ref={scrollerLiveRef}
            className="flex gap-4 overflow-x-auto pb-2 pt-1 scroll-smooth"
            style={{ scrollbarWidth: "thin" }}
          >
            {liveMatches.map((m) => (
              <LiveMatchCard key={m.id} match={m} />
            ))}
          </div>
        )}
      </section>
      )}

      {/* Agenda del día (programados / finalizados hoy) */}
      {dayMatches.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.18em]">
              {titleSchedule}
            </h2>
            <div className="hidden sm:flex gap-1">
              <button
                type="button"
                onClick={() => scroll(scrollerDayRef, "prev")}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll(scrollerDayRef, "next")}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                aria-label="Siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div
            ref={scrollerDayRef}
            className="flex gap-4 overflow-x-auto pb-2 pt-1 scroll-smooth"
            style={{ scrollbarWidth: "thin" }}
          >
            {dayMatches.map((m) => (
              <LiveMatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* Sin datos del día */}
      {!showMock && matches.length === 0 && showLiveMockWhenEmpty && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Radio className="w-9 h-9 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">
            No hay partidos registrados para hoy en el sistema.
          </p>
        </div>
      )}
    </div>
  );
}

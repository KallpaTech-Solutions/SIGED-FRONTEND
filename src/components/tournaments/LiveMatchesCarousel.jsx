import React from "react";
import { ChevronLeft, ChevronRight, Radio } from "lucide-react";
import LiveMatchCard from "./LiveMatchCard";

function isLiveStatus(status) {
  return status === 1 || status === "EnVivo";
}

/** Icono tipo transmisión (ondas grises) con punto central rojo pulsante. */
function PulsingBroadcastIcon() {
  return (
    <div className="relative flex h-10 w-10 items-center justify-center">
      <Radio className="h-8 w-8 text-slate-300" strokeWidth={1.5} aria-hidden />
      <span
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-3 w-3 items-center justify-center"
        aria-hidden
      >
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600 ring-2 ring-white" />
      </span>
    </div>
  );
}

function EmptyStateCard({ title, description, hint }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/90 to-emerald-50/40 shadow-[0_8px_30px_rgba(15,23,42,0.06)]"
      role="status"
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-400/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-12 h-44 w-44 rounded-full bg-slate-400/10 blur-3xl"
        aria-hidden
      />
      <div className="relative z-10 flex flex-col items-center justify-center px-6 py-12 sm:py-14 text-center max-w-lg mx-auto">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md border border-slate-100">
          <PulsingBroadcastIcon />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
          {title}
        </h3>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-sm">
          {description}
        </p>
        {hint ? (
          <p className="mt-4 text-xs text-slate-500">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

export default function LiveMatchesCarousel({
  matches = [],
  titleLive = "En vivo",
  titleSchedule = "Agenda de hoy",
}) {
  const scrollerLiveRef = React.useRef(null);
  const scrollerDayRef = React.useRef(null);

  const liveMatches = matches.filter((m) => isLiveStatus(m.status));
  const dayMatches = matches.filter((m) => !isLiveStatus(m.status));

  const scroll = (ref, dir) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir === "next" ? 320 : -320, behavior: "smooth" });
  };

  if (matches.length === 0) {
    return (
      <EmptyStateCard
        title="No hay partidos para hoy"
        description="Aún no hay encuentros cargados en el calendario del día. Cuando el fixture esté publicado, los partidos en vivo y la agenda aparecerán en esta vitrina."
        hint="Los marcadores en vivo se actualizan automáticamente."
      />
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {liveMatches.length > 0 ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 bg-red-400" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-300" />
              )}
            </span>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.18em]">
              {titleLive}
            </h2>
          </div>
          {liveMatches.length > 0 && (
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

        {liveMatches.length > 0 ? (
          <div
            ref={scrollerLiveRef}
            className="flex gap-4 overflow-x-auto pb-2 pt-1 scroll-smooth"
            style={{ scrollbarWidth: "thin" }}
          >
            {liveMatches.map((m) => (
              <LiveMatchCard key={m.id} match={m} />
            ))}
          </div>
        ) : (
          <EmptyStateCard
            title="No hay partidos en vivo"
            description={
              <>
                Cuando un encuentro pase a{" "}
                <span className="font-semibold text-slate-800">en vivo</span>, el
                marcador aparecerá aquí y se actualizará en tiempo real.
              </>
            }
            hint={
              dayMatches.length > 0
                ? "Revisá la agenda del día debajo."
                : null
            }
          />
        )}
      </section>

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
    </div>
  );
}


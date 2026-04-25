import React from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Construction,
  ChevronRight,
  Sparkles,
  Target,
} from "lucide-react";

export default function CalendarioPage() {
  return (
    <div className="w-full flex-1 flex flex-col min-h-0 bg-slate-50 font-inter">
      {/* Header ejecutivo - Calendario competitivo */}
      <section className="bg-gradient-to-r from-slate-900 via-emerald-900 to-emerald-700 border-b border-border/20 py-10 md:py-14">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-900 border border-slate-800/60 shadow-[0_24px_60px_rgba(15,23,42,0.45)] px-6 py-8 md:px-10 md:py-10 text-white overflow-hidden relative">
            <div className="absolute top-4 right-4 opacity-20">
              <Sparkles className="w-16 h-16 text-amber-300" />
            </div>
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-200 text-[10px] font-bold uppercase tracking-[0.22em] mb-4">
                  <Construction size={14} /> En desarrollo
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Calendario competitivo
                </h1>
                <p className="text-sm text-slate-200/90 mt-3 max-w-2xl">
                  Próximamente: cronograma oficial de encuentros, fases eliminatorias
                  por disciplina y toda la agenda para que planifiques tu participación.
                  Una vista única para seguir día a día las competencias deportivas de la UNAS.
                </p>
              </div>
              <div className="shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-sky-500/20 border border-sky-400/50 flex items-center justify-center">
                  <CalendarDays className="w-10 h-10 text-sky-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Qué incluirá */}
      <section className="container mx-auto px-4 py-10 max-w-5xl">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] mb-6">
          Lo que esperamos ofrecer
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <Target className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">Vista ejecutiva</h3>
              <p className="text-sm text-slate-600">
                Calendario por mes y por disciplina, con filtros y exportación.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
              <CalendarDays className="w-6 h-6 text-sky-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">Fechas y sedes</h3>
              <p className="text-sm text-slate-600">
                Encuentros oficiales, sedes y horarios en un solo lugar.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Volver al inicio
          </Link>
          <Link
            to="/torneos"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-emerald-500 text-emerald-700 text-sm font-semibold hover:bg-emerald-50 transition-colors"
          >
            Ver torneos
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

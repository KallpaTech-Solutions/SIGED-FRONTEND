import React from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Construction,
  ChevronRight,
  Award,
  Calendar,
} from "lucide-react";

const disciplines = [
  { name: "Fútbol", emoji: "⚽", category: "Varones y mujeres" },
  { name: "Futsal", emoji: "🏃", category: "Varones y mujeres" },
  { name: "Vóley", emoji: "🏐", category: "Varones y mujeres" },
  { name: "Básquet", emoji: "🏀", category: "Varones y mujeres" },
];

export default function TorneosPublicPage() {
  return (
    <div className="w-full min-h-screen bg-slate-50 font-inter">
      {/* Header ejecutivo */}
      <section className="bg-gradient-to-r from-slate-900 via-emerald-900 to-emerald-700 border-b border-border/20 py-10 md:py-14">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-900 border border-slate-800/60 shadow-[0_24px_60px_rgba(15,23,42,0.45)] px-6 py-8 md:px-10 md:py-10 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-200 text-[10px] font-bold uppercase tracking-[0.22em] mb-4">
                  <Construction size={14} /> En desarrollo
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Torneos y competencias UNAS
                </h1>
                <p className="text-sm text-slate-200/90 mt-2 max-w-2xl">
                  Próximamente: fixtures, llaves de campeonato y toda la agenda de las
                  olimpiadas inter escuelas profesionales. Una experiencia tipo
                  justa deportiva institucional.
                </p>
              </div>
              <div className="shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center">
                  <Trophy className="w-10 h-10 text-emerald-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Qué esperar */}
      <section className="container mx-auto px-4 py-10 max-w-5xl">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] mb-6">
          Lo que estamos preparando
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-slate-600" />
              </div>
              <h3 className="font-semibold text-slate-800">Fixtures y cronograma</h3>
            </div>
            <p className="text-sm text-slate-600">
              Fechas oficiales de encuentros, fases de grupos y eliminatorias por
              disciplina.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Award className="w-5 h-5 text-slate-600" />
              </div>
              <h3 className="font-semibold text-slate-800">Llaves de campeonato</h3>
            </div>
            <p className="text-sm text-slate-600">
              Cuadros de eliminación directa, posiciones y resultados en tiempo real.
            </p>
          </div>
        </div>

        {/* Disciplinas */}
        <div className="mt-10">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">
            Disciplinas (varones y mujeres)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {disciplines.map((d) => (
              <div
                key={d.name}
                className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm"
              >
                <span className="text-2xl block mb-2">{d.emoji}</span>
                <p className="font-semibold text-slate-800 text-sm">{d.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{d.category}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Volver al inicio
          </Link>
          <Link
            to="/noticias"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-emerald-500 text-emerald-700 text-sm font-semibold hover:bg-emerald-50 transition-colors"
          >
            Ver noticias
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

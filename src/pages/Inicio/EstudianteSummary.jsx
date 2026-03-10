import React from 'react';
import { Trophy, Calendar, Zap } from 'lucide-react';

export default function EstudianteSummary() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Card */}
      <div className="bg-linear-to-r from-primary to-primary-800 p-10 rounded-[2.5rem] text-white shadow-xl shadow-primary/10 relative overflow-hidden">
        <Zap size={140} className="absolute -right-10 -bottom-10 text-white/10 -rotate-12" />
        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold tracking-tight mb-3 uppercase">¡Hola de nuevo!</h2>
          <p className="text-white/80 font-medium text-sm leading-relaxed">
            Bienvenido a tu portal deportivo oficial de la UNAS. Aquí podrás inscribirte en torneos y ver tus resultados.
          </p>
        </div>
      </div>

      {/* Empty State / Construction */}
      <div className="bg-white p-16 rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6">
          <Calendar size={32} className="text-slate-300" />
        </div>
        <p className="font-bold text-slate-400 uppercase tracking-[0.2em] text-[10px] mb-2">Próximamente</p>
        <p className="text-slate-800 font-bold text-lg">Tu actividad deportiva aparecerá aquí</p>
        <p className="text-slate-500 text-sm mt-1 max-w-xs">Estamos preparando la vista de tus equipos, partidos programados y estadísticas de juego.</p>
      </div>
    </div>
  );
}
import React from 'react';
import { Trophy, Clock, Construction } from 'lucide-react';

export default function TorneosPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="bg-amber-100 p-6 rounded-full text-amber-600 animate-bounce">
        <Trophy size={48} />
      </div>
      <div className="max-w-md">
        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Módulo de Torneos</h1>
        <div className="flex items-center justify-center gap-2 text-amber-600 font-bold text-sm mt-2 mb-4">
          <Construction size={16} /> EN DESARROLLO PRÓXIMAMENTE
        </div>
        <p className="text-slate-500 text-sm leading-relaxed">
          Esta sección permitirá la creación de eventos, gestión de llaves de competencia e inscripción de equipos por facultad.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        <div className="p-4 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center">
          <Clock size={20} className="text-slate-300 mb-2" />
          <span className="text-[10px] font-bold text-slate-400 uppercase">Fase 2</span>
        </div>
        <div className="p-4 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center">
          <Trophy size={20} className="text-slate-300 mb-2" />
          <span className="text-[10px] font-bold text-slate-400 uppercase">Premiación</span>
        </div>
      </div>
    </div>
  );
}
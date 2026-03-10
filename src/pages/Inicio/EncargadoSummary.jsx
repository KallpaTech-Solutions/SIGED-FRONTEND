import React from 'react';
import { Shield, Users, ClipboardCheck } from 'lucide-react';

export default function EncargadoSummary() {
  return (
    <div className="p-2 space-y-8 animate-fade-in">
      <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white shadow-lg flex items-center justify-between relative overflow-hidden">
        <Shield size={100} className="absolute -right-4 -bottom-4 text-white/5" />
        <div className="relative z-10">
          <h2 className="text-3xl font-bold uppercase tracking-tight mb-2">Gestión de Facultad</h2>
          <p className="text-slate-400 font-medium">Panel administrativo para Coordinadores Deportivos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 flex flex-col items-center text-center">
          <Users size={32} className="text-primary mb-4" />
          <h4 className="font-bold text-slate-800 uppercase text-xs tracking-widest mb-2">Delegados</h4>
          <p className="text-slate-500 text-sm">Gestiona y valida a los delegados de cada disciplina de tu facultad.</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 flex flex-col items-center text-center">
          <ClipboardCheck size={32} className="text-primary mb-4" />
          <h4 className="font-bold text-slate-800 uppercase text-xs tracking-widest mb-2">Inscripciones</h4>
          <p className="text-slate-500 text-sm">Próximamente podrás aprobar las fichas de inscripción de tus alumnos.</p>
        </div>
      </div>
    </div>
  );
}
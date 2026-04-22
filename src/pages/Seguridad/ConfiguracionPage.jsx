import React from "react";
import { Settings, LayoutDashboard, ShieldCheck } from "lucide-react";
import RolesPage from "./RolesPage";
import DashboardPreferences from "./DashboardPreferences";

export default function ConfiguracionPage() {
  return (
    <div className="space-y-8 pb-16 font-inter">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 md:px-6 md:py-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
          <Settings size={22} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Sistema
          </p>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            Roles, permisos y preferencias del panel. Cada bloque está separado para que encuentres
            rápido lo que necesitás.
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="text-emerald-400" size={20} />
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-[0.2em]">
            Seguridad y roles
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-2">
          Define qué perfiles existen en el sistema y qué permisos tiene cada uno. Ideal para
          administradores del SIGED.
        </p>
        <RolesPage />
      </section>

      <section id="preferencias-dashboard" className="scroll-mt-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <LayoutDashboard className="text-emerald-600" size={20} />
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-[0.18em]">
            Preferencias de dashboard
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-2">
          Personaliza qué bloques aparecen en tu resumen ejecutivo de inicio. Cada usuario puede
          tener una vista distinta.
        </p>
        <DashboardPreferences />
      </section>
    </div>
  );
}
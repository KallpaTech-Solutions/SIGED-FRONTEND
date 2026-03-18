import React from "react";
import { Settings, LayoutDashboard, ShieldCheck } from "lucide-react";
import RolesPage from "./RolesPage";
import DashboardPreferences from "./DashboardPreferences";

export default function ConfiguracionPage() {
  return (
    <div className="space-y-10 pb-20 font-inter">
      {/* Cabecera Principal ejecutiva */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-900 border border-slate-800/80 shadow-[0_24px_70px_rgba(15,23,42,0.9)] px-6 sm:px-8 py-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/60 text-emerald-300">
            <Settings size={30} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-300/80 mb-1">
              Panel Maestro · Configuración
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Centro de configuración del sistema
            </h1>
            <p className="text-[11px] md:text-sm text-slate-300 mt-2 max-w-2xl">
              Administra los roles, permisos y la vista de inicio de SIGED UNAS desde un único
              panel ejecutivo, con control fino sobre seguridad y experiencia de usuario.
            </p>
          </div>
        </div>
      </div>

      {/* Secciones en columna para escalar mejor cuando haya más configuraciones */}
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

      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <LayoutDashboard className="text-emerald-400" size={20} />
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-[0.2em]">
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
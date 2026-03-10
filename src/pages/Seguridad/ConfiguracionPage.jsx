import React from 'react';
import { Settings } from 'lucide-react';
import RolesPage from './RolesPage';

export default function ConfiguracionPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 border-b pb-4">
        <Settings className="text-primary" size={32} />
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
            Configuración del Sistema
          </h1>
          <p className="text-slate-500 text-sm">
            Administración de roles, permisos y políticas de seguridad.
          </p>
        </div>
      </div>

      {/* Módulo de Roles y Permisos */}
      <RolesPage />
    </div>
  );
}
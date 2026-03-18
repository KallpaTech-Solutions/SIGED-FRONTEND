import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Trophy,
  Users,
  Settings,
  LayoutDashboard,
  School,
  Activity,
  ChevronRight,
  Loader2,
  Newspaper,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, can, loading } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 1. Pantalla de carga global del Dashboard (Evita parpadeos y llamadas antes de tener usuario)
  if (loading || !user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f8fafc]">
        <Loader2 className="animate-spin text-primary mb-4" size={40} />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Iniciando Entorno SIGED...</p>
      </div>
    );
  }

  const isActive = (path) => 
    location.pathname === path || (path !== '/PanelControl' && location.pathname.startsWith(path));

  // 2. Definición de Menú (Asegúrate de que 'can' esté funcionando con los permisos de la DB)
  const menuItems = [
    { title: "Inicio", path: "/PanelControl", icon: LayoutDashboard, visible: true },
    { title: "Usuarios UNAS", path: "/PanelControl/usuarios", icon: Users, visible: can("security.user.view") },
    {
      title: "Facultades",
      path: "/PanelControl/organizaciones",
      icon: School,
      visible: can("core.org.view") || user?.rol?.toUpperCase() === "SUPERADMIN",
    },
    {
      title: "Noticias",
      path: "/PanelControl/noticias",
      icon: Newspaper,
      visible: can("news.view"),
    },
    { title: "Torneos Activos", path: "/PanelControl/torneos", icon: Trophy, visible: can("comp.tourn.view") },
    { title: "Configuración", path: "/PanelControl/configuracion", icon: Settings, visible: can("security.role.manage") },
  ];

  const menuFiltrado = menuItems.filter(item => item.visible);

  // 3. Mapeo de Títulos (Más limpio que ternarios)
  const roleTitles = {
    'SUPERADMIN': 'Panel de Control OTI',
    'ADMIN': 'Panel de Control OTI',
    'ENCARGADO': 'Gestión de Facultad',
    'ESTUDIANTE': 'Portal del Estudiante'
  };
  
  const dashboardTitle = roleTitles[user?.rol?.toUpperCase()] || 'Portal SIGED';

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] bg-[#f8fafc] font-inter text-slate-900">
      {/* --- SIDEBAR MÓVIL (drawer) --- */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)}>
          <aside
            className="absolute inset-y-0 left-0 w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 flex items-center justify-between border-b border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">
                Menú SIGED
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <nav className="space-y-1.5">
                {menuFiltrado.map((item, index) => (
                  <Link
                    key={index}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between group w-full px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all duration-200 ${
                      isActive(item.path)
                        ? "bg-emerald-500/15 text-emerald-300 shadow-sm shadow-emerald-500/20"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-all ${
                          isActive(item.path)
                            ? "border-emerald-400/60 bg-slate-900/60"
                            : "border-slate-700 bg-slate-900/40 group-hover:border-slate-500"
                        }`}
                      >
                        <item.icon
                          size={16}
                          strokeWidth={isActive(item.path) ? 2.4 : 2}
                          className={
                            isActive(item.path)
                              ? "text-emerald-300"
                              : "text-slate-400 group-hover:text-slate-100"
                          }
                        />
                      </div>
                      <span>{item.title}</span>
                    </div>
                    {isActive(item.path) && (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>
        </div>
      )}

      {/* --- SIDEBAR DESKTOP --- */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-100 flex-col sticky top-16 h-[calc(100vh-64px)] z-10 border-r border-slate-800">
        <div className="p-6 flex-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.26em] mb-6 pl-2">
            Administración
          </p>

          <nav className="space-y-1.5">
            {menuFiltrado.map((item, index) => (
              <Link 
                key={index}
                to={item.path} 
                className={`flex items-center justify-between group w-full px-4 py-2.5 rounded-xl text-[12px] font-semibold transition-all duration-200 ${
                  isActive(item.path) 
                  ? "bg-emerald-500/15 text-emerald-300 shadow-sm shadow-emerald-500/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-all ${
                    isActive(item.path)
                      ? "border-emerald-400/60 bg-slate-900/60"
                      : "border-slate-700 bg-slate-900/40 group-hover:border-slate-500"
                  }`}>
                    <item.icon
                      size={16}
                      strokeWidth={isActive(item.path) ? 2.4 : 2}
                      className={isActive(item.path) ? "text-emerald-300" : "text-slate-400 group-hover:text-slate-100"}
                    />
                  </div>
                  <span>{item.title}</span>
                </div>
                {isActive(item.path) && (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Footer del Sidebar */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-300 border border-emerald-400/40">
              <Activity size={16} />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                Organización
              </span>
              <span
                className="text-[11px] font-semibold text-slate-100 truncate"
                title={user?.nombreOrganizacion || "Sede Central"}
              >
                {user?.nombreOrganizacion || "Sede Central"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <header className="mb-6 md:mb-10">
            <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-600 px-5 py-4 md:px-8 md:py-6 shadow-[0_20px_60px_rgba(15,23,42,0.55)] border border-slate-800/60 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                {/* Botón para abrir sidebar en mobile */}
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/60 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-100 md:hidden"
                >
                  <Menu size={14} />
                  Menú del panel
                </button>

                <div className="flex items-center gap-2 text-emerald-200/80 mb-1">
                  <span className="text-[9px] font-bold uppercase tracking-[0.28em]">
                    Panel Principal
                  </span>
                  <ChevronRight size={11} className="text-emerald-300" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-emerald-100">
                    {menuItems.find(i => isActive(i.path))?.title || 'Inicio'}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
                  {dashboardTitle}
                </h1>
                <p className="mt-1 text-[11px] text-slate-200/80 max-w-xl">
                  Vista ejecutiva del entorno SIGED. Personaliza tu panel desde{' '}
                  <span className="font-semibold">Configuración &gt; Mi Dashboard</span>.
                </p>
              </div>
            </div>
          </header>

          <div className="animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
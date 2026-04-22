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
  Layers,
  Shirt,
  UserPlus,
  MapPin,
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
    {
      title: "Gestión de equipos",
      path: "/PanelControl/gestion-equipos",
      icon: UserPlus,
      visible: can("tourn.team.manage"),
    },
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
    {
      title: "Torneos Activos",
      path: "/PanelControl/torneos",
      icon: Trophy,
      visible:
        can("comp.tourn.view") ||
        can("tourn.view") ||
        can("tourn.manage") ||
        can("tourn.team.manage") ||
        can("tourn.match.control"),
    },
    {
      title: "Equipos y planteles",
      path: "/PanelControl/torneos/equipos",
      icon: Shirt,
      visible: can("tourn.manage"),
    },
    {
      title: "Sedes y canchas",
      path: "/PanelControl/torneos/sedes",
      icon: MapPin,
      visible: can("tourn.manage"),
    },
    {
      title: "Disciplinas",
      path: "/PanelControl/disciplinas",
      icon: Layers,
      visible:
        can("tourn.view") ||
        can("tourn.manage") ||
        can("tourn.team.manage"),
    },
    { title: "Configuración", path: "/PanelControl/configuracion", icon: Settings, visible: can("security.role.manage") },
  ];

  const menuFiltrado = menuItems.filter(item => item.visible);

  // 3. Mapeo de Títulos (Más limpio que ternarios)
  const roleTitles = {
    SUPERADMIN: "Panel de Control",
    ADMIN: "Panel de Control",
    ENCARGADO: "Gestión de Facultad",
    ESTUDIANTE: "Portal del Estudiante",
    DELEGADO_ESCUELA: "Delegado de escuela — Torneos",
    DELEGADO: "Delegado de escuela — Torneos",
  };
  
  const dashboardTitle = roleTitles[user?.rol?.toUpperCase()] || 'Portal SIGED';

  /** Título y subtítulo según la ruta: el banner refleja el módulo actual (menos repetición con la página). */
  const pathNorm = location.pathname.replace(/\/$/, "") || "/PanelControl";
  const firstSeg = pathNorm.startsWith("/PanelControl")
    ? pathNorm.slice("/PanelControl".length).replace(/^\//, "").split("/")[0]
    : "";
  const moduleByRoute = {
    usuarios: { title: "Usuarios UNAS", subtitle: "Cuentas y permisos de acceso." },
    organizaciones: { title: "Facultades", subtitle: "Organizaciones y sedes." },
    noticias: { title: "Noticias", subtitle: "Comunicación institucional." },
    "gestion-equipos": {
      title: "Gestión de equipos",
      subtitle:
        "Inscribí equipos en torneos y administrá jugadores desde el panel.",
    },
    torneos: { title: "Torneos", subtitle: "Torneos y competencias." },
    disciplinas: { title: "Disciplinas", subtitle: "Catálogo deportivo y reglas maestras." },
    configuracion: { title: "Configuración", subtitle: "Roles, permisos y preferencias del panel." },
  };
  const moduleInfo = firstSeg ? moduleByRoute[firstSeg] : null;
  const isPanelHome = pathNorm === "/PanelControl" || pathNorm === "";
  const headerMainTitle = isPanelHome || !moduleInfo ? dashboardTitle : moduleInfo.title;
  const headerSubtitle = isPanelHome
    ? null
    : moduleInfo?.subtitle ?? null;
  const canOpenConfig = can("security.role.manage");

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

      {/* --- SIDEBAR DESKTOP ---
          Solo altura natural + sticky (sin h=100vh): si no, el pie del sidebar queda
          fijo abajo del viewport y se superpone al <Footer> global al hacer scroll. */}
      <aside className="hidden md:flex w-64 shrink-0 bg-slate-900 text-slate-100 flex-col self-start sticky top-16 max-h-[calc(100vh-4rem)] overflow-hidden z-[1] border-r border-slate-800">
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6">
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

        {/* Bloque contextual (no anclado al borde inferior de la ventana) */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-300 border border-emerald-400/40 shrink-0">
              <Activity size={16} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                Organización
              </span>
              <span
                className="text-[11px] font-semibold text-slate-100 break-words"
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
          <header className="mb-5 md:mb-8">
            <div className="rounded-2xl bg-gradient-to-r from-slate-800 via-slate-900 to-emerald-800 px-4 py-4 md:px-6 md:py-5 shadow-lg shadow-slate-900/20 border border-slate-700/50 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div className="min-w-0">
                {/* Botón para abrir sidebar en mobile */}
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100 md:hidden"
                >
                  <Menu size={14} />
                  Menú del panel
                </button>

                <div className="flex items-center gap-2 text-emerald-200/70 mb-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-[0.24em]">
                    Panel principal
                  </span>
                  <ChevronRight size={11} className="text-emerald-400/80 shrink-0" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-emerald-100 truncate">
                    {menuItems.find(i => isActive(i.path))?.title || "Inicio"}
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
                  {headerMainTitle}
                </h1>
                {!isPanelHome && (
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium uppercase tracking-wide">
                    {dashboardTitle}
                  </p>
                )}
                {headerSubtitle && (
                  <p className="mt-2 text-xs text-slate-300/90 max-w-xl leading-relaxed">
                    {headerSubtitle}
                  </p>
                )}
                {isPanelHome && (
                  <p className="mt-2 text-[11px] text-slate-300/85 max-w-xl leading-relaxed">
                    Resumen de tu entorno SIGED.
                    {canOpenConfig ? (
                      <>
                        {" "}
                        Personalizá widgets en{" "}
                        <Link
                          to="/PanelControl/configuracion#preferencias-dashboard"
                          className="font-semibold text-emerald-300 hover:text-emerald-200 underline decoration-emerald-500/50 underline-offset-2"
                        >
                          Configuración → Preferencias de dashboard
                        </Link>
                        .
                      </>
                    ) : (
                      <> Contactá a un administrador si necesitás cambios de permisos.</>
                    )}
                  </p>
                )}
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
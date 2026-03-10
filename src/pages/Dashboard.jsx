import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { 
  Trophy, 
  Users, 
  Settings, 
  LayoutDashboard, 
  School, 
  Activity,
  ChevronRight,
  Loader2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, can, loading } = useAuth(); // 👈 Añadimos loading si tu context lo tiene
  const location = useLocation();

  // 1. Pantalla de carga global del Dashboard (Evita parpadeos)
  if (loading) {
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
    { title: 'Inicio', path: '/PanelControl', icon: LayoutDashboard, visible: true },
    { title: 'Usuarios UNAS', path: '/PanelControl/usuarios', icon: Users, visible: can('security.user.view') },
    { 
      title: 'Facultades', 
      path: '/PanelControl/organizaciones', 
      icon: School, 
      visible: can('core.org.view') || user?.rol?.toUpperCase() === 'SUPERADMIN' 
    },
    { title: 'Torneos Activos', path: '/PanelControl/torneos', icon: Trophy, visible: can('comp.tourn.view') },
    { title: 'Configuración', path: '/PanelControl/configuracion', icon: Settings, visible: can('security.role.manage') },
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
    <div className="flex min-h-[calc(100vh-64px)] bg-[#f8fafc] font-inter text-slate-900">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col sticky top-16 h-[calc(100vh-64px)] z-10">
        <div className="p-6 flex-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 pl-2">
            Administración
          </p>
          
          <nav className="space-y-1.5">
            {menuFiltrado.map((item, index) => (
              <Link 
                key={index}
                to={item.path} 
                className={`flex items-center justify-between group w-full px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                  isActive(item.path) 
                  ? "bg-primary/5 text-primary" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} strokeWidth={isActive(item.path) ? 2.5 : 2} /> 
                  <span>{item.title}</span>
                </div>
                {isActive(item.path) && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
              </Link>
            ))}
          </nav>
        </div>

        {/* Footer del Sidebar */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Activity size={16} />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Organización</span>
              <span className="text-[11px] font-bold text-slate-700 truncate" title={user?.nombreOrganizacion || "Sede Central"}>
                {user?.nombreOrganizacion || "Sede Central"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <header className="mb-10 flex justify-between items-end">
            <div>
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                 <span className="text-[10px] font-bold uppercase tracking-widest">Panel Principal</span>
                 <ChevronRight size={12} />
                 <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    {menuItems.find(i => isActive(i.path))?.title || 'Inicio'}
                 </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                {dashboardTitle}
              </h1>
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
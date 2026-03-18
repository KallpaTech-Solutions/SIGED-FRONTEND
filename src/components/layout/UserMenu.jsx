import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  User, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  Trophy, 
  HelpCircle,
  ChevronDown
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function UserMenu() {
  const { user, logout, loggingOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();
  const inDashboard = location.pathname.startsWith("/PanelControl");

  // Cerrar el menú si se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative font-inter" ref={menuRef}>
      {/* Botón Disparador */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 pl-4 border-l hover:opacity-80 transition-all group ${
          inDashboard ? "border-white/15" : "border-border"
        }`}
      >
        <div className="flex flex-col items-end leading-none">
          <span
            className={`text-[13px] font-bold mb-1 ${
              inDashboard ? "text-slate-100" : "text-foreground"
            }`}
          >
            {user.nombreCompleto}
          </span>
          <span
            className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter border ${
              inDashboard
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-400/40"
                : "bg-primary/5 text-primary border-primary/30"
            }`}
          >
            {user?.rol}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <div
            className={`w-9 h-9 rounded-full border flex items-center justify-center font-bold text-xs overflow-hidden ${
              inDashboard
                ? "bg-slate-800 border-slate-600 text-slate-100"
                : "bg-muted border-border text-muted-foreground"
            }`}
          >
            {user.fotoUrl ? (
              <img src={user.fotoUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user.nombreCompleto?.charAt(0)
            )}
          </div>
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${
              inDashboard ? "text-slate-300" : "text-muted-foreground"
            } ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Menú Desplegable */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-border py-2 z-50 animate-scale-in">
          <div className="px-4 py-3 border-b border-border mb-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cuenta SIGED</p>
            <p className="text-xs font-medium text-foreground truncate">{user.username}</p>
          </div>

          <div className="space-y-0.5">
            <Link to="/perfil" className="flex items-center gap-3 px-4 py-2 text-[13px] text-muted-foreground hover:bg-muted hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>
              <User size={16} /> Ver Perfil
            </Link>
            
            <Link to="/PanelControl/mis-torneos" className="flex items-center gap-3 px-4 py-2 text-[13px] text-muted-foreground hover:bg-muted hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>
              <Trophy size={16} /> Mis Torneos
            </Link>

            <Link to="/configuracion" className="flex items-center gap-3 px-4 py-2 text-[13px] text-muted-foreground hover:bg-muted hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>
              <Settings size={16} /> Configuración
            </Link>

            <Link to="/Seguridad/cambiar-password" className="flex items-center gap-3 px-4 py-2 text-[13px] text-muted-foreground hover:bg-muted hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>
              <ShieldCheck size={16} /> Seguridad
            </Link>

            <div className="h-px bg-border my-1 mx-4" />

            <button 
              type="button"
              onClick={loggingOut ? undefined : logout}
              disabled={loggingOut}
              className="w-full flex items-center gap-3 px-4 py-2 text-[13px] text-destructive hover:bg-destructive/5 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loggingOut ? (
                <>
                  <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                  <span>Cerrando sesión...</span>
                </>
              ) : (
                <>
                  <LogOut size={16} /> <span>Cerrar Sesión</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
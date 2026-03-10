import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
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
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

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
        className="flex items-center gap-3 pl-4 border-l border-border hover:opacity-80 transition-all group"
      >
        <div className="flex flex-col items-end leading-none">
          <span className="text-[13px] font-bold text-foreground mb-1">
            {user.nombreCompleto}
          </span>
          <span className="bg-accent/10 text-accent-foreground text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-tighter border border-accent/20">
            {user?.rol}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground font-bold text-xs overflow-hidden">
            {user.fotoUrl ? (
              <img src={user.fotoUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user.nombreCompleto?.charAt(0)
            )}
          </div>
          <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
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
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2 text-[13px] text-destructive hover:bg-destructive/5 font-bold transition-colors"
            >
              <LogOut size={16} /> Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LayoutDashboard, Menu, X } from "lucide-react";
import UserMenu from "./UserMenu"; 
import logoUnas from "../../assets/LogoUNAS.png"; 

export default function Navbar() {
  const { user } = useAuth(); // Quitamos 'can' si no lo usaremos aquí
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  // CORRECCIÓN: Ahora cualquier usuario logueado ve el botón
  const showAdminPanel = !!user; 
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50 font-inter">
      <div className="container mx-auto px-6 h-16 flex justify-between items-center">
        
        {/* Lado Izquierdo: Logo */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <div className="transition-transform duration-300 group-hover:scale-105">
            <img src={logoUnas} alt="UNAS" className="w-11 h-11 object-contain" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-lg text-foreground tracking-tight">SIGED</span>
            <span className="text-[9px] font-bold text-primary tracking-widest uppercase">UNAS - PERÚ</span>
          </div>
        </Link>

        {/* Centro: Links de Navegación */}
        <div className="hidden md:flex items-center gap-8">
          {["INICIO", "TORNEOS", "NOTICIAS", "CALENDARIO"].map((item) => (
            <Link 
              key={item}
              to={item === "INICIO" ? "/" : `/${item.toLowerCase()}`}
              className={`text-[13px] font-semibold transition-colors ${
                isActive(item === "INICIO" ? "/" : `/${item.toLowerCase()}`) 
                ? "text-primary" 
                : "text-muted-foreground hover:text-primary"
              }`}
            >
              {item}
            </Link>
          ))}

          {/* Si hay usuario, mostramos el acceso al Panel */}
          {showAdminPanel && (
            <>
              <div className="h-4 w-px bg-border mx-1" />
              <Link to="/PanelControl" className="flex items-center gap-2 text-primary text-[13px] font-bold">
                <LayoutDashboard size={16} /> PANEL DE CONTROL
              </Link>
            </>
          )}
        </div>

        {/* Lado Derecho: Usuario o Login */}
        <div className="hidden md:block">
          {!user ? (
            <Link to="/login" className="text-[13px] font-bold text-foreground hover:text-primary">
              INGRESAR
            </Link>
          ) : (
            <UserMenu /> 
          )}
        </div>

        {/* Botón Móvil */}
        <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="md:hidden text-foreground">
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Menú Móvil - Implementación simplificada */}
      {isMobileOpen && (
        <div className="md:hidden bg-white border-t border-border p-4 space-y-4">
          {/* Aquí irían tus links del menú móvil siguiendo la misma lógica del showAdminPanel */}
        </div>
      )}
    </nav>
  );
}
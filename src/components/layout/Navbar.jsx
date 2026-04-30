import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LayoutDashboard, Menu, X } from "lucide-react";
import UserMenu from "./UserMenu"; 
import logoUnas from "../../assets/LogoUNAS.png"; 

export default function Navbar() {
  const { user, loading, logout, loggingOut } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  /** Login conservando la pantalla actual (p. ej. inscripción al torneo). */
  const loginHref = useMemo(() => {
    if (location.pathname === "/login") return "/login";
    const back = `${location.pathname}${location.search || ""}`;
    return `/login?returnUrl=${encodeURIComponent(back)}`;
  }, [location.pathname, location.search]);

  // Mostramos acceso al panel solo si realmente hay sesión cargada
  const showAdminPanel = !!user && !loading;
  const isActive = (path) => location.pathname === path;
  const inDashboard = location.pathname.startsWith("/PanelControl");

  return (
    <nav
      className={`border-b border-border sticky top-0 z-50 font-inter transition-colors ${
        inDashboard ? "bg-slate-950/95 backdrop-blur-md" : "bg-white"
      }`}
    >
      <div className="container mx-auto px-6 h-16 flex justify-between items-center">
        
        {/* Lado Izquierdo: Logo */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <div className="transition-transform duration-300 group-hover:scale-105">
            <img src={logoUnas} alt="UNAS" className="w-11 h-11 object-contain" />
          </div>
          <div className="flex flex-col leading-none">
            <span
              className={`font-bold text-lg tracking-tight ${
                inDashboard ? "text-white" : "text-foreground"
              }`}
            >
              SIGED
            </span>
            <span
              className={`text-[9px] font-bold tracking-widest uppercase ${
                inDashboard ? "text-emerald-400" : "text-primary"
              }`}
            >
              UNAS - PERÚ
            </span>
          </div>
        </Link>

        {/* Centro: Links de Navegación */}
        <div className="hidden md:flex items-center gap-6">
          {[
            { label: "INICIO", to: "/" },
            { label: "TORNEOS", to: "/torneos" },
            { label: "CAMPEONES", to: "/campeones" },
            { label: "NOTICIAS", to: "/noticias" },
          ].map((item) => (
            <div key={item.to} className="relative flex flex-col items-center">
              <Link
                to={item.to}
                className={`text-[12px] font-semibold transition-colors ${
                  isActive(item.to)
                    ? inDashboard
                      ? "text-emerald-300"
                      : "text-emerald-700"
                    : inDashboard
                      ? "text-slate-300 hover:text-white"
                      : "text-slate-500 hover:text-emerald-600"
                }`}
              >
                {item.label}
              </Link>
              {isActive(item.to) && (
                <span
                  className={`mt-1 h-[2px] w-7 rounded-full ${
                    inDashboard ? "bg-emerald-300" : "bg-emerald-600"
                  } shadow-[0_0_18px_rgba(16,185,129,0.25)]`}
                />
              )}
            </div>
          ))}

          {/* Si hay usuario, mostramos el acceso al Panel */}
          {showAdminPanel && (
            <>
              <div className="h-4 w-px bg-border mx-1" />
              <Link
                to="/PanelControl"
                className={`flex items-center gap-2 text-[13px] font-bold px-3 py-1.5 rounded-full border transition-all ${
                  inDashboard
                    ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-300"
                    : "border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.08)]"
                }`}
              >
                <LayoutDashboard size={16} /> PANEL DE CONTROL
              </Link>
            </>
          )}
        </div>

        {/* Lado Derecho: Usuario o Login */}
        <div className="hidden md:block">
          {!user ? (
            <Link
              to={loginHref}
              className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[12px] font-bold tracking-[0.18em] uppercase border transition-all ${
                inDashboard
                  ? "border-emerald-400/60 text-emerald-200 hover:bg-emerald-500/10"
                  : "border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.08)]"
              }`}
            >
              INGRESAR
            </Link>
          ) : (
            <UserMenu /> 
          )}
        </div>

        {/* Botón Móvil */}
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className={`md:hidden ${
            inDashboard ? "text-slate-100" : "text-foreground"
          }`}
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Menú Móvil */}
      {isMobileOpen && (
        <div
          className={`md:hidden border-t border-border p-4 space-y-4 ${
            inDashboard ? "bg-slate-950/95 text-slate-100" : "bg-white"
          }`}
        >
          {/* Navegación pública */}
          <div className="flex flex-col gap-2">
            {[
              { label: "Inicio", to: "/" },
              { label: "Torneos", to: "/torneos" },
              { label: "Campeones", to: "/campeones" },
              { label: "Noticias", to: "/noticias" },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileOpen(false)}
                className={`w-full px-3 py-2 rounded-lg text-sm font-semibold tracking-wide ${
                  isActive(item.to)
                    ? inDashboard
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-emerald-500/15 text-emerald-700"
                    : inDashboard
                      ? "text-slate-200 hover:bg-slate-800/70"
                      : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Acceso al panel / login */}
          <div className="pt-2 border-t border-border/60 mt-2 flex flex-col gap-2">
            {showAdminPanel ? (
              <>
                <Link
                  to="/PanelControl"
                  onClick={() => setIsMobileOpen(false)}
                  className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full text-xs font-bold tracking-[0.16em] uppercase ${
                    inDashboard
                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-400/60"
                      : "bg-emerald-500/10 text-emerald-700 border border-emerald-400/60 hover:bg-emerald-500/15 hover:text-emerald-800"
                  }`}
                >
                  <LayoutDashboard size={14} />
                  Panel de control
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileOpen(false);
                    if (!loggingOut) logout();
                  }}
                  disabled={loggingOut}
                  className="w-full mt-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full text-[11px] font-semibold tracking-[0.16em] uppercase border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
                </button>
              </>
            ) : (
              <Link
                to={loginHref}
                onClick={() => setIsMobileOpen(false)}
                className={`w-full text-center text-xs font-bold tracking-[0.16em] uppercase inline-flex items-center justify-center px-3 py-2 rounded-full border transition-all ${
                  inDashboard
                    ? "text-slate-200 border-emerald-400/60 hover:bg-emerald-500/10"
                    : "text-slate-700 border-slate-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                }`}
              >
                Ingresar
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
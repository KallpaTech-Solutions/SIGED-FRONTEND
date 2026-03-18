import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  School,
  Trophy,
  Activity,
  ArrowRight,
  Clock,
} from "lucide-react";
import api from "../../api/axiosConfig";
import { useAuth } from "../../context/AuthContext";

export default function SuperAdminSummary() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const navigate = useNavigate();
  const { can, user } = useAuth();

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        // 1) Cargamos preferencias del usuario (qué widgets quiere ver)
        let blocks = "all";
        try {
          const prefRes = await api.get("/Preferences/my-config", {
            signal: controller.signal,
          });
          const raw = prefRes.data?.widgetsVisibles;
          if (typeof raw === "string" && raw.trim().length > 0) {
            const parsed = raw
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            if (parsed.length > 0) {
              setSelectedBlocks(parsed);
              blocks = parsed.join(",");
            } else {
              setSelectedBlocks([]);
            }
          } else {
            setSelectedBlocks([]);
          }
        } catch {
          // Si falla preferencias, usamos "all" y dejamos selectedBlocks vacío
          setSelectedBlocks([]);
        }

        // 2) Llamamos al summary pasando los bloques elegidos
        const response = await api.get("/Dashboard/summary", {
          params: { blocks },
          signal: controller.signal,
        });
        setStats(response.data);
      } catch (error) {
        if (error.code !== "ERR_CANCELED") {
          // eslint-disable-next-line no-console
          console.error("Error al cargar estadísticas:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Sincronizando panel ejecutivo...
          </p>
        </div>
      </div>
    );
  }

  const allWidgets = [
    {
      id: 'usuarios',
      permission: 'security.user.view',
      title: 'Usuarios Totales',
      value: stats?.totalUsuarios,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      path: '/PanelControl/usuarios',
    },
    {
      id: 'orgs',
      permission: 'core.org.view',
      title: 'Facultades',
      value: stats?.totalFacultades,
      icon: School,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      path: '/PanelControl/organizaciones',
    },
    {
      id: 'torneos',
      permission: 'comp.tourn.view',
      title: 'Torneos Activos',
      value: stats?.totalTorneos,
      icon: Trophy,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      path: '/PanelControl/torneos',
    },
    {
      id: 'activos',
      permission: 'security.user.view',
      title: 'Sesiones Activas',
      value: stats?.usuariosActivos,
      icon: Activity,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      path: null,
    },
  ];

  const cards = allWidgets.filter((widget) => {
    if (!can(widget.permission)) return false;
    // Si no hay preferencias guardadas, mostramos todo lo permitido
    if (!selectedBlocks || selectedBlocks.length === 0) return true;
    return selectedBlocks.includes(widget.id);
  });

  const showRecent =
    !selectedBlocks || selectedBlocks.length === 0 || selectedBlocks.includes("recent");

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Encabezado ejecutivo */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-7 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-white/60 mb-1">
            Panel ejecutivo
          </p>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Resumen en tiempo real
          </h2>
          <p className="text-xs md:text-sm text-white/70 mt-2 max-w-xl">
            Vista rápida del estado del sistema para{" "}
            <span className="font-semibold">
              {user?.nombreCompleto || "administrador"}
            </span>
            . Personaliza los bloques desde{" "}
            <span className="underline decoration-primary/70 decoration-dashed">
              Configuración &gt; Mi Dashboard
            </span>
            .
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 font-semibold uppercase tracking-[0.18em]">
            {stats?.tipoVista?.toUpperCase() || "VISTA GLOBAL"}
          </span>
          {stats?.totalUsuarios != null && (
            <span className="text-white/70">
              Usuarios registrados:{" "}
              <span className="font-semibold text-white">
                {stats.totalUsuarios}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Grid de tarjetas métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => card.path && navigate(card.path)}
            className={`group relative overflow-hidden bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-slate-100 shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition-all duration-300 ${
              card.path
                ? "hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_24px_60px_rgba(15,23,42,0.16)] cursor-pointer"
                : "cursor-default"
            }`}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-primary/5 via-transparent to-secondary/10 pointer-events-none" />
            <div
              className={`relative w-12 h-12 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110`}
            >
              <card.icon size={22} />
            </div>
            <p className="relative text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {card.title}
            </p>
            <h2 className="relative text-3xl font-bold text-slate-800 tracking-tight">
              {card.value ?? 0}
            </h2>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Actividad Reciente (solo si está habilitada en preferencias) */}
        {showRecent && stats?.ultimosUsuarios && stats.ultimosUsuarios.length > 0 && (
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/60">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                <Clock size={16} className="text-slate-400" /> Actividad reciente
              </h3>
              <button
                type="button"
                onClick={() => navigate("/PanelControl/usuarios")}
                className="text-primary font-bold text-[10px] uppercase tracking-widest hover:underline"
              >
                Ver usuarios
              </button>
            </div>
            <div className="p-4 space-y-1">
              {stats.ultimosUsuarios.map((u, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold uppercase">
                      {u?.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700">
                        {u}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Nuevo registro en el sistema
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-slate-300" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Banner lateral (siempre visible) */}
        <div className="bg-primary p-8 rounded-3xl text-white relative overflow-hidden flex flex-col justify-between">
          <Trophy
            size={64}
            className="absolute -right-4 -top-4 text-white/10 rotate-12"
          />
          <div className="relative z-10">
            <span className="bg-white/20 text-[9px] font-bold px-2 py-1 rounded mb-4 inline-block uppercase tracking-widest">
              Aviso OTI
            </span>
            <h4 className="text-xl font-bold leading-tight mb-2">
              Interfacultades 2026
            </h4>
            <p className="text-white/75 text-sm leading-relaxed">
              Las inscripciones están próximas a abrirse. Revisa los reglamentos
              actualizados y prepara a tus equipos.
            </p>
          </div>
          <button
            type="button"
            className="mt-8 bg-white text-primary text-[11px] font-bold py-3 rounded-xl uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-all"
          >
            Ver calendario
          </button>
        </div>
      </div>
    </div>
  );
}
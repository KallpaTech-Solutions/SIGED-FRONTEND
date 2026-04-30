import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  School,
  Trophy,
  Medal,
  Activity,
  ArrowRight,
  Clock,
  Newspaper,
  ExternalLink,
  Globe,
  Settings,
} from "lucide-react";
import api from "../../api/axiosConfig";
import { useAuth } from "../../context/AuthContext";
import {
  tournamentPublicLabel,
  tournamentPublicBadgeClass,
} from "../../utils/tournamentPublicStatus";
  
export default function SuperAdminSummary() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const navigate = useNavigate();
  const { can } = useAuth();

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
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
          setSelectedBlocks([]);
        }

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
      id: "usuarios",
      permission: "security.user.view",
      title: "Usuarios Totales",
      value: stats?.totalUsuarios,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      path: "/PanelControl/usuarios",
    },
    {
      id: "orgs",
      permission: "core.org.view",
      title: "Facultades",
      value: stats?.totalFacultades,
      icon: School,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      path: "/PanelControl/organizaciones",
    },
    {
      id: "torneos",
      permission: "tourn.view",
      title: "Torneos",
      value: stats?.totalTorneos,
      icon: Trophy,
      color: "text-amber-600",
      bg: "bg-amber-50",
      path: "/PanelControl/torneos",
    },
    {
      id: "activos",
      permission: "security.user.view",
      title: "Sesiones Activas",
      value: stats?.usuariosActivos,
      icon: Activity,
      color: "text-purple-600",
      bg: "bg-purple-50",
      path: null,
    },
  ];

  const cards = allWidgets.filter((widget) => {
    const ok =
      widget.id === "torneos"
        ? can("comp.tourn.view") || can("tourn.view")
        : can(widget.permission);
    if (!ok) return false;
    if (!selectedBlocks || selectedBlocks.length === 0) return true;
    return selectedBlocks.includes(widget.id);
  });

  const showRecent =
    !selectedBlocks ||
    selectedBlocks.length === 0 ||
    selectedBlocks.includes("recent");

  const showBannerTorneos =
    !selectedBlocks ||
    selectedBlocks.length === 0 ||
    selectedBlocks.includes("banner_torneos");

  const torneosActivos = Array.isArray(stats?.torneosActivos)
    ? stats.torneosActivos
    : [];
  const noticiasInicio = Array.isArray(stats?.noticiasInicio)
    ? stats.noticiasInicio
    : [];
  const showNoticias =
    can("news.view") &&
    noticiasInicio.length > 0 &&
    (!selectedBlocks ||
      selectedBlocks.length === 0 ||
      selectedBlocks.includes("noticias_1") ||
      selectedBlocks.includes("noticias_3"));

  const newsCols =
    stats?.noticiasModo === 3 || noticiasInicio.length > 1
      ? "md:grid-cols-3"
      : "md:grid-cols-1";

  const torneosGridCols = showRecent
    ? "grid-cols-1"
    : torneosActivos.length >= 3
      ? "md:grid-cols-3"
      : torneosActivos.length === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-1";

  const torneosCardTitle = (() => {
    const ctx = stats?.torneosMetricaContexto;
    if (ctx === "planeamiento") return "En planeamiento";
    if (ctx === "inscripciones_curso") return "Inscripciones / en curso";
    if (ctx === "ninguno") return "Torneos";
    return "Torneos activos";
  })();

  return (
    <div className="space-y-10 animate-fade-in">
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
              {card.id === "torneos" ? torneosCardTitle : card.title}
            </p>
            <h2 className="relative text-3xl font-bold text-slate-800 tracking-tight">
              {card.value ?? 0}
            </h2>
          </div>
        ))}
      </div>

      <div
        className={`grid grid-cols-1 gap-8 ${
          showRecent && showBannerTorneos
            ? "lg:grid-cols-3"
            : showRecent || showBannerTorneos
              ? "lg:grid-cols-1"
              : ""
        }`}
      >
        {showRecent && stats?.ultimosUsuarios && stats.ultimosUsuarios.length > 0 && (
          <div
            className={`bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden ${
              showBannerTorneos ? "lg:col-span-2" : "lg:col-span-1"
            }`}
          >
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
                      <span className="text-sm font-bold text-slate-700">{u}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Registro reciente
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-slate-300" />
                </div>
              ))}
            </div>
          </div>
        )}

        {showBannerTorneos && (
          <div
            className={`${
              showRecent ? "" : "lg:col-span-1"
            } ${!showRecent ? "lg:max-w-4xl" : ""}`}
          >
            <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-full">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Trophy size={18} className="text-amber-600" />
                    Torneos
                    <span className="text-xs font-normal text-slate-500">
                      · Últimos registrados
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-md">
                    Hasta tres torneos, mismo criterio que la vitrina pública.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <Link
                    to="/PanelControl/torneos"
                    className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                  >
                    Ver todos los torneos
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to="/campeones"
                    className="text-xs font-bold text-slate-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-1"
                  >
                    <Medal className="w-3.5 h-3.5" />
                    Ver campeones
                  </Link>
                </div>
              </div>

              {torneosActivos.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <p className="text-sm text-slate-600 font-medium">
                    Aún no hay torneos publicados en el sistema.
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Creá uno desde el panel o revisá la visibilidad (IsActive).
                  </p>
                </div>
              ) : (
                <div
                  className={`p-4 md:p-5 grid grid-cols-1 gap-3 ${torneosGridCols}`}
                >
                  {torneosActivos.map((t) => {
                    const id = t.id ?? t.Id;
                    const name = t.name ?? t.Name ?? "—";
                    const st = t.status ?? t.Status;
                    const year = t.year ?? t.Year;
                    const publicUrl = `/torneos/torneo/${id}`;
                    const panelUrl = `/PanelControl/torneos/${id}`;
                    return (
                      <div
                        key={id}
                        className="rounded-2xl border border-slate-100 bg-white hover:border-slate-200/90 hover:shadow-sm transition-all p-4"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-amber-50 to-slate-50 border border-amber-100/80 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                            <Trophy
                              className="w-5 h-5 text-amber-600"
                              strokeWidth={2}
                            />
                          </div>
                          <div className="min-w-0 flex-1 flex flex-col gap-1">
                            <span
                              className={`inline-flex max-w-full w-fit whitespace-normal text-[10px] font-bold px-2 py-0.5 rounded-full border ${tournamentPublicBadgeClass(st)}`}
                            >
                              {tournamentPublicLabel(st)}
                            </span>
                            <p className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 break-words">
                              {name}
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                              Temporada {year}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                          <Link
                            to={publicUrl}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/60 hover:text-emerald-800 transition-colors"
                            title="Ver cómo se ve en la web pública"
                          >
                            <Globe className="w-3.5 h-3.5 shrink-0" />
                            Pública
                          </Link>
                          <Link
                            to={panelUrl}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-700 hover:border-amber-300 hover:bg-amber-50/50 hover:text-amber-900 transition-colors"
                            title="Gestionar y editar en el panel"
                          >
                            <Settings className="w-3.5 h-3.5 shrink-0" />
                            Panel
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {showNoticias && (
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Newspaper size={18} className="text-emerald-600" />
              Noticias
              {stats?.noticiasModo === 3 ? (
                <span className="text-xs font-normal text-slate-500">
                  · Últimas 3 publicadas
                </span>
              ) : (
                <span className="text-xs font-normal text-slate-500">
                  · Última publicada
                </span>
              )}
            </h3>
            <Link
              to="/noticias"
              className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
            >
              Ver todas
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className={`p-6 grid grid-cols-1 gap-4 ${newsCols}`}>
            {noticiasInicio.map((n) => {
              const slug = n.slug ?? n.Slug;
              const title = n.title ?? n.Title;
              const excerpt = n.excerpt ?? n.Excerpt ?? "";
              const created = n.createdAt ?? n.CreatedAt;
              const img = n.imageUrl ?? n.ImageUrl;
              return (
                <Link
                  key={n.id ?? n.Id}
                  to={slug ? `/noticia/${slug}` : "/noticias"}
                  className="group rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all overflow-hidden flex flex-col bg-slate-50/50"
                >
                  {img ? (
                    <div className="aspect-[16/9] bg-slate-200 overflow-hidden">
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                      />
                    </div>
                  ) : null}
                  <div className="p-4 flex-1 flex flex-col">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                      {created
                        ? new Date(created).toLocaleDateString("es-PE", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : ""}
                    </p>
                    <p className="font-bold text-slate-900 mt-1 line-clamp-2 group-hover:text-emerald-800">
                      {title}
                    </p>
                    {excerpt ? (
                      <p className="text-xs text-slate-600 mt-2 line-clamp-3 flex-1">
                        {excerpt}
                      </p>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

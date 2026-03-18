import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Pencil, Trash2, RefreshCw } from "lucide-react";
import {
  getCategoryBadgeColor,
  getCategoryEmoji,
  getCategoryLabel,
} from "./mockNews";
import { fetchNoticiasAdmin, updateNoticia, deleteNoticia } from "../../api/noticiasService";

export default function NoticiasAdminPage() {
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [noticias, setNoticias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [operandoId, setOperandoId] = useState(null);
  const [estadoMenuAbierto, setEstadoMenuAbierto] = useState(null);

  useEffect(() => {
    let montado = true;
    fetchNoticiasAdmin()
      .then((data) => {
        if (montado) setNoticias(data || []);
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error("Error cargando noticias:", error);
      })
      .finally(() => {
        if (montado) setCargando(false);
      });

    return () => {
      montado = false;
    };
  }, []);

  const noticiasFiltradas = noticias.filter((noticia) => {
    const texto = (busqueda || "").toLowerCase();
    const cumpleBusqueda =
      !texto ||
      noticia.titulo.toLowerCase().includes(texto) ||
      noticia.extracto.toLowerCase().includes(texto);

    const cumpleEstado =
      estadoFiltro === "todos" || noticia.estado === estadoFiltro;

    return cumpleBusqueda && cumpleEstado;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800/60 shadow-[0_24px_60px_rgba(15,23,42,0.45)] text-white">
        <div>
          <div className="flex items-center gap-2 text-white/70 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.28em]">
              Panel Maestro
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-300">
              Contenido institucional
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Gestión de noticias
          </h1>
          <p className="text-[11px] text-white/70 mt-1 max-w-xl">
            Crea, edita y administra las noticias que se muestran en el portal público.
          </p>
        </div>
        <Link
          to="/PanelControl/noticias/crear"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-emerald-400 text-slate-900 text-xs font-bold uppercase tracking-[0.22em] shadow-lg shadow-emerald-500/40 hover:bg-emerald-300 hover:shadow-emerald-400/60 transition-all"
        >
          Nueva noticia
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder="Buscar por título o extracto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="todos">Todos</option>
              <option value="publicada">Publicadas</option>
              <option value="borrador">Borradores</option>
              <option value="archivada">Archivadas</option>
            </select>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Mostrando{" "}
          <span className="font-semibold text-slate-700">
            {noticiasFiltradas.length}
          </span>{" "}
          de{" "}
          <span className="font-semibold text-slate-700">
            {noticias.length}
          </span>{" "}
          noticias.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left w-[40%] whitespace-nowrap">
                  Noticia
                </th>
                <th className="px-4 py-3 text-left w-[16%] min-w-[110px] whitespace-nowrap">
                  Categoría
                </th>
                <th className="px-4 py-3 text-left w-[14%] min-w-[90px] whitespace-nowrap">
                  Fecha
                </th>
                <th className="px-4 py-3 text-center w-[10%] min-w-[70px] whitespace-nowrap">
                  Vistas
                </th>
                <th className="px-4 py-3 text-left w-[10%] min-w-[90px] whitespace-nowrap">
                  Estado
                </th>
                <th className="px-4 py-3 text-right w-[10%] min-w-[90px] whitespace-nowrap">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargando && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-xs text-slate-500"
                  >
                    Cargando noticias...
                  </td>
                </tr>
              )}
              {!cargando &&
                noticiasFiltradas.map((noticia) => (
                <tr key={noticia.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={noticia.imagenPrincipal}
                        alt={noticia.titulo}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm line-clamp-2">
                          {noticia.titulo}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {noticia.extracto}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getCategoryBadgeColor(
                        noticia.categoria
                      )}`}
                    >
                      {getCategoryEmoji(noticia.categoria)}{" "}
                      {getCategoryLabel(noticia.categoria)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                    {new Date(noticia.fechaPublicacion).toLocaleDateString(
                      "es-PE",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-slate-600">
                    {noticia.vistas.toLocaleString("es-PE")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-normal whitespace-nowrap ${
                        noticia.estado === "publicada"
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : noticia.estado === "borrador"
                          ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {noticia.estado === "publicada"
                        ? "Publicada"
                        : noticia.estado === "borrador"
                        ? "Borrador"
                        : "Archivada"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs relative">
                    <div className="inline-flex items-center gap-1.5 text-slate-500">
                      <Link
                        to={`/noticia/${noticia.slug || noticia.id}`}
                        className="p-1 rounded-full hover:bg-slate-100"
                        aria-label="Ver noticia pública"
                        title="Ver noticia pública"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/PanelControl/noticias/${noticia.id}`}
                        className="p-1 rounded-full hover:bg-slate-100"
                        aria-label="Editar noticia"
                        title="Editar noticia"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        className="p-1 rounded-full hover:bg-slate-100 disabled:opacity-50"
                        aria-label="Cambiar estado de publicación"
                        title="Cambiar estado de publicación"
                        disabled={operandoId === noticia.id}
                        onClick={async () => {
                          setEstadoMenuAbierto(
                            estadoMenuAbierto === noticia.id ? null : noticia.id,
                          );
                        }}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      {estadoMenuAbierto === noticia.id && (
                        <div className="absolute right-6 bottom-8 z-20 bg-white border border-slate-200 rounded-lg shadow-lg text-xs min-w-[130px]">
                          {[
                            { value: "publicada", label: "Publicada" },
                            { value: "borrador", label: "Borrador" },
                            { value: "archivada", label: "Archivada" },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              disabled={operandoId === noticia.id}
                              onClick={async () => {
                                if (opt.value === noticia.estado) {
                                  setEstadoMenuAbierto(null);
                                  return;
                                }
                                setOperandoId(noticia.id);
                                try {
                                  const actualizada = await updateNoticia(noticia.id, {
                                    ...noticia,
                                    estado: opt.value,
                                  });
                                  setNoticias((prev) =>
                                    prev.map((n) =>
                                      n.id === noticia.id ? actualizada : n,
                                    ),
                                  );
                                } catch (error) {
                                  // eslint-disable-next-line no-console
                                  console.error(
                                    "Error cambiando estado de noticia",
                                    error,
                                  );
                                } finally {
                                  setOperandoId(null);
                                  setEstadoMenuAbierto(null);
                                }
                              }}
                              className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 ${
                                noticia.estado === opt.value
                                  ? "text-primary font-semibold"
                                  : "text-slate-600"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        className="p-1 rounded-full hover:bg-red-50 text-red-500 disabled:opacity-50"
                        aria-label="Eliminar noticia"
                        title="Eliminar noticia"
                        disabled={operandoId === noticia.id}
                        onClick={async () => {
                          if (operandoId === noticia.id) return;
                          const confirmar = window.confirm(
                            "¿Seguro que deseas eliminar esta noticia?",
                          );
                          if (!confirmar) return;
                          setOperandoId(noticia.id);
                          try {
                            await deleteNoticia(noticia.id);
                            setNoticias((prev) =>
                              prev.filter((n) => n.id !== noticia.id),
                            );
                          } catch (error) {
                            // eslint-disable-next-line no-console
                            console.error("Error eliminando noticia", error);
                          } finally {
                            setOperandoId(null);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!cargando && noticiasFiltradas.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-sm text-slate-500"
                    colSpan={6}
                  >
                    No se encontraron noticias con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


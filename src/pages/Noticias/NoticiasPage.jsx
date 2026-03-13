import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCategoryEmoji, getCategoryLabel } from "./mockNews";
import { fetchNoticiasFeed } from "../../api/noticiasService";

const categories = [
  { value: "todas", label: "Todas" },
  { value: "resultados", label: "Resultados" },
  { value: "jugadores", label: "Jugadores" },
  { value: "equipos", label: "Equipos" },
  { value: "convocatorias", label: "Convocatorias" },
  { value: "institucional", label: "Institucional" },
];

const NOTICIAS_POR_PAGINA = 6;

export default function NoticiasPage() {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("todas");
  const [paginaActual, setPaginaActual] = useState(1);
  const [noticias, setNoticias] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let montado = true;
    fetchNoticiasFeed()
      .then((data) => {
        if (montado) {
          setNoticias(data || []);
        }
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

  const noticiasFiltradas = useMemo(() => {
    return noticias.filter((noticia) => {
      const cumpleCategoria =
        categoriaActiva === "todas" || noticia.categoria === categoriaActiva;
      const texto = (busqueda || "").toLowerCase();
      const cumpleBusqueda =
        !texto ||
        noticia.titulo.toLowerCase().includes(texto) ||
        noticia.extracto.toLowerCase().includes(texto) ||
        (noticia.etiquetas || []).some((tag) =>
          tag.toLowerCase().includes(texto)
        );

      return cumpleCategoria && cumpleBusqueda && noticia.estado === "publicada";
    });
  }, [busqueda, categoriaActiva]);

  const noticiaDestacada =
    noticiasFiltradas.find((n) => n.destacada) || noticiasFiltradas[0];
  const noticiasRestantes = noticiasFiltradas.filter(
    (n) => n.id !== noticiaDestacada?.id
  );

  const totalPaginas = Math.ceil(
    noticiasRestantes.length / NOTICIAS_POR_PAGINA || 1
  );
  const indiceInicio = (paginaActual - 1) * NOTICIAS_POR_PAGINA;
  const noticiasPaginadas = noticiasRestantes.slice(
    indiceInicio,
    indiceInicio + NOTICIAS_POR_PAGINA
  );

  return (
    <div className="w-full">
      <section className="bg-linear-to-r from-primary/10 via-secondary/10 to-accent/10 border-b border-border py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Portal de Noticias
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
              Novedades, resultados y comunicados oficiales del deporte
              universitario UNAS.
            </p>
          </div>

          <div className="max-w-2xl mx-auto mt-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar noticias por título, categoría o etiquetas..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginaActual(1);
                }}
                className="w-full h-11 px-4 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-border sticky top-16 z-30">
        <div className="container mx-auto px-4 py-2 md:py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs md:text-sm">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => {
                  setCategoriaActiva(cat.value);
                  setPaginaActual(1);
                }}
                className={`px-3 py-1.5 rounded-full border text-[11px] md:text-xs font-semibold whitespace-nowrap transition-colors ${
                  categoriaActiva === cat.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {cat.value !== "todas" &&
                  `${getCategoryEmoji(cat.value)} `}
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 bg-white">
        <div className="container mx-auto px-4">
          {cargando ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Cargando noticias...
            </div>
          ) : noticiasFiltradas.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No se encontraron noticias con los filtros aplicados.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              <div className="lg:col-span-2 space-y-6">
                {noticiaDestacada && (
                  <Link
                    to={`/noticia/${noticiaDestacada.slug || noticiaDestacada.id}`}
                    className="block bg-white rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                  >
                    <div className="h-52 md:h-64 w-full overflow-hidden">
                      <img
                        src={noticiaDestacada.imagenPrincipal}
                        alt={noticiaDestacada.titulo}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-5 md:p-6 space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] md:text-xs text-muted-foreground">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                          {getCategoryLabel(noticiaDestacada.categoria)}
                        </span>
                        <span>
                          {new Date(
                            noticiaDestacada.fechaPublicacion
                          ).toLocaleDateString("es-PE", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <h2 className="text-lg md:text-2xl font-bold text-foreground leading-snug md:leading-tight">
                        {noticiaDestacada.titulo}
                      </h2>
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-3">
                        {noticiaDestacada.extracto}
                      </p>
                    </div>
                  </Link>
                )}

                <div className="space-y-3 md:space-y-4">
                  {noticiasPaginadas.map((noticia) => (
                    <Link
                      key={noticia.id}
                      to={`/noticia/${noticia.slug || noticia.id}`}
                      className="flex flex-col sm:flex-row gap-3 sm:gap-4 bg-white border border-border rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="w-full h-40 sm:w-28 sm:h-24 shrink-0 overflow-hidden rounded-lg">
                        <img
                          src={noticia.imagenPrincipal}
                          alt={noticia.titulo}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 mt-2 sm:mt-0">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground mb-1">
                          <span className="uppercase font-bold tracking-wide">
                            {getCategoryLabel(noticia.categoria)}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(
                              noticia.fechaPublicacion
                            ).toLocaleDateString("es-PE", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <h3 className="text-sm md:text-base font-semibold text-foreground mb-1 line-clamp-2">
                          {noticia.titulo}
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                          {noticia.extracto}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>

                {totalPaginas > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4 text-[11px] md:text-xs">
                    <button
                      onClick={() =>
                        setPaginaActual((p) => Math.max(1, p - 1))
                      }
                      disabled={paginaActual === 1}
                      className="px-3 py-1.5 rounded-lg border text-xs font-semibold disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                      (pagina) => (
                        <button
                          key={pagina}
                          onClick={() => setPaginaActual(pagina)}
                          className={`w-7 h-7 rounded-full text-xs font-semibold ${
                            paginaActual === pagina
                              ? "bg-primary text-primary-foreground"
                              : "bg-white border border-border text-foreground"
                          }`}
                        >
                          {pagina}
                        </button>
                      )
                    )}
                    <button
                      onClick={() =>
                        setPaginaActual((p) =>
                          Math.min(totalPaginas, p + 1)
                        )
                      }
                      disabled={paginaActual === totalPaginas}
                      className="px-3 py-1.5 rounded-lg border text-xs font-semibold disabled:opacity-50"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </div>

              <aside className="space-y-4 mt-6 lg:mt-0">
                <div className="p-4 border border-border rounded-xl bg-white">
                  <h3 className="text-sm font-bold mb-3">
                    Noticias más leídas
                  </h3>
                  <ul className="space-y-2 text-xs">
                    {noticias
                      .filter((n) => n.estado === "publicada")
                      .slice()
                      .sort((a, b) => b.vistas - a.vistas)
                      .slice(0, 5)
                      .map((n) => (
                        <li key={n.id}>
                          <Link
                            to={`/noticia/${n.slug || n.id}`}
                            className="block hover:text-primary"
                          >
                            <span className="font-semibold">
                              {n.titulo}
                            </span>
                            <span className="block text-[11px] text-muted-foreground">
                              {n.vistas.toLocaleString("es-PE")} vistas
                            </span>
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}


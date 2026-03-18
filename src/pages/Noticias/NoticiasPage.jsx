import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCategoryEmoji,
  getCategoryId,
  getCategoryLabel,
} from "./newsCategoryUtils";
import { fetchNoticiasFeed } from "../../api/noticiasService";

const categories = [
  { value: "todas", label: "Todas" },
  { value: 0, label: "Institucional" },
  { value: 1, label: "Academia" },
  { value: 2, label: "Deportes" },
  { value: 3, label: "Investigación" },
  { value: 4, label: "Cultura" },
  { value: 5, label: "Convocatorias" },
  { value: 6, label: "Bienestar" },
];

const NOTICIAS_POR_PAGINA = 10;

export default function NoticiasPage() {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("todas");
  const [paginaActual, setPaginaActual] = useState(1);
  const [noticias, setNoticias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [headerSlide, setHeaderSlide] = useState(0); // destino (flechas/puntos/interval)
  const [visibleSlide, setVisibleSlide] = useState(0); // contenido que se muestra (cambia después del fade out)
  const [headerOpacity, setHeaderOpacity] = useState(1);
  const FADE_DURATION_MS = 1500;

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

  // noticia destacada según filtros
  const noticiasFiltradas = useMemo(() => {
    return noticias.filter((noticia) => {
      const cumpleCategoria =
        categoriaActiva === "todas" ||
        getCategoryId(noticia.categoria) === categoriaActiva;
      const texto = (busqueda || "").toLowerCase();
      const cumpleBusqueda =
        !texto ||
        String(noticia.titulo || "").toLowerCase().includes(texto) ||
        String(noticia.extracto || "").toLowerCase().includes(texto) ||
        (noticia.etiquetas || []).some((tag) =>
          tag.toLowerCase().includes(texto)
        );

      // El feed ya solo devuelve noticias publicadas,
      // así que aquí no filtramos por estado.
      return cumpleCategoria && cumpleBusqueda;
    });
  }, [busqueda, categoriaActiva, noticias]);

  const noticiaDestacada =
    noticiasFiltradas.find((n) => n.destacada) || noticiasFiltradas[0];

  // Top 3 noticias más vistas (según filtro actual)
  const topMasVistas = useMemo(() => {
    return noticiasFiltradas
      .slice()
      .sort((a, b) => (b.vistas || 0) - (a.vistas || 0))
      .slice(0, 3);
  }, [noticiasFiltradas]);

  const totalSlides = 1 + topMasVistas.length; // 0 = mensaje, 1..3 = top vistas

  // carrusel del header: cambia automáticamente entre mensaje y top vistas
  useEffect(() => {
    if (totalSlides <= 1) {
      setHeaderSlide(0);
      setVisibleSlide(0);
      return undefined;
    }
    const id = setInterval(() => {
      setHeaderSlide((prev) => (prev + 1) % totalSlides);
    }, 6000);
    return () => clearInterval(id);
  }, [totalSlides]);

  // Ref para saber si ya estamos en medio de un fade (varios clics no encolan espera)
  const transitionInProgressRef = React.useRef(false);

  // Transición en dos pasos: desvanecer contenido actual (3s), luego mostrar el siguiente y hacerlo aparecer (3s)
  useEffect(() => {
    if (headerSlide === visibleSlide) return;

    // Si el usuario dio otro clic mientras esperábamos: ir directo al slide elegido con fade-in
    if (transitionInProgressRef.current) {
      transitionInProgressRef.current = false;
      setVisibleSlide(headerSlide);
      requestAnimationFrame(() => setHeaderOpacity(1));
      return undefined;
    }

    transitionInProgressRef.current = true;
    setHeaderOpacity(0);

    const timeoutId = setTimeout(() => {
      transitionInProgressRef.current = false;
      setVisibleSlide(headerSlide);
      requestAnimationFrame(() => setHeaderOpacity(1));
    }, FADE_DURATION_MS);

    return () => clearTimeout(timeoutId);
  }, [headerSlide, visibleSlide]);

  const noticiasRestantes = noticiasFiltradas.filter(
    (n) => n.id !== noticiaDestacada?.id
  );

  const visibleCount = paginaActual * NOTICIAS_POR_PAGINA;
  const noticiasPaginadas = noticiasRestantes.slice(0, visibleCount);

  // Contenido de un slide del carrusel (índice 0 = mensaje + buscador, 1..n = noticia más vista)
  const renderHeaderSlideContent = (slideIndex) => {
    if (slideIndex === 0) {
      return (
        <div className="flex flex-col lg:flex-row gap-6 lg:items-center w-full">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-300 mb-2">
              Portal de noticias · SIGED UNAS
            </p>
            <h1 className="text-xl md:text-2xl font-semibold text-white mb-1">
              Novedades del deporte universitario UNAS
            </h1>
            <p className="text-xs md:text-sm text-emerald-50/90 max-w-xl">
              Resultados, comunicados oficiales y cobertura ejecutiva de los
              eventos deportivos de la universidad.
            </p>
          </div>
          <div className="w-full lg:w-80">
            <label className="text-[10px] font-semibold text-emerald-100 uppercase tracking-[0.18em] block mb-1">
              Buscar noticia
            </label>
            <input
              type="text"
              placeholder="Título, categoría o etiquetas..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1);
              }}
              className="w-full h-10 px-3 rounded-xl border border-emerald-400/40 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 bg-white/95 text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>
      );
    }
    const noticia = topMasVistas[slideIndex - 1];
    if (!noticia) return null;
    return (
      <Link
        to={`/noticia/${noticia.slug || noticia.id}`}
        className="grid grid-cols-1 md:grid-cols-[minmax(0,2.1fr)_minmax(0,3fr)] gap-4 md:gap-6 items-stretch group w-full"
      >
        <div className="relative h-40 md:h-44 rounded-2xl overflow-hidden bg-slate-900/70 border border-emerald-500/40 max-w-xl">
          <img
            src={noticia.imagenPrincipal}
            alt={noticia.titulo}
            className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
              {getCategoryLabel(noticia.categoria)}
            </span>
            <span className="text-[10px] text-emerald-100">
              {new Date(noticia.fechaPublicacion).toLocaleDateString("es-PE", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-center min-w-0 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-200">
            Noticias más vistas
          </p>
          <h2 className="text-base md:text-lg font-semibold text-white leading-snug line-clamp-3">
            {noticia.titulo}
          </h2>
          <p className="text-[11px] md:text-sm text-emerald-50/90 line-clamp-3">
            {noticia.extracto}
          </p>
          <p className="text-[10px] text-emerald-200/80">
            {noticia.vistas ? `${noticia.vistas.toLocaleString("es-PE")} vistas · ` : ""}
            {getCategoryLabel(noticia.categoria)}
          </p>
        </div>
      </Link>
    );
  };

  return (
    <div className="w-full">
      <section className="bg-gradient-to-r from-slate-900 via-emerald-900 to-emerald-700 border-b border-border/20 py-10 md:py-14">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Tarjeta flotante tipo carrusel (mensaje / noticia destacada) */}
          <div className="max-w-5xl mx-auto">
            <div className="relative rounded-[28px] bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-800 shadow-[0_24px_70px_rgba(15,23,42,0.75)] border border-emerald-500/30 px-6 py-5 md:px-8 md:py-6 text-white overflow-hidden">
              <div className="pointer-events-none absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.6),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.4),_transparent_55%)]" />
              <div
                className="relative z-10 min-h-40 md:min-h-44 flex items-center overflow-hidden"
                style={{
                  opacity: headerOpacity,
                  transition: `opacity ${FADE_DURATION_MS}ms ease-in-out`,
                }}
              >
                {renderHeaderSlideContent(visibleSlide)}
              </div>

              {/* Controles carrusel */}
              <button
                type="button"
                onClick={() =>
                  setHeaderSlide((prev) =>
                    totalSlides > 1 ? (prev - 1 + totalSlides) % totalSlides : 0
                  )
                }
                className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border border-emerald-400/50 bg-slate-900/70 text-emerald-100 items-center justify-center shadow-md hover:bg-slate-900"
                aria-label="Anterior"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() =>
                  setHeaderSlide((prev) =>
                    totalSlides > 1 ? (prev + 1) % totalSlides : 0
                  )
                }
                className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border border-emerald-400/50 bg-slate-900/70 text-emerald-100 items-center justify-center shadow-md hover:bg-slate-900"
                aria-label="Siguiente"
              >
                ›
              </button>

              <div className="mt-3 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setHeaderSlide(0)}
                  className={`w-2 h-2 rounded-full border border-emerald-300/70 transition-all ${
                    headerSlide === 0 ? "bg-white w-4" : "bg-emerald-500/40"
                  }`}
                />
                {topMasVistas.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setHeaderSlide(index + 1)}
                    className={`w-2 h-2 rounded-full border border-emerald-300/70 transition-all ${
                      headerSlide === index + 1 ? "bg-white w-4" : "bg-emerald-500/40"
                    }`}
                  />
                ))}
              </div>
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
                    className="block rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-shadow bg-linear-to-r from-primary/5 via-secondary/5 to-primary/5"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 md:gap-6 items-stretch p-4 md:p-6">
                      {/* Imagen con fondo decorativo */}
                      <div className="relative flex items-center justify-center rounded-xl bg-white/80 border border-border overflow-hidden h-40 md:h-48">
                        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_top,_#22c55e,_transparent_60%),radial-gradient(circle_at_bottom,_#3b82f6,_transparent_55%)]" />
                        <img
                          src={noticiaDestacada.imagenPrincipal}
                          alt={noticiaDestacada.titulo}
                          className="relative z-10 max-w-full max-h-full object-contain"
                        />
                      </div>

                      {/* Texto y CTA */}
                      <div className="flex flex-col justify-center space-y-3">
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
                        <div>
                          <span className="inline-flex items-center text-xs font-semibold text-primary">
                            Leer noticia completa →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )}

                <div className="space-y-3 md:space-y-4">
                  {noticiasPaginadas.map((noticia) => (
                    <Link
                      key={noticia.id}
                      to={`/noticia/${noticia.slug || noticia.id}`}
                      className="flex flex-col sm:flex-row gap-3 sm:gap-4 bg-white border border-border rounded-2xl p-4 hover:shadow-md hover:-translate-y-[1px] transition-all"
                    >
                      <div className="w-full h-40 sm:w-32 sm:h-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        <img
                          src={noticia.imagenPrincipal}
                          alt={noticia.titulo}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 mt-1 sm:mt-0 flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="uppercase font-bold tracking-wide text-primary">
                            {getCategoryLabel(noticia.categoria)}
                          </span>
                          <span className="text-slate-300">•</span>
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
                        <h3 className="text-sm md:text-base font-semibold text-foreground line-clamp-2">
                          {noticia.titulo}
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                          {noticia.extracto}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>

                {visibleCount < noticiasRestantes.length && (
                  <div className="flex items-center justify-center pt-5">
                    <button
                      type="button"
                      onClick={() => setPaginaActual((p) => p + 1)}
                      className="px-5 py-2.5 rounded-full border border-slate-300 bg-white text-[11px] md:text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 hover:bg-slate-50 hover:border-primary/40 hover:text-primary transition-all"
                    >
                      Cargar más noticias
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


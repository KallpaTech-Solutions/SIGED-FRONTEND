import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, Eye, Tag, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchNoticiaBySlug } from "../../api/noticiasService";
import { getCategoryEmoji, getCategoryLabel } from "./newsCategoryUtils";

export default function NoticiaDetalle() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [noticia, setNoticia] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!slug) return;
    let montado = true;
    setCargando(true);
    setError("");

    fetchNoticiaBySlug(slug)
      .then((data) => {
        if (montado) setNoticia(data);
      })
      .catch(() => {
        if (montado) setError("No se pudo cargar la noticia.");
      })
      .finally(() => {
        if (montado) setCargando(false);
      });

    return () => {
      montado = false;
    };
  }, [slug]);

  if (cargando) {
    return (
      <div className="w-full flex-1 min-h-0 bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-emerald-700 font-inter">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-emerald-700/80">
            Cargando noticia...
          </p>
        </div>
      </div>
    );
  }

  if (error || !noticia) {
    return (
      <div className="w-full min-h-[60vh] bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl bg-white border border-red-200 shadow-[0_18px_40px_rgba(15,23,42,0.12)] p-6 text-center text-slate-900">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-red-500 mb-2">
            Noticias
          </p>
          <h1 className="text-lg font-semibold mb-2">No pudimos mostrar esta noticia</h1>
          <p className="text-xs text-slate-600 mb-4">
            {error || "La noticia no existe o ya no se encuentra disponible."}
          </p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold uppercase tracking-[0.18em] bg-emerald-500 text-white hover:bg-emerald-400"
          >
            <ArrowLeft size={14} />
            Volver
          </button>
        </div>
      </div>
    );
  }

  const openPreviewByUrl = (url) => {
    setPreviewUrl(url);
  };

  const closePreview = () => {
    setPreviewUrl(null);
  };

  const fecha = new Date(noticia.fechaPublicacion).toLocaleDateString(
    "es-PE",
    { day: "2-digit", month: "short", year: "numeric" },
  );

  // Calculamos todas las imágenes (principal + resto) SIN hooks
  const mediaAll = (() => {
    const arr = Array.isArray(noticia.mediaUrls) ? noticia.mediaUrls : [];
    if (noticia.imagenPrincipal && !arr.includes(noticia.imagenPrincipal)) {
      return [noticia.imagenPrincipal, ...arr];
    }
    return arr;
  })();

  const showPrev = () => {
    if (!previewUrl || !mediaAll.length) return;
    const currentIndex = mediaAll.findIndex((u) => u === previewUrl);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex - 1 + mediaAll.length) % mediaAll.length;
    setPreviewUrl(mediaAll[nextIndex]);
  };

  const showNext = () => {
    if (!previewUrl || !mediaAll.length) return;
    const currentIndex = mediaAll.findIndex((u) => u === previewUrl);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % mediaAll.length;
    setPreviewUrl(mediaAll[nextIndex]);
  };

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 bg-slate-50 text-slate-900 font-inter">
      {/* HERO CON ANCHO IGUAL AL CONTENIDO */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="container mx-auto px-4 pt-6 pb-8 max-w-5xl">
          <div className="bg-gradient-to-r from-slate-950/95 via-slate-900/95 to-emerald-900/90 rounded-3xl border border-emerald-500/40 px-5 py-5 md:px-7 md:py-6 text-white shadow-[0_20px_50px_rgba(15,23,42,0.6)]">
            {/* Breadcrumb */}
            <div className="text-[11px] text-emerald-200/80 mb-3 flex flex-wrap items-center gap-2">
              <Link to="/" className="hover:text-white">
                Inicio
              </Link>
              <span className="opacity-60">/</span>
              <Link to="/noticias" className="hover:text-white">
                Noticias
              </Link>
              <span className="opacity-60">/</span>
              <span className="text-emerald-100 font-semibold">
                {getCategoryEmoji(noticia.categoria)} {getCategoryLabel(noticia.categoria)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-[11px] text-slate-200 hover:text-white mb-4"
            >
              <ArrowLeft size={14} />
              Volver
            </button>

            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2.2fr)_minmax(0,2.8fr)] gap-6 items-stretch">
              {/* Imagen hero */}
              <div className="relative h-52 md:h-60 rounded-2xl overflow-hidden bg-slate-900/80 border border-emerald-500/30">
                {noticia.imagenPrincipal && (
                  <button
                    type="button"
                    onClick={() => openPreviewByUrl(noticia.imagenPrincipal)}
                    className="w-full h-full group flex items-center justify-center"
                  >
                    <img
                      src={noticia.imagenPrincipal}
                      alt={noticia.titulo}
                      className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[10px]">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 font-semibold uppercase tracking-[0.18em]">
                        {getCategoryEmoji(noticia.categoria)} {getCategoryLabel(noticia.categoria)}
                      </span>
                    </div>
                  </button>
                )}
              </div>

              {/* Meta + título */}
              <div className="flex flex-col justify-center space-y-3">
                <div className="inline-flex flex-wrap items-center gap-3 text-[11px] text-emerald-100/90">
                  {noticia.autor && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-900/60 border border-emerald-500/40 text-emerald-100">
                      Por {noticia.autor}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <CalendarDays size={12} />
                    {fecha}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={12} />
                    {noticia.vistas.toLocaleString("es-PE")} lecturas
                  </span>
                </div>

                <h1 className="text-2xl md:text-3xl font-semibold text-white leading-tight">
                  {noticia.titulo}
                </h1>

                {noticia.etiquetas && noticia.etiquetas.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-emerald-100/80">
                    <Tag size={12} />
                    {noticia.etiquetas.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full border border-emerald-500/40 bg-slate-950/40"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="bg-white border border-slate-200 rounded-3xl shadow-[0_18px_40px_rgba(15,23,42,0.08)] px-5 py-6 md:px-8 md:py-8">
          {/* Contenido */}
          {noticia.contenido && noticia.contenido.includes("<") ? (
            <article
              className="prose prose-sm md:prose-base max-w-3xl mx-auto text-slate-800
                         prose-headings:font-semibold prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
                         prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
                         prose-strong:text-slate-900
                         prose-p:leading-7 prose-p:my-3 prose-p:text-justify
                         prose-ul:my-4 prose-ol:my-4
                         [&_ul]:list-disc [&_ul]:pl-5
                         [&_ol]:list-decimal [&_ol]:pl-5
                         [&_li]:list-item [&_li]:ml-1 [&_li]:text-justify"
              dangerouslySetInnerHTML={{
                __html: noticia.contenido
                  // quitar marcas de código que venían del editor
                  .replace(/<\/?code>/g, "")
                  // tratar <p></p> y <p><br></p> como saltos de línea
                  .replace(/<p>\s*<\/p>/g, "<br />")
                  .replace(/<p>\s*<br\s*\/?>\s*<\/p>/g, "<br />"),
              }}
            />
          ) : (
            <article className="prose prose-sm md:prose-base max-w-3xl mx-auto text-slate-800 prose-p:leading-7">
              {noticia.contenido
                .split("\n")
                .map((p, i) =>
                  p.trim() ? (
                    <p key={i} className="mb-3">
                      {p}
                    </p>
                  ) : (
                    <br key={i} />
                  ),
                )}
            </article>
          )}

          {/* Galería adicional */}
          {noticia.mediaUrls && noticia.mediaUrls.length > 1 && (
            <div className="mt-8 border-t border-slate-200 pt-6">
              <h2 className="text-sm font-semibold text-slate-800 mb-3">
                Galería
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {noticia.mediaUrls.slice(1).map((url, index) => (
                  <div
                    key={url + index}
                    className="relative w-full aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer hover:shadow-md hover:-translate-y-[1px] transition-all group"
                    onClick={() => openPreviewByUrl(url)}
                  >
                    <img
                      src={url}
                      alt={`Galería ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                        <ZoomIn className="w-4 h-4 text-slate-800" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10 text-xs text-slate-500 flex justify-between items-center">
          <Link
            to="/noticias"
              className="text-emerald-600 hover:text-emerald-500 font-semibold"
          >
            ← Volver al listado de noticias
          </Link>
            <span className="text-[10px] text-slate-400">
              SIGED UNAS · Portal de noticias institucionales
            </span>
          </div>
        </div>
      </section>

      {/* Modal de vista previa */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 w-full h-full cursor-zoom-out"
            onClick={closePreview}
          />
          <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Vista previa"
              className="max-w-full max-h-[90vh] rounded-xl border border-slate-700 shadow-xl object-contain bg-black"
            />

            {/* Navegación */}
            {mediaAll.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    showPrev();
                  }}
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-slate-800 flex items-center justify-center hover:bg-white"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    showNext();
                  }}
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-slate-800 flex items-center justify-center hover:bg-white"
                  aria-label="Siguiente"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={closePreview}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-slate-800 text-sm font-bold flex items-center justify-center hover:bg-red-500 hover:text-white"
            aria-label="Cerrar vista previa"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}


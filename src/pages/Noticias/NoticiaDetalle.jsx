import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, Eye, Tag, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchNoticiaBySlug } from "../../api/noticiasService";

export default function NoticiaDetalle() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [noticia, setNoticia] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
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
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <p className="text-center text-sm text-muted-foreground">
          Cargando noticia...
        </p>
      </div>
    );
  }

  if (error || !noticia) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft size={14} />
          Volver
        </button>
        <p className="text-center text-sm text-red-600">
          {error || "La noticia no existe."}
        </p>
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
    <div className="w-full bg-white">
      <section className="border-b border-border bg-linear-to-b from-primary-50 to-white">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Breadcrumb */}
          <div className="text-[11px] text-muted-foreground mb-3 flex flex-wrap items-center gap-2">
            <Link to="/" className="hover:text-foreground">
              Inicio
            </Link>
            <span className="opacity-60">/</span>
            <Link to="/noticias" className="hover:text-foreground">
              Noticias
            </Link>
            <span className="opacity-60">/</span>
            <span className="text-foreground/80 font-semibold">
              {noticia.categoria}
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft size={14} />
            Volver
          </button>

          <div className="space-y-3">
            <div className="inline-flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                {noticia.categoria}
              </span>
              {noticia.autor && (
                <span className="px-2 py-0.5 rounded-full bg-white/70 border border-border text-foreground/70">
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

            <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
              {noticia.titulo}
            </h1>

            {noticia.etiquetas && noticia.etiquetas.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <Tag size={12} />
                {noticia.etiquetas.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full border border-border"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Imagen principal */}
        {noticia.imagenPrincipal && (
          <button
            type="button"
            onClick={() => openPreviewByUrl(noticia.imagenPrincipal)}
            className="mb-6 w-full rounded-2xl overflow-hidden border border-border bg-slate-100 group flex items-center justify-center h-64 md:h-80"
          >
            <img
              src={noticia.imagenPrincipal}
              alt={noticia.titulo}
              className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform"
            />
          </button>
        )}

        {/* Contenido */}
        <article className="prose prose-sm md:prose-base max-w-none text-foreground">
          {noticia.contenido && noticia.contenido.includes("<") ? (
            <div
              dangerouslySetInnerHTML={{ __html: noticia.contenido }}
            />
          ) : (
            noticia.contenido
              .split("\n")
              .map((p, i) =>
                p.trim() ? (
                  <p key={i} className="mb-3">
                    {p}
                  </p>
                ) : (
                  <br key={i} />
                ),
              )
          )}
        </article>

        {/* Galería adicional */}
        {noticia.mediaUrls && noticia.mediaUrls.length > 1 && (
          <div className="mt-8 border-t border-border pt-6">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">
              Galería
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {noticia.mediaUrls.slice(1).map((url, index) => (
                <div
                  key={url + index}
                  className="relative w-full aspect-4/3 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer hover:shadow-md transition-shadow group"
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

        <div className="mt-10 text-xs text-muted-foreground">
          <Link
            to="/noticias"
            className="text-primary hover:text-primary/80 font-semibold"
          >
            ← Volver al listado de noticias
          </Link>
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


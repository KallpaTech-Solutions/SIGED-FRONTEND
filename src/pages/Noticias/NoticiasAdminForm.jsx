import React, { useEffect, useState } from "react";
import RichTextEditorNoticias from "../../components/common/RichTextEditorNoticias";
import { useNavigate, useParams } from "react-router-dom";
import {
  createNoticia,
  fetchNoticiaById,
  updateNoticia,
} from "../../api/noticiasService";
import { uploadMediaFiles } from "../../api/mediaService";

export default function NoticiasAdminForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    titulo: "",
    categoria: "2",
    extracto: "",
    contenido: "",
    imagenPrincipal: "",
    mediaUrls: [],
    etiquetas: "",
    destacada: false,
    permitirComentarios: true,
    permitirReacciones: true,
    estado: "borrador",
  });

  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(isEditing);
  const [enviando, setEnviando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [progresoSubida, setProgresoSubida] = useState(0);

  useEffect(() => {
    if (!isEditing || !id) return;

    let montado = true;
    setCargando(true);

    fetchNoticiaById(id)
      .then((noticiaExistente) => {
        if (!montado || !noticiaExistente) return;
        setFormData({
          titulo: noticiaExistente.titulo || "",
          categoria: noticiaExistente.categoria ?? "2",
          extracto: noticiaExistente.extracto || "",
          contenido: noticiaExistente.contenido || "",
          imagenPrincipal: noticiaExistente.imagenPrincipal || "",
          mediaUrls: noticiaExistente.mediaUrls || [],
          etiquetas: (noticiaExistente.etiquetas || []).join(", "),
          destacada: Boolean(noticiaExistente.destacada),
          permitirComentarios: noticiaExistente.permitirComentarios !== false,
          permitirReacciones: noticiaExistente.permitirReacciones !== false,
          estado: noticiaExistente.estado || "borrador",
        });
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error("Error cargando noticia:", error);
      })
      .finally(() => {
        if (montado) setCargando(false);
      });

    return () => {
      montado = false;
    };
  }, [id, isEditing]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errores[field]) {
      setErrores((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validar = () => {
    const nuevos = {};
    if (!formData.titulo.trim()) nuevos.titulo = "El título es obligatorio";
    if (formData.titulo.length > 120)
      nuevos.titulo = "Máximo 120 caracteres";
    if (!formData.extracto.trim())
      nuevos.extracto = "El extracto es obligatorio";
    if (formData.extracto.length > 250)
      nuevos.extracto = "Máximo 250 caracteres";
    if (
      !formData.contenido ||
      !formData.contenido.replace(/<[^>]+>/g, "").trim()
    )
      nuevos.contenido = "El contenido es obligatorio";
    if (!formData.imagenPrincipal)
      nuevos.imagenPrincipal = "La imagen principal es obligatoria";
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const handleFileChange = async (event) => {
    const files = event.target.files;
    if (!files || !files.length) return;

    setSubiendo(true);
    setProgresoSubida(0);
    try {
      const nuevasUrls = await uploadMediaFiles(files, (percent) => {
        setProgresoSubida(percent);
      });
      if (!nuevasUrls.length) return;

      setFormData((prev) => {
        const todas = [...(prev.mediaUrls || []), ...nuevasUrls];
        return {
          ...prev,
          mediaUrls: todas,
          imagenPrincipal: prev.imagenPrincipal || todas[0],
        };
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error subiendo archivos:", error);
    } finally {
      setSubiendo(false);
      setProgresoSubida(0);
      event.target.value = "";
    }
  };

  const handleSetPrincipal = (url) => {
    setFormData((prev) => {
      const restantes = (prev.mediaUrls || []).filter((u) => u !== url);
      return {
        ...prev,
        imagenPrincipal: url,
        mediaUrls: [url, ...restantes],
      };
    });
  };

  const handleRemoveMedia = (url) => {
    setFormData((prev) => {
      const restantes = (prev.mediaUrls || []).filter((u) => u !== url);
      const nuevaPrincipal =
        prev.imagenPrincipal === url ? restantes[0] || "" : prev.imagenPrincipal;
      return {
        ...prev,
        mediaUrls: restantes,
        imagenPrincipal: nuevaPrincipal,
      };
    });
  };

  const handleSubmit = async (estado) => {
    if (!validar()) return;

    const payload = { ...formData, estado };
    setEnviando(true);

    try {
      if (isEditing && id) {
        await updateNoticia(id, payload);
      } else {
        await createNoticia(payload);
      }
      navigate("/PanelControl/noticias");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error guardando noticia:", error);
      setEnviando(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <button
        onClick={() => navigate("/PanelControl/noticias")}
        className="mb-4 text-xs text-slate-500 hover:text-slate-700"
      >
        ← Volver a la lista de noticias
      </button>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        {isEditing ? "Editar noticia" : "Nueva noticia"}
      </h1>

      {cargando && (
        <p className="text-xs text-slate-500 mb-4">Cargando datos de la noticia...</p>
      )}

      <div className="space-y-5 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-800">
            Título *
          </label>
          <input
            type="text"
            value={formData.titulo}
            onChange={(e) => handleChange("titulo", e.target.value)}
            maxLength={120}
            className={`w-full px-3 py-2 text-sm rounded-lg border ${
              errores.titulo ? "border-red-500" : "border-slate-200"
            } focus:outline-none focus:ring-2 focus:ring-primary/30`}
            placeholder="Ej: Agronomía se corona campeón..."
          />
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>{formData.titulo.length} / 120</span>
            {errores.titulo && (
              <span className="text-red-600">{errores.titulo}</span>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-800">
            Categoría *
          </label>
          <select
            value={formData.categoria}
            onChange={(e) => handleChange("categoria", e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="0">🎯 Institucional</option>
            <option value="1">⭐ Academia</option>
            <option value="2">🏆 Deportes</option>
            <option value="3">🔬 Investigación</option>
            <option value="4">🎭 Cultura</option>
            <option value="5">📢 Convocatorias</option>
            <option value="6">❤️ Bienestar</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-800">
            Extracto *
          </label>
          <textarea
            value={formData.extracto}
            onChange={(e) => handleChange("extracto", e.target.value)}
            rows={3}
            maxLength={250}
            className={`w-full px-3 py-2 text-sm rounded-lg border resize-none ${
              errores.extracto ? "border-red-500" : "border-slate-200"
            } focus:outline-none focus:ring-2 focus:ring-primary/30`}
            placeholder="Breve resumen de la noticia (máximo 250 caracteres)"
          />
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>{formData.extracto.length} / 250</span>
            {errores.extracto && (
              <span className="text-red-600">{errores.extracto}</span>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-800">
            Contenido *
          </label>
          <RichTextEditorNoticias
            value={formData.contenido}
            onChange={(html) => handleChange("contenido", html)}
          />
          {errores.contenido && (
            <p className="text-[11px] text-red-600">{errores.contenido}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800">
            Imágenes de la noticia *
          </label>

          {/* Input real (oculto), se dispara desde la tarjeta "+" */}
          <input
            id="imagen-noticia"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          {subiendo && (
            <div className="mt-1 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.7)] transition-all"
                style={{ width: `${progresoSubida}%` }}
              />
              <p className="mt-1 text-[10px] text-slate-500 text-right">
                Subiendo archivo... {progresoSubida}%
              </p>
            </div>
          )}

          {errores.imagenPrincipal && (
            <p className="text-[11px] text-red-600">
              {errores.imagenPrincipal}
            </p>
          )}

          <div className="mt-2 grid grid-cols-3 gap-3 max-h-44 overflow-y-auto pr-1">
            {/* Miniaturas existentes */}
            {formData.mediaUrls &&
              formData.mediaUrls.map((url, index) => (
                <div
                  key={url + index}
                  className="relative w-full aspect-4/3 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer group"
                  onClick={() => handleSetPrincipal(url)}
                >
                  <img
                    src={url}
                    alt={`Media ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {formData.imagenPrincipal === url && (
                    <span className="absolute bottom-1 left-1 px-2 py-0.5 rounded-full bg-primary text-[10px] font-semibold text-primary-foreground shadow">
                      Principal
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveMedia(url);
                    }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/90 text-[11px] font-bold text-slate-600 flex items-center justify-center shadow-sm hover:bg-red-500 hover:text-white"
                    aria-label="Quitar imagen"
                  >
                    ×
                  </button>
                </div>
              ))}

            {/* Tarjeta "+" para añadir más (siempre visible) */}
            <label
              htmlFor="imagen-noticia"
              className="flex items-center justify-center w-full aspect-4/3 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 text-2xl font-bold cursor-pointer hover:border-primary hover:text-primary bg-slate-50"
            >
              +
            </label>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-800">
            Etiquetas (separadas por coma)
          </label>
          <input
            type="text"
            value={formData.etiquetas}
            onChange={(e) => handleChange("etiquetas", e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Fútbol, Interfacultades, Agronomía"
          />
        </div>

        <div className="space-y-2 pt-2">
          <p className="text-sm font-semibold text-slate-800">
            Configuración de interacción
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                checked={formData.destacada}
                onChange={(e) => handleChange("destacada", e.target.checked)}
                className="w-4 h-4"
              />
              Es destacada (aparece primero en el feed)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                checked={formData.permitirComentarios}
                onChange={(e) =>
                  handleChange("permitirComentarios", e.target.checked)
                }
                className="w-4 h-4"
              />
              Permitir comentarios
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                checked={formData.permitirReacciones}
                onChange={(e) =>
                  handleChange("permitirReacciones", e.target.checked)
                }
                className="w-4 h-4"
              />
              Permitir reacciones (me gusta, etc.)
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => navigate("/PanelControl/noticias")}
            disabled={enviando}
            className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={enviando}
            onClick={() => handleSubmit("borrador")}
            className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {enviando
              ? "Guardando..."
              : isEditing
              ? "Actualizar como borrador"
              : "Guardar borrador"}
          </button>
          <button
            type="button"
            disabled={enviando}
            onClick={() => handleSubmit("publicada")}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
          >
            {enviando
              ? "Guardando..."
              : isEditing
              ? "Actualizar y publicar"
              : "Publicar"}
          </button>
        </div>
      </div>
    </div>
  );
}


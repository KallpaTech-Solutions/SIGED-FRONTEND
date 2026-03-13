import React, { useEffect, useState } from "react";
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
    categoria: "resultados",
    extracto: "",
    contenido: "",
    imagenPrincipal: "",
    mediaUrls: [],
    etiquetas: "",
    destacada: false,
    estado: "borrador",
  });

  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(isEditing);
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
          categoria: noticiaExistente.categoria || "resultados",
          extracto: noticiaExistente.extracto || "",
          contenido: noticiaExistente.contenido || "",
          imagenPrincipal: noticiaExistente.imagenPrincipal || "",
          mediaUrls: noticiaExistente.mediaUrls || [],
          etiquetas: (noticiaExistente.etiquetas || []).join(", "),
          destacada: noticiaExistente.destacada || false,
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
    if (!formData.contenido.trim())
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

  const handleSubmit = async (estado) => {
    if (!validar()) return;

    const payload = { ...formData, estado };

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
            <option value="resultados">🏆 Resultados</option>
            <option value="jugadores">⭐ Jugadores</option>
            <option value="equipos">👥 Equipos</option>
            <option value="convocatorias">📢 Convocatorias</option>
            <option value="institucional">🎯 Institucional</option>
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
          <textarea
            value={formData.contenido}
            onChange={(e) => handleChange("contenido", e.target.value)}
            rows={8}
            className={`w-full px-3 py-2 text-sm rounded-lg border resize-none font-mono ${
              errores.contenido ? "border-red-500" : "border-slate-200"
            } focus:outline-none focus:ring-2 focus:ring-primary/30`}
            placeholder="Contenido completo del artículo..."
          />
          {errores.contenido && (
            <p className="text-[11px] text-red-600">{errores.contenido}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800">
            Imagen principal *
          </label>
          <input
            id="imagen-noticia"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="imagen-noticia"
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
          >
            {subiendo ? "Subiendo..." : "Seleccionar desde el equipo"}
          </label>
          {subiendo && (
            <div className="mt-2 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
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
          {formData.imagenPrincipal && (
            <div className="mt-3">
              <p className="text-[11px] text-slate-500 mb-1">
                Vista previa de la imagen principal
              </p>
              <img
                src={formData.imagenPrincipal}
                alt="Imagen principal"
                className="w-full h-48 rounded-lg object-cover border border-slate-200"
              />
            </div>
          )}
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

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-800">
            <input
              type="checkbox"
              checked={formData.destacada}
              onChange={(e) => handleChange("destacada", e.target.checked)}
              className="w-4 h-4"
            />
            Marcar como destacada
          </label>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => navigate("/PanelControl/noticias")}
            className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => handleSubmit("borrador")}
            className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Guardar borrador
          </button>
          <button
            type="button"
            onClick={() => handleSubmit("publicada")}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
          >
            Publicar
          </button>
        </div>
      </div>
    </div>
  );
}


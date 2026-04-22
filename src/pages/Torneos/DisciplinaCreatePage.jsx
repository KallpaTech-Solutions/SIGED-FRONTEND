import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2, Layers, ImagePlus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  createDiscipline,
  DISCIPLINE_TEMPLATE_OPTIONS,
} from "../../api/disciplinesAdminService";

export default function DisciplinaCreatePage() {
  const { can } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const canManage = can("tourn.manage");

  const [name, setName] = useState("");
  const [templateKey, setTemplateKey] = useState(
    DISCIPLINE_TEMPLATE_OPTIONS[0]?.key ?? ""
  );
  const [iconFile, setIconFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast("Indicá el nombre de la disciplina.", "error");
      return;
    }
    if (!templateKey) {
      toast("Elegí una plantilla de reglas.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("Name", name.trim());
      fd.append("TemplateKey", templateKey);
      if (iconFile) fd.append("IconFile", iconFile);
      const created = await createDiscipline(fd);
      const newId = created?.id ?? created?.Id;
      toast("Disciplina creada. Revisá el detalle y las reglas si hace falta.", "success");
      if (newId) {
        navigate(`/PanelControl/disciplinas/${newId}`);
      } else {
        navigate("/PanelControl/disciplinas");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "No se pudo crear la disciplina.";
      toast(typeof msg === "string" ? msg : "Error al crear.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center text-sm text-amber-900">
        No tenés permiso para crear disciplinas. Hace falta{" "}
        <strong>administración de torneos</strong>.
        <Link
          to="/PanelControl/disciplinas"
          className="block mt-4 font-bold text-emerald-800 hover:underline"
        >
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <Link
        to="/PanelControl/disciplinas"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700"
      >
        <ChevronLeft className="w-4 h-4" />
        Disciplinas
      </Link>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-emerald-900 px-6 py-5 text-white flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
            <Layers className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Nueva disciplina</h1>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              Nombre + plantilla oficial de reglas (FIFA, FIVB, FIBA…).
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
              placeholder="Ej. Fútbol campo, Futsal UNAS…"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Plantilla de reglas *
            </label>
            <select
              value={templateKey}
              onChange={(e) => setTemplateKey(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
            >
              {DISCIPLINE_TEMPLATE_OPTIONS.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Define puntos, periodos o sets según el deporte.
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-[11px] font-bold uppercase text-slate-500 mb-1">
              <ImagePlus className="w-3.5 h-3.5" />
              Icono (opcional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setIconFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-800"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Layers className="w-4 h-4" />
              )}
              Crear disciplina
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

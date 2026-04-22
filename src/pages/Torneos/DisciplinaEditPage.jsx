import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Loader2, Layers, ImagePlus, Save, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  fetchDisciplineById,
  updateDiscipline,
  getDisciplineTemplateLabel,
} from "../../api/disciplinesAdminService";

export default function DisciplinaEditPage() {
  const { disciplineId } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const { toast } = useToast();
  const canManage = can("tourn.manage");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [name, setName] = useState("");
  const [templateKey, setTemplateKey] = useState("");
  const [iconFile, setIconFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!disciplineId) return;
      setLoading(true);
      setError(null);
      try {
        const d = await fetchDisciplineById(disciplineId);
        if (cancelled) return;
        setName(d?.name ?? d?.Name ?? "");
        setTemplateKey(d?.templateKey ?? d?.TemplateKey ?? "");
      } catch (e) {
        if (!cancelled) {
          setError(
            e?.response?.status === 404
              ? "Disciplina no encontrada."
              : e?.message || "No se pudo cargar."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [disciplineId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canManage || !name.trim()) {
      toast("Indicá el nombre.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("Name", name.trim());
      if (iconFile) fd.append("IconFile", iconFile);
      await updateDiscipline(disciplineId, fd);
      toast("Disciplina actualizada.", "success");
      navigate(`/PanelControl/disciplinas/${disciplineId}`);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "No se pudo guardar.";
      toast(typeof msg === "string" ? msg : "Error al guardar.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center text-sm text-amber-900">
        No tenés permiso para editar disciplinas. Hace falta{" "}
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

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-slate-500">
        <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
        <span className="text-sm font-semibold">Cargando…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-red-800 text-sm flex gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <div>
          <p>{error}</p>
          <Link
            to="/PanelControl/disciplinas"
            className="inline-block mt-3 font-bold text-emerald-900 hover:underline"
          >
            Volver
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <Link
        to={`/PanelControl/disciplinas/${disciplineId}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700"
      >
        <ChevronLeft className="w-4 h-4" />
        Disciplina
      </Link>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-emerald-900 px-6 py-5 text-white flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
            <Layers className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Editar disciplina</h1>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              Nombre e icono. La plantilla no se recalcula desde aquí.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {templateKey ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
              <p className="text-[11px] font-bold uppercase text-slate-500">Plantilla registrada</p>
              <p className="font-semibold text-slate-900 mt-1">
                {getDisciplineTemplateLabel(templateKey)}
              </p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{templateKey}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-xs text-amber-900">
              Esta disciplina no tiene clave de plantilla en base de datos. El tipo de puntaje y las
              reglas siguen según lo cargado al crear o en &quot;Reglas maestras&quot;.
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-[11px] font-bold uppercase text-slate-500 mb-1">
              <ImagePlus className="w-3.5 h-3.5" />
              Nuevo icono (opcional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setIconFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-800"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link
              to={`/PanelControl/disciplinas/${disciplineId}`}
              className="inline-flex items-center px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

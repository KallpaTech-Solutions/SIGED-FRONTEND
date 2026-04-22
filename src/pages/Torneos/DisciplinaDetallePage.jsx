import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Loader2,
  Layers,
  Pencil,
  BookOpen,
  Trash2,
  Power,
  AlertCircle,
  LayoutList,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import {
  fetchDisciplineById,
  fetchDisciplineRules,
  deleteDiscipline,
  toggleDisciplineStatus,
  getDisciplineTemplateLabel,
} from "../../api/disciplinesAdminService";
import { OFFICIAL_TEMPLATE_CATALOG } from "../../data/disciplineTemplateCatalog";
import { scoringTypeLabel } from "../../utils/tournamentEnums";

export default function DisciplinaDetallePage() {
  const { disciplineId } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const canManage = can("tourn.manage");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [disc, setDisc] = useState(null);
  const [rules, setRules] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!disciplineId) return;
    setLoading(true);
    setError(null);
    try {
      const [d, r] = await Promise.all([
        fetchDisciplineById(disciplineId),
        fetchDisciplineRules(disciplineId),
      ]);
      setDisc(d);
      setRules(Array.isArray(r) ? r : []);
    } catch (e) {
      setError(
        e?.response?.status === 404
          ? "Disciplina no encontrada."
          : e?.message || "No se pudo cargar."
      );
    } finally {
      setLoading(false);
    }
  }, [disciplineId]);

  useEffect(() => {
    load();
  }, [load]);

  const name = disc?.name ?? disc?.Name ?? "—";
  const active = disc?.isActive ?? disc?.IsActive;
  const iconUrl = disc?.iconUrl ?? disc?.IconUrl;
  const templateKey = disc?.templateKey ?? disc?.TemplateKey;
  const scoringRaw = disc?.scoringType ?? disc?.ScoringType;
  const templateLabel = getDisciplineTemplateLabel(templateKey);
  const catalog = templateKey ? OFFICIAL_TEMPLATE_CATALOG[templateKey] : null;

  const handleToggle = async () => {
    if (!canManage) return;
    const ok = await confirm({
      title: active ? "Desactivar disciplina" : "Activar disciplina",
      message: active
        ? "La disciplina dejará de aparecer en listados que filtren solo activas."
        : "La disciplina volverá a estar disponible para nuevas competencias.",
      confirmText: active ? "Desactivar" : "Activar",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await toggleDisciplineStatus(disciplineId);
      toast(active ? "Disciplina desactivada." : "Disciplina activada.", "success");
      await load();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "No se pudo cambiar el estado.";
      toast(typeof msg === "string" ? msg : "Error.", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!canManage) return;
    const ok = await confirm({
      title: "Eliminar disciplina",
      message:
        "Solo se puede eliminar si no hay competencias que la usen. Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      variant: "danger",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await deleteDiscipline(disciplineId);
      toast("Disciplina eliminada.", "success");
      navigate("/PanelControl/disciplinas");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "No se pudo eliminar.";
      toast(typeof msg === "string" ? msg : "Error al eliminar.", "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-slate-500">
        <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
        <span className="text-sm font-semibold">Cargando disciplina…</span>
      </div>
    );
  }

  if (error || !disc) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-red-800 text-sm flex gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <div>
          <p>{error || "Sin datos."}</p>
          <Link
            to="/PanelControl/disciplinas"
            className="inline-block mt-3 font-bold text-emerald-900 hover:underline"
          >
            Volver al listado
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link
          to="/PanelControl/disciplinas"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700 mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          Disciplinas
        </Link>

        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
              {iconUrl ? (
                <img src={iconUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Layers className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{name}</h1>
              <p className="text-sm text-slate-500 mt-1">
                {scoringTypeLabel(scoringRaw)}
                {" · "}
                {active ? (
                  <span className="text-emerald-700 font-medium">Activa</span>
                ) : (
                  <span className="text-slate-500">Inactiva</span>
                )}
              </p>
            </div>
          </div>

          {canManage && (
            <div className="flex flex-wrap gap-2 shrink-0">
              <Link
                to={`/PanelControl/disciplinas/${disciplineId}/editar`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-50"
              >
                <Pencil className="w-3.5 h-3.5" />
                Editar datos
              </Link>
              <Link
                to={`/PanelControl/disciplinas/${disciplineId}/reglas`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Reglas maestras
              </Link>
              <button
                type="button"
                disabled={busy}
                onClick={handleToggle}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <Power className="w-3.5 h-3.5" />
                {active ? "Desactivar" : "Activar"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/80">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Plantilla al crear
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {templateKey ? (
              <>
                <span className="font-semibold text-slate-900">{templateLabel}</span>
                <span className="text-slate-400 font-mono text-xs ml-2">({templateKey})</span>
              </>
            ) : (
              <span className="text-slate-500">
                No hay clave de plantilla guardada (disciplinas creadas antes de esta mejora). El
                tipo de puntaje sigue siendo{" "}
                <span className="font-medium">{scoringTypeLabel(scoringRaw)}</span>.
              </span>
            )}
          </p>
        </div>
        <div className="px-5 py-4 text-xs text-slate-500 leading-relaxed">
          La plantilla define el <strong className="text-slate-700">ScoringType</strong> y las{" "}
          <strong className="text-slate-700">reglas iniciales</strong> al crear la disciplina. Lo
          que ves abajo como “referencia” es el contenido oficial del diccionario de plantillas; las
          reglas reales pueden haberse editado en{" "}
          <Link
            to={`/PanelControl/disciplinas/${disciplineId}/reglas`}
            className="font-bold text-emerald-700 hover:underline"
          >
            Reglas maestras
          </Link>
          .
        </div>
      </div>

      {catalog ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-amber-50/60 flex items-center gap-2">
            <LayoutList className="w-4 h-4 text-amber-800" />
            <span className="text-xs font-bold uppercase tracking-wide text-amber-900/80">
              Referencia de plantilla — {catalog.name}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[10px] font-bold uppercase text-slate-500">
                  <th className="px-4 py-2">Clave</th>
                  <th className="px-4 py-2">Valor por defecto</th>
                  <th className="px-4 py-2">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {catalog.rules.map((row) => (
                  <tr key={row.key} className="border-b border-slate-50">
                    <td className="px-4 py-2 font-mono text-xs">{row.key}</td>
                    <td className="px-4 py-2 text-xs">{row.value}</td>
                    <td className="px-4 py-2 text-xs text-slate-600">{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Reglas guardadas en base de datos
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              {rules.length} regla{rules.length === 1 ? "" : "s"} — se clonan a cada competencia
              nueva.
            </p>
          </div>
          <Link
            to={`/PanelControl/disciplinas/${disciplineId}/reglas`}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            Editar lista completa →
          </Link>
        </div>
        {rules.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">No hay reglas cargadas.</p>
        ) : (
          <ul className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {rules.slice(0, 12).map((r) => {
              const k = r.ruleKey ?? r.RuleKey;
              const v = r.ruleValue ?? r.RuleValue;
              return (
                <li key={r.id ?? r.Id ?? `${k}-${v}`} className="px-5 py-2 flex gap-3 text-sm">
                  <span className="font-mono text-xs text-slate-800 shrink-0">{k}</span>
                  <span className="text-slate-600 truncate">{v}</span>
                </li>
              );
            })}
          </ul>
        )}
        {rules.length > 12 ? (
          <p className="px-5 py-2 text-[11px] text-slate-400 border-t border-slate-100">
            Mostrando 12 de {rules.length}. Ver todas en Reglas maestras.
          </p>
        ) : null}
      </div>
    </div>
  );
}

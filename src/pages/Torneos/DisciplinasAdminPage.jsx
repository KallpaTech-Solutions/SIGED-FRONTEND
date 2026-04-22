import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  Plus,
  Layers,
  AlertCircle,
  Settings2,
  ChevronRight,
  Eye,
  Power,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import {
  fetchDisciplinesAdmin,
  deleteDiscipline,
  toggleDisciplineStatus,
} from "../../api/disciplinesAdminService";
import { scoringTypeLabel } from "../../utils/tournamentEnums";

export default function DisciplinasAdminPage() {
  const { can } = useAuth();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const canManage = can("tourn.manage");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const refreshList = useCallback(async () => {
    try {
      const data = await fetchDisciplinesAdmin({ onlyActive: false });
      setItems(data);
    } catch (e) {
      toast(
        e?.response?.data?.message ||
          e?.message ||
          "No se pudo actualizar el listado.",
        "error"
      );
    }
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchDisciplinesAdmin({ onlyActive: false });
        if (!cancelled) setItems(data);
      } catch (e) {
        if (!cancelled) {
          setError(
            e?.response?.data?.message ||
              e?.message ||
              "No se pudieron cargar las disciplinas."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggle = async (e, did, active) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canManage) return;
    const ok = await confirm({
      title: active ? "Desactivar disciplina" : "Activar disciplina",
      message: active
        ? "Dejará de mostrarse en listados que filtren solo activas."
        : "Volverá a estar disponible para nuevas competencias.",
      confirmText: active ? "Desactivar" : "Activar",
    });
    if (!ok) return;
    setBusyId(did);
    try {
      await toggleDisciplineStatus(did);
      toast(active ? "Disciplina desactivada." : "Disciplina activada.", "success");
      await refreshList();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "No se pudo cambiar el estado.";
      toast(typeof msg === "string" ? msg : "Error.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (e, did) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canManage) return;
    const ok = await confirm({
      title: "Eliminar disciplina",
      message:
        "Solo se elimina si no hay competencias que la usen. No se puede deshacer.",
      confirmText: "Eliminar",
      variant: "danger",
    });
    if (!ok) return;
    setBusyId(did);
    try {
      await deleteDiscipline(did);
      toast("Disciplina eliminada.", "success");
      await refreshList();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "No se pudo eliminar.";
      toast(typeof msg === "string" ? msg : "Error al eliminar.", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {!canManage && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
          Solo lectura. Crear o modificar disciplinas requiere permiso de{" "}
          <strong>administración de torneos</strong>.
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 py-16 text-slate-500 rounded-2xl border border-slate-200 bg-white">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="text-sm font-semibold">Cargando…</span>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 flex items-start gap-3 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-8 py-14 text-center">
          <Layers className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No hay disciplinas.</p>
          {canManage && (
            <Link
              to="/PanelControl/disciplinas/nuevo"
              className="inline-flex items-center gap-2 mt-4 text-emerald-700 font-bold text-sm hover:underline"
            >
              Crear la primera disciplina
            </Link>
          )}
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 md:px-5 md:py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/90">
            <p className="text-sm text-slate-600 leading-snug">
              Listado ordenado por nombre. Las competencias clonan las reglas de la disciplina
              elegida.
            </p>
            {canManage && (
              <Link
                to="/PanelControl/disciplinas/nuevo"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 shadow-sm shrink-0 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                Nueva disciplina
              </Link>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-white text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3 md:px-4 min-w-[200px]">Disciplina</th>
                  <th className="px-3 py-3 md:px-4 whitespace-nowrap hidden md:table-cell max-w-[220px]">
                    Tipo de puntaje
                  </th>
                  <th className="px-3 py-3 md:px-4 whitespace-nowrap">Estado</th>
                  <th className="px-3 py-3 md:px-4 text-right min-w-[260px]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((d) => {
                  const did = d.id ?? d.Id;
                  const name = d.name ?? d.Name ?? "—";
                  const active = d.isActive ?? d.IsActive;
                  const scoringRaw = d.scoringType ?? d.ScoringType;
                  const scoring = scoringTypeLabel(scoringRaw);
                  return (
                    <tr
                      key={did}
                      className="hover:bg-slate-50/80 transition-colors align-top"
                    >
                      <td className="px-3 py-3 md:px-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                            {d.iconUrl || d.IconUrl ? (
                              <img
                                src={d.iconUrl ?? d.IconUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Layers className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0 pt-0.5">
                            <Link
                              to={`/PanelControl/disciplinas/${did}`}
                              className="font-semibold text-slate-900 hover:text-emerald-800 inline-flex items-center gap-1 group"
                            >
                              {name}
                              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-emerald-600 transition-opacity shrink-0" />
                            </Link>
                            <p className="text-[11px] text-slate-500 mt-0.5 md:hidden line-clamp-2">
                              {scoring}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 md:px-4 text-slate-600 text-xs leading-snug hidden md:table-cell">
                        {scoring}
                      </td>
                      <td className="px-3 py-3 md:px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            active
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {active ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td className="px-3 py-3 md:px-4 text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-1">
                          <Link
                            to={`/PanelControl/disciplinas/${did}`}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                            title="Ver ficha"
                          >
                            <Eye className="w-3.5 h-3.5 shrink-0" />
                            Detalle
                          </Link>
                          <Link
                            to={`/PanelControl/disciplinas/${did}/reglas`}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                            title="Reglas maestras"
                          >
                            <Settings2 className="w-3.5 h-3.5 shrink-0" />
                            Reglas
                          </Link>
                          {canManage && (
                            <>
                              <button
                                type="button"
                                disabled={busyId === did}
                                onClick={(ev) => handleToggle(ev, did, active)}
                                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              >
                                <Power className="w-3.5 h-3.5 shrink-0" />
                                {active ? "Desactivar" : "Activar"}
                              </button>
                              <button
                                type="button"
                                disabled={busyId === did}
                                onClick={(ev) => handleDelete(ev, did)}
                                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-red-200 text-[11px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                Eliminar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

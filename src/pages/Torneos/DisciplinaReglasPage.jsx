import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Loader2,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  fetchDisciplineById,
  fetchDefaultReportAssets,
  fetchDisciplineReportAssets,
  fetchDisciplineRules,
  updateDisciplineRules,
  updateDefaultReportAssets,
  updateDisciplineReportAssets,
  DISCIPLINE_RULE_KEY_HINTS,
} from "../../api/disciplinesAdminService";
import ActaReportHeader from "../../components/torneos/ActaReportHeader";

function newRowId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `row-${Date.now()}-${Math.random()}`;
}

/** Fila con `rowId` estable para no cambiar la `key` de React al editar la clave. */
function normalizeRuleRow(r) {
  const key = (r.ruleKey ?? r.RuleKey ?? "").trim();
  const val = (r.ruleValue ?? r.RuleValue ?? "").trim();
  const rowId = r.rowId ?? r.id ?? r.Id ?? newRowId();
  return { rowId, ruleKey: key, ruleValue: val };
}

function revokeBlobUrl(url) {
  if (url && String(url).startsWith("blob:")) URL.revokeObjectURL(url);
}

/** URL efectiva izquierda/derecha según respuesta del API (incluye fallback global en disciplina). */
function effectiveLeftFromAssets(a) {
  if (!a) return null;
  return (
    a.effectiveLeftLogoUrl ??
    a.EffectiveLeftLogoUrl ??
    a.defaultLeftLogoUrl ??
    a.DefaultLeftLogoUrl ??
    a.leftLogoUrl ??
    a.LeftLogoUrl ??
    null
  );
}

function effectiveRightFromAssets(a) {
  if (!a) return null;
  return (
    a.effectiveRightLogoUrl ??
    a.EffectiveRightLogoUrl ??
    a.defaultRightLogoUrl ??
    a.DefaultRightLogoUrl ??
    a.rightLogoUrl ??
    a.RightLogoUrl ??
    null
  );
}

export default function DisciplinaReglasPage() {
  const { disciplineId } = useParams();
  const { can } = useAuth();
  const { toast } = useToast();
  const canManage = can("tourn.manage");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [disciplineName, setDisciplineName] = useState("");
  const [rows, setRows] = useState([]);
  const [assetsBusy, setAssetsBusy] = useState(false);
  const [disciplineAssets, setDisciplineAssets] = useState(null);
  const [defaultAssets, setDefaultAssets] = useState(null);
  /** Previsualización local (blob) al elegir archivo, antes de guardar. */
  const [discBlobLeft, setDiscBlobLeft] = useState(null);
  const [discBlobRight, setDiscBlobRight] = useState(null);
  const [globalBlobLeft, setGlobalBlobLeft] = useState(null);
  const [globalBlobRight, setGlobalBlobRight] = useState(null);

  const load = useCallback(async () => {
    if (!disciplineId) return;
    setLoading(true);
    setError(null);
    try {
      const [disc, rules] = await Promise.all([
        fetchDisciplineById(disciplineId),
        fetchDisciplineRules(disciplineId),
      ]);
      setDisciplineName(disc?.name ?? disc?.Name ?? "Disciplina");
      const list = (rules ?? []).map(normalizeRuleRow).filter((x) => x.ruleKey);
      setRows(
        list.length ? list : [{ rowId: newRowId(), ruleKey: "", ruleValue: "" }]
      );
      const [discRes, defRes] = await Promise.allSettled([
        fetchDisciplineReportAssets(disciplineId),
        fetchDefaultReportAssets(),
      ]);
      setDisciplineAssets(discRes.status === "fulfilled" ? discRes.value : null);
      setDefaultAssets(defRes.status === "fulfilled" ? defRes.value : null);
      if (discRes.status !== "fulfilled" || defRes.status !== "fulfilled") {
        toast(
          "No se pudieron cargar los logos del acta. Si acabás de actualizar el backend, aplicá la migración EF y reiniciá la API.",
          "error"
        );
      }
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

  const setRow = (index, field, value) => {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      )
    );
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { rowId: newRowId(), ruleKey: "", ruleValue: "" },
    ]);
  };

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canManage) return;

    const payload = rows
      .map(normalizeRuleRow)
      .filter((r) => r.ruleKey.length > 0);

    const keys = new Set();
    for (const r of payload) {
      const k = r.ruleKey.toUpperCase();
      if (keys.has(k)) {
        toast(`Clave duplicada: ${k}`, "error");
        return;
      }
      keys.add(k);
    }

    setSaving(true);
    try {
      await updateDisciplineRules(disciplineId, payload);
      toast("Reglas guardadas.", "success");
      await load();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "No se pudo guardar.";
      toast(typeof msg === "string" ? msg : "Error al guardar.", "error");
    } finally {
      setSaving(false);
    }
  };

  const reloadAssets = useCallback(async () => {
    if (!disciplineId) return;
    const [d, g] = await Promise.allSettled([
      fetchDisciplineReportAssets(disciplineId),
      fetchDefaultReportAssets(),
    ]);
    setDisciplineAssets(d.status === "fulfilled" ? d.value : null);
    setDefaultAssets(g.status === "fulfilled" ? g.value : null);
  }, [disciplineId]);

  const clearDisciplineBlobPreviews = () => {
    setDiscBlobLeft((prev) => {
      revokeBlobUrl(prev);
      return null;
    });
    setDiscBlobRight((prev) => {
      revokeBlobUrl(prev);
      return null;
    });
  };

  const clearGlobalBlobPreviews = () => {
    setGlobalBlobLeft((prev) => {
      revokeBlobUrl(prev);
      return null;
    });
    setGlobalBlobRight((prev) => {
      revokeBlobUrl(prev);
      return null;
    });
  };

  const handleSaveDisciplineAssets = async (e) => {
    e.preventDefault();
    if (!canManage || !disciplineId) return;
    const fd = new FormData(e.currentTarget);
    setAssetsBusy(true);
    try {
      await updateDisciplineReportAssets(disciplineId, fd);
      e.currentTarget.reset();
      clearDisciplineBlobPreviews();
      try {
        await reloadAssets();
      } catch {
        toast(
          "Logos guardados, pero no se pudo refrescar la vista. Recargue la página si hace falta.",
          "warning"
        );
        return;
      }
      toast("Logos de acta por disciplina actualizados.", "success");
    } catch (err) {
      const d = err?.response?.data;
      const msg =
        (typeof d === "string" ? d : d?.message) ||
        d?.detail ||
        "No se pudo guardar logos de disciplina.";
      toast(typeof msg === "string" ? msg : "No se pudo guardar logos de disciplina.", "error");
    } finally {
      setAssetsBusy(false);
    }
  };

  const handleSaveDefaultAssets = async (e) => {
    e.preventDefault();
    if (!canManage) return;
    const fd = new FormData(e.currentTarget);
    setAssetsBusy(true);
    try {
      await updateDefaultReportAssets(fd);
      e.currentTarget.reset();
      clearGlobalBlobPreviews();
      try {
        await reloadAssets();
      } catch {
        toast(
          "Logos guardados, pero no se pudo refrescar la vista. Recargue la página si hace falta.",
          "warning"
        );
        return;
      }
      toast("Logos predeterminados de acta actualizados.", "success");
    } catch (err) {
      const d = err?.response?.data;
      const msg =
        (typeof d === "string" ? d : d?.message) ||
        d?.detail ||
        "No se pudo guardar logos predeterminados.";
      toast(typeof msg === "string" ? msg : "No se pudo guardar logos predeterminados.", "error");
    } finally {
      setAssetsBusy(false);
    }
  };

  const actaPreviewLeft =
    discBlobLeft ||
    effectiveLeftFromAssets(disciplineAssets) ||
    globalBlobLeft ||
    effectiveLeftFromAssets(defaultAssets);
  const actaPreviewRight =
    discBlobRight ||
    effectiveRightFromAssets(disciplineAssets) ||
    globalBlobRight ||
    effectiveRightFromAssets(defaultAssets);

  useEffect(() => {
    setDiscBlobLeft((p) => {
      revokeBlobUrl(p);
      return null;
    });
    setDiscBlobRight((p) => {
      revokeBlobUrl(p);
      return null;
    });
    setGlobalBlobLeft((p) => {
      revokeBlobUrl(p);
      return null;
    });
    setGlobalBlobRight((p) => {
      revokeBlobUrl(p);
      return null;
    });
  }, [disciplineId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-slate-500">
        <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
        <span className="text-sm font-semibold">Cargando reglas…</span>
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
            Volver a disciplinas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-slate-600 mb-3">
          <Link
            to="/PanelControl/disciplinas"
            className="inline-flex items-center gap-1 hover:text-emerald-700"
          >
            <ChevronLeft className="w-4 h-4" />
            Disciplinas
          </Link>
          <span className="text-slate-300">/</span>
          <Link
            to={`/PanelControl/disciplinas/${disciplineId}`}
            className="hover:text-emerald-700 truncate max-w-[200px]"
          >
            {disciplineName}
          </Link>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Reglas · {disciplineName}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5 max-w-2xl">
                Estas reglas son la base que se clona a cada competencia. Al
                guardar se reemplaza la lista completa (claves sin repetir).
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <form
          onSubmit={handleSaveDisciplineAssets}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-3"
        >
          <h3 className="text-sm font-bold text-slate-900">Acta · Logos por disciplina</h3>
          <p className="text-xs text-slate-500">
            Se aplican a esta disciplina y, si no existen, se usa la configuración predeterminada global.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Logo izquierdo</label>
              <input
                type="file"
                name="LeftLogoFile"
                accept="image/*"
                className="w-full text-xs"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setDiscBlobLeft((prev) => {
                    revokeBlobUrl(prev);
                    return f ? URL.createObjectURL(f) : null;
                  });
                }}
              />
              <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" name="ClearLeftLogo" />
                Quitar logo izquierdo
              </label>
              <p className="text-[10px] text-slate-400">Vista previa</p>
              {discBlobLeft || effectiveLeftFromAssets(disciplineAssets) ? (
                <img
                  src={discBlobLeft || effectiveLeftFromAssets(disciplineAssets)}
                  alt="Logo izquierdo acta"
                  className="h-20 w-full object-contain rounded border border-slate-200 bg-slate-50"
                />
              ) : (
                <div className="h-20 rounded border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[10px] text-slate-400">
                  Sin imagen
                </div>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Logo derecho</label>
              <input
                type="file"
                name="RightLogoFile"
                accept="image/*"
                className="w-full text-xs"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setDiscBlobRight((prev) => {
                    revokeBlobUrl(prev);
                    return f ? URL.createObjectURL(f) : null;
                  });
                }}
              />
              <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" name="ClearRightLogo" />
                Quitar logo derecho
              </label>
              <p className="text-[10px] text-slate-400">Vista previa</p>
              {discBlobRight || effectiveRightFromAssets(disciplineAssets) ? (
                <img
                  src={discBlobRight || effectiveRightFromAssets(disciplineAssets)}
                  alt="Logo derecho acta"
                  className="h-20 w-full object-contain rounded border border-slate-200 bg-slate-50"
                />
              ) : (
                <div className="h-20 rounded border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[10px] text-slate-400">
                  Sin imagen
                </div>
              )}
            </div>
          </div>
          {canManage && (
            <button
              type="submit"
              disabled={assetsBusy}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold disabled:opacity-60"
            >
              {assetsBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar logos de disciplina
            </button>
          )}
        </form>

        <form
          onSubmit={handleSaveDefaultAssets}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-3"
        >
          <h3 className="text-sm font-bold text-slate-900">Acta · Logos predeterminados (global)</h3>
          <p className="text-xs text-slate-500">
            Se usan en todas las disciplinas que no tengan logo propio.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Logo izquierdo</label>
              <input
                type="file"
                name="LeftLogoFile"
                accept="image/*"
                className="w-full text-xs"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setGlobalBlobLeft((prev) => {
                    revokeBlobUrl(prev);
                    return f ? URL.createObjectURL(f) : null;
                  });
                }}
              />
              <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" name="ClearLeftLogo" />
                Quitar logo izquierdo
              </label>
              <p className="text-[10px] text-slate-400">Vista previa</p>
              {globalBlobLeft || effectiveLeftFromAssets(defaultAssets) ? (
                <img
                  src={globalBlobLeft || effectiveLeftFromAssets(defaultAssets)}
                  alt="Logo global izquierdo"
                  className="h-20 w-full object-contain rounded border border-slate-200 bg-slate-50"
                />
              ) : (
                <div className="h-20 rounded border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[10px] text-slate-400">
                  Sin imagen
                </div>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Logo derecho</label>
              <input
                type="file"
                name="RightLogoFile"
                accept="image/*"
                className="w-full text-xs"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setGlobalBlobRight((prev) => {
                    revokeBlobUrl(prev);
                    return f ? URL.createObjectURL(f) : null;
                  });
                }}
              />
              <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" name="ClearRightLogo" />
                Quitar logo derecho
              </label>
              <p className="text-[10px] text-slate-400">Vista previa</p>
              {globalBlobRight || effectiveRightFromAssets(defaultAssets) ? (
                <img
                  src={globalBlobRight || effectiveRightFromAssets(defaultAssets)}
                  alt="Logo global derecho"
                  className="h-20 w-full object-contain rounded border border-slate-200 bg-slate-50"
                />
              ) : (
                <div className="h-20 rounded border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[10px] text-slate-400">
                  Sin imagen
                </div>
              )}
            </div>
          </div>
          {canManage && (
            <button
              type="submit"
              disabled={assetsBusy}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 text-white text-xs font-bold disabled:opacity-60"
            >
              {assetsBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar logos globales
            </button>
          )}
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Vista previa · encabezado del acta (PDF)</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Misma franja que el PDF y la vista previa del partido: logos, título SIGED — ACTA DE PARTIDO,
            campeonato, disciplina y marcador. Los archivos sin guardar también se muestran (disciplina →
            global).
          </p>
        </div>
        <ActaReportHeader
          variant="compact"
          leftLogoUrl={actaPreviewLeft}
          rightLogoUrl={actaPreviewRight}
          tournamentName="Nombre del campeonato (desde el torneo)"
          disciplineName={disciplineName}
          localTeamName="Local"
          visitorTeamName="Visitante"
          localScore={0}
          visitorScore={0}
        />
      </div>

      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
      >
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Pares clave / valor
          </span>
          {canManage && (
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900"
            >
              <Plus className="w-4 h-4" />
              Agregar fila
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[10px] font-bold uppercase text-slate-500">
                <th className="px-4 py-2 w-[28%]">Clave</th>
                <th className="px-4 py-2 w-[22%]">Valor</th>
                <th className="px-4 py-2">Referencia</th>
                {canManage && <th className="px-4 py-2 w-14" />}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const upper = String(row.ruleKey ?? "").trim().toUpperCase();
                const hint = upper
                  ? DISCIPLINE_RULE_KEY_HINTS[upper]
                  : null;
                return (
                  <tr
                    key={row.rowId}
                    className="border-b border-slate-50 hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-2 align-top">
                      <input
                        type="text"
                        value={row.ruleKey}
                        onChange={(e) =>
                          setRow(index, "ruleKey", e.target.value)
                        }
                        disabled={!canManage}
                        placeholder="EJ: POINTS_WIN"
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-mono disabled:bg-slate-50"
                      />
                    </td>
                    <td className="px-4 py-2 align-top">
                      <input
                        type="text"
                        value={row.ruleValue}
                        onChange={(e) =>
                          setRow(index, "ruleValue", e.target.value)
                        }
                        disabled={!canManage}
                        placeholder="Ej. 3"
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs disabled:bg-slate-50"
                      />
                    </td>
                    <td className="px-4 py-2 text-[11px] text-slate-500 align-top">
                      {hint || "—"}
                    </td>
                    {canManage && (
                      <td className="px-2 py-2 align-top">
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                          aria-label="Quitar fila"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {canManage ? (
          <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar reglas
            </button>
          </div>
        ) : (
          <p className="px-5 py-4 text-xs text-slate-500 border-t border-slate-100">
            Solo lectura. Para editar hace falta permiso de{" "}
            <strong>administración de torneos</strong>.
          </p>
        )}
      </form>

      <p className="text-[11px] text-slate-400 max-w-3xl">
        Las claves suelen coincidir con la plantilla elegida al crear la
        disciplina (FIFA_FOOTBALL, FIVB_VOLLEYBALL, etc.). Si cambiás claves,
        asegurate de que los valores sean coherentes (números, true/false).
      </p>
    </div>
  );
}

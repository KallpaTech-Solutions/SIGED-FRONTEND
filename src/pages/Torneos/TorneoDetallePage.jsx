import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Loader2,
  Trophy,
  Calendar,
  ExternalLink,
  AlertCircle,
  Users,
  Plus,
  FileText,
  Save,
  LayoutGrid,
  Radio,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  fetchTournamentById,
  createCompetition,
  patchTournamentLifecycleStatus,
  patchTournamentRules,
} from "../../api/tournamentsAdminService";
import { fetchDisciplinesAdmin } from "../../api/disciplinesAdminService";
import {
  tournamentPublicLabel,
  tournamentPublicBadgeClass,
  isTournamentActivoCompetencia,
} from "../../utils/tournamentPublicStatus";
import {
  GENDER_OPTIONS,
  genderLabel,
  TOURNAMENT_STATUS_OPTIONS,
} from "../../utils/tournamentEnums";

function tournamentStatusToNumber(status) {
  if (typeof status === "number" && !Number.isNaN(status)) return status;
  const map = {
    Borrador: 0,
    InscripcionesAbiertas: 1,
    Activo: 2,
    Finalizado: 3,
    Programado: 4,
  };
  const s = String(status ?? "");
  return map[s] ?? 0;
}

export default function TorneoDetallePage() {
  const { id } = useParams();
  const { can } = useAuth();
  const { toast } = useToast();
  const canManage = can("tourn.manage");
  const canFixtureSetup =
    can("tourn.manage") || can("tourn.config") || can("tourn.fixture");
  const canMesa = can("tourn.match.control");
  const canViewTournament = can("tourn.view") || can("comp.tourn.view") || canManage;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [disciplines, setDisciplines] = useState([]);

  const [form, setForm] = useState({
    disciplineId: "",
    gender: 0,
    categoryName: "",
  });
  const [saving, setSaving] = useState(false);
  const [statusSelect, setStatusSelect] = useState(0);
  const [statusSaving, setStatusSaving] = useState(false);
  const [rulesSaving, setRulesSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const t = await fetchTournamentById(id);
      setTournament(t);
      setStatusSelect(tournamentStatusToNumber(t?.status ?? t?.Status));
      if (canManage) {
        try {
          const disc = await fetchDisciplinesAdmin({ onlyActive: true });
          setDisciplines(Array.isArray(disc) ? disc : []);
        } catch {
          setDisciplines([]);
        }
      } else {
        setDisciplines([]);
      }
    } catch (e) {
      setError(
        e?.response?.status === 404
          ? "Torneo no encontrado."
          : e?.response?.data?.message ||
              e?.message ||
              "No se pudo cargar el torneo."
      );
      setTournament(null);
      setDisciplines([]);
    } finally {
      setLoading(false);
    }
  }, [id, canManage]);

  useEffect(() => {
    load();
  }, [load]);

  const competitions = tournament?.competitions ?? tournament?.Competitions ?? [];
  const name = tournament?.name ?? tournament?.Name;
  const year = tournament?.year ?? tournament?.Year;
  const status = tournament?.status ?? tournament?.Status;
  const mesaTransmissionEnabled =
    canMesa && isTournamentActivoCompetencia(status);
  const active = tournament?.isActive ?? tournament?.IsActive;
  const start = tournament?.startDate ?? tournament?.StartDate;
  const end = tournament?.endDate ?? tournament?.EndDate;

  const handleCreateCompetition = async (e) => {
    e.preventDefault();
    if (!form.disciplineId) {
      toast("Elegí una disciplina.", "error");
      return;
    }
    setSaving(true);
    try {
      await createCompetition({
        tournamentId: id,
        disciplineId: form.disciplineId,
        gender: Number(form.gender),
        categoryName: form.categoryName?.trim() || null,
      });
      toast("Competencia creada.", "success");
      setForm((f) => ({ ...f, categoryName: "" }));
      await load();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "No se pudo crear la competencia.";
      toast(typeof msg === "string" ? msg : "Error al crear.", "error");
    } finally {
      setSaving(false);
    }
  };

  const rulesUrl = tournament?.rulesUrl ?? tournament?.RulesUrl;
  const currentStatusNum = tournamentStatusToNumber(
    tournament?.status ?? tournament?.Status
  );

  const handleSaveLifecycleStatus = async () => {
    if (!canManage || !id) return;
    setStatusSaving(true);
    try {
      await patchTournamentLifecycleStatus(id, statusSelect);
      toast("Estado del torneo actualizado.", "success");
      await load();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "No se pudo guardar el estado.";
      toast(typeof msg === "string" ? msg : "Error al guardar.", "error");
    } finally {
      setStatusSaving(false);
    }
  };

  const handleRulesFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !canManage || !id) return;
    setRulesSaving(true);
    try {
      await patchTournamentRules(id, file);
      toast("Reglamento (PDF) subido correctamente.", "success");
      e.target.value = "";
      await load();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "No se pudo subir el PDF.";
      toast(typeof msg === "string" ? msg : "Error al subir.", "error");
    } finally {
      setRulesSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-slate-500">
        <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
        <span className="text-sm font-semibold">Cargando torneo…</span>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-red-800 text-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p>{error || "Sin datos."}</p>
            <Link
              to="/PanelControl/torneos"
              className="inline-flex items-center gap-1 mt-3 font-bold text-emerald-800 hover:underline"
            >
              <ChevronLeft className="w-4 h-4" />
              Volver a torneos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/PanelControl/torneos"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700 mb-3"
          >
            <ChevronLeft className="w-4 h-4" />
            Torneos
          </Link>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex flex-wrap items-center gap-2">
            <Trophy className="w-6 h-6 text-emerald-600 shrink-0" />
            {name}
            <span className="text-slate-400 font-mono text-base">{year}</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-600">
            {start && end && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(start).toLocaleDateString("es-PE")} —{" "}
                {new Date(end).toLocaleDateString("es-PE")}
              </span>
            )}
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${tournamentPublicBadgeClass(
                status
              )}`}
            >
              {tournamentPublicLabel(status)}
            </span>
            <span
              className={
                active ? "text-emerald-700 font-semibold" : "text-slate-400"
              }
            >
              {active ? "Visible" : "Oculto"}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
          {canMesa &&
            (mesaTransmissionEnabled ? (
              <Link
                to={`/PanelControl/torneos/${id}/mesa`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-500 shadow-sm"
              >
                <Radio className="w-4 h-4" />
                Partidos y transmisión
              </Link>
            ) : (
              <span
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-200 text-slate-500 text-sm font-bold cursor-not-allowed"
                title="Disponible cuando el torneo está en estado Activo (en competencia)."
              >
                <Radio className="w-4 h-4" />
                Partidos y transmisión
              </span>
            ))}
          <a
            href={`/torneos/torneo/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
          >
            Ver vitrina pública
            <ExternalLink className="w-4 h-4" />
          </a>
          {canManage && (
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("gestion-estado-torneo")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="text-xs font-bold text-slate-600 hover:text-emerald-700 underline underline-offset-2"
            >
              Cambiar estado del torneo ↓
            </button>
          )}
        </div>
      </div>

      {!canManage && canMesa && mesaTransmissionEnabled && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
          <span className="font-semibold">Mesa / transmisión.</span> El torneo está{" "}
          <strong>en competencia</strong>: podés{" "}
          <Link
            to={`/PanelControl/torneos/${id}/mesa`}
            className="font-bold text-sky-800 underline underline-offset-2"
          >
            abrir la lista de partidos
          </Link>{" "}
          para transmitir en vivo.
        </div>
      )}

      {!canManage && canMesa && !mesaTransmissionEnabled && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-950">
          <span className="font-semibold">Mesa / transmisión.</span> Los enlaces de transmisión se
          habilitan cuando el administrador deja el torneo en{" "}
          <strong>Activo (en competencia)</strong>. Ahora mismo el estado es{" "}
          <strong>{tournamentPublicLabel(status)}</strong>.
        </div>
      )}

      {canViewTournament && !canManage && !canMesa && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <span className="font-semibold">Solo lectura.</span> Para cambiar el estado del torneo
          (y lo que ve la vitrina pública) necesitás permiso de{" "}
          <strong>administración de torneos</strong>.
        </div>
      )}

      {canManage && (
        <section
          id="gestion-estado-torneo"
          className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-white to-white p-5 md:p-6 shadow-md shadow-emerald-900/5 space-y-6 scroll-mt-6"
        >
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1 flex flex-wrap items-center gap-2">
              Estado del torneo
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                Afecta la vitrina pública
              </span>
            </h3>
            <p className="text-xs text-slate-600 mb-4 max-w-2xl leading-relaxed">
              Con <strong>Inscripciones abiertas</strong> habilitás el registro de equipos.{" "}
              <strong>Programado</strong> indica inscripciones cerradas y fixture en armado; luego{" "}
              <strong>Activo</strong> cuando la competencia está en marcha. Desde la web mostraremos
              distintas opciones según este valor.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[min(100%,260px)] flex-1">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Estado del torneo
                </label>
                <select
                  value={statusSelect}
                  onChange={(e) => setStatusSelect(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  {TOURNAMENT_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleSaveLifecycleStatus}
                disabled={
                  statusSaving || statusSelect === currentStatusNum
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
              >
                {statusSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Guardar estado
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-1">
              Reglamento (PDF)
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Visible en la vitrina pública para descarga.
            </p>
            {rulesUrl ? (
              <a
                href={rulesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:underline mb-3"
              >
                <FileText className="w-4 h-4" />
                Ver reglamento actual
              </a>
            ) : (
              <p className="text-xs text-slate-600 mb-3">
                Todavía no hay ningún PDF cargado.
              </p>
            )}
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
              {rulesSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              {rulesSaving ? "Subiendo…" : "Subir o reemplazar PDF"}
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                disabled={rulesSaving}
                onChange={handleRulesFileChange}
              />
            </label>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
            Competencias
          </h3>
          <Link
            to="/PanelControl/disciplinas"
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            Gestionar disciplinas
          </Link>
        </div>

        {!competitions.length ? (
          <p className="text-sm text-slate-500 py-4">
            Aún no hay competencias. Creá una abajo (disciplina + género +
            categoría).
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            {competitions.map((c) => {
              const cid = c.id ?? c.Id;
              const d = c.discipline ?? c.Discipline;
              const dname = d?.name ?? d?.Name ?? "—";
              const cat = c.categoryName ?? c.CategoryName;
              const g = c.gender ?? c.Gender;
              const isOn = c.isActive ?? c.IsActive;
              return (
                <li
                  key={cid}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-slate-50/80"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">
                      {dname}
                      {cat ? (
                        <span className="text-slate-600"> · {cat}</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {genderLabel(g)} ·{" "}
                      {isOn ? (
                        <span className="text-emerald-700">Activa</span>
                      ) : (
                        <span className="text-slate-400">Inactiva</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    {canFixtureSetup && (
                      <Link
                        to={`/PanelControl/torneos/${id}/competencias/${cid}/fixture`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        Fixture / grupos
                      </Link>
                    )}
                    {canMesa &&
                      (mesaTransmissionEnabled ? (
                        <Link
                          to={`/PanelControl/torneos/${id}/mesa`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 text-xs font-bold text-red-800 hover:bg-red-100"
                        >
                          <Radio className="w-3.5 h-3.5" />
                          Partidos / mesa
                        </Link>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-100 text-xs font-bold text-slate-400 cursor-not-allowed"
                          title="Activo (en competencia) requerido para transmitir."
                        >
                          <Radio className="w-3.5 h-3.5" />
                          Partidos / mesa
                        </span>
                      ))}
                    <Link
                      to={`/torneos/${cid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
                    >
                      Página pública
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {canManage && (
          <form
            onSubmit={handleCreateCompetition}
            className="mt-6 pt-6 border-t border-slate-100 space-y-4"
          >
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              Nueva competencia
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Disciplina *
                </label>
                <select
                  required
                  value={form.disciplineId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, disciplineId: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar…</option>
                  {disciplines.map((d) => {
                    const did = d.id ?? d.Id;
                    const dn = d.name ?? d.Name;
                    return (
                      <option key={did} value={did}>
                        {dn}
                      </option>
                    );
                  })}
                </select>
                {disciplines.length === 0 && (
                  <p className="text-xs text-amber-700 mt-1">
                    No hay disciplinas activas.{" "}
                    <Link
                      to="/PanelControl/disciplinas/nuevo"
                      className="font-bold underline"
                    >
                      Crear disciplina
                    </Link>
                    .
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Género *
                </label>
                <select
                  value={form.gender}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      gender: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  {GENDER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Categoría (opcional)
                </label>
                <input
                  type="text"
                  value={form.categoryName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, categoryName: e.target.value }))
                  }
                  placeholder="Ej. Cachimbos, Libre, Primera…"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving || !form.disciplineId}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Users className="w-4 h-4" />
              )}
              Crear competencia
            </button>
          </form>
        )}

        {!canManage && (
          <p className="text-xs text-slate-500 mt-4">
            No tenés permiso para crear competencias. Hace falta rol de{" "}
            <strong>administración de torneos</strong>.
          </p>
        )}
      </section>
    </div>
  );
}

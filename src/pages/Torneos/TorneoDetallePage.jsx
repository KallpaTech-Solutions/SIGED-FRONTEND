import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
  Bell,
  Lock,
  Unlock,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import {
  fetchTournamentById,
  fetchTournamentAdminAlerts,
  createCompetition,
  deleteCompetition,
  deleteTournament,
  patchTournamentLifecycleStatus,
  patchTournamentRules,
  setCompetitionRostersLock,
  setCompetitionTeamRosterLock,
  setTournamentRostersLock,
  updateCompetitionTeamInscriptionLimit,
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
  const navigate = useNavigate();
  const { can } = useAuth();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const canManage = can("tourn.manage");
  const canFixtureSetup =
    can("tourn.manage") || can("tourn.config") || can("tourn.fixture");
  const canMesa = can("tourn.match.control");
  const canViewTournament = can("tourn.view") || can("comp.tourn.view") || canManage;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [disciplines, setDisciplines] = useState([]);

  const [form, setForm] = useState({
    disciplineId: "",
    gender: 0,
    categoryName: "",
    maxTeamsPerOrganization: 1,
  });
  const [saving, setSaving] = useState(false);
  const [statusSelect, setStatusSelect] = useState(0);
  const [statusSaving, setStatusSaving] = useState(false);
  const [rulesSaving, setRulesSaving] = useState(false);
  const [rostersBusy, setRostersBusy] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [competitionDeleteBusy, setCompetitionDeleteBusy] = useState(null);
  const [competitionLimitBusy, setCompetitionLimitBusy] = useState(null);
  const [competitionLimitDraft, setCompetitionLimitDraft] = useState({});
  const [teamUnlockPick, setTeamUnlockPick] = useState({});

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [t, alertRows] = await Promise.all([
        fetchTournamentById(id),
        canViewTournament ? fetchTournamentAdminAlerts(id).catch(() => []) : [],
      ]);
      setTournament(t);
      setAlerts(Array.isArray(alertRows) ? alertRows : []);
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
      setAlerts([]);
      setDisciplines([]);
    } finally {
      setLoading(false);
    }
  }, [id, canManage, canViewTournament]);

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
        maxTeamsPerOrganization: Math.max(
          0,
          Number(form.maxTeamsPerOrganization) || 0
        ),
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

  const handleCompetitionTeamLimitSave = async (competitionId, rawValue) => {
    if (!canManage || !competitionId || competitionLimitBusy) return;
    const next = Math.max(0, Number(rawValue) || 0);
    setCompetitionLimitBusy(String(competitionId));
    try {
      await updateCompetitionTeamInscriptionLimit(competitionId, next);
      toast(
        next === 0
          ? "La competencia ahora permite equipos sin límite por escuela."
          : `Límite actualizado: ${next} equipo(s) por escuela.`,
        "success"
      );
      await load();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "No se pudo guardar el límite de inscripción.";
      toast(typeof msg === "string" ? msg : "Error al guardar.", "error");
    } finally {
      setCompetitionLimitBusy(null);
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

  const handleDeleteTournament = async () => {
    if (!canManage || !id || deleteBusy) return;
    const ok = await confirm({
      title: "Eliminar torneo",
      message:
        "¿Eliminar este torneo definitivamente? Solo se podrá eliminar si todavía no tiene competencias asignadas.",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      variant: "danger",
    });
    if (!ok) return;

    setDeleteBusy(true);
    try {
      await deleteTournament(id);
      toast("Torneo eliminado.", "success");
      navigate("/PanelControl/torneos");
    } catch (err) {
      toast(
        err?.response?.data?.message ||
          err?.response?.data ||
          "No se pudo eliminar el torneo.",
        "error"
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleDeleteCompetition = async (competitionId, label) => {
    if (!canManage || !competitionId || competitionDeleteBusy) return;
    const ok = await confirm({
      title: "Eliminar competencia",
      message: `¿Eliminar la competencia "${label}"? Primero verificaremos si tiene historial antes de borrarla.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      variant: "danger",
    });
    if (!ok) return;

    setCompetitionDeleteBusy(String(competitionId));
    try {
      await deleteCompetition(competitionId);
      toast("Competencia eliminada.", "success");
      await load();
    } catch (err) {
      const data = err?.response?.data;
      if (data?.canForceDelete) {
        const forceOk = await confirm({
          title: "Eliminar todo el historial",
          message:
            `${data.message} Esta acción borrará definitivamente partidos, eventos, actas, planillas, inscripciones, fases, grupos y reglas de esta competencia. ¿Confirmas eliminar todo?`,
          confirmText: "Sí, eliminar todo",
          cancelText: "Conservar",
          variant: "danger",
        });
        if (forceOk) {
          try {
            await deleteCompetition(competitionId, { force: true });
            toast("Competencia eliminada con todo su historial.", "success");
            await load();
          } catch (forceErr) {
            toast(
              forceErr?.response?.data?.message ||
                forceErr?.response?.data ||
                "No se pudo eliminar la competencia.",
              "error"
            );
          } finally {
            setCompetitionDeleteBusy(null);
          }
          return;
        }
        setCompetitionDeleteBusy(null);
        return;
      }

      toast(
        data?.message ||
          data ||
          "No se pudo eliminar la competencia.",
        "error"
      );
    } finally {
      setCompetitionDeleteBusy(null);
    }
  };

  const handleTournamentRostersLock = async (locked) => {
    if (!canManage || !id) return;
    setRostersBusy(`tournament-${locked ? "lock" : "unlock"}`);
    try {
      await setTournamentRostersLock(id, locked);
      toast(
        locked
          ? "Listas de todas las competencias cerradas."
          : "Listas de todas las competencias reabiertas.",
        "success"
      );
      await load();
    } catch (err) {
      toast(
        err?.response?.data?.message ||
          err?.response?.data ||
          "No se pudo actualizar las listas.",
        "error"
      );
    } finally {
      setRostersBusy(null);
    }
  };

  const handleCompetitionRostersLock = async (competitionId, locked) => {
    if (!canManage || !competitionId) return;
    setRostersBusy(`${competitionId}-${locked ? "lock" : "unlock"}`);
    try {
      await setCompetitionRostersLock(competitionId, locked);
      toast(locked ? "Listas de la competencia cerradas." : "Listas de la competencia reabiertas.", "success");
      await load();
    } catch (err) {
      toast(
        err?.response?.data?.message ||
          err?.response?.data ||
          "No se pudo actualizar la competencia.",
        "error"
      );
    } finally {
      setRostersBusy(null);
    }
  };

  const handleTeamRosterUnlock = async (competitionId) => {
    const teamId = teamUnlockPick[competitionId];
    if (!canManage || !competitionId || !teamId) return;
    setRostersBusy(`${competitionId}-${teamId}-unlock`);
    try {
      await setCompetitionTeamRosterLock({ competitionId, teamId, locked: false });
      toast("Lista del equipo reabierta como excepción.", "success");
      setTeamUnlockPick((prev) => ({ ...prev, [competitionId]: "" }));
      await load();
    } catch (err) {
      toast(
        err?.response?.data?.message ||
          err?.response?.data ||
          "No se pudo reabrir la lista del equipo.",
        "error"
      );
    } finally {
      setRostersBusy(null);
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
            <div className="flex flex-wrap items-center justify-end gap-2">
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
              <button
                type="button"
                onClick={handleDeleteTournament}
                disabled={deleteBusy}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                title="Solo elimina torneos sin competencias asignadas."
              >
                {deleteBusy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Eliminar torneo
              </button>
            </div>
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

      {canViewTournament && alerts.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-amber-950 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Alertas del torneo
          </h3>
          <div className="space-y-2">
            {alerts.slice(0, 8).map((a) => {
              const severity = String(a.severity ?? a.Severity ?? "info");
              const path = a.path ?? a.Path;
              return (
                <div
                  key={a.id ?? a.Id}
                  className={`rounded-xl border px-3 py-2 text-sm flex flex-wrap items-center justify-between gap-3 ${
                    severity === "danger"
                      ? "border-red-200 bg-red-50 text-red-900"
                      : severity === "warning"
                        ? "border-amber-200 bg-white text-amber-950"
                        : "border-sky-200 bg-sky-50 text-sky-950"
                  }`}
                >
                  <span>{a.message ?? a.Message}</span>
                  {path && (
                    <Link
                      to={path}
                      className="text-xs font-bold underline underline-offset-2"
                    >
                      {a.actionLabel ?? a.ActionLabel ?? "Resolver"}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </section>
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
              Listas oficiales
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Cierra o reabre las listas de todas las competencias. Los delegados solo envían planillas de partido.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleTournamentRostersLock(true)}
                disabled={!!rostersBusy}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50"
              >
                {rostersBusy === "tournament-lock" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                Cerrar todas las listas
              </button>
              <button
                type="button"
                onClick={() => handleTournamentRostersLock(false)}
                disabled={!!rostersBusy}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {rostersBusy === "tournament-unlock" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Unlock className="w-4 h-4" />
                )}
                Reabrir todas
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
          <ul className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            {competitions.map((c) => {
              const cid = c.id ?? c.Id;
              const d = c.discipline ?? c.Discipline;
              const dname = d?.name ?? d?.Name ?? "—";
              const cat = c.categoryName ?? c.CategoryName;
              const g = c.gender ?? c.Gender;
              const isOn = c.isActive ?? c.IsActive;
              const competitionLabel = `${dname}${cat ? ` · ${cat}` : ""} (${genderLabel(g)})`;
              const competitionTeams =
                c.competitionTeams ?? c.CompetitionTeams ?? [];
              const lockedCount = competitionTeams.filter(
                (ct) => ct.rosterLocked ?? ct.RosterLocked ?? false
              ).length;
              const totalTeams = competitionTeams.length;
              const maxTeamsPerOrganization =
                c.maxTeamsPerOrganization ?? c.MaxTeamsPerOrganization ?? 1;
              const limitDraft =
                competitionLimitDraft[cid] ?? String(maxTeamsPerOrganization);
              return (
                <li
                  key={cid}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-colors hover:border-slate-300 hover:bg-slate-50/40"
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
                      )}{" "}
                      · Listas {lockedCount}/{totalTeams} cerradas
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Límite por escuela:{" "}
                      <span className="font-semibold text-slate-700">
                        {maxTeamsPerOrganization === 0
                          ? "sin límite"
                          : `${maxTeamsPerOrganization} equipo(s)`}
                      </span>
                    </p>
                  </div>
                  <div className="w-full md:w-auto rounded-lg border border-slate-200/80 bg-slate-50/70 px-2 py-2">
                    <div className="flex flex-col items-stretch gap-2 md:items-end">
                      <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    {canManage && (
                      <>
                        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
                          <span className="text-[11px] font-bold text-slate-500">
                            Máx. escuela
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={99}
                            value={limitDraft}
                            onChange={(e) =>
                              setCompetitionLimitDraft((prev) => ({
                                ...prev,
                                [cid]: e.target.value,
                              }))
                            }
                            className="w-14 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                            title="0 significa sin límite"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleCompetitionTeamLimitSave(cid, limitDraft)
                            }
                            disabled={
                              competitionLimitBusy === String(cid) ||
                              Number(limitDraft) === maxTeamsPerOrganization
                            }
                            className="px-2 py-1 rounded-md bg-slate-900 text-white text-[11px] font-bold hover:bg-slate-800 disabled:opacity-50"
                          >
                            {competitionLimitBusy === String(cid) ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "Guardar"
                            )}
                          </button>
                        </div>
                        <div className="h-6 w-px bg-slate-200 hidden xl:block" />
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteCompetition(cid, competitionLabel)
                          }
                          disabled={competitionDeleteBusy === String(cid)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-200 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                          title="Elimina la competencia si todavía no tiene historial de actas."
                        >
                          {competitionDeleteBusy === String(cid) ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          Eliminar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCompetitionRostersLock(cid, true)}
                          disabled={!!rostersBusy || totalTeams === 0}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-900 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          Cerrar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCompetitionRostersLock(cid, false)}
                          disabled={!!rostersBusy || totalTeams === 0}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          Reabrir
                        </button>
                      </>
                    )}
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
                  {canManage && totalTeams > 0 && (
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1">
                        <select
                          value={teamUnlockPick[cid] ?? ""}
                          onChange={(e) =>
                            setTeamUnlockPick((prev) => ({
                              ...prev,
                              [cid]: e.target.value,
                            }))
                          }
                          className="max-w-44 rounded-lg border border-slate-200 px-2 py-1 text-xs bg-white"
                        >
                          <option value="">Excepción equipo…</option>
                          {competitionTeams.map((ct) => {
                            const team = ct.team ?? ct.Team ?? {};
                            const teamId = ct.teamId ?? ct.TeamId;
                            const teamName =
                              team.name ?? team.Name ?? String(teamId);
                            return (
                              <option key={teamId} value={teamId}>
                                {teamName}
                              </option>
                            );
                          })}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleTeamRosterUnlock(cid)}
                          disabled={
                            !!rostersBusy || !(teamUnlockPick[cid] ?? "")
                          }
                          className="px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 text-xs font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                        >
                          Reabrir equipo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
              <div>
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
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Máximo de equipos por escuela
                </label>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={form.maxTeamsPerOrganization}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      maxTeamsPerOrganization: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Usa 1 para la regla actual. Usa 0 si quieres permitir más de
                  un equipo sin límite.
                </p>
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

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  Trophy,
  Users,
  UserPlus,
  ChevronRight,
  ExternalLink,
  UserX,
  UserCheck,
  Pencil,
  Trash2,
  X,
  ImagePlus,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useConfirm } from "../../context/ConfirmContext";
import { fetchPublicTournaments } from "../../api/tournamentsPublicService";
import {
  fetchDelegateSummary,
  togglePlayerStatus,
  createPlayerMultipart,
  updatePlayerMultipart,
  deletePlayer,
  deleteTeam,
  fetchTeamsManagementCatalog,
  fetchOrgUsersForTeamGestores,
  fetchTeamGestores,
  postTeamGestor,
  deleteTeamGestor,
  fetchTeamDetail,
  updateTeamMultipart,
} from "../../api/tournamentInscriptionService";
import {
  isInscripcionesAbiertas,
  tournamentPublicLabel,
  tournamentPublicBadgeClass,
} from "../../utils/tournamentPublicStatus";

const PANEL_INSC_BASE = "/PanelControl/gestion-equipos/torneo";

const POSITIONS = [
  { value: "0", label: "Sin definir" },
  { value: "1", label: "Portero" },
  { value: "2", label: "Defensa" },
  { value: "3", label: "Mediocampista" },
  { value: "4", label: "Delantero" },
  { value: "5", label: "Líbero (vóley)" },
  { value: "6", label: "Armador" },
  { value: "7", label: "Central" },
  { value: "8", label: "Capitán" },
];

function positionLabel(pos) {
  const s = String(pos ?? 0);
  return POSITIONS.find((p) => p.value === s)?.label ?? "—";
}

function sortPlayers(list) {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => {
    const aa = a.isActive ?? a.IsActive ?? true;
    const bb = b.isActive ?? b.IsActive ?? true;
    if (aa !== bb) return aa ? -1 : 1;
    const na = a.number ?? a.Number;
    const nb = b.number ?? b.Number;
    if (na != null && nb != null && na !== nb) return Number(na) - Number(nb);
    if (na != null && nb == null) return -1;
    if (na == null && nb != null) return 1;
    return String(a.name ?? a.Name ?? "").localeCompare(
      String(b.name ?? b.Name ?? ""),
      "es"
    );
  });
}

function tournamentStatusRaw(t) {
  return (
    t?.statusValue ??
    t?.StatusValue ??
    t?.status ??
    t?.Status
  );
}

function formatBirthForInput(v) {
  if (v == null || v === "") return "";
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function DelegadoGestionEquiposPage() {
  const { can, user, loading: authLoading } = useAuth();
  const { confirm } = useConfirm();
  const puedeEliminarJugador = can("tourn.manage");
  const puedeVerTodasLasEscuelas = can("tourn.manage");

  const [summary, setSummary] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingPlayerId, setDeletingPlayerId] = useState(null);
  const [rosterMutateErr, setRosterMutateErr] = useState(null);
  const [teamsCatalog, setTeamsCatalog] = useState(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState(null);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogOrgId, setCatalogOrgId] = useState("");
  const [deletingTeamId, setDeletingTeamId] = useState(null);

  const [playerEdit, setPlayerEdit] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr] = useState(null);

  const [quickAddTeamId, setQuickAddTeamId] = useState(null);
  const [qaName, setQaName] = useState("");
  const [qaDni, setQaDni] = useState("");
  const [qaBirth, setQaBirth] = useState("");
  const [qaNumber, setQaNumber] = useState("");
  const [qaPosition, setQaPosition] = useState("0");
  const [qaPhoto, setQaPhoto] = useState(null);
  const [qaSaving, setQaSaving] = useState(false);
  const [qaErr, setQaErr] = useState(null);
  const [qaMsg, setQaMsg] = useState(null);

  /** @type {Record<string, unknown[]>} */
  const [gestoresCache, setGestoresCache] = useState({});
  const [orgUsersForGestores, setOrgUsersForGestores] = useState([]);
  const [coDelegadoPick, setCoDelegadoPick] = useState({});
  const [gestorBusy, setGestorBusy] = useState(null);

  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamInitials, setEditTeamInitials] = useState("");
  const [editTeamRep, setEditTeamRep] = useState("");
  const [editTeamLogo, setEditTeamLogo] = useState(null);
  const [editTeamLoading, setEditTeamLoading] = useState(false);
  const [editTeamSaving, setEditTeamSaving] = useState(false);
  const [editTeamErr, setEditTeamErr] = useState(null);
  const teamEditFetchSeq = useRef(0);

  /** Modal catálogo global (solo admin OTI): renombrar equipo de cualquier escuela. */
  const [catalogEditOpen, setCatalogEditOpen] = useState(false);
  const [catalogEditTeamId, setCatalogEditTeamId] = useState(null);
  const [catalogEditOrgId, setCatalogEditOrgId] = useState(null);
  const [catalogEditName, setCatalogEditName] = useState("");
  const [catalogEditInitials, setCatalogEditInitials] = useState("");
  const [catalogEditRep, setCatalogEditRep] = useState("");
  const [catalogEditLogo, setCatalogEditLogo] = useState(null);
  const [catalogEditLoading, setCatalogEditLoading] = useState(false);
  const [catalogEditSaving, setCatalogEditSaving] = useState(false);
  const [catalogEditErr, setCatalogEditErr] = useState(null);
  const catalogEditFetchSeq = useRef(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, tlist] = await Promise.all([
        fetchDelegateSummary(),
        fetchPublicTournaments(),
      ]);
      setSummary(s);
      setTournaments(Array.isArray(tlist) ? tlist : []);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          (typeof e?.response?.data === "string"
            ? e.response.data
            : null) ||
          "No se pudo cargar la información."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTeamsCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const data = await fetchTeamsManagementCatalog({
        search: catalogSearch,
        organizacionId: puedeVerTodasLasEscuelas ? catalogOrgId : "",
        includeInactive: true,
      });
      setTeamsCatalog(data);
    } catch (e) {
      setCatalogError(
        e?.response?.data?.message ||
          (typeof e?.response?.data === "string" ? e.response.data : null) ||
          "No se pudo cargar el catálogo de equipos."
      );
    } finally {
      setCatalogLoading(false);
    }
  }, [catalogSearch, catalogOrgId, puedeVerTodasLasEscuelas]);

  useEffect(() => {
    if (authLoading || !user) return;
    load();
  }, [load, user, authLoading]);

  useEffect(() => {
    if (authLoading || !user) return;
    loadTeamsCatalog();
  }, [loadTeamsCatalog, user, authLoading]);

  const loadGestoresForTeam = useCallback(async (teamId) => {
    try {
      const rows = await fetchTeamGestores(teamId);
      setGestoresCache((prev) => ({ ...prev, [teamId]: Array.isArray(rows) ? rows : [] }));
    } catch {
      setGestoresCache((prev) => ({ ...prev, [teamId]: [] }));
    }
  }, []);

  useEffect(() => {
    if (!summary?.teams?.length) return;
    const needPrincipal = summary.teams.some(
      (t) => t.iAmPrincipal ?? t.IAmPrincipal
    );
    if (!needPrincipal) return;
    let c = false;
    (async () => {
      try {
        const rows = await fetchOrgUsersForTeamGestores();
        if (!c) setOrgUsersForGestores(Array.isArray(rows) ? rows : []);
      } catch {
        if (!c) setOrgUsersForGestores([]);
      }
    })();
    return () => {
      c = true;
    };
  }, [summary]);

  const openPlayerEdit = (p, teamGuid) => {
    setRosterMutateErr(null);
    setEditErr(null);
    const numRaw = p.number ?? p.Number;
    setPlayerEdit({
      id: p.id ?? p.Id,
      teamId: String(teamGuid),
      name: String(p.name ?? p.Name ?? ""),
      dni: String(p.dni ?? p.Dni ?? "")
        .replace(/\D/g, "")
        .slice(0, 10),
      birth: formatBirthForInput(p.birthDate ?? p.BirthDate),
      number:
        numRaw != null && numRaw !== "" ? String(numRaw) : "",
      position: String(p.position ?? p.Position ?? 0),
      photoFile: null,
    });
  };

  const closePlayerEdit = () => {
    setPlayerEdit(null);
    setEditErr(null);
  };

  const handlePlayerEditSubmit = async (e) => {
    e.preventDefault();
    if (!playerEdit || !playerEdit.name.trim() || !playerEdit.dni.trim()) return;
    setEditSaving(true);
    setEditErr(null);
    try {
      const fd = new FormData();
      fd.append("TeamId", playerEdit.teamId);
      fd.append("Name", playerEdit.name.trim());
      fd.append("Dni", playerEdit.dni.trim().replace(/\s/g, ""));
      if (playerEdit.birth) fd.append("BirthDate", playerEdit.birth);
      if (playerEdit.number !== "" && playerEdit.number != null) {
        const n = parseInt(playerEdit.number, 10);
        if (!Number.isNaN(n)) fd.append("Number", String(n));
      }
      fd.append("Position", playerEdit.position || "0");
      if (playerEdit.photoFile) fd.append("PhotoFile", playerEdit.photoFile);
      await updatePlayerMultipart(playerEdit.id, fd);
      closePlayerEdit();
      await load();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string"
          ? err.response.data
          : null) ||
        "No se pudo actualizar el jugador.";
      setEditErr(msg);
    } finally {
      setEditSaving(false);
    }
  };

  const handlePlayerDelete = async (p, displayName) => {
    if (!puedeEliminarJugador) return;
    const pid = p.id ?? p.Id;
    const ok = await confirm({
      title: "Eliminar jugador",
      message: `¿Eliminar a ${displayName}? No se puede recuperar. Si ya participó en partidos con goles o tarjetas, el sistema no permitirá borrarlo.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      variant: "danger",
    });
    if (!ok) return;
    setRosterMutateErr(null);
    setDeletingPlayerId(pid);
    try {
      await deletePlayer(pid);
      await load();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string"
          ? err.response.data
          : null) ||
        "No se pudo eliminar el jugador.";
      setRosterMutateErr(msg);
    } finally {
      setDeletingPlayerId(null);
    }
  };

  const handleTeamDelete = async (team) => {
    const teamId = team.id ?? team.Id;
    const teamName = team.name ?? team.Name ?? "Equipo";
    const ok = await confirm({
      title: "Eliminar equipo y plantel",
      message: `¿Eliminar "${teamName}" y todos sus jugadores? Solo se podrá eliminar si no tiene fixture, partidos, planillas, sanciones ni historial deportivo.`,
      confirmText: "Eliminar equipo",
      cancelText: "Cancelar",
      variant: "danger",
    });
    if (!ok) return;

    setRosterMutateErr(null);
    setDeletingTeamId(String(teamId));
    try {
      await deleteTeam(teamId);
      await Promise.all([load(), loadTeamsCatalog()]);
    } catch (err) {
      setRosterMutateErr(
        err?.response?.data?.message ||
          (typeof err?.response?.data === "string"
            ? err.response.data
            : null) ||
          "No se pudo eliminar el equipo."
      );
    } finally {
      setDeletingTeamId(null);
    }
  };

  const closeTeamEditPanel = () => {
    setEditingTeamId(null);
    setEditTeamLogo(null);
    setEditTeamErr(null);
    setEditTeamLoading(false);
  };

  const openTeamEditPanel = async (tid) => {
    setEditTeamErr(null);
    setEditTeamLogo(null);
    setEditTeamLoading(true);
    setEditingTeamId(tid);
    const seq = ++teamEditFetchSeq.current;
    try {
      const d = await fetchTeamDetail(tid);
      if (seq !== teamEditFetchSeq.current) return;
      setEditTeamName(String(d.name ?? d.Name ?? "").trim());
      setEditTeamInitials(String(d.initials ?? d.Initials ?? "").trim());
      setEditTeamRep(
        String(d.representativeName ?? d.RepresentativeName ?? "").trim()
      );
    } catch (err) {
      if (seq !== teamEditFetchSeq.current) return;
      setEditTeamErr(
        err?.response?.data?.message || "No se pudo cargar el equipo."
      );
      setEditingTeamId(null);
    } finally {
      if (seq === teamEditFetchSeq.current) setEditTeamLoading(false);
    }
  };

  const closeCatalogTeamEditModal = () => {
    setCatalogEditOpen(false);
    setCatalogEditTeamId(null);
    setCatalogEditOrgId(null);
    setCatalogEditLogo(null);
    setCatalogEditErr(null);
    setCatalogEditLoading(false);
    setCatalogEditSaving(false);
  };

  const openCatalogTeamEditModal = async (team) => {
    const tid = String(team.id ?? team.Id);
    const oid = team.organizacionId ?? team.OrganizacionId;
    setCatalogEditErr(null);
    setCatalogEditLogo(null);
    setCatalogEditOpen(true);
    setCatalogEditTeamId(tid);
    setCatalogEditOrgId(oid != null && oid !== "" ? Number(oid) : null);
    setCatalogEditLoading(true);
    const seq = ++catalogEditFetchSeq.current;
    try {
      const d = await fetchTeamDetail(tid, { includeInactive: true });
      if (seq !== catalogEditFetchSeq.current) return;
      setCatalogEditName(String(d.name ?? d.Name ?? "").trim());
      setCatalogEditInitials(String(d.initials ?? d.Initials ?? "").trim());
      setCatalogEditRep(
        String(d.representativeName ?? d.RepresentativeName ?? "").trim()
      );
    } catch (err) {
      if (seq !== catalogEditFetchSeq.current) return;
      setCatalogEditErr(
        err?.response?.data?.message || "No se pudo cargar el equipo."
      );
    } finally {
      if (seq === catalogEditFetchSeq.current) setCatalogEditLoading(false);
    }
  };

  const handleCatalogTeamSave = async (e) => {
    e.preventDefault();
    if (!catalogEditTeamId || !catalogEditName.trim()) return;
    setCatalogEditSaving(true);
    setCatalogEditErr(null);
    try {
      const fd = new FormData();
      fd.append("Name", catalogEditName.trim());
      fd.append("Initials", (catalogEditInitials || "").trim());
      if (catalogEditRep.trim())
        fd.append("RepresentativeName", catalogEditRep.trim());
      if (catalogEditOrgId != null && !Number.isNaN(catalogEditOrgId))
        fd.append("OrganizacionId", String(catalogEditOrgId));
      if (catalogEditLogo) fd.append("LogoFile", catalogEditLogo);
      await updateTeamMultipart(catalogEditTeamId, fd);
      closeCatalogTeamEditModal();
      await loadTeamsCatalog();
    } catch (err) {
      setCatalogEditErr(
        err?.response?.data?.message ||
          (typeof err?.response?.data === "string"
            ? err.response.data
            : null) ||
          "No se pudo guardar el equipo."
      );
    } finally {
      setCatalogEditSaving(false);
    }
  };

  const handleSaveTeamEdit = async (e) => {
    e.preventDefault();
    if (!editingTeamId || !editTeamName.trim()) return;
    const orgId = summary?.organizacionId ?? summary?.OrganizacionId;
    setEditTeamSaving(true);
    setEditTeamErr(null);
    try {
      const fd = new FormData();
      fd.append("Name", editTeamName.trim());
      fd.append("Initials", (editTeamInitials || "").trim());
      if (editTeamRep.trim())
        fd.append("RepresentativeName", editTeamRep.trim());
      if (orgId != null && orgId !== "")
        fd.append("OrganizacionId", String(orgId));
      if (editTeamLogo) fd.append("LogoFile", editTeamLogo);
      await updateTeamMultipart(editingTeamId, fd);
      closeTeamEditPanel();
      await load();
    } catch (err) {
      setEditTeamErr(
        err?.response?.data?.message ||
          (typeof err?.response?.data === "string"
            ? err.response.data
            : null) ||
          "No se pudo guardar el equipo."
      );
    } finally {
      setEditTeamSaving(false);
    }
  };

  const handleToggle = async (p) => {
    const pid = p.id ?? p.Id;
    const active = p.isActive ?? p.IsActive;
    const ok = await confirm({
      title: active ? "Desactivar jugador" : "Reactivar jugador",
      message: `¿${active ? "Desactivar" : "Reactivar"} a este jugador en el plantel?`,
      confirmText: active ? "Desactivar" : "Reactivar",
      cancelText: "Cancelar",
      variant: active ? "danger" : "default",
    });
    if (!ok) return;
    setRosterMutateErr(null);
    setTogglingId(pid);
    try {
      await togglePlayerStatus(pid);
      await load();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string"
          ? e.response.data
          : null) ||
        "No se pudo cambiar el estado del jugador.";
      setRosterMutateErr(msg);
    } finally {
      setTogglingId(null);
    }
  };

  const resetQuickAdd = () => {
    setQaName("");
    setQaDni("");
    setQaBirth("");
    setQaNumber("");
    setQaPosition("0");
    setQaPhoto(null);
    setQaErr(null);
    setQaMsg(null);
  };

  const handleQuickAddSubmit = async (e, teamGuid) => {
    e.preventDefault();
    if (!qaName.trim() || !qaDni.trim()) return;
    setQaSaving(true);
    setQaErr(null);
    setQaMsg(null);
    try {
      const fd = new FormData();
      fd.append("TeamId", String(teamGuid));
      fd.append("Name", qaName.trim());
      fd.append("Dni", qaDni.trim().replace(/\s/g, ""));
      if (qaBirth) fd.append("BirthDate", qaBirth);
      if (qaNumber !== "" && qaNumber != null) {
        const n = parseInt(qaNumber, 10);
        if (!Number.isNaN(n)) fd.append("Number", String(n));
      }
      if (qaPosition && qaPosition !== "0") fd.append("Position", qaPosition);
      if (qaPhoto) fd.append("PhotoFile", qaPhoto);
      await createPlayerMultipart(fd);
      setQaMsg("Jugador registrado.");
      resetQuickAdd();
      setQuickAddTeamId(null);
      await load();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string"
          ? err.response.data
          : null) ||
        "No se pudo registrar el jugador.";
      setQaErr(msg);
    } finally {
      setQaSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium">Cargando sesión…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Iniciá sesión para ver la gestión de equipos e inscripciones.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium">Cargando torneos y tus equipos…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800 text-sm">
        {error}
      </div>
    );
  }

  const nombreEscuela =
    summary?.nombreEscuela ?? summary?.NombreEscuela ?? "Tu escuela";
  const teams = summary?.teams ?? summary?.Teams ?? [];
  const catalogTeams = teamsCatalog?.teams ?? teamsCatalog?.Teams ?? [];
  const catalogOrganizations =
    teamsCatalog?.organizations ?? teamsCatalog?.Organizations ?? [];

  const torneosInscripcion = tournaments.filter((t) => {
    const id = t.id ?? t.Id;
    if (id == null || id === "") return false;
    return isInscripcionesAbiertas(tournamentStatusRaw(t));
  });

  const otrosTorneos = tournaments.filter((t) => {
    const id = t.id ?? t.Id;
    if (id == null || id === "") return false;
    return !isInscripcionesAbiertas(tournamentStatusRaw(t));
  });

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <UserPlus className="w-7 h-7 text-emerald-600" />
          Gestión de equipos
        </h2>
        <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
          Desde acá podés <strong>inscribir equipos</strong> en torneos con
          inscripciones abiertas y <strong>gestionar jugadores</strong> por
          equipo: alta rápida, edición, activar o desactivar, y eliminación
          solo para administración de torneos. Escuela:{" "}
          <span className="font-semibold text-slate-800">{nombreEscuela}</span>
          .
        </p>
      </div>

      {rosterMutateErr && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {rosterMutateErr}
        </div>
      )}

      <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-5 md:p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-emerald-700" />
          Inscribir o gestionar en un torneo
        </h3>
        <p className="text-xs text-slate-600 mt-1 mb-4">
          Elegí un torneo con <strong>inscripciones abiertas</strong> para crear
          equipos, anotarlos en una competencia y cargar jugadores (misma
          herramienta que en la vitrina pública, dentro del panel).
        </p>

        {torneosInscripcion.length === 0 ? (
          <p className="text-sm text-slate-500 py-2">
            No hay torneos con inscripciones abiertas en este momento. Cuando el
            administración abra inscripciones, aparecerán aquí.
          </p>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-3">
            {torneosInscripcion.map((t) => {
              const tid = String(t.id ?? t.Id);
              const name = t.name ?? t.Name ?? "Torneo";
              const st = tournamentStatusRaw(t);
              return (
                <li
                  key={tid}
                  className="rounded-xl border border-emerald-100 bg-white p-4 flex flex-col gap-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-900 leading-snug">
                      {name}
                    </p>
                    <span
                      className={`shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${tournamentPublicBadgeClass(st)}`}
                    >
                      {tournamentPublicLabel(st)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`${PANEL_INSC_BASE}/${tid}/inscripcion`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                    >
                      Registrar / inscribir equipo
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      to={`/torneos/torneo/${tid}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-emerald-700"
                    >
                      Ver vitrina
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {otrosTorneos.length > 0 && (
          <details className="mt-5 text-sm">
            <summary className="cursor-pointer text-slate-600 font-medium hover:text-slate-900">
              Otros torneos ({otrosTorneos.length}) — sin inscripciones abiertas
            </summary>
            <ul className="mt-3 space-y-2 pl-1">
              {otrosTorneos.map((t) => {
                const tid = String(t.id ?? t.Id);
                const name = t.name ?? t.Name ?? "Torneo";
                const st = tournamentStatusRaw(t);
                return (
                  <li
                    key={tid}
                    className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 border-b border-slate-100 pb-2"
                  >
                    <span>{name}</span>
                    <span className="text-slate-400">
                      {tournamentPublicLabel(st)}
                    </span>
                    <Link
                      to={`/torneos/torneo/${tid}`}
                      className="text-emerald-700 font-semibold hover:underline"
                    >
                      Ver
                    </Link>
                  </li>
                );
              })}
            </ul>
          </details>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-700" />
              {puedeVerTodasLasEscuelas
                ? "Todos los equipos creados"
                : "Equipos de tu escuela"}
            </h3>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              Revisa quién creó cada equipo, a qué competencias está inscrito y
              gestiona el equipo completo. La eliminación solo se permite al
              creador o a administración, y únicamente si no hay historial.
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
            {catalogTeams.length} equipo(s)
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_16rem]">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Buscar por equipo, siglas, responsable o escuela
            </label>
            <input
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="Ej. Fútbol, TGR, ingeniería..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          {puedeVerTodasLasEscuelas && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Escuela
              </label>
              <select
                value={catalogOrgId}
                onChange={(e) => setCatalogOrgId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
              >
                <option value="">Todas</option>
                {catalogOrganizations.map((org) => {
                  const oid = org.id ?? org.Id;
                  const oname = org.nombre ?? org.Nombre ?? "Escuela";
                  return (
                    <option key={String(oid)} value={String(oid)}>
                      {oname}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {catalogError && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {catalogError}
          </p>
        )}

        {catalogLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 py-6">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando equipos…
          </div>
        ) : catalogTeams.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center border border-dashed border-slate-200 rounded-xl">
            No se encontraron equipos con los filtros actuales.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Equipo</th>
                  <th className="px-3 py-2 text-left">Escuela</th>
                  <th className="px-3 py-2 text-left">Creado por</th>
                  <th className="px-3 py-2 text-left">Inscripciones</th>
                  <th className="px-3 py-2 text-left">Plantel</th>
                  <th className="px-4 py-2 text-right min-w-[17rem]">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {catalogTeams.map((team) => {
                  const tid = String(team.id ?? team.Id);
                  const tname = team.name ?? team.Name ?? "Equipo";
                  const initials = team.initials ?? team.Initials;
                  const school = team.escuela ?? team.Escuela ?? "—";
                  const createdBy =
                    team.createdBy ?? team.CreatedBy ?? "Sin registro";
                  const playerCount = team.playerCount ?? team.PlayerCount ?? 0;
                  const activePlayerCount =
                    team.activePlayerCount ?? team.ActivePlayerCount ?? 0;
                  const inscriptions =
                    team.inscriptions ?? team.Inscriptions ?? [];
                  const canDelete = team.canDelete ?? team.CanDelete ?? false;
                  const isDeleting = deletingTeamId === tid;
                  return (
                    <tr key={tid} className="align-top">
                      <td className="px-3 py-3">
                        <p className="font-bold text-slate-900">
                          {tname}
                          {initials ? (
                            <span className="ml-1 font-normal text-slate-500">
                              ({initials})
                            </span>
                          ) : null}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {team.isActive ?? team.IsActive
                            ? "Activo"
                            : "Inactivo"}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{school}</td>
                      <td className="px-3 py-3 text-slate-600">{createdBy}</td>
                      <td className="px-3 py-3">
                        {inscriptions.length === 0 ? (
                          <span className="text-xs text-slate-400">
                            Sin inscripción
                          </span>
                        ) : (
                          <div className="space-y-1">
                            {inscriptions.map((ins) => (
                              <div
                                key={String(ins.competitionId ?? ins.CompetitionId)}
                                className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] text-emerald-900"
                              >
                                <span className="font-semibold">
                                  {ins.tournamentName ??
                                    ins.TournamentName ??
                                    "Torneo"}
                                </span>{" "}
                                ·{" "}
                                {ins.competitionLabel ??
                                  ins.CompetitionLabel ??
                                  "Competencia"}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {activePlayerCount}/{playerCount} activos
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {puedeVerTodasLasEscuelas ? (
                            <button
                              type="button"
                              title="Editar nombre, siglas y representante"
                              aria-label="Editar nombre del equipo"
                              onClick={() => void openCatalogTeamEditModal(team)}
                              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 shadow-sm hover:bg-emerald-100"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          ) : null}
                          <Link
                            to={
                              torneosInscripcion[0]
                                ? `${PANEL_INSC_BASE}/${String(
                                    torneosInscripcion[0].id ??
                                      torneosInscripcion[0].Id
                                  )}/inscripcion?teamId=${encodeURIComponent(tid)}`
                                : "#"
                            }
                            onClick={(e) => {
                              if (!torneosInscripcion[0]) e.preventDefault();
                            }}
                            className="inline-flex h-9 min-w-[9.5rem] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50"
                          >
                            {puedeVerTodasLasEscuelas ? (
                              <>
                                <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                                Inscripción y plantel
                              </>
                            ) : (
                              <>
                                <Pencil className="w-3.5 h-3.5 shrink-0" />
                                Gestionar
                              </>
                            )}
                          </Link>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleTeamDelete(team)}
                              disabled={isDeleting}
                              className="inline-flex h-9 min-w-24 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-800 shadow-sm hover:bg-rose-100 disabled:opacity-50"
                            >
                              {isDeleting ? (
                                <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                              )}
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-slate-700" />
          Tus equipos y jugadores
        </h3>
        <p className="text-xs text-slate-600 -mt-4">
          Ves los equipos de tu escuela; solo podés <strong>editar planteles</strong>{" "}
          de los que sos delegado principal o co-delegado (equipos nuevos). Los
          equipos antiguos sin gestores siguen pudiendo ser editados por cualquier
          delegado de la escuela hasta que OTI migre el registro.
        </p>

        {teams.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center border border-dashed border-slate-200 rounded-xl">
            Aún no tenés equipos registrados. Usá un torneo con inscripciones
            abiertas arriba para crear el primero.
          </p>
        ) : (
          teams.map((team) => {
            const tid = String(team.id ?? team.Id);
            const tname = team.name ?? team.Name ?? "Equipo";
            const initials = team.initials ?? team.Initials;
            const inscriptions =
              team.inscriptions ?? team.Inscriptions ?? [];
            const players = sortPlayers(team.players ?? team.Players ?? []);
            const canManage = team.canManage ?? team.CanManage ?? true;
            const hasLockedRoster = inscriptions.some(
              (ins) => ins.rosterLocked ?? ins.RosterLocked ?? false
            );
            const iAmPrincipal =
              team.iAmPrincipal ?? team.IAmPrincipal ?? false;
            const tieneGestoresExplicitos =
              team.tieneGestoresExplicitos ??
              team.TieneGestoresExplicitos ??
              false;
            const gestoresList = gestoresCache[tid] ?? null;

            return (
              <div
                key={tid}
                className="rounded-xl border border-slate-100 bg-slate-50/60 overflow-hidden"
              >
                <div className="px-4 py-3 bg-slate-100/80 border-b border-slate-100 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900">
                      {tname}
                      {initials ? (
                        <span className="text-slate-500 font-normal text-sm ml-2">
                          ({initials})
                        </span>
                      ) : null}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {players.length}{" "}
                      {players.length === 1 ? "jugador" : "jugadores"}
                    </p>
                  </div>
                  {canManage ? (
                    <button
                      type="button"
                      onClick={() =>
                        editingTeamId === tid
                          ? closeTeamEditPanel()
                          : void openTeamEditPanel(tid)
                      }
                      className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      {editingTeamId === tid ? "Cerrar" : "Editar equipo"}
                    </button>
                  ) : null}
                </div>

                {canManage && editingTeamId === tid ? (
                  <div className="px-4 py-3 border-b border-emerald-100 bg-emerald-50/50 space-y-3">
                    {editTeamLoading ? (
                      <p className="text-xs text-slate-600 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Cargando…
                      </p>
                    ) : (
                      <form onSubmit={handleSaveTeamEdit} className="space-y-2">
                        {editTeamErr ? (
                          <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded px-2 py-1">
                            {editTeamErr}
                          </p>
                        ) : null}
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                            Nombre del equipo
                          </label>
                          <input
                            required
                            value={editTeamName}
                            onChange={(e) => setEditTeamName(e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm bg-white"
                          />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                              Siglas
                            </label>
                            <input
                              maxLength={5}
                              value={editTeamInitials}
                              onChange={(e) =>
                                setEditTeamInitials(e.target.value)
                              }
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                              Representante
                            </label>
                            <input
                              value={editTeamRep}
                              onChange={(e) => setEditTeamRep(e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm bg-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                            Nuevo logo (opcional)
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              setEditTeamLogo(e.target.files?.[0] ?? null)
                            }
                            className="w-full text-xs"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={editTeamSaving}
                          className="w-full py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 disabled:opacity-50"
                        >
                          {editTeamSaving ? "Guardando…" : "Guardar cambios"}
                        </button>
                      </form>
                    )}
                  </div>
                ) : null}

                {!canManage ? (
                  <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 text-[11px] text-amber-900">
                    <strong>Solo lectura:</strong> no sos gestor de este equipo.
                    La edición del plantel la hace el delegado principal o un co-delegado.
                  </div>
                ) : null}

                {iAmPrincipal && tieneGestoresExplicitos ? (
                  <div className="px-4 py-3 border-b border-violet-100 bg-violet-50/40 text-xs space-y-2">
                    <p className="text-[10px] font-bold uppercase text-violet-900">
                      Co-delegados (máx. 2)
                    </p>
                    <button
                      type="button"
                      onClick={() => loadGestoresForTeam(tid)}
                      className="text-[11px] font-semibold text-violet-700 hover:underline"
                    >
                      Ver / actualizar quienes pueden gestionar este equipo
                    </button>
                    {gestoresList && (
                      <ul className="space-y-1 mt-1">
                        {gestoresList.map((g) => {
                          const uid = g.usuarioId ?? g.UsuarioId;
                          const kind = String(g.kind ?? g.Kind ?? "");
                          const nm =
                            g.nombreCompleto ??
                            g.NombreCompleto ??
                            g.username ??
                            g.Username ??
                            uid;
                          return (
                            <li
                              key={String(uid)}
                              className="flex flex-wrap items-center justify-between gap-2 py-0.5 border-b border-violet-100/80 last:border-0"
                            >
                              <span>
                                <span className="font-medium text-slate-800">
                                  {nm}
                                </span>{" "}
                                <span className="text-violet-700">({kind})</span>
                              </span>
                              {kind === "Delegado" ? (
                                <button
                                  type="button"
                                  disabled={gestorBusy === `${tid}-${uid}`}
                                  onClick={async () => {
                                    if (
                                      !window.confirm(
                                        "¿Quitar a este co-delegado del equipo?"
                                      )
                                    )
                                      return;
                                    setGestorBusy(`${tid}-${uid}`);
                                    try {
                                      await deleteTeamGestor(tid, Number(uid));
                                      await loadGestoresForTeam(tid);
                                    } catch (err) {
                                      window.alert(
                                        err?.response?.data?.message ||
                                          "No se pudo quitar al co-delegado."
                                      );
                                    } finally {
                                      setGestorBusy(null);
                                    }
                                  }}
                                  className="text-[10px] font-bold text-rose-700 hover:underline disabled:opacity-50"
                                >
                                  Quitar
                                </button>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    <div className="flex flex-wrap items-end gap-2 pt-1">
                      <div className="flex-1 min-w-[10rem]">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Agregar usuario de tu escuela
                        </label>
                        <select
                          value={coDelegadoPick[tid] ?? ""}
                          onChange={(e) =>
                            setCoDelegadoPick((prev) => ({
                              ...prev,
                              [tid]: e.target.value,
                            }))
                          }
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                        >
                          <option value="">Elegir…</option>
                          {orgUsersForGestores.map((u) => {
                            const uid = String(u.id ?? u.Id);
                            const taken = (gestoresList ?? []).some(
                              (g) =>
                                String(g.usuarioId ?? g.UsuarioId) === uid
                            );
                            if (taken) return null;
                            const label =
                              u.nombreCompleto ??
                              u.NombreCompleto ??
                              u.username ??
                              u.Username;
                            return (
                              <option key={uid} value={uid}>
                                {label}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <button
                        type="button"
                        disabled={
                          gestorBusy === `add-${tid}` ||
                          !(coDelegadoPick[tid] ?? "").trim()
                        }
                        onClick={async () => {
                          const pick = coDelegadoPick[tid];
                          if (!pick) return;
                          setGestorBusy(`add-${tid}`);
                          try {
                            await postTeamGestor(tid, Number(pick));
                            setCoDelegadoPick((prev) => ({ ...prev, [tid]: "" }));
                            await loadGestoresForTeam(tid);
                          } catch (err) {
                            window.alert(
                              err?.response?.data?.message ||
                                "No se pudo agregar el co-delegado."
                            );
                          } finally {
                            setGestorBusy(null);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-violet-700 text-white text-[11px] font-bold hover:bg-violet-800 disabled:opacity-50"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="px-4 py-3 border-b border-slate-100 bg-white">
                  <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">
                    Gestionar inscripción y plantel
                  </p>
                  {inscriptions.length === 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500">
                        Este equipo no está inscrito en ninguna competencia.
                      </p>
                      {canManage && torneosInscripcion.length > 0 ? (
                        <ul className="space-y-1.5">
                          {torneosInscripcion.map((tour) => {
                            const tourId = String(tour.id ?? tour.Id);
                            const tourName =
                              tour.name ?? tour.Name ?? "Torneo";
                            return (
                              <li key={tourId}>
                                <Link
                                  to={`${PANEL_INSC_BASE}/${tourId}/inscripcion?teamId=${encodeURIComponent(tid)}`}
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                                >
                                  <UserPlus className="w-3.5 h-3.5 shrink-0" />
                                  Inscribir en: {tourName}
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-[11px] text-slate-500">
                          Cuando haya torneos con inscripciones abiertas, podrás
                          enlazar desde acá o desde la lista superior.
                        </p>
                      )}
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {inscriptions.map((ins) => {
                        const cid = String(
                          ins.competitionId ?? ins.CompetitionId
                        );
                        const tourId = String(
                          ins.tournamentId ?? ins.TournamentId
                        );
                        const label =
                          ins.competitionLabel ??
                          ins.CompetitionLabel ??
                          "Competencia";
                        const tourName =
                          ins.tournamentName ?? ins.TournamentName ?? "";
                        const rosterLocked =
                          ins.rosterLocked ?? ins.RosterLocked ?? false;
                        return (
                          <li
                            key={cid}
                            className="rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2"
                          >
                            <Link
                              to={`${PANEL_INSC_BASE}/${tourId}/inscripcion?competitionId=${encodeURIComponent(cid)}`}
                              aria-disabled={!canManage}
                              className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold hover:underline ${
                                canManage
                                  ? "text-emerald-700 hover:text-emerald-800"
                                  : "text-slate-400 pointer-events-none cursor-not-allowed"
                              }`}
                              onClick={(e) => {
                                if (!canManage) e.preventDefault();
                              }}
                            >
                              <UserPlus className="w-4 h-4 shrink-0" />
                              <span>{tourName}</span>
                              <span className="text-slate-500 font-normal">
                                — {label}
                              </span>
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  rosterLocked
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {rosterLocked
                                  ? "Lista cerrada"
                                  : "Lista abierta"}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                El administrador controla el cierre de listas.
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {torneosInscripcion.length > 0 && (
                    <p className="text-[11px] text-slate-500 mt-3">
                      ¿Nueva competencia? Elegí el torneo en la sección superior
                      y usá el mismo equipo desde el formulario de inscripción.
                    </p>
                  )}
                </div>

                <div className="px-4 py-3 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <p className="text-[10px] font-bold uppercase text-slate-500">
                      Jugadores (CRUD)
                    </p>
                    <button
                      type="button"
                      disabled={!canManage || hasLockedRoster}
                      onClick={() => {
                        setRosterMutateErr(null);
                        if (quickAddTeamId === tid) {
                          setQuickAddTeamId(null);
                          resetQuickAdd();
                        } else {
                          resetQuickAdd();
                          setQuickAddTeamId(tid);
                        }
                      }}
                      className="text-[11px] font-bold text-emerald-700 hover:underline disabled:opacity-40 disabled:no-underline"
                    >
                      {quickAddTeamId === tid
                        ? "Cerrar alta rápida"
                        : hasLockedRoster
                          ? "Lista cerrada"
                          : "+ Agregar jugador"}
                    </button>
                  </div>
                  {hasLockedRoster && (
                    <p className="mb-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                      Hay una competencia con lista cerrada. Reabrila antes de
                      registrar jugadores nuevos.
                    </p>
                  )}

                  {quickAddTeamId === tid && (
                    <form
                      onSubmit={(e) => handleQuickAddSubmit(e, tid)}
                      className="mb-4 p-4 rounded-xl border border-violet-200 bg-violet-50/40 space-y-3 text-sm"
                    >
                      {qaMsg && (
                        <p className="text-xs font-medium text-violet-900">
                          {qaMsg}
                        </p>
                      )}
                      {qaErr && (
                        <p className="text-xs text-red-600">{qaErr}</p>
                      )}
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                            Nombre completo
                          </label>
                          <input
                            required
                            value={qaName}
                            onChange={(e) => setQaName(e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                            Código estudiante (10 dígitos)
                          </label>
                          <input
                            required
                            maxLength={10}
                            inputMode="numeric"
                            placeholder="Ej. 0020180314"
                            value={qaDni}
                            onChange={(e) =>
                              setQaDni(
                                e.target.value.replace(/\D/g, "").slice(0, 10)
                              )
                            }
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                            Nacimiento (opc.)
                          </label>
                          <input
                            type="date"
                            value={qaBirth}
                            onChange={(e) => setQaBirth(e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                              Dorsal
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={99}
                              value={qaNumber}
                              onChange={(e) => setQaNumber(e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                              Puesto
                            </label>
                            <select
                              value={qaPosition}
                              onChange={(e) => setQaPosition(e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm bg-white"
                            >
                              {POSITIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                          Foto (opc.)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setQaPhoto(e.target.files?.[0] ?? null)
                          }
                          className="w-full text-xs"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={
                          !canManage ||
                          qaSaving ||
                          !qaName.trim() ||
                          !qaDni.trim()
                        }
                        className="w-full py-2 rounded-lg bg-violet-700 text-white text-xs font-bold hover:bg-violet-800 disabled:opacity-50"
                      >
                        {qaSaving ? "Guardando…" : "Registrar jugador"}
                      </button>
                    </form>
                  )}

                  {players.length === 0 ? (
                    <p className="text-xs text-slate-500">Sin jugadores.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                      {players.map((p) => {
                        const pid = p.id ?? p.Id;
                        const pname = p.name ?? p.Name ?? "—";
                        const code = p.dni ?? p.Dni ?? "—";
                        const num = p.number ?? p.Number;
                        const pos = p.position ?? p.Position;
                        const active = p.isActive ?? p.IsActive ?? true;
                        return (
                          <li
                            key={String(pid)}
                            className={`px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-sm ${
                              !active ? "bg-slate-50" : ""
                            }`}
                          >
                            <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
                              {num != null && num !== "" ? (
                                <span className="inline-flex w-6 h-6 items-center justify-center rounded border text-[10px] font-bold">
                                  {num}
                                </span>
                              ) : null}
                              <span className="font-medium text-slate-900">
                                {pname}
                              </span>
                              {!active ? (
                                <span className="text-[10px] font-bold uppercase text-amber-800 bg-amber-100 px-1 rounded">
                                  Inactivo
                                </span>
                              ) : null}
                              <span className="text-xs font-mono text-slate-600">
                                {code}
                              </span>
                              <span className="text-xs text-slate-400">
                                {positionLabel(pos)}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => openPlayerEdit(p, tid)}
                                disabled={
                                  !canManage ||
                                  !!playerEdit ||
                                  !!deletingPlayerId ||
                                  togglingId === pid ||
                                  qaSaving
                                }
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border border-slate-200 text-slate-800 bg-white hover:bg-slate-50 disabled:opacity-50"
                              >
                                <Pencil className="w-3 h-3" />
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggle(p)}
                                disabled={
                                  !canManage ||
                                  !!playerEdit ||
                                  deletingPlayerId === pid ||
                                  togglingId === pid ||
                                  qaSaving
                                }
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border border-amber-200 text-amber-900 bg-white hover:bg-amber-50 disabled:opacity-50"
                              >
                                {togglingId === pid ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : active ? (
                                  <UserX className="w-3 h-3" />
                                ) : (
                                  <UserCheck className="w-3 h-3" />
                                )}
                                {active ? "Desactivar" : "Reactivar"}
                              </button>
                              {puedeEliminarJugador ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handlePlayerDelete(p, pname)
                                  }
                                  disabled={
                                    !canManage ||
                                    !!playerEdit ||
                                    deletingPlayerId === pid ||
                                    togglingId === pid ||
                                    qaSaving
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border border-rose-200 text-rose-800 bg-white hover:bg-rose-50 disabled:opacity-50"
                                  title="Solo administración de torneos"
                                >
                                  {deletingPlayerId === pid ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3 h-3" />
                                  )}
                                  Eliminar
                                </button>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>

      {playerEdit && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/45"
          role="presentation"
          onClick={closePlayerEdit}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delegado-player-edit-title"
            className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-white rounded-t-2xl">
              <h2
                id="delegado-player-edit-title"
                className="text-lg font-bold text-slate-900"
              >
                Editar jugador
              </h2>
              <button
                type="button"
                onClick={closePlayerEdit}
                disabled={editSaving}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handlePlayerEditSubmit}
              className="px-5 py-4 space-y-4"
            >
              {editErr && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {editErr}
                </p>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Nombre completo
                </label>
                <input
                  required
                  value={playerEdit.name}
                  onChange={(e) =>
                    setPlayerEdit((prev) =>
                      prev ? { ...prev, name: e.target.value } : prev
                    )
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Código de estudiante (hasta 10 dígitos)
                  </label>
                  <input
                    required
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Ej. 0020180314"
                    value={playerEdit.dni}
                    onChange={(e) =>
                      setPlayerEdit((prev) =>
                        prev
                          ? {
                              ...prev,
                              dni: e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 10),
                            }
                          : prev
                      )
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Fecha de nacimiento (opcional)
                  </label>
                  <input
                    type="date"
                    value={playerEdit.birth}
                    onChange={(e) =>
                      setPlayerEdit((prev) =>
                        prev ? { ...prev, birth: e.target.value } : prev
                      )
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    N° de camiseta (opcional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={playerEdit.number}
                    onChange={(e) =>
                      setPlayerEdit((prev) =>
                        prev ? { ...prev, number: e.target.value } : prev
                      )
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Puesto
                  </label>
                  <select
                    value={playerEdit.position}
                    onChange={(e) =>
                      setPlayerEdit((prev) =>
                        prev
                          ? { ...prev, position: e.target.value }
                          : prev
                      )
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {POSITIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  <ImagePlus className="w-4 h-4" />
                  Nueva foto (opcional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setPlayerEdit((prev) =>
                      prev
                        ? {
                            ...prev,
                            photoFile: e.target.files?.[0] ?? null,
                          }
                        : prev
                    )
                  }
                  className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Si no elegís archivo, se mantiene la foto actual.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={closePlayerEdit}
                  disabled={editSaving}
                  className="flex-1 min-w-[120px] py-2.5 rounded-xl border border-slate-200 text-slate-800 font-semibold text-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    editSaving ||
                    !playerEdit.name.trim() ||
                    !playerEdit.dni.trim()
                  }
                  className="flex-1 min-w-[120px] py-2.5 rounded-xl bg-violet-700 text-white font-bold text-sm hover:bg-violet-800 disabled:opacity-50"
                >
                  {editSaving ? "Guardando…" : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {catalogEditOpen && puedeVerTodasLasEscuelas && (
        <div
          className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/45"
          role="presentation"
          onClick={() => {
            if (!catalogEditSaving) closeCatalogTeamEditModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalog-team-edit-title"
            className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
              <h2
                id="catalog-team-edit-title"
                className="text-lg font-bold text-slate-900 flex items-center gap-2"
              >
                <Pencil className="w-5 h-5 text-emerald-700" />
                Editar equipo
              </h2>
              <button
                type="button"
                onClick={() => {
                  if (!catalogEditSaving) closeCatalogTeamEditModal();
                }}
                disabled={catalogEditSaving}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={handleCatalogTeamSave}
              className="px-5 py-4 space-y-4"
            >
              {catalogEditErr && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {catalogEditErr}
                </p>
              )}
              {catalogEditLoading ? (
                <p className="text-sm text-slate-600 flex items-center gap-2 py-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Cargando datos del equipo…
                </p>
              ) : (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                      Nombre del equipo
                    </label>
                    <input
                      required
                      value={catalogEditName}
                      onChange={(e) => setCatalogEditName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                        Siglas (opcional)
                      </label>
                      <input
                        maxLength={5}
                        value={catalogEditInitials}
                        onChange={(e) =>
                          setCatalogEditInitials(e.target.value)
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                        Representante (opcional)
                      </label>
                      <input
                        value={catalogEditRep}
                        onChange={(e) => setCatalogEditRep(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 uppercase mb-1">
                      <ImagePlus className="w-4 h-4" />
                      Nuevo logo (opcional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setCatalogEditLogo(e.target.files?.[0] ?? null)
                      }
                      className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!catalogEditSaving) closeCatalogTeamEditModal();
                      }}
                      disabled={catalogEditSaving}
                      className="flex-1 min-w-[120px] py-2.5 rounded-xl border border-slate-200 text-slate-800 font-semibold text-sm hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={
                        catalogEditSaving ||
                        catalogEditLoading ||
                        !catalogEditName.trim()
                      }
                      className="flex-1 min-w-[120px] py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-800 disabled:opacity-50"
                    >
                      {catalogEditSaving ? "Guardando…" : "Guardar cambios"}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

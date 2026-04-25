import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Shield, UserPlus } from "lucide-react";
import api from "../../api/axiosConfig";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { createTeamMultipart } from "../../api/tournamentInscriptionService";

const ORG_TIPOS_EQUIPO = new Set(["Escuela", "Facultad"]);

export default function AltaEquipoSuperAdminPage() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const esSuperAdmin = hasRole("SuperAdmin");

  const [orgs, setOrgs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);

  const [organizacionId, setOrganizacionId] = useState("");
  const [principalId, setPrincipalId] = useState("");
  const [name, setName] = useState("");
  const [initials, setInitials] = useState("");
  const [rep, setRep] = useState("");
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    if (!esSuperAdmin) return;
    let c = false;
    (async () => {
      setLoadingOrgs(true);
      try {
        const { data } = await api.get("/Organizacion");
        if (!c) setOrgs(Array.isArray(data) ? data : []);
      } catch {
        if (!c) toast("No se pudieron cargar las organizaciones.", "error");
      } finally {
        if (!c) setLoadingOrgs(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [esSuperAdmin, toast]);

  const orgsEquipo = useMemo(
    () =>
      orgs.filter((o) =>
        ORG_TIPOS_EQUIPO.has(String(o.tipo ?? o.Tipo ?? "").trim())
      ),
    [orgs]
  );

  const loadUsers = useCallback(
    async (oid) => {
      if (!oid) {
        setUsers([]);
        return;
      }
      setLoadingUsers(true);
      try {
        const { data } = await api.get("/Usuarios", {
          params: { organizacionId: oid },
        });
        setUsers(Array.isArray(data) ? data : []);
      } catch {
        toast("No se pudieron cargar usuarios de la organización.", "error");
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (!organizacionId) {
      setUsers([]);
      setPrincipalId("");
      return;
    }
    loadUsers(organizacionId);
    setPrincipalId("");
  }, [organizacionId, loadUsers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !organizacionId || !principalId) {
      toast("Completá nombre, organización y delegado principal.", "error");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("Name", name.trim());
      fd.append("OrganizacionId", String(organizacionId));
      fd.append("PrincipalUsuarioId", String(principalId));
      if (initials.trim()) fd.append("Initials", initials.trim());
      if (rep.trim()) fd.append("RepresentativeName", rep.trim());
      if (logo) fd.append("LogoFile", logo);
      await createTeamMultipart(fd);
      toast("Equipo registrado. El delegado principal ya puede gestionarlo.", "success");
      setName("");
      setInitials("");
      setRep("");
      setLogo(null);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string"
          ? err.response.data
          : null) ||
        "No se pudo crear el equipo.";
      toast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  if (!esSuperAdmin) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Solo <strong>SuperAdmin</strong> puede usar el alta de equipos con asignación de delegado principal.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-violet-600" />
          Alta de equipo (SuperAdmin)
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Creá el equipo en una <strong>facultad o escuela</strong> y asigná el{" "}
          <strong>usuario delegado principal</strong> (debe existir en esa organización).
        </p>
        <Link
          to="/PanelControl/torneos/equipos"
          className="text-sm font-semibold text-emerald-700 hover:underline mt-2 inline-block"
        >
          ← Volver a equipos y planteles
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm"
      >
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Organización
          </label>
          {loadingOrgs ? (
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
            </p>
          ) : (
            <select
              required
              value={organizacionId}
              onChange={(e) => setOrganizacionId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="">Elegir…</option>
              {orgsEquipo.map((o) => {
                const id = String(o.id ?? o.Id);
                const nom = o.nombre ?? o.Nombre ?? id;
                return (
                  <option key={id} value={id}>
                    {nom} ({o.tipo ?? o.Tipo})
                  </option>
                );
              })}
            </select>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
            <UserPlus className="w-3.5 h-3.5" />
            Delegado principal (usuario de la org.)
          </label>
          {!organizacionId ? (
            <p className="text-xs text-slate-500">Primero elegí la organización.</p>
          ) : loadingUsers ? (
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando usuarios…
            </p>
          ) : (
            <select
              required
              value={principalId}
              onChange={(e) => setPrincipalId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="">Elegir usuario…</option>
              {users.map((u) => {
                const id = String(u.id ?? u.Id);
                const label =
                  u.nombreCompleto ??
                  u.NombreCompleto ??
                  u.username ??
                  u.Username ??
                  id;
                return (
                  <option key={id} value={id}>
                    {label} ({u.username ?? u.Username})
                  </option>
                );
              })}
            </select>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Nombre del equipo
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Siglas (opc.)
            </label>
            <input
              value={initials}
              onChange={(e) => setInitials(e.target.value.slice(0, 5))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Representante (opc.)
            </label>
            <input
              value={rep}
              onChange={(e) => setRep(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Logo (opc.)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={saving || !organizacionId || !principalId || !name.trim()}
          className="w-full py-2.5 rounded-xl bg-violet-700 text-white text-sm font-bold hover:bg-violet-800 disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Registrar equipo"}
        </button>
      </form>
    </div>
  );
}

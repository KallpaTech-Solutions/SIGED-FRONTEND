import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, AlertCircle, Filter, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  fetchTeamsList,
  fetchTeamDetail,
} from "../../api/tournamentInscriptionService";

function normStr(v) {
  return String(v ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export default function EquiposPlantelesAdminPage() {
  const { can, hasRole } = useAuth();
  const puedeAdminTorneos = can("tourn.manage");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teams, setTeams] = useState([]);
  const [filtroEscuela, setFiltroEscuela] = useState("");
  const [filtroEquipo, setFiltroEquipo] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!puedeAdminTorneos) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTeamsList({ onlyActive: true });
        if (!cancelled) setTeams(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) {
          setError(
            e?.response?.data?.message ||
              e?.message ||
              "No se pudieron cargar los equipos."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [puedeAdminTorneos]);

  const filtrados = useMemo(() => {
    const fe = normStr(filtroEscuela);
    const ft = normStr(filtroEquipo);
    return teams.filter((t) => {
      const esc =
        normStr(t.nombreEscuela ?? t.NombreEscuela ?? "") || "";
      const nom = normStr(t.name ?? t.Name ?? "");
      const ini = normStr(t.initials ?? t.Initials ?? "");
      if (fe && !esc.includes(fe)) return false;
      if (ft && !nom.includes(ft) && !ini.includes(ft)) return false;
      return true;
    });
  }, [teams, filtroEscuela, filtroEquipo]);

  const toggleExpand = async (teamId) => {
    if (expandedId === teamId) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(teamId);
    setDetail(null);
    setDetailLoading(true);
    try {
      const d = await fetchTeamDetail(teamId, { includeInactive: true });
      setDetail(d);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  if (!puedeAdminTorneos) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Solo la <strong>administración de torneos</strong> puede usar esta
        vista de equipos y planteles de todas las escuelas.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-emerald-600" />
          Equipos y planteles (todas las escuelas)
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Listado de equipos activos. Filtrá por escuela o nombre de equipo.
          Expandí una fila para ver la nómina (incluye jugadores inactivos).
          Para gestionar torneos y eliminar registros, usá las pantallas de
          administración correspondientes.
        </p>
        {hasRole("SuperAdmin") ? (
          <p className="text-sm mt-2">
            <Link
              to="/PanelControl/torneos/alta-equipo-superadmin"
              className="font-semibold text-violet-700 hover:underline"
            >
              Registrar equipo con delegado principal (SuperAdmin)
            </Link>
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap gap-4 items-end">
        <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold uppercase tracking-wide">
          <Filter className="w-4 h-4" />
          Filtros
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Escuela / facultad
          </label>
          <input
            value={filtroEscuela}
            onChange={(e) => setFiltroEscuela(e.target.value)}
            placeholder="Ej. FII…"
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-56 max-w-full"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Equipo
          </label>
          <input
            value={filtroEquipo}
            onChange={(e) => setFiltroEquipo(e.target.value)}
            placeholder="Nombre o siglas"
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-56 max-w-full"
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          Cargando…
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex gap-2 text-red-800 text-sm items-start">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <p className="text-xs text-slate-500 px-4 py-2 bg-slate-50 border-b border-slate-100">
            {filtrados.length} equipo{filtrados.length === 1 ? "" : "s"}
          </p>
          <ul className="divide-y divide-slate-100">
            {filtrados.map((t) => {
              const id = String(t.id ?? t.Id);
              const name = t.name ?? t.Name ?? "—";
              const esc = t.nombreEscuela ?? t.NombreEscuela ?? "—";
              const exp = expandedId === id;
              return (
                <li key={id} className="bg-white">
                  <button
                    type="button"
                    onClick={() => toggleExpand(id)}
                    className="w-full text-left px-4 py-3 flex flex-wrap items-center justify-between gap-2 hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{name}</p>
                      <p className="text-xs text-slate-500">{esc}</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">
                      {exp ? "Cerrar" : "Ver plantel"}
                    </span>
                  </button>
                  {exp && (
                    <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50">
                      {detailLoading ? (
                        <div className="flex items-center gap-2 py-4 text-slate-500 text-sm">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Cargando jugadores…
                        </div>
                      ) : detail && String(detail.id ?? detail.Id) === id ? (
                        <ul className="mt-3 space-y-1 text-sm">
                          {(detail.players ?? detail.Players ?? []).map((p) => {
                            const pa = p.isActive ?? p.IsActive;
                            return (
                              <li
                                key={String(p.id ?? p.Id)}
                                className="flex flex-wrap gap-2 py-1 border-b border-slate-100 last:border-0"
                              >
                                <span className="font-medium">
                                  {p.name ?? p.Name}
                                </span>
                                <span className="text-xs font-mono text-slate-600">
                                  {p.dni ?? p.Dni}
                                </span>
                                {!pa ? (
                                  <span className="text-[10px] uppercase font-bold text-amber-800">
                                    Inactivo
                                  </span>
                                ) : null}
                              </li>
                            );
                          })}
                        </ul>
                      ) : !detailLoading ? (
                        <p className="text-xs text-slate-500 py-2">
                          No se pudo cargar el plantel.
                        </p>
                      ) : null}
                      <Link
                        to="/PanelControl/torneos"
                        className="inline-block mt-3 text-xs font-semibold text-emerald-700 hover:underline"
                      >
                        Ir a torneos (panel) →
                      </Link>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

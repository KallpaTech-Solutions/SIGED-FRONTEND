import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Loader2,
  Plus,
  Calendar,
  ExternalLink,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { fetchTournamentsAdmin } from "../../api/tournamentsAdminService";
import {
  tournamentPublicLabel,
  tournamentPublicBadgeClass,
} from "../../utils/tournamentPublicStatus";

export default function TorneosPage() {
  const { can } = useAuth();
  const canManage = can("tourn.manage");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tournaments, setTournaments] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTournamentsAdmin({ includeInactive: true });
        if (!cancelled) setTournaments(data);
      } catch (e) {
        if (!cancelled) {
          setError(
            e?.response?.data?.message ||
              e?.message ||
              "No se pudieron cargar los torneos."
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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Torneos
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Listado de torneos institucionales. Creá uno nuevo y luego agregá
            competencias, fases y sedes desde el flujo de gestión (siguientes
            pasos).
          </p>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              to="/PanelControl/torneos/equipos"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-bold hover:bg-slate-50 shadow-sm"
            >
              Equipos (todas las escuelas)
            </Link>
            <Link
              to="/PanelControl/torneos/sedes"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-bold hover:bg-slate-50 shadow-sm"
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              Sedes y canchas
            </Link>
            <Link
              to="/PanelControl/torneos/nuevo"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nuevo torneo
            </Link>
          </div>
        )}
      </div>

      {!canManage && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
          Solo podés ver el listado. La <strong>creación de torneos</strong> está
          reservada para quienes tienen permiso de administración de torneos en
          la plataforma.
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 py-20 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="text-sm font-semibold">Cargando torneos…</span>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 flex items-start gap-3 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && tournaments.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-8 py-14 text-center">
          <Trophy className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No hay torneos registrados.</p>
          {canManage && (
            <Link
              to="/PanelControl/torneos/nuevo"
              className="inline-flex items-center gap-2 mt-4 text-emerald-700 font-bold text-sm hover:underline"
            >
              Crear el primer torneo
            </Link>
          )}
        </div>
      )}

      {!loading && !error && tournaments.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {tournaments.map((t) => {
            const id = t.id ?? t.Id;
            const name = t.name ?? t.Name ?? "—";
            const year = t.year ?? t.Year;
            const active = t.isActive ?? t.IsActive;
            const status = t.status ?? t.Status;
            const start = t.startDate ?? t.StartDate;
            const end = t.endDate ?? t.EndDate;
            return (
              <li
                key={id}
                className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-slate-50/80 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  <Trophy className="w-6 h-6 text-emerald-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 truncate">{name}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs text-slate-500 mt-1">
                    <span className="font-mono">{year}</span>
                    {start && end && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(start).toLocaleDateString("es-PE")} —{" "}
                        {new Date(end).toLocaleDateString("es-PE")}
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${tournamentPublicBadgeClass(
                        status
                      )}`}
                      title="Etapa del torneo (ciclo de vida)"
                    >
                      {tournamentPublicLabel(status)}
                    </span>
                    <span
                      className={
                        active
                          ? "text-emerald-700 font-semibold"
                          : "text-slate-400 font-semibold"
                      }
                      title="Si aparece en listados públicos"
                    >
                      {active ? "Visible" : "Oculto"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Link
                    to={`/PanelControl/torneos/${id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-emerald-800"
                  >
                    Ver detalles
                  </Link>
                  <a
                    href={`/torneos/torneo/${id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900"
                  >
                    Vitrina
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

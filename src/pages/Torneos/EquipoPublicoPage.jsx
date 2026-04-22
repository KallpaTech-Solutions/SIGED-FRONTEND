import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, Loader2, Shirt, Users } from "lucide-react";
import { fetchPublicTeamRoster } from "../../api/tournamentsPublicService";
import { useAuth } from "../../context/AuthContext";

const POSITION_LABELS = {
  0: "Sin definir",
  1: "Portero",
  2: "Defensa",
  3: "Mediocampista",
  4: "Delantero",
  5: "Líbero (vóley)",
  6: "Armador",
  7: "Central",
  8: "Capitán",
};

function positionLabel(pos) {
  const n = Number(pos);
  if (!Number.isNaN(n) && POSITION_LABELS[n] != null) return POSITION_LABELS[n];
  return String(pos ?? "—");
}

function sortPlayers(list) {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => {
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

function formatBirthDisplay(v) {
  if (v == null || v === "") return null;
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [y, m, d] = s.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function EquipoPublicoPage() {
  const { teamId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navState = location.state || {};
  const { user, loading: authLoading, can } = useAuth();

  /** Delegados / encargados con inscripción y administración de torneo. */
  const verDatosCompletos = Boolean(
    user &&
      !authLoading &&
      (can("tourn.team.manage") || can("tourn.manage"))
  );

  const competitionId = searchParams.get("competitionId") || "";
  const tournamentId = searchParams.get("tournamentId") || "";

  const backHref = useMemo(() => {
    if (navState.backPath && typeof navState.backPath === "string")
      return navState.backPath;
    if (competitionId) return `/torneos/${competitionId}`;
    if (tournamentId) return `/torneos/torneo/${tournamentId}`;
    return "/torneos";
  }, [navState.backPath, competitionId, tournamentId]);

  const backLabel = useMemo(() => {
    if (navState.backLabel && typeof navState.backLabel === "string")
      return navState.backLabel;
    if (competitionId) return "Volver a la competencia";
    if (tournamentId) return "Volver al torneo";
    return "Volver a torneos";
  }, [navState.backLabel, competitionId, tournamentId]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!teamId) {
      setLoading(false);
      setError("Equipo no especificado.");
      return undefined;
    }
    if (authLoading) {
      setLoading(true);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const t = await fetchPublicTeamRoster(teamId, {
          includeInactive: verDatosCompletos,
        });
        if (!cancelled) setData(t);
      } catch (e) {
        if (!cancelled) {
          setError(
            e?.response?.status === 404
              ? "No encontramos este equipo."
              : "No se pudo cargar el plantel."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [teamId, authLoading, verDatosCompletos]);

  const players = useMemo(
    () => sortPlayers(data?.players ?? data?.Players ?? []),
    [data]
  );

  const teamName = data?.name ?? data?.Name ?? "Equipo";
  const subtitle =
    navState.competitionTitle ||
    navState.fromCompetition ||
    (competitionId ? "Competencia" : null);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-inter">
      <section className="bg-gradient-to-r from-slate-900 via-emerald-900 to-emerald-700 border-b border-border/20 py-8 md:py-10">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link
            to={backHref}
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 hover:text-white mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            {backLabel}
          </Link>

          {loading && (
            <div className="flex items-center gap-3 text-emerald-100/80 py-6">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-300" />
              Cargando plantel…
            </div>
          )}

          {error && !loading && (
            <p className="text-red-200 text-sm py-6">{error}</p>
          )}

          {!loading && data && (
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center shrink-0 text-sm font-bold text-emerald-100">
                {data.logoUrl || data.LogoUrl ? (
                  <img
                    src={data.logoUrl ?? data.LogoUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (data.initials ?? data.Initials ?? teamName).slice(0, 4)
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-200/90 mb-1 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  {verDatosCompletos
                    ? "Plantel · gestión (datos completos)"
                    : "Plantel público"}
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  {teamName}
                </h1>
                {subtitle && (
                  <p className="mt-1 text-xs text-emerald-100/85">{subtitle}</p>
                )}
                {(data.representativeName || data.RepresentativeName) && (
                  <p className="mt-2 text-sm text-emerald-50/90">
                    <span className="text-emerald-200/80">Delegado:</span>{" "}
                    {data.representativeName ?? data.RepresentativeName}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {!loading && data && (
        <div className="bg-slate-50 border-t border-slate-100">
          <div className="container mx-auto px-4 max-w-3xl py-10">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Shirt className="w-4 h-4 text-emerald-600" />
              Jugadores ({players.length})
            </h2>
            {!players.length ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-slate-500 text-sm">
                No hay jugadores activos registrados en este equipo.
              </div>
            ) : (
              <ul className="space-y-2">
                {players.map((p) => {
                  const pid = p.id ?? p.Id;
                  const num = p.number ?? p.Number;
                  const name = p.name ?? p.Name ?? "—";
                  const pos = p.position ?? p.Position;
                  const photo = p.photoUrl ?? p.PhotoUrl;
                  const dni = p.dni ?? p.Dni ?? "";
                  const birthRaw = p.birthDate ?? p.BirthDate;
                  const birth = formatBirthDisplay(birthRaw);
                  const active = p.isActive ?? p.IsActive ?? true;
                  const eligible = p.isEligible ?? p.IsEligible ?? true;
                  return (
                    <li
                      key={pid}
                      className={`rounded-2xl border bg-white px-4 py-3 shadow-sm ${
                        verDatosCompletos
                          ? "border-slate-200"
                          : "border-slate-200 flex items-center gap-3"
                      }`}
                    >
                      <div
                        className={
                          verDatosCompletos
                            ? "flex flex-col sm:flex-row sm:items-start gap-3"
                            : "contents"
                        }
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 text-xs font-bold text-slate-600">
                          {photo ? (
                            <img
                              src={photo}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : num != null && num !== "" ? (
                            num
                          ) : (
                            "—"
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-900 truncate">
                              {name}
                            </p>
                            {verDatosCompletos && !active && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                                Inactivo
                              </span>
                            )}
                            {verDatosCompletos && !eligible && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-100">
                                No elegible
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {positionLabel(pos)}
                            {num != null && num !== "" ? ` · N° ${num}` : ""}
                          </p>
                          {verDatosCompletos && (
                            <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-600">
                              <div>
                                <dt className="text-slate-400 font-semibold uppercase tracking-tight">
                                  Código de estudiante
                                </dt>
                                <dd className="font-mono tabular-nums">
                                  {dni ? String(dni) : "—"}
                                </dd>
                              </div>
                              {birth && (
                                <div>
                                  <dt className="text-slate-400 font-semibold uppercase tracking-tight">
                                    Fecha de nacimiento
                                  </dt>
                                  <dd>{birth}</dd>
                                </div>
                              )}
                            </dl>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {!verDatosCompletos && (
              <p className="mt-8 text-[11px] text-slate-400 max-w-xl leading-relaxed">
                Datos de contacto y documento de identidad no se publican en la
                vitrina. Para consultas administrativas, contactá a OTI o a la
                mesa del torneo.
              </p>
            )}
            {verDatosCompletos && (
              <p className="mt-8 text-[11px] text-slate-500 max-w-xl leading-relaxed border border-slate-200 bg-slate-100/80 rounded-xl px-4 py-3">
                Estás viendo datos completos porque tu cuenta tiene permiso de
                gestión de equipos o administración de torneos. Los jugadores
                inactivos solo aparecen si el equipo es de tu facultad o tenés
                rol de administración.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

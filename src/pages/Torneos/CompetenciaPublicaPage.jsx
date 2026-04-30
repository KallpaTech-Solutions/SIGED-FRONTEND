import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Loader2,
  ChevronLeft,
  Users,
  Building2,
  UserPlus,
  ChevronRight,
} from "lucide-react";
import {
  fetchCompetitionById,
  fetchCompetitionPublicDashboard,
  fetchPublicLandingMatchesByCompetition,
} from "../../api/tournamentsPublicService";
import CompetitionDashboard from "../../components/tournaments/CompetitionDashboard";
import ChampionBanner from "../../components/tournaments/ChampionBanner";
import LiveMatchesCarousel from "../../components/tournaments/LiveMatchesCarousel";
import {
  buildLandingMatchIdsKey,
} from "../../hooks/useTorneosVitrinaHub";
import { useCompetitionVitrinaHub } from "../../hooks/useCompetitionVitrinaHub";
import { isInscripcionesAbiertas } from "../../utils/tournamentPublicStatus";

function genderLabel(g) {
  const map = {
    Masculino: "Masculino",
    Femenino: "Femenino",
    Mixto: "Mixto",
    0: "Masculino",
    1: "Femenino",
    2: "Mixto",
  };
  return map[g] ?? map[String(g)] ?? String(g ?? "—");
}

export default function CompetenciaPublicaPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [competitionLandingMatches, setCompetitionLandingMatches] = useState(
    []
  );
  /** Calendario + lista "hoy" — el API public-dashboard hace muchas consultas por fase/grupo. */
  const [secondaryLoading, setSecondaryLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const landingIdsKey = useMemo(
    () => buildLandingMatchIdsKey(competitionLandingMatches),
    [competitionLandingMatches]
  );

  const hubEnabled = !loading && !error && !!data && !!id;

  const refreshPublicDashboard = useCallback(async (competitionId) => {
    if (!competitionId) return;
    try {
      const d = await fetchCompetitionPublicDashboard(competitionId);
      setDashboard(d);
    } catch {
      /* ignore */
    }
  }, []);

  useCompetitionVitrinaHub({
    enabled: hubEnabled,
    competitionId: id,
    matchIdsKey: landingIdsKey,
    setLandingMatches: setCompetitionLandingMatches,
    onLandingRefetchComplete: refreshPublicDashboard,
  });

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;

    setLoading(true);
    setSecondaryLoading(true);
    setError(null);
    setData(null);
    setDashboard(null);
    setCompetitionLandingMatches([]);

    (async () => {
      let comp;
      try {
        comp = await fetchCompetitionById(id);
      } catch (e) {
        if (!cancelled) {
          setError(
            e?.response?.status === 404
              ? "No encontramos esta competencia."
              : "No se pudo cargar la competencia."
          );
          setLoading(false);
          setSecondaryLoading(false);
        }
        return;
      }

      if (cancelled) return;
      setData(comp);
      setLoading(false);

      const [dashRes, landingRes] = await Promise.allSettled([
        fetchCompetitionPublicDashboard(id),
        fetchPublicLandingMatchesByCompetition(id),
      ]);

      if (cancelled) return;

      setDashboard(
        dashRes.status === "fulfilled" ? dashRes.value : null
      );
      setCompetitionLandingMatches(
        landingRes.status === "fulfilled" && Array.isArray(landingRes.value)
          ? landingRes.value
          : []
      );
      setSecondaryLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const title =
    data?.categoryName && data?.discipline?.name
      ? `${data.discipline.name} · ${data.categoryName}`
      : data?.discipline?.name ?? "Competencia";

  /** Sedes desde landing (misma competencia): respaldo si el dashboard aún no trae venueName. */
  const venueByMatchId = useMemo(() => {
    const map = new Map();
    for (const m of competitionLandingMatches) {
      const mid = m?.id ?? m?.Id;
      const v = m?.venueName ?? m?.VenueName;
      if (mid != null && v != null && String(v).trim() !== "") {
        map.set(String(mid).toLowerCase(), String(v).trim());
      }
    }
    return map;
  }, [competitionLandingMatches]);

  const teams = useMemo(() => {
    const rows = data?.competitionTeams ?? data?.CompetitionTeams ?? [];
    if (!Array.isArray(rows)) return [];
    return [...rows].sort((a, b) => {
      const na = a.team?.name ?? a.Team?.name ?? "";
      const nb = b.team?.name ?? b.Team?.name ?? "";
      return na.localeCompare(nb, "es");
    });
  }, [data]);

  const torneoHref = data?.tournament?.id
    ? `/torneos/torneo/${data.tournament.id}`
    : "/torneos";

  const championBannerPayload = useMemo(() => {
    if (!data) return null;
    const team =
      data.championTeam ??
      data.ChampionTeam ??
      null;
    const teamId =
      data.championTeamId ??
      data.ChampionTeamId ??
      team?.id ??
      team?.Id ??
      dashboard?.championTeamId ??
      dashboard?.ChampionTeamId;
    if (!teamId) return null;
    const name =
      team?.name ??
      team?.Name ??
      dashboard?.championTeamName ??
      dashboard?.ChampionTeamName ??
      null;
    if (!name) return null;
    const logoUrl =
      team?.logoUrl ??
      team?.LogoUrl ??
      dashboard?.championTeamLogoUrl ??
      dashboard?.ChampionTeamLogoUrl ??
      null;
    const competitionName =
      (data.discipline?.name ?? data.Discipline?.name ?? "") +
      (data.categoryName || data.CategoryName
        ? ` · ${data.categoryName ?? data.CategoryName}`
        : "");
    return {
      name,
      logoUrl: logoUrl || undefined,
      competitionName: competitionName.trim() || "Competencia",
      tournamentName: data.tournament?.name ?? data.Tournament?.name,
      year: data.tournament?.year ?? data.Tournament?.year,
    };
  }, [data, dashboard]);

  const tournamentStatusRaw =
    data?.tournament?.statusValue ??
    data?.tournament?.StatusValue ??
    data?.tournament?.status ??
    data?.tournament?.Status;
  const inscripcionesAbiertasTorneo =
    data && isInscripcionesAbiertas(tournamentStatusRaw);
  const inscripcionHref =
    data?.tournament?.id && id
      ? `/torneos/torneo/${data.tournament.id}/inscripcion?competitionId=${id}`
      : null;

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 bg-white text-slate-900 font-inter">
      <section className="bg-gradient-to-r from-slate-900 via-emerald-900 to-emerald-700 border-b border-border/20 py-8 md:py-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6 text-sm font-semibold">
            <Link
              to="/torneos"
              className="inline-flex items-center gap-2 text-emerald-200 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
              Torneos
            </Link>
            {data?.tournament?.id && (
              <>
                <span className="text-emerald-500/80 hidden sm:inline">/</span>
                <Link
                  to={torneoHref}
                  className="inline-flex items-center gap-2 text-emerald-200 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4 sm:hidden" />
                  {data.tournament.name}
                </Link>
              </>
            )}
          </div>

          {loading && (
            <div className="flex items-center gap-3 text-emerald-100/80 py-8">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-300" />
              Cargando competencia…
            </div>
          )}

          {error && !loading && (
            <p className="text-red-200 text-sm py-8">{error}</p>
          )}

          {!loading && data && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-200/90 mb-2">
                {data.tournament?.name} · {data.tournament?.year}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                {title}
              </h1>
              <p className="mt-1 text-xs text-emerald-200/90">
                {genderLabel(data.gender)}
              </p>
              <p className="mt-3 text-sm text-emerald-50/90 max-w-2xl leading-relaxed">
                Partidos por fase (grupos / eliminatoria), tabla de posiciones en
                round robin y acceso al detalle de cada partido.
              </p>
              {inscripcionesAbiertasTorneo && inscripcionHref && (
                <div className="mt-8">
                  <Link
                    to={inscripcionHref}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-emerald-900 text-sm font-bold border-2 border-emerald-200 hover:bg-emerald-50 shadow-md transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Inscribí a tu equipo
                  </Link>
                  <p className="mt-2 text-[11px] text-emerald-100/80 max-w-md">
                    Esta competencia ya está elegida; solo completá los datos
                    del equipo y confirmá con tu cuenta de delegado.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {!loading && data && (
        <div className="bg-slate-50 border-t border-slate-100">
          <div className="container mx-auto px-4 max-w-5xl py-10 space-y-10">
            {championBannerPayload ? (
              <ChampionBanner champion={championBannerPayload} title="Campeón" />
            ) : null}
            <section>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Equipos inscritos
              </h2>
              {!teams.length ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-slate-500 text-sm">
                  Aún no hay equipos inscritos.
                </div>
              ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {teams.map((ct) => {
                    const team = ct.team ?? ct.Team;
                    const teamGuid = team?.id ?? team?.Id;
                    const escuela =
                      team?.organizacion?.nombre ??
                      team?.Organizacion?.nombre ??
                      null;
                    const rosterTo = teamGuid
                      ? `/torneos/equipo/${teamGuid}?competitionId=${encodeURIComponent(id)}`
                      : null;
                    const inner = (
                      <>
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 text-[11px] font-bold text-slate-500">
                          {team?.logoUrl || team?.LogoUrl ? (
                            <img
                              src={team.logoUrl ?? team.LogoUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            (team?.initials ?? team?.Initials ?? "—").slice(
                              0,
                              4
                            )
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 truncate">
                            {team?.name ?? team?.Name ?? "Equipo"}
                          </p>
                          {escuela && (
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate mt-0.5">
                              <Building2 className="w-3 h-3 shrink-0" />
                              {escuela}
                            </p>
                          )}
                        </div>
                        {(ct.puntos > 0 || ct.partidosJugados > 0) && (
                          <div className="text-[10px] font-mono text-slate-500 text-right shrink-0">
                            {ct.puntos} pts · {ct.partidosJugados} PJ
                          </div>
                        )}
                        {rosterTo && (
                          <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
                        )}
                      </>
                    );
                    return (
                      <li key={ct.id ?? ct.Id}>
                        {rosterTo ? (
                          <Link
                            to={rosterTo}
                            state={{
                              backPath: `/torneos/${id}`,
                              backLabel: "Volver a la competencia",
                              competitionTitle: title,
                            }}
                            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all"
                          >
                            {inner}
                          </Link>
                        ) : (
                          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            {inner}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {secondaryLoading && (
              <div className="rounded-2xl border border-slate-200 bg-white px-6 py-8 flex flex-wrap items-center gap-3 text-slate-600 text-sm">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-800">
                    Cargando calendario y partidos del día…
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    El listado por fases puede tardar unos segundos (muchas
                    consultas en el servidor).
                  </p>
                </div>
              </div>
            )}

            {!secondaryLoading && competitionLandingMatches.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
                  Hoy · En vivo
                </h2>
                <p className="text-xs text-slate-500 max-w-2xl">
                  Partidos de esta competencia (en vivo y programados para hoy,
                  UTC). El marcador se actualiza en caliente (
                  <code className="text-[11px] bg-slate-100 px-1 rounded">
                    /tournamentHub
                  </code>
                  ).
                </p>
                <LiveMatchesCarousel matches={competitionLandingMatches} />
              </section>
            )}

            {!secondaryLoading && dashboard && (
              <CompetitionDashboard
                dashboard={dashboard}
                venueByMatchId={venueByMatchId}
              />
            )}

            {!secondaryLoading && !dashboard && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900 text-sm">
                El calendario detallado no está disponible (¿API sin actualizar?).
                Puedes seguir viendo los equipos inscritos arriba.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

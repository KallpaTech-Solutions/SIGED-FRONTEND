import React, { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import TournamentGrid from "../../components/tournaments/TournamentGrid";
import LiveMatchesCarousel from "../../components/tournaments/LiveMatchesCarousel";
import {
  fetchPublicTournaments,
  fetchPublicLandingMatches,
} from "../../api/tournamentsPublicService";
import {
  buildLandingMatchIdsKey,
  useTorneosVitrinaHub,
} from "../../hooks/useTorneosVitrinaHub";

/**
 * Dos fuentes: torneos + partidos para vitrina (GET /api/Matches/public/landing).
 * Si el deploy no tiene /landing aún, el carrusel queda en mock sin romper la página.
 */
export default function TorneosPublicPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [landingMatches, setLandingMatches] = useState([]);

  const landingIdsKey = useMemo(
    () => buildLandingMatchIdsKey(landingMatches),
    [landingMatches]
  );

  /** Hub en cuanto no hay error: si esperamos a loading, se pierden avisos durante la carga inicial. */
  const hubEnabled = !err;
  useTorneosVitrinaHub({
    enabled: hubEnabled,
    landingIdsKey,
    setLandingMatches,
    setTournaments,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const [tRes, lRes] = await Promise.allSettled([
          fetchPublicTournaments(),
          fetchPublicLandingMatches(),
        ]);
        if (cancelled) return;
        if (tRes.status === "rejected") {
          throw tRes.reason;
        }
        setTournaments(tRes.value);
        setLandingMatches(lRes.status === "fulfilled" ? lRes.value : []);
      } catch (e) {
        if (!cancelled) {
          setErr(
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
    <div className="w-full min-h-screen bg-white font-inter text-slate-900">
      <section className="bg-gradient-to-r from-slate-900 via-emerald-900 to-emerald-700 border-b border-border/20 py-10 md:py-14">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="rounded-[28px] bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-900 shadow-[0_24px_70px_rgba(15,23,42,0.35)] border border-emerald-500/25 px-6 py-6 md:px-10 md:py-8 text-white overflow-hidden relative">
            <div
              className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.45),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.25),_transparent_55%)]"
              aria-hidden
            />
            <div className="relative z-10 max-w-2xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-200/90 mb-2">
                Portal deportivo · SIGED UNAS
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight">
                Torneos
              </h1>
              <p className="mt-2 text-sm text-emerald-50/90 max-w-xl leading-relaxed">
                Partidos en vivo y del día, más el listado de torneos publicados.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-slate-50 border-b border-slate-100">
        <div className="container mx-auto px-4 max-w-5xl py-8 md:py-10 space-y-10">
          {loading && (
            <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
              <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
              <span className="text-sm font-semibold">Cargando…</span>
            </div>
          )}

          {err && !loading && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800 text-sm">
              {err}
            </div>
          )}

          {!loading && !err && (
            <>
              <section className="space-y-3">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
                  Hoy · En vivo
                </h2>
                <p className="text-xs text-slate-500 max-w-2xl">
                  Datos desde{" "}
                  <code className="text-[11px] bg-slate-100 px-1 rounded">
                    GET /api/Matches/public/landing
                  </code>
                  . SignalR (
                  <code className="text-[11px] bg-slate-100 px-1 rounded">
                    /tournamentHub
                  </code>
                  ) actualiza el marcador en caliente y, si el servidor avisa, vuelve a cargar la lista
                  cuando hay partidos nuevos en la vitrina.
                </p>
                <LiveMatchesCarousel matches={landingMatches} />
              </section>

              <section className="space-y-4">
                <div>
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
                    Torneos
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                    Solo torneos con{" "}
                    <span className="font-medium">IsActive</span> en el API; la
                    grilla se refresca sola cuando hay altas o cambios de visibilidad
                    (SignalR).
                  </p>
                </div>
                <TournamentGrid tournaments={tournaments} />
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

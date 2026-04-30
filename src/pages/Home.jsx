import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Newspaper,
  Trophy,
  Users,
} from "lucide-react";
import TournamentGrid from "../components/tournaments/TournamentGrid";
import LiveMatchesCarousel from "../components/tournaments/LiveMatchesCarousel";
import {
  fetchPublicLandingMatches,
  fetchPublicTournaments,
} from "../api/tournamentsPublicService";
import {
  buildLandingMatchIdsKey,
  useTorneosVitrinaHub,
} from "../hooks/useTorneosVitrinaHub";

const HERO_FADE_MS = 900;

const heroSlides = [
  {
    id: 1,
    title: "Torneos y competencias",
    subtitle:
      "Partidos en vivo, fixture por fase, tablas y llaves. Todo el calendario deportivo UNAS en un solo lugar.",
    badge: "Portal deportivo · SIGED UNAS",
    bgClass: "from-slate-900 via-emerald-800 to-emerald-600",
    ctaTo: "/torneos",
    ctaLabel: "Ver torneos",
  },
  {
    id: 2,
    title: "Campeones",
    subtitle:
      "Consultá los equipos campeones por año y disciplina, con enlace a cada competencia.",
    badge: "Vitrina pública",
    bgClass: "from-slate-900 via-amber-900 to-amber-800",
    ctaTo: "/campeones",
    ctaLabel: "Ver campeones",
  },
  {
    id: 3,
    title: "Noticias",
    subtitle: "Novedades, comunicados y lo más destacado del deporte universitario.",
    badge: "Comunicación",
    bgClass: "from-slate-900 via-emerald-900 to-teal-800",
    ctaTo: "/noticias",
    ctaLabel: "Ver noticias",
  },
];

const quickLinks = [
  {
    to: "/torneos",
    title: "Torneos",
    desc: "Listado de torneos, partidos del día y transmisiones.",
    icon: Users,
  },
  {
    to: "/campeones",
    title: "Campeones",
    desc: "Historial por año y disciplina.",
    icon: Trophy,
  },
  {
    to: "/noticias",
    title: "Noticias",
    desc: "Actualidad del deporte en la UNAS.",
    icon: Newspaper,
  },
];

export default function Home() {
  const [targetSlide, setTargetSlide] = useState(0);
  const [visibleSlide, setVisibleSlide] = useState(0);
  const [heroOpacity, setHeroOpacity] = useState(1);
  const [tournamentsLoading, setTournamentsLoading] = useState(true);
  const [tournamentsErr, setTournamentsErr] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [landingMatches, setLandingMatches] = useState([]);

  const landingIdsKey = useMemo(
    () => buildLandingMatchIdsKey(landingMatches),
    [landingMatches]
  );

  const liveCount = useMemo(
    () =>
      landingMatches.filter((m) => {
        const s = m.status ?? m.Status;
        return s === 1 || s === "EnVivo" || String(s) === "1";
      }).length,
    [landingMatches]
  );

  useTorneosVitrinaHub({
    enabled: !tournamentsErr,
    landingIdsKey,
    setLandingMatches,
    setTournaments,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setTournamentsLoading(true);
      setTournamentsErr(null);
      try {
        const [tRes, lRes] = await Promise.allSettled([
          fetchPublicTournaments(),
          fetchPublicLandingMatches(),
        ]);
        if (cancelled) return;
        if (tRes.status === "rejected") throw tRes.reason;
        setTournaments(tRes.value);
        setLandingMatches(lRes.status === "fulfilled" ? lRes.value : []);
      } catch (e) {
        if (!cancelled) {
          setTournaments([]);
          setLandingMatches([]);
          setTournamentsErr(
            e?.response?.data?.message ||
              e?.message ||
              "No se pudo cargar el contenido."
          );
        }
      } finally {
        if (!cancelled) setTournamentsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setTargetSlide((v) => (v + 1) % heroSlides.length);
    }, 6500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (targetSlide === visibleSlide) return;
    setHeroOpacity(0);
    const t = setTimeout(() => {
      setVisibleSlide(targetSlide);
      requestAnimationFrame(() => setHeroOpacity(1));
    }, HERO_FADE_MS);
    return () => clearTimeout(t);
  }, [targetSlide, visibleSlide]);

  const current = heroSlides[visibleSlide];

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 bg-background">
      <section
        className={`relative min-h-[42vh] md:min-h-[46vh] bg-gradient-to-r ${current.bgClass} overflow-hidden transition-colors duration-700`}
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.6),_transparent_55%)]" />
        </div>

        <button
          type="button"
          onClick={() =>
            setTargetSlide((visibleSlide - 1 + heroSlides.length) % heroSlides.length)
          }
          className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/15 border border-white/30 text-white flex items-center justify-center hover:bg-white/25 transition-colors"
          aria-label="Slide anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setTargetSlide((visibleSlide + 1) % heroSlides.length)}
          className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/15 border border-white/30 text-white flex items-center justify-center hover:bg-white/25 transition-colors"
          aria-label="Slide siguiente"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div
          className="container mx-auto px-4 min-h-[42vh] md:min-h-[46vh] flex flex-col items-center justify-center relative z-10 text-center transition-opacity duration-[900ms] ease-in-out py-12"
          style={{ opacity: heroOpacity }}
        >
          <div className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/15 border border-white/10 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            <span className="text-[10px] font-semibold tracking-[0.22em] text-emerald-100 uppercase">
              {current.badge}
            </span>
          </div>

          <div className="mb-3">
            <Flame className="w-9 h-9 text-amber-300 mx-auto" aria-hidden />
          </div>

          <h1 className="text-2xl md:text-4xl font-semibold text-white mb-2 leading-tight font-montserrat uppercase tracking-wide">
            {current.title}
          </h1>

          <p className="text-xs md:text-sm text-emerald-50/90 mb-6 max-w-2xl font-inter">
            {current.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
            <Link
              to={current.ctaTo}
              className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-[13px] font-semibold uppercase tracking-[0.18em] bg-gradient-to-r from-amber-500 to-red-500 text-white shadow-[0_14px_40px_rgba(0,0,0,0.45)] hover:shadow-[0_18px_55px_rgba(0,0,0,0.65)] transition-all"
            >
              <Flame className="w-4 h-4" />
              {current.ctaLabel}
            </Link>
            <Link
              to="/torneos"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-[12px] font-semibold uppercase tracking-wider border border-white/35 text-white hover:bg-white/10 transition-colors"
            >
              Ir a torneos
            </Link>
          </div>

          <div className="mt-6 inline-flex items-center gap-3 bg-black/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-white border border-white/10">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/90">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </span>
            <p className="text-[11px] md:text-xs font-semibold">
              {liveCount} partido{liveCount !== 1 ? "s" : ""} en vivo ahora
            </p>
          </div>

          <div className="mt-4 flex justify-center gap-2">
            {heroSlides.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setTargetSlide(idx)}
                className={`w-2 h-2 rounded-full border border-white/40 transition-all ${
                  idx === visibleSlide ? "bg-white w-4" : "bg-white/10"
                }`}
                aria-label={`Ir al slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 bg-linear-to-b from-white to-slate-50 border-t border-slate-100">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickLinks.map(({ to, title, desc, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group"
              >
                <Icon className="w-8 h-8 text-emerald-600 mb-3" aria-hidden />
                <h2 className="text-lg font-bold text-slate-900 group-hover:text-emerald-800">
                  {title}
                </h2>
                <p className="text-sm text-slate-600 mt-1 leading-snug">{desc}</p>
                <span className="mt-4 inline-block text-xs font-bold text-emerald-700 uppercase tracking-wide">
                  Entrar →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 bg-slate-50 border-t border-slate-100">
        <div className="container mx-auto px-4 max-w-5xl space-y-4">
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
              Hoy · En vivo
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Resultados en tiempo real de los partidos publicados en SIGED.
            </p>
          </div>
          <LiveMatchesCarousel matches={landingMatches} />
        </div>
      </section>

      <section className="py-12 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4 max-w-5xl space-y-5">
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
              Torneos
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Torneos activos en el portal. La lista se actualiza cuando hay cambios en la
              vitrina.
            </p>
          </div>

          {tournamentsLoading && (
            <p className="text-sm text-slate-500 py-6">Cargando torneos…</p>
          )}
          {tournamentsErr && !tournamentsLoading && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm">
              {tournamentsErr}
            </div>
          )}
          {!tournamentsLoading && !tournamentsErr && (
            <TournamentGrid tournaments={tournaments} />
          )}
        </div>
      </section>
    </div>
  );
}

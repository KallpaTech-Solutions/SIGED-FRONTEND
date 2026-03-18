import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Users, Flame, ChevronLeft, ChevronRight } from "lucide-react";

const liveMatches = [
  {
    id: 1,
    home: "Agronomía",
    away: "Zootecnia",
    homeScore: 3,
    awayScore: 1,
    sport: "Fútbol",
    time: "78'",
    viewers: 1234,
    location: "Estadio UNAS",
    isLive: true,
  },
];

const sports = [
  {
    name: "Fútbol",
    href: "/torneos",
    color: "from-green-500 to-green-600",
  },
  {
    name: "Vóley",
    href: "/torneos",
    color: "from-yellow-500 to-yellow-600",
  },
  {
    name: "Básquet",
    href: "/torneos",
    color: "from-orange-500 to-orange-600",
  },
  {
    name: "Futsal",
    href: "/torneos",
    color: "from-blue-500 to-blue-600",
  },
];

const sportDescriptions = {
  Fútbol:
    "El deporte rey con partidos emocionantes entre todas las facultades.",
  Vóley: "Voleibol universitario con actuaciones de alto nivel.",
  Básquet: "Baloncesto competitivo con estrategia y velocidad.",
  Futsal: "Fútbol rápido y dinámico en espacios reducidos.",
};

const heroSlides = [
  {
    id: 1,
    title: "Pasión deportiva UNAS",
    subtitle:
      "Resultados en vivo y estadísticas actualizadas de Cachimbos e Interfacultades.",
    badge: "Portal deportivo · SIGED UNAS",
    bgClass: "from-slate-900 via-emerald-800 to-emerald-600",
    ctaTo: "/torneos",
    ctaLabel: "Ver torneos",
  },
  {
    id: 2,
    title: "Calendario competitivo",
    subtitle:
      "Consulta el cronograma oficial de encuentros y fases eliminatorias por disciplina.",
    badge: "Agenda oficial UNAS",
    bgClass: "from-slate-900 via-sky-900 to-sky-700",
    ctaTo: "/calendario",
    ctaLabel: "Ver calendario",
  },
  {
    id: 3,
    title: "Noticias y momentos clave",
    subtitle:
      "Resumen ejecutivo de lo más importante en cada jornada deportiva.",
    badge: "Highlights del día",
    bgClass: "from-slate-900 via-emerald-900 to-lime-700",
    ctaTo: "/noticias",
    ctaLabel: "Ver noticias",
  },
];

const HERO_FADE_MS = 1500;

export default function Home() {
  const [targetSlide, setTargetSlide] = useState(0); // destino (flechas, puntos, intervalo)
  const [visibleSlide, setVisibleSlide] = useState(0); // contenido mostrado (cambia tras el fade out)
  const [heroOpacity, setHeroOpacity] = useState(1);
  const visibleSlideRef = useRef(0);
  visibleSlideRef.current = visibleSlide;

  useEffect(() => {
    const id = setInterval(() => {
      setTargetSlide((visibleSlideRef.current + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  // Transición: desvanecer (1.5s), luego cambiar slide y aparecer (1.5s)
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
    <div className="w-full">
      {/* Hero Section con desvanecimiento y flechas */}
      <section
        className={`relative h-[52vh] md:h-[56vh] bg-gradient-to-r ${current.bgClass} overflow-hidden transition-colors duration-700`}
      >
        {/* Textura suave */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.6),_transparent_55%)]" />
        </div>

        {/* Flechas laterales */}
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
          onClick={() =>
            setTargetSlide((visibleSlide + 1) % heroSlides.length)
          }
          className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/15 border border-white/30 text-white flex items-center justify-center hover:bg-white/25 transition-colors"
          aria-label="Slide siguiente"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div
          className="container mx-auto px-4 h-full flex flex-col items-center justify-center relative z-10 text-center transition-opacity duration-[1500ms] ease-in-out"
          style={{ opacity: heroOpacity }}
        >
          {/* Etiqueta superior */}
          <div className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/15 border border-white/10 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            <span className="text-[10px] font-semibold tracking-[0.22em] text-emerald-100 uppercase">
              {current.badge}
            </span>
          </div>

          <div className="mb-4">
            <Flame className="w-10 h-10 text-amber-300 mx-auto animate-pulse" />
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold text-white mb-2 leading-tight font-montserrat uppercase tracking-wide">
            {current.title}
          </h1>

          <p className="text-xs md:text-sm text-emerald-50/90 mb-6 max-w-2xl font-inter">
            {current.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={current.ctaTo}
              className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-[13px] font-semibold uppercase tracking-[0.18em] bg-gradient-to-r from-amber-500 to-red-500 text-white shadow-[0_14px_40px_rgba(0,0,0,0.45)] hover:shadow-[0_18px_55px_rgba(0,0,0,0.65)] transition-all"
            >
              <Flame className="w-4 h-4" />
              {current.ctaLabel}
            </Link>
          </div>

          {/* Indicador de partidos en vivo */}
          <div className="mt-5 inline-flex items-center gap-3 bg-black/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-white border border-white/10">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/90">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </span>
            <p className="flex items-center gap-1 text-[11px] md:text-xs">
              <span className="font-semibold">
                {liveMatches.length} partido{liveMatches.length !== 1 && "s"} en vivo ahora
              </span>
            </p>
          </div>

          {/* Indicadores del carrusel */}
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

      {/* Ongoing Tournaments Section - Región Común */}
      <section className="py-12 bg-linear-to-b from-white to-primary-50 border-t-4 border-secondary">        <div className="container mx-auto px-4">
          {/* Section Header - vista ejecutiva torneos */}
          <div className="mb-16 max-w-4xl">
            <div className="flex items-start gap-4">
              <div className="w-1.5 h-14 bg-linear-to-b from-primary to-primary/50 rounded-full shrink-0"></div>
              <div>
                <h2 className="text-4xl font-bold text-foreground leading-tight tracking-tight">
                  Torneos y olimpiadas UNAS
                </h2>
                <p className="text-base text-muted-foreground mt-3 font-medium max-w-2xl">
                  Vista general de los campeonatos inter escuelas profesionales. Muy
                  pronto: fixtures, llaves de campeonato y resultados en tiempo real.
                </p>
              </div>
            </div>
          </div>

          {/* Tournaments Grid - Similitud y Simetría */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {[
              {
                id: 1,
                slug: "interfacultades-2026",
                title: "INTERFACULTADES 2026",
                status: "Próximamente",
                description:
                  "Olimpiadas inter escuelas profesionales: fútbol, futsal, vóley y básquet — varones y mujeres. Fixtures y llaves de campeonato en desarrollo.",
                daysLeft: "—",
                totalTeams: 42,
                progress: 0,
                color: "primary",
              },
            ].map((tournament) => (
              <div
                key={tournament.id}
                className="bg-white rounded-3xl p-8 shadow-sm border border-border hover:shadow-xl transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      tournament.id === 1
                        ? "bg-amber-100 text-amber-700"
                        : "bg-accent-100 text-accent"
                    }`}
                  >
                    {tournament.status}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">
                      {tournament.daysLeft}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">
                      En desarrollo
                    </p>
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {tournament.title}
                </h3>
                <p className="text-muted-foreground mb-8 line-clamp-2">
                  {tournament.description}
                </p>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-bold text-foreground">
                        Lo que vendrá
                      </span>
                      <span className="text-muted-foreground">
                        Fixtures · Llaves
                      </span>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-muted transition-all duration-1000"
                        style={{ width: "0%" }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border mb-6">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-muted-foreground" />
                      <span className="font-bold">
                        {tournament.totalTeams} Facultades
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/torneos"
                    className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Users className="w-4 h-4" />
                    Ver torneos (en desarrollo)
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/torneos"
              className="text-primary hover:text-primary-700 font-bold text-lg flex items-center gap-2 mx-auto w-fit"
            >
              Ver torneos (en desarrollo) →
            </Link>
          </div>
        </div>
      </section>

      {/* Live Matches Section - Región Común y Similitud */}
      <section className="py-20 bg-linear-to-b from-white via-white to-primary-50 border-t-4 border-secondary">
        <div className="container mx-auto px-4">
          {/* Section Header - Partidos hoy */}
          <div className="mb-16 max-w-4xl">
            <div className="flex items-start gap-4">
              <div className="w-1.5 h-14 bg-linear-to-b from-secondary to-secondary/50 rounded-full shrink-0"></div>
              <div>
                <h2 className="text-4xl font-bold text-foreground leading-tight tracking-tight">
                  Partidos Hoy
                </h2>
                <p className="text-base text-muted-foreground mt-3 font-medium max-w-2xl">
                  Módulo de marcadores en tiempo real. Mientras lo terminamos, puedes
                  explorar la experiencia visual de un encuentro en vivo.
                </p>
              </div>
            </div>
          </div>

          {/* Matches Grid - Similitud de estilo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {liveMatches.slice(0, 2).map((match) => (
              <div
                key={match.id}
                className="group flex flex-col h-full bg-white border-2 border-secondary rounded-2xl overflow-hidden hover:shadow-2xl hover:border-secondary/80 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Live Badge - Figura-Fondo claro */}
                <div className="bg-linear-to-r from-destructive via-destructive to-red-600 px-6 py-4 flex items-center justify-between text-white border-b-4 border-destructive/40">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-block w-3 h-3 bg-white rounded-full animate-pulse"></span>
                    <span className="font-bold text-sm tracking-wide">EN VIVO</span>
                  </div>
                  <span className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-full">{match.sport}</span>
                </div>

                {/* Score Section - Simetría y Continuidad */}
                <div className="flex-1 p-8 text-center flex flex-col justify-center">
                  <div className="grid grid-cols-3 gap-4 items-center mb-6">
                    {/* Home Team */}
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-foreground/80 uppercase tracking-tight">
                        {match.home}
                      </p>
                      <p className="text-5xl font-black text-primary">
                        {match.homeScore}
                      </p>
                    </div>

                    {/* Separator - Conectividad visual */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-1 h-12 bg-linear-to-b from-primary via-primary to-transparent rounded-full"></div>
                      <span className="text-2xl font-light text-muted-foreground/40 mt-1">-</span>
                    </div>

                    {/* Away Team */}
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-foreground/80 uppercase tracking-tight">
                        {match.away}
                      </p>
                      <p className="text-5xl font-black text-secondary">
                        {match.awayScore}
                      </p>
                    </div>
                  </div>

                  {/* Match Info - Región Común */}
                  <div className="border-t-2 border-dashed border-primary/20 pt-4 mt-4 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      📍 {match.location}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {match.time}
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="px-6 pb-6">
                  <Link
                    to={`/partidos/${match.id}`}
                    className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Play className="w-4 h-4" />
                    VER DETALLES
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/partidos"
              className="text-primary hover:text-primary-700 font-bold text-lg flex items-center gap-2 mx-auto w-fit"
            >
              Ver todos los partidos →
            </Link>
          </div>
        </div>
      </section>

      {/* Latest News Section - Región Común y Similitud */}
      <section className="py-20 bg-white border-t-4 border-accent">
        <div className="container mx-auto px-4">
          {/* Section Header - Noticias */}
          <div className="mb-16 max-w-4xl">
            <div className="flex items-start gap-4">
              <div className="w-1.5 h-14 bg-linear-to-b from-accent to-accent/50 rounded-full shrink-0"></div>
              <div>
                <h2 className="text-4xl font-bold text-foreground leading-tight tracking-tight">
                  Últimas Noticias
                </h2>
                <p className="text-base text-muted-foreground mt-3 font-medium max-w-2xl">
                  Resumen ejecutivo de lo más relevante de las jornadas deportivas:
                  resultados clave, crónicas y contenido destacado.
                </p>
              </div>
            </div>
          </div>

          {/* News Grid - Similitud de estilos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              {
                id: 1,
                title: "Interfacultades 2026 Comienza con Emoción",
                category: "Noticias",
                date: "Hoy",
                image: "bg-[linear-gradient(to_bottom_right,var(--tw-gradient-stops))] from-green-500 to-green-600",
              },
            ].map((news) => (
              <div
                key={news.id}
                className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-xl transition-all"
              >
                <div className={`h-32 ${news.image}`}></div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-bold text-primary bg-primary-100 px-3 py-1 rounded-full">
                      {news.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {news.date}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-4 line-clamp-2">
                    {news.title}
                  </h3>
                  <Link
                    to="/noticias"
                    className="block w-full py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary-700 transition-colors text-sm text-center"
                  >
                    Ver noticias
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/noticias"
              className="text-primary hover:text-primary-700 font-bold text-lg flex items-center gap-2 mx-auto w-fit"
            >
              Ver todas las noticias →
            </Link>
          </div>
        </div>
      </section>

      {/* Sports Categories Information - Similitud y Simetría */}
      <section className="py-20 bg-linear-to-b from-primary-50 to-white border-t-4 border-primary/20" id="disciplines">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="mb-16 max-w-3xl">
            <div className="flex items-start gap-4">
              <div className="w-1.5 h-14 bg-linear-to-b from-primary to-primary/50 rounded-full shrink-0"></div>
              <div>
                <h2 className="text-4xl font-bold text-foreground leading-tight">
                  Disciplinas Deportivas
                </h2>
                <p className="text-base text-muted-foreground mt-3 font-medium max-w-2xl">
                  En SIGED podrás encontrar información completa sobre todas las
                  disciplinas deportivas que participan en Interfacultades y
                  Cachimbos.
                </p>
              </div>
            </div>
          </div>

          {/* Disciplines Grid - Similitud uniforme */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {sports.map((sport) => {
              return (
                <div
                  key={sport.name}
                  className="group flex flex-col h-full bg-white rounded-2xl border-2 border-border hover:border-primary/50 p-8 text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Icon area */}
                  <div className="mb-4 h-12 flex items-center justify-center text-2xl">
                    {sport.name === "Fútbol" && "⚽"}
                    {sport.name === "Vóley" && "🏐"}
                    {sport.name === "Básquet" && "🏀"}
                    {sport.name === "Futsal" && "🏃"}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {sport.name}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm mb-6 flex-1">
                    {sportDescriptions[sport.name] ||
                      "Información de este deporte disponible en la plataforma."}
                  </p>

                  {/* Footer separator */}
                  <div className="w-12 h-1 bg-linear-to-r from-transparent via-primary/30 to-transparent rounded-full mx-auto mb-4"></div>

                  {/* CTA */}
                  <Link
                    to={sport.href}
                    className="text-xs text-primary font-bold uppercase tracking-wide hover:underline"
                  >
                    Ver en torneos
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

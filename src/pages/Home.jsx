import React from "react";
import { Link } from "react-router-dom";
import { Play, Users, Flame } from "lucide-react";

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
    href: "/deportes/futbol",
    color: "from-green-500 to-green-600",
  },
  {
    name: "Vóley",
    href: "/deportes/voley",
    color: "from-yellow-500 to-yellow-600",
  },
  {
    name: "Básquet",
    href: "/deportes/basquet",
    color: "from-orange-500 to-orange-600",
  },
  {
    name: "Futsal",
    href: "/deportes/futsal",
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

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative h-[55vh] md:h-[60vh] bg-linear-to-r from-primary via-secondary to-primary overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2240%22 fill=%22none%22 stroke=%22white%22 stroke-width=%220.5%22 opacity=%220.1%22/></svg>')] bg-repeat"></div>
        </div>

        <div className="container mx-auto px-4 h-full flex flex-col items-center justify-center relative z-10 text-center">          <div className="mb-6 animate-pulse-live">
            <div className="mb-2 animate-pulse-live">
                <Flame className="w-12 h-12 text-accent mx-auto animate-pulse" />
            </div>

          {/* Reducimos tamaño de fuente y margen inferior */}
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight font-montserrat uppercase">
            Pasión Deportiva UNAS
          </h1>

          <p className="text-sm md:text-base text-white/90 mb-6 max-w-2xl font-inter">
            Gestión integral de olimpiadas Cachimbos e Interfacultades.
            <br />
            Resultados en vivo, estadísticas actualizadas y toda la emoción del
            deporte universitario.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">            <Link
              to="/torneos?tab=activos"
              className="group relative px-6 py-3 bg-destructive text-white rounded-lg font-bold text-base hover:shadow-xl transition-all overflow-hidden"            >
              <span className="relative z-10 flex items-center justify-center gap-2">                <Flame className="w-5 h-5" />
                VER TORNEOS ACTIVOS
              </span>
              <div className="absolute inset-0 bg-destructive/80 group-hover:opacity-0 transition-opacity"></div>
            </Link>
          </div>

          {/* Indicador de partidos vivos más discreto */}
          <div className="mt-6 inline-block bg-white/10 backdrop-blur-xs rounded-full px-4 py-2 text-white border border-white/20">
            <p className="flex items-center gap-2 text-xs md:text-sm">
              <span className="inline-block w-2 h-2 bg-destructive rounded-full animate-pulse-live"></span>
              <span className="font-medium">
                {liveMatches.length} partidos en vivo ahora
              </span>
            </p>
          </div>
        </div>
        </div>
      </section>

      {/* Ongoing Tournaments Section - Región Común */}
      <section className="py-12 bg-linear-to-b from-white to-primary-50 border-t-4 border-secondary">        <div className="container mx-auto px-4">
          {/* Section Header - Proximidad y Continuidad */}
          <div className="mb-16 max-w-3xl">
            <div className="flex items-start gap-4">
              <div className="w-1.5 h-14 bg-linear-to-b from-primary to-primary/50 rounded-full shrink-0"></div>
              <div>
                <h2 className="text-4xl font-bold text-foreground leading-tight">
                  Torneos en Curso
                </h2>
                <p className="text-base text-muted-foreground mt-3 font-medium">
                  Competencias actuales en las que puedes participar
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
                status: "En Progreso",
                description:
                  "La competencia deportiva más importante de la UNAS. Todas las facultades compitiendo por la gloria.",
                daysLeft: 18,
                totalTeams: 42,
                progress: 65,
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
                        ? "bg-primary-100 text-primary"
                        : "bg-accent-100 text-accent"
                    }`}
                  >
                    {tournament.status}
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-foreground">
                      Faltan {tournament.daysLeft}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">
                      Días para la final
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
                        Progreso del Torneo
                      </span>
                      <span className="text-muted-foreground">
                        {tournament.progress}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          tournament.id === 1 ? "bg-primary" : "bg-accent"
                        }`}
                        style={{ width: `${tournament.progress}%` }}
                      ></div>
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
                    to={`/torneo/${tournament.slug}`}
                    className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Users className="w-4 h-4" />
                    VER DETALLES
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/torneos?tab=activos"
              className="text-primary hover:text-primary-700 font-bold text-lg flex items-center gap-2 mx-auto w-fit"
            >
              Ver todos los torneos →
            </Link>
          </div>
        </div>
      </section>

      {/* Live Matches Section - Región Común y Similitud */}
      <section className="py-20 bg-linear-to-b from-white via-white to-primary-50 border-t-4 border-secondary">
        <div className="container mx-auto px-4">
          {/* Section Header - Proximidad y Continuidad */}
          <div className="mb-16 max-w-3xl">
            <div className="flex items-start gap-4">
              <div className="w-1.5 h-14 bg-linear-to-b from-secondary to-secondary/50 rounded-full shrink-0"></div>
              <div>
                <h2 className="text-4xl font-bold text-foreground leading-tight">
                  Partidos Hoy
                </h2>
                <p className="text-base text-muted-foreground mt-3 font-medium">
                  Sigue los encuentros de hoy en vivo
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
          {/* Section Header */}
          <div className="mb-16 max-w-3xl">
            <div className="flex items-start gap-4">
              <div className="w-1.5 h-14 bg-linear-to-b from-accent to-accent/50 rounded-full shrink-0"></div>
              <div>
                <h2 className="text-4xl font-bold text-foreground leading-tight">
                  Últimas Noticias
                </h2>
                <p className="text-base text-muted-foreground mt-3 font-medium">
                  Mantente informado de los eventos más importantes
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
                  <button className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary-700 transition-colors text-sm">
                    VER DETALLES
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <button className="text-primary hover:text-primary-700 font-bold text-lg flex items-center gap-2 mx-auto w-fit">
              Ver todas las noticias →
            </button>
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
                  <p className="text-xs text-primary font-bold uppercase tracking-wide">
                    Ver disciplinas
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

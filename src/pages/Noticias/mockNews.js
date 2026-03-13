// estados posibles: "borrador" | "publicada" | "archivada"
export const mockNews = [
  {
    id: "1",
    titulo: "Agronomía se corona campeón de Fútbol Interfacultades 2026",
    slug: "agronomia-campeon-futbol-2026",
    categoria: "resultados",
    extracto:
      "En una emocionante final, Agronomía venció a Ingeniería 3-2 en el torneo Interfacultades 2026. Una jornada histórica para la facultad.",
    contenido:
      "En una emocionante final disputada en el Estadio UNAS, la facultad de Agronomía se coronó como campeona del torneo Interfacultades 2026 de fútbol. Con una actuación brillante y un juego ofensivo impecable, Agronomía derrotó a Ingeniería 3-2 en los últimos minutos del encuentro.\n\nEl gol decisivo llegó en el minuto 87, cortando un apasionante enfrentamiento que mantuvo en vilo a todos los aficionados. Agronomía demostró ser el equipo más consistente a lo largo del torneo.",
    imagenPrincipal:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=675&fit=crop",
    galeria: [
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&h=300&fit=crop",
    ],
    autor: "Admin SIGED",
    fechaPublicacion: "2026-02-07T15:30:00",
    vistas: 1250,
    destacada: true,
    etiquetas: ["Fútbol", "Interfacultades", "Agronomía", "Final"],
    olimpiada: "Interfacultades 2026",
    disciplina: "Fútbol",
    equipos: ["Agronomía", "Ingeniería"],
    estado: "borrador",
    tiempoLectura: 3,
  },
  {
    id: "2",
    titulo: "Juan Pérez alcanza 15 goles y lidera tabla de goleadores",
    slug: "juan-perez-15-goles-goleador",
    categoria: "jugadores",
    extracto:
      "El delantero Juan Pérez de Agronomía ha establecido un nuevo récord personal al alcanzar 15 goles en el torneo actual.",
    contenido:
      "Juan Pérez, destacado delantero de la facultad de Agronomía, ha alcanzado la cifra de 15 goles en lo que va del torneo Interfacultades 2026, consolidándose como el máximo goleador de la competencia.\n\nCon un promedio de casi un gol por partido, Pérez ha demostrado ser una pieza clave en el ataque agronomista. Su técnica, velocidad y capacidad de definición lo han convertido en una pesadilla para las defensas rivales.",
    imagenPrincipal:
      "https://images.unsplash.com/photo-1552109067-e59ff1a88da5?w=1200&h=675&fit=crop",
    galeria: [],
    autor: "Admin SIGED",
    fechaPublicacion: "2026-02-06T10:15:00",
    vistas: 890,
    destacada: true,
    etiquetas: ["Goles", "Agronomía", "Delantero", "Tabla de goleadores"],
    disciplina: "Fútbol",
    jugadores: ["Juan Pérez"],
    estado: "archivada",
    tiempoLectura: 2,
  },
  {
    id: "3",
    titulo: "Enfermería destaca en Vóley con juego colectivo impecable",
    slug: "enfermeria-voley-juego-colectivo",
    categoria: "equipos",
    extracto:
      "El equipo de Vóley de Enfermería ha demostrado un nivel excepcional con un juego coordinado y estratégico en las últimas jornadas.",
    contenido:
      "El equipo de Vóley femenino de la facultad de Enfermería continúa impresionando con su desempeño en el torneo Interfacultades. Su característica principal es el excelente trabajo en equipo y la coordinación defensiva.\n\nCon un récord invicto en los últimos 8 encuentros, Enfermería se perfila como una seria candidata para disputar la final del torneo.",
    imagenPrincipal:
      "https://images.unsplash.com/photo-1624526267942-ab67cb38121d?w=1200&h=675&fit=crop",
    galeria: [],
    autor: "Admin SIGED",
    fechaPublicacion: "2026-02-05T14:45:00",
    vistas: 650,
    destacada: false,
    etiquetas: ["Vóley", "Enfermería", "Equipo", "Interfacultades"],
    disciplina: "Vóley",
    equipos: ["Enfermería"],
    estado: "publicada",
    tiempoLectura: 2,
  },
  {
    id: "4",
    titulo: "Últimas 48 horas para inscribirse a Cachimbos 2026",
    slug: "inscripcion-cachimbos-2026-deadline",
    categoria: "convocatorias",
    extracto:
      "Quedan solo 2 días para que los estudiantes de primer año se inscriban en las diferentes disciplinas de Cachimbos 2026.",
    contenido:
      "La Comisión Organizadora del evento deportivo más importante para estudiantes de primer año recuerda que el plazo de inscripción vence el 9 de febrero de 2026.\n\nLos estudiantes interesados deben completar el formulario en el portal SIGED e indicar las disciplinas en las que desean participar. No hay límite de estudiantes por facultad.",
    imagenPrincipal:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=675&fit=crop",
    galeria: [],
    autor: "Comité Organizador",
    fechaPublicacion: "2026-02-07T09:00:00",
    vistas: 450,
    destacada: true,
    etiquetas: ["Cachimbos", "Inscripción", "Primer año", "Evento"],
    olimpiada: "Cachimbos 2026",
    estado: "publicada",
    tiempoLectura: 2,
  },
  {
    id: "5",
    titulo: "UNAS inaugura nuevas instalaciones deportivas de clase mundial",
    slug: "unas-inaugura-nuevas-instalaciones-deportivas",
    categoria: "institucional",
    extracto:
      "La universidad inaugura hoy nuevas canchas de entrenamiento, gimnasio equipado y piscina olímpica para potenciar el deporte universitario.",
    contenido:
      "En una ceremonia oficial, la Rectoría de la Universidad Nacional Agraria de la Selva inauguró las nuevas instalaciones deportivas que elevarán significativamente la calidad de entrenamiento de nuestros atletas.\n\nLas nuevas instalaciones incluyen canchas de última generación, gimnasio totalmente equipado y una piscina olímpica que cumple con estándares internacionales.",
    imagenPrincipal:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=675&fit=crop",
    galeria: [],
    autor: "Oficina de Comunicaciones",
    fechaPublicacion: "2026-02-04T11:30:00",
    vistas: 1100,
    destacada: false,
    etiquetas: ["UNAS", "Instalaciones", "Deporte", "Infraestructura"],
    estado: "publicada",
    tiempoLectura: 3,
  },
  {
    id: "6",
    titulo: "Resumen Jornada 12: Grandes sorpresas y giros inesperados",
    slug: "resumen-jornada-12-interfacultades",
    categoria: "resultados",
    extracto:
      "Revive los momentos más emocionantes de la jornada 12 del torneo Interfacultades con resultados sorprendentes en todas las disciplinas.",
    contenido:
      "La jornada 12 del torneo Interfacultades 2026 fue una jornada de grandes sorpresas. Forestales sorprendió derrotando a Zootecnia en voleibol, mientras que en fútbol se jugó un emocionante empate que mantiene abierta la carrera por el título.",
    imagenPrincipal:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=675&fit=crop",
    galeria: [],
    autor: "Admin SIGED",
    fechaPublicacion: "2026-02-03T16:20:00",
    vistas: 520,
    destacada: false,
    etiquetas: ["Jornada 12", "Resultados", "Sorpresas", "Interfacultades"],
    olimpiada: "Interfacultades 2026",
    estado: "publicada",
    tiempoLectura: 4,
  },
  {
    id: "7",
    titulo: "María García rompe récord histórico en Vóley",
    slug: "maria-garcia-record-voley",
    categoria: "jugadores",
    extracto:
      "La levantadora María García estableció un nuevo récord de asistencias en una sola temporada del torneo Interfacultades.",
    contenido:
      "María García, destacada levantadora de Enfermería, ha alcanzado las 150 asistencias en lo que va de la temporada, superando el récord anterior que databa de hace 5 años.\n\nSu precisión, visión de juego y coordinación con sus compañeras la han convertido en el motor del ataque enfermista.",
    imagenPrincipal:
      "https://images.unsplash.com/photo-1624526267942-ab67cb38121d?w=1200&h=675&fit=crop",
    galeria: [],
    autor: "Admin SIGED",
    fechaPublicacion: "2026-02-02T13:00:00",
    vistas: 780,
    destacada: false,
    etiquetas: ["Vóley", "Récord", "Levantadora", "Enfermería"],
    disciplina: "Vóley",
    jugadores: ["María García"],
    estado: "publicada",
    tiempoLectura: 2,
  },
  {
    id: "8",
    titulo: "Ingeniería busca su primer título en Básquet",
    slug: "ingenieria-primer-titulo-basquet",
    categoria: "equipos",
    extracto:
      "El equipo de Básquet de Ingeniería se encuentra en su mejor momento en el torneo y apunta a conquistar su primer título histórico.",
    contenido:
      "Después de años de participación, Ingeniería finalmente tiene las credenciales para pelear por el título en Básquet. Con una defensa sofocante y un ataque fluido, el equipo ingenieril se ha consolidado como uno de los favoritos.",
    imagenPrincipal:
      "https://images.unsplash.com/photo-1546519638-68711109d298?w=1200&h=675&fit=crop",
    galeria: [],
    autor: "Admin SIGED",
    fechaPublicacion: "2026-02-01T10:30:00",
    vistas: 670,
    destacada: false,
    etiquetas: ["Básquet", "Ingeniería", "Título", "Interfacultades"],
    disciplina: "Básquet",
    equipos: ["Ingeniería"],
    estado: "publicada",
    tiempoLectura: 2,
  },
  {
    id: "9",
    titulo:
      "Cambios en calendario de Interfacultades por condiciones climáticas",
    slug: "cambios-calendario-interfacultades-clima",
    categoria: "convocatorias",
    extracto:
      "Debido a pronósticos de lluvia, la Comisión Organizadora ha pospuesto dos jornadas del torneo Interfacultades.",
    contenido:
      "Por condiciones climáticas adversas pronosticadas para la próxima semana, la Comisión Organizadora ha decidido reprogramar las jornadas 13 y 14 del torneo Interfacultades para las semanas del 17 y 24 de febrero respectivamente.",
    imagenPrincipal:
      "https://images.unsplash.com/photo-1505228395891-9a51e7e86e81?w=1200&h=675&fit=crop",
    galeria: [],
    autor: "Comité Organizador",
    fechaPublicacion: "2026-02-01T08:00:00",
    vistas: 380,
    destacada: false,
    etiquetas: ["Calendario", "Interfacultades", "Clima", "Reprogramación"],
    olimpiada: "Interfacultades 2026",
    estado: "publicada",
    tiempoLectura: 2,
  },
  {
    id: "10",
    titulo: "Entrevista exclusiva: El delegado más exitoso de UNAS",
    slug: "entrevista-delegado-exitoso-unas",
    categoria: "institucional",
    extracto:
      "Conoce la historia de éxito del delegado de deportes con el mejor récord en la historia de los torneos universitarios.",
    contenido:
      "En esta entrevista exclusiva, hablamos con Luis Fernández, delegado de deportes de la facultad de Agronomía, quien ha llevado a su facultad a un nivel nunca antes visto en la competencia deportiva universitaria.\n\nSus estrategias, dedicación y visión han transformado completamente el programa deportivo agronomista en los últimos años.",
    imagenPrincipal:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=675&fit=crop",
    galeria: [],
    autor: "Redacción SIGED",
    fechaPublicacion: "2026-01-30T14:15:00",
    vistas: 920,
    destacada: false,
    etiquetas: ["Entrevista", "Delegado", "Agronomía", "Éxito"],
    estado: "publicada",
    tiempoLectura: 5,
  },
];

export const getCategoryLabel = (categoria) => {
  const labels = {
    resultados: "Resultados",
    jugadores: "Jugadores",
    equipos: "Equipos",
    convocatorias: "Convocatorias",
    institucional: "Institucional",
  };
  return labels[categoria];
};

export const getCategoryBadgeColor = (categoria) => {
  const colors = {
    resultados: "bg-yellow-100 text-yellow-700 border-yellow-200",
    jugadores: "bg-blue-100 text-blue-700 border-blue-200",
    equipos: "bg-green-100 text-green-700 border-green-200",
    convocatorias: "bg-red-100 text-red-700 border-red-200",
    institucional: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return colors[categoria];
};

export const getCategoryEmoji = (categoria) => {
  const emojis = {
    resultados: "🏆",
    jugadores: "⭐",
    equipos: "👥",
    convocatorias: "📢",
    institucional: "🎯",
  };
  return emojis[categoria];
};


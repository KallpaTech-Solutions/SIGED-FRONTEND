const normalizeToString = (value) =>
  value === null || value === undefined ? "" : String(value);

const normalizeCategoria = (categoria) => {
  if (categoria === null || categoria === undefined) return null;
  if (typeof categoria === "number") return categoria;

  const raw = normalizeToString(categoria).trim();
  if (!raw) return null;

  // Si llega como string de número (e.g. "0")
  if (/^\d+$/.test(raw)) return Number(raw);

  // Normalizamos texto: quitar acentos y lower-case
  const noAccents = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return noAccents.toLowerCase();
};

// Orden del enum en backend:
// Institucional=0, Academia=1, Deportes=2, Investigacion=3, Cultura=4, Convocatorias=5, Bienestar=6
const CATEGORIAS_META = {
  0: {
    label: "Institucional",
    emoji: "🎯",
    badge: "bg-gray-100 text-gray-800 border-gray-200",
  },
  1: {
    label: "Academia",
    emoji: "⭐",
    badge: "bg-sky-100 text-sky-800 border-sky-200",
  },
  2: {
    label: "Deportes",
    emoji: "🏆",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  3: {
    label: "Investigación",
    emoji: "🔬",
    badge: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  4: {
    label: "Cultura",
    emoji: "🎭",
    badge: "bg-orange-100 text-orange-800 border-orange-200",
  },
  5: {
    label: "Convocatorias",
    emoji: "📢",
    badge: "bg-red-100 text-red-800 border-red-200",
  },
  6: {
    label: "Bienestar",
    emoji: "❤️",
    badge: "bg-lime-100 text-lime-800 border-lime-200",
  },
};

export const getCategoryId = (categoria) => {
  const norm = normalizeCategoria(categoria);
  if (norm === null || norm === undefined) return null;

  if (typeof norm === "number") {
    return Number.isFinite(norm) ? norm : null;
  }

  // norm string lower-case sin acentos
  const alias = {
    institucional: 0,
    academia: 1,
    deportes: 2,
    investigacion: 3,
    cultura: 4,
    convocatorias: 5,
    bienestar: 6,

    // Compatibilidad strings viejos (si existieran registros antiguos)
    resultados: 2,
    jugadores: 2,
    equipos: 2,
  };

  return alias[norm] ?? null;
};

const getMeta = (categoria) => {
  const id = getCategoryId(categoria);
  if (id === null) return null;
  return CATEGORIAS_META[id] || null;
};

export const getCategoryLabel = (categoria) => {
  const meta = getMeta(categoria);
  return meta?.label ?? "";
};

export const getCategoryEmoji = (categoria) => {
  const meta = getMeta(categoria);
  return meta?.emoji ?? "";
};

export const getCategoryBadgeColor = (categoria) => {
  const meta = getMeta(categoria);
  return meta?.badge ?? "bg-slate-100 text-slate-700 border-slate-200";
};


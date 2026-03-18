import api from "./axiosConfig";

function mapStatusFromApi(rawStatus) {
  if (rawStatus === null || rawStatus === undefined) return "borrador";

  // Caso 1: backend envía número (0,1,2)
  if (typeof rawStatus === "number") {
    if (rawStatus === 1) return "publicada";
    if (rawStatus === 2) return "archivada";
    return "borrador";
  }

  // Caso 2: backend envía string del enum (Draft/Published/Archived)
  const value = String(rawStatus).toLowerCase();
  if (value.includes("publish")) return "publicada";
  if (value.includes("archiv")) return "archivada";
  return "borrador";
}

function mapStatusToApi(statusText) {
  if (statusText === "publicada") return 1;
  if (statusText === "archivada") return 2;
  return 0; // borrador
}

function mapCategoriaToApi(categoria) {
  if (categoria === null || categoria === undefined) return null;
  if (typeof categoria === "number") return categoria;
  const raw = String(categoria).trim();
  if (!raw) return null;

  // Si llega como "0".."6"
  if (/^\d+$/.test(raw)) return Number(raw);

  // Si llega como nombre del enum (ej. "Deportes")
  const noAccents = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const alias = {
    institucional: 0,
    academia: 1,
    deportes: 2,
    investigacion: 3,
    cultura: 4,
    convocatorias: 5,
    bienestar: 6,

    // Compatibilidad con strings viejos del front
    resultados: 2,
    jugadores: 2,
    equipos: 2,
  };

  return alias[noAccents] ?? null;
}

function mapFromApi(apiItem) {
  if (!apiItem) return null;

  const tagsArray =
    typeof apiItem.tags === "string"
      ? apiItem.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : Array.isArray(apiItem.tags)
      ? apiItem.tags
      : [];

  const media =
    apiItem.media && Array.isArray(apiItem.media) && apiItem.media.length > 0
      ? apiItem.media.map((m) => m.url)
      : apiItem.mediaUrls && apiItem.mediaUrls.length > 0
      ? apiItem.mediaUrls
      : [];

  return {
    // El backend expone el DTO con propiedades PascalCase (Id, Slug, etc.)
    // según cómo esté configurado el serializer, pueden llegar como `id`/`Id`.
    id: apiItem.id ?? apiItem.Id,
    slug:
      apiItem.slug ??
      apiItem.Slug ??
      apiItem.id ??
      apiItem.Id,
    // Mantener compatibilidad con distintos nombres de propiedades (EN/ES) y defaults seguros
    titulo:
      apiItem.title ??
      apiItem.Title ??
      apiItem.titulo ??
      apiItem.Titulo ??
      "",
    extracto:
      apiItem.excerpt ??
      apiItem.Excerpt ??
      apiItem.extracto ??
      apiItem.Extracto ??
      "",
    contenido:
      apiItem.content ??
      apiItem.Content ??
      apiItem.contenido ??
      apiItem.Contenido ??
      "",
    categoria:
      apiItem.category ??
      apiItem.Category ??
      apiItem.categoria ??
      apiItem.Categoria ??
      null,
    etiquetas: tagsArray,
    destacada: Boolean(apiItem.isFeatured ?? apiItem.IsFeatured),
    permitirComentarios:
      apiItem.allowComments === undefined
        ? apiItem.AllowComments ?? true
        : apiItem.allowComments,
    permitirReacciones:
      apiItem.allowReactions === undefined
        ? apiItem.AllowReactions ?? true
        : apiItem.allowReactions,
    estado: mapStatusFromApi(apiItem.status ?? apiItem.Status),
    imagenPrincipal:
      media[0] ||
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=675&fit=crop",
    mediaUrls: media,
    fechaPublicacion:
      apiItem.publishedAt ||
      apiItem.PublishedAt ||
      apiItem.createdAt ||
      apiItem.CreatedAt ||
      apiItem.updatedAt ||
      apiItem.UpdatedAt ||
      new Date().toISOString(),
    vistas: apiItem.viewCount ?? apiItem.ViewCount ?? apiItem.vistas ?? apiItem.Vistas ?? 0,
    autor: apiItem.author ?? apiItem.Author ?? apiItem.autor ?? apiItem.Autor ?? "SIGED",
  };
}

function mapToApi(model) {
  const tags =
    Array.isArray(model.etiquetas) && model.etiquetas.length > 0
      ? model.etiquetas.join(", ")
      : typeof model.etiquetas === "string"
      ? model.etiquetas
      : "";

  const media =
    model.mediaUrls && model.mediaUrls.length
      ? model.mediaUrls
      : model.imagenPrincipal
      ? [model.imagenPrincipal]
      : [];

  return {
    title: model.titulo,
    excerpt: model.extracto,
    content: model.contenido,
    category: mapCategoriaToApi(model.categoria),
    tags,
    isFeatured: Boolean(model.destacada),
    allowComments:
      model.permitirComentarios === undefined
        ? true
        : Boolean(model.permitirComentarios),
    allowReactions:
      model.permitirReacciones === undefined
        ? true
        : Boolean(model.permitirReacciones),
    status: mapStatusToApi(model.estado),
    mediaUrls: media,
  };
}

// --- FEED PÚBLICO -----------------------------------------------------------

export async function fetchNoticiasFeed() {
  const { data } = await api.get("/News/feed");
  return Array.isArray(data) ? data.map(mapFromApi) : [];
}

export async function fetchNoticiaBySlug(slug) {
  const { data } = await api.get(`/News/${slug}`);
  return mapFromApi(data);
}

// --- ADMIN ------------------------------------------------------------------

export async function fetchNoticiasAdmin() {
  const { data } = await api.get("/News/admin");
  return Array.isArray(data) ? data.map(mapFromApi) : [];
}

export async function fetchNoticiaById(id) {
  const { data } = await api.get(`/News/${id}`);
  return mapFromApi(data);
}

export async function createNoticia(model) {
  const payload = mapToApi(model);
  const { data } = await api.post("/News", payload);
  return mapFromApi(data);
}

export async function updateNoticia(id, model) {
  const payload = mapToApi(model);
  const { data } = await api.put(`/News/${id}`, payload);
  // El backend devuelve la noticia actualizada (NewsResponseDto)
  return data ? mapFromApi(data) : { ...model };
}

export async function deleteNoticia(id) {
  await api.delete(`/News/${id}`);
}


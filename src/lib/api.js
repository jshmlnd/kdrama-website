export const API = 'https://kdramaapi.joshuaklein-malonda.workers.dev';

function request(path, { signal, timeout = 10000, base = API } = {}) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeout);
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', abort, { once: true });

  return fetch(`${base}${path}`, { signal: controller.signal })
    .then((response) => {
      if (!response.ok) throw new Error(`API ${response.status}`);
      return response.json();
    })
    .catch((error) => {
      if (timedOut) throw new Error('Request timed out');
      throw error;
    })
    .finally(() => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    });
}

function normalizeEpisode(episode) {
  return {
    id: episode?.id ?? episode?.episodeId ?? episode?.streamId ?? null,
    url: typeof episode?.url === 'string' ? episode.url : '',
    number: String(episode?.number ?? episode?.episode ?? ''),
  };
}

const cache = new Map();
// ponytail: session-lifetime cache, no invalidation — catalog/detail data is stable within a visit
function cached(key, load) {
  if (!cache.has(key)) cache.set(key, load().catch((error) => { cache.delete(key); throw error; }));
  return cache.get(key);
}

export function seasonFrom(name) {
  return String(name ?? '').match(/season[-\s]?(\d+)/i)?.[1] ?? '';
}

export function normalizeDrama(drama, fallbackSlug = '') {
  const genres = Array.isArray(drama?.genres)
    ? drama.genres.filter(Boolean).map(String)
    : Array.isArray(drama?.genre)
      ? drama.genre.filter(Boolean).map(String)
      : drama?.genre
        ? [String(drama.genre)]
        : [];

  return {
    slug: String(drama?.slug ?? drama?.id ?? fallbackSlug),
    title: String(drama?.title ?? drama?.name ?? 'Untitled drama'),
    year: drama?.year ? String(drama.year) : '',
    genres,
    status: drama?.status ?? '',
    image: drama?.thumbnail ?? drama?.image ?? drama?.cover ?? drama?.poster ?? '',
    synopsis: drama?.synopsis ?? drama?.description ?? '',
    network: drama?.network ?? '',
    country: drama?.country ?? '',
    episodes: Array.isArray(drama?.episodes)
      ? drama.episodes.map(normalizeEpisode).sort((a, b) => Number(a.number || Infinity) - Number(b.number || Infinity))
      : [],
  };
}

export function fetchCatalog() {
  return cached('catalog', async () => {
    const data = await request('/drama');
    const list = Array.isArray(data) ? data : data?.dramas;
    if (!Array.isArray(list)) throw new Error('Invalid catalog response');
    return list.map((drama) => normalizeDrama(drama)).filter((drama) => drama.slug && drama.title);
  });
}

export function fetchDrama(slug) {
  if (!slug) return null;
  return cached(`drama:${slug}`, async () => normalizeDrama(await request(`/drama/${encodeURIComponent(slug)}`), slug));
}

export function proxyStreamUrl(url) {
  return typeof url === 'string' && url ? `/api/stream?url=${encodeURIComponent(url)}` : null;
}

export async function fetchStream(epId, options) {
  if ((typeof epId !== 'string' && typeof epId !== 'number') || !String(epId).trim()) return null;
  const id = encodeURIComponent(String(epId));
  const data = await request(`/stream/${id}`, options);
  const rawSubtitles = Array.isArray(data?.subtitles)
    ? data.subtitles
    : await request(`/stream/${id}/subtitles`, options).then((result) => result?.subtitles).catch(() => []);
  const subtitles = Array.isArray(rawSubtitles)
    ? rawSubtitles.flatMap((subtitle) => {
      if (!subtitle?.url) return [];
      return [{ ...subtitle, lang: subtitle.lang || subtitle.language || 'en', url: `/api/stream?subtitle=${encodeURIComponent(subtitle.url)}` }];
    })
    : [];
  return typeof data?.url === 'string'
    ? { url: proxyStreamUrl(data.url), subtitles }
    : null;
}

export async function resolveEpisodeStream(episodeUrl, options) {
  if (typeof episodeUrl !== 'string' || !episodeUrl) return null;
  const data = await request(`/api/stream?episode=${encodeURIComponent(episodeUrl)}`, { ...options, base: '' });
  return typeof data?.url === 'string' ? { url: data.url, subtitles: Array.isArray(data.subtitles) ? data.subtitles : [] } : null;
}

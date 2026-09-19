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

export async function fetchCatalog(options) {
  const data = await request('/drama', options);
  const list = Array.isArray(data) ? data : data?.dramas;
  if (!Array.isArray(list)) throw new Error('Invalid catalog response');
  return list.map((drama) => normalizeDrama(drama)).filter((drama) => drama.slug && drama.title);
}

export async function fetchDrama(slug, options) {
  if (!slug) return null;
  return normalizeDrama(await request(`/drama/${encodeURIComponent(slug)}`, options), slug);
}

export function proxyStreamUrl(url) {
  return typeof url === 'string' && url ? url : null;
}

export async function fetchStream(epId, options) {
  if ((typeof epId !== 'string' && typeof epId !== 'number') || !String(epId).trim()) return null;
  const data = await request(`/stream/${encodeURIComponent(String(epId))}`, options);
  return typeof data?.url === 'string' ? proxyStreamUrl(data.url) : null;
}

export async function resolveEpisodeStream(episodeUrl, options) {
  if (typeof episodeUrl !== 'string' || !episodeUrl) return null;
  const data = await request(`/api/stream?episode=${encodeURIComponent(episodeUrl)}`, { ...options, base: '' });
  return typeof data?.url === 'string' ? { url: data.url, subtitles: Array.isArray(data.subtitles) ? data.subtitles : [] } : null;
}

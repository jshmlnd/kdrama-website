import { Readable } from 'node:stream';

const SOURCES = new Set(['myasiantv.com.lv']);
const PLAYER = new Set(['catalog.dramavibe.cfd', 'kisskh.casa']);
const MEDIA = new Set(['*.asiaflix.in', 'cdn.dramav2.xyz', 'cdn.drama3.click', 'storage.dramavibe.cfd', '*.cdnvideo11.shop', '*.streamingvideofaster1.site', '*.videocdndelivery05.site']);
const SUBTITLE_FALLBACK = new Set(['kdramaapi.joshuaklein-malonda.workers.dev']);
const SUBTITLE_SERVICE = new Set(['sub.cdnvideo11.shop', 'auto.cdnvideo11.shop']);
const RESOLVER = 'https://api.dramacool.rest/v1';
const WORKER = 'https://kdramaapi.joshuaklein-malonda.workers.dev';
const RESOLVER_HEADERS = { 'x-access-control': 'web', origin: 'https://kisskh.casa', referer: 'https://kisskh.casa/' };
const KISSKH_REFERRER = 'https://kisskh.casa/';
const USER_AGENT = 'Mozilla/5.0 (compatible; MeiDrama/1.0)';

function value(value) {
  return Array.isArray(value) ? value[0] : value;
}

function allowed(raw, hosts) {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:') return null;
    const match = hosts.has(url.hostname) || [...hosts].some((host) => host.startsWith('*.') && url.hostname.endsWith(host.slice(1)));
    return match ? url : null;
  } catch {
    return null;
  }
}

function proxyUrl(target, referrer, type = 'media') {
  const key = type === 'subtitle' ? 'subtitle' : 'url';
  return `/api/stream?${key}=${encodeURIComponent(target)}&ref=${encodeURIComponent(referrer)}`;
}

async function getJson(url, headers = {}) {
  const response = await fetch(url, { headers: { 'user-agent': USER_AGENT, ...headers } });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Upstream ${response.status}: ${body.slice(0, 120)}`);
  }
  return response.json();
}

async function resolverGet(path) {
  const attempt = (url) => getJson(url, RESOLVER_HEADERS);
  try {
    // Vercel's egress (and now Cloudflare's) gets CF-challenged by the
    // resolver; the worker passthrough is the route that answers. Detailed
    // error if both routes fail.
    return await attempt(`${WORKER}/resolver?src=${encodeURIComponent(`${RESOLVER}${path}`)}`);
  } catch (viaWorker) {
    try {
      return await attempt(`${RESOLVER}${path}`);
    } catch (direct) {
      throw new Error(`resolver failed ${path} (worker: ${viaWorker.cause?.code || viaWorker.message}; direct: ${direct.cause?.code || direct.message})`);
    }
  }
}

function resolverDetail(slug, number) {
  const core = slug.replace(/-20\d{2}$/i, '');
  const hasEpisode = (data) => data?.episodes?.some((episode) => String(episode.number) === number);
  let lastError = null;
  const detail = (candidate) => resolverGet(`/drama/detail?slug=${encodeURIComponent(candidate)}`).catch((e) => { lastError = e; return null; });

  return (async () => {
    for (const candidate of [...new Set([slug, core])]) {
      const data = await detail(candidate);
      if (hasEpisode(data)) return data;
    }
    const search = await resolverGet(`/drama/search?q=${encodeURIComponent(core.replace(/-/g, ' '))}&page=1`).catch((e) => { lastError = e; return null; });
    for (const item of Array.isArray(search?.body) ? search.body : []) {
      if (!item?.slug?.startsWith(core)) continue;
      const data = await detail(item.slug);
      if (hasEpisode(data)) return data;
    }
    if (lastError) throw lastError;
    return null;
  })();
}

function streamRequest(entry) {
  const source = String(entry?.source || '').toLowerCase();
  const url = String(entry?.url || '');
  const lower = url.toLowerCase();
  if (source === 'kisskh' && entry?.id) return { server: 'kisskh', value: String(entry.id) };
  if (source.includes('asiaflix')) return { server: source.split('-').pop(), value: url };
  if (['streamwish', 'vidhide', 'mixdrop', 'streamtape'].includes(source)) return { server: source, value: url };
  if (lower.includes('vidmoly')) return { server: 'vidmoly', value: url };
  if (lower.includes('dramacool.men')) return { server: 'dramacool.men', value: url };
  if (lower.includes('asianload.cfd')) return { server: 'asianload.cfd', value: url };
  if (lower.includes('vidbasic')) return { server: 'vidbasic', value: url };
  return null;
}

async function resolveEpisode(raw) {
  const source = allowed(raw, SOURCES);
  if (!source) throw new Error('Unsupported episode source');
  const match = source.pathname.replace(/^\/|\/$/g, '').match(/^(.+?)-episode-(\d+)$/);
  if (!match) throw new Error('Unsupported episode URL');
  const [, slug, number] = match;

  // myasiantv pages embed the kisskh id (data-video); the resolver API 403s
  // datacenter egress (Vercel and most worker egress get CF-challenged), so
  // scrape the id off the source page and skip the resolver entirely.
  // myasiantv intermittently serves a truncated shell and its player page
  // flakes too, so retry the whole kisskh path — one miss drops us onto the
  // resolver, which 403s and turns into a 502.
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    const page = await fetch(source.href, { headers: { 'user-agent': USER_AGENT } })
      .then((r) => (r.ok ? r.text() : ''))
      .catch(() => '');
    const pageKisskhId = page.match(/kisskh-player\.php\?ep=(\d+)/)?.[1];
    if (!pageKisskhId) continue;
    const result = await tryKisskh(pageKisskhId, source, slug, number);
    if (result) return result;
  }

  const detail = await resolverDetail(slug, number);
  if (!detail) throw new Error('Drama not found in resolver');
  const episode = detail.episodes.find((item) => String(item.number) === number);
  if (!episode?.streamUrls?.length) throw new Error('Episode has no stream sources');

  // kisskh's own stream is clean — the resolver's mxcontent/mixdrop rips burn
  // English captions into the pixels (frame-verified), which duplicates our
  // overlay; kisskh serves soft subs alongside, exposed by myasiantv's player
  const kisskhEntry = episode.streamUrls.find((entry) => entry?.source === 'kisskh' && entry?.id);
  if (kisskhEntry) {
    const result = await tryKisskh(kisskhEntry.id, source, slug, number);
    if (result) return result;
  }

  let media = '';
  let tracks = [];
  for (const entry of episode.streamUrls) {
    const request = streamRequest(entry);
    if (!request) continue;
    const url = `${RESOLVER}/drama/get-stream-url?value=${encodeURIComponent(Buffer.from(request.value).toString('base64'))}&server=${encodeURIComponent(request.server)}`;
    const data = await getJson(url, RESOLVER_HEADERS).catch(() => null);
    if (data?.sources?.[0]?.url) { media = data.sources[0].url; tracks = data.subtitles || []; break; }
  }
  if (!media) throw new Error('All stream sources failed');
  console.warn(`[stream] resolved ${source.pathname} via ${media.slice(0, 80)}`);

  // resolver media servers often return no tracks; the worker synthesizes an
  // English list from sub.cdnvideo11's <Kebab-Title>.Ep<N>_eng.srt[.txt] pattern
  // (verified live) on a host SUBTITLE_FALLBACK already allows
  let subtitles = tracks.flatMap((subtitle) => subtitle?.url
    ? [{ lang: subtitle.lang || subtitle.language || 'en', label: subtitle.label || 'EN', url: proxyUrl(subtitle.url, '', 'subtitle') }]
    : []);
  if (!subtitles.length) subtitles = await synthSubtitles(slug, number);

  return { url: proxyUrl(media, KISSKH_REFERRER), subtitles };
}

async function tryKisskh(id, source, slug, number) {
  const kisskh = await kisskhPlayer(id, source.href).catch(() => null);
  if (!kisskh?.media) return null;
  console.warn(`[stream] ${source.pathname} via kisskh ${id}`);
  return {
    url: proxyUrl(kisskh.media, KISSKH_REFERRER),
    subtitles: kisskh.subtitles.length ? kisskh.subtitles : await synthSubtitles(slug, number),
  };
}

async function kisskhPlayer(id, referer) {
  // myasiantv intermittently truncates this page under load (534-byte shell,
  // no vars) — retry rather than silently falling back to the hardsubbed rip
  for (let attempt = 0; attempt < 5; attempt++) {
    if (attempt) await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    const response = await fetch(`https://myasiantv.com.lv/wp-content/themes/alidramacool/kisskh-player.php?ep=${encodeURIComponent(id)}`, {
      headers: { 'user-agent': USER_AGENT, referer },
    }).catch(() => null);
    if (!response?.ok) continue;
    const html = await response.text();
    const media = html.match(/var src = "([^"]+)"/)?.[1]?.replace(/\\\//g, '/');
    if (!media) continue;
    let list = [];
    try { list = JSON.parse(html.match(/var subtitleList = (\[[^\n]+\]);/)?.[1] || '[]'); } catch {}
    const subtitles = list.flatMap((subtitle) => subtitle?.url
      ? [{ lang: subtitle.land || 'en', label: subtitle.label || 'EN', url: proxyUrl(`${WORKER}/kisskh/srt?src=${encodeURIComponent(subtitle.url)}`, '', 'subtitle') }]
      : []);
    return { media, subtitles };
  }
  return null;
}

async function synthSubtitles(slug, number) {
  try {
    const response = await fetch(`${WORKER}/kisskh/${slug}/${number}/subtitles`, {
      headers: { 'user-agent': USER_AGENT },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (Array.isArray(data?.subtitles) ? data.subtitles : []).flatMap((subtitle) => subtitle?.url
      ? [{ lang: subtitle.language || subtitle.lang || 'en', label: subtitle.label || 'EN', url: proxyUrl(subtitle.url, '', 'subtitle') }]
      : []);
  } catch {
    return [];
  }
}

function rewriteManifest(text, base, referrer) {
  return text.split(/(\r?\n)/).map((line) => {
    if (/^\r?\n$/.test(line)) return line;
    const match = line.match(/URI="([^"]+)"/);
    if (match) {
      const uri = new URL(match[1], base).href;
      return line.replace(match[1], proxyUrl(uri, referrer));
    }
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line;
    try {
      return line.replace(trimmed, proxyUrl(new URL(trimmed, base).href, referrer));
    } catch {
      return line;
    }
  }).join('');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });

  try {
    const episode = value(req.query?.episode);
    if (episode) return res.status(200).json(await resolveEpisode(episode));

    const subtitle = value(req.query?.subtitle);
    const raw = subtitle || value(req.query?.url);
    const target = allowed(raw, MEDIA) ?? allowed(raw, SUBTITLE_FALLBACK) ?? allowed(raw, SUBTITLE_SERVICE);
    const referrer = allowed(value(req.query?.ref) || KISSKH_REFERRER, PLAYER);
    if (!target || !referrer) return res.status(400).json({ error: 'invalid media URL' });

    const upstream = await fetch(target.href, {
      headers: {
        'user-agent': USER_AGENT,
        referer: referrer.href,
        origin: referrer.origin,
        ...(req.headers.range ? { range: req.headers.range } : {}),
      },
    });
    if (!upstream.ok) return res.status(upstream.status).send('upstream media error');

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=30');
    const type = upstream.headers.get('content-type') || 'application/octet-stream';
    if (subtitle) {
      const text = await upstream.text();
      const srt = /\d{2}:\d{2}:\d{2},\d{3} --> /.test(text) && !/^\s*WEBVTT/m.test(text);
      const vtt = srt
        ? `WEBVTT\n\n${text.replace(/\r/g, '').replace(/\{\\an\d+\}/g, '').replace(/^\d+\s*$/gm, '').replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')}`
        : text;
      res.setHeader('Content-Type', 'text/vtt');
      return res.status(200).send(vtt);
    }
    if (target.pathname.endsWith('.m3u8') || type.includes('mpegurl')) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      return res.status(200).send(rewriteManifest(await upstream.text(), target.href, referrer.href));
    }

    for (const name of ['content-range', 'content-length', 'accept-ranges']) {
      const header = upstream.headers.get(name);
      if (header) res.setHeader(name, header);
    }
    res.setHeader('Content-Type', type);
    res.status(upstream.status);
    const body = Readable.fromWeb(upstream.body);
    if (typeof res.stream === 'function') return res.stream(body);
    res.on('close', () => body.destroy());
    await new Promise((done) => { body.on('error', done); body.pipe(res).on('finish', done).on('close', done); });
    return res;
  } catch (error) {
    console.error('[stream]', error.message);
    return res.status(502).json({ error: error.message || 'stream unavailable' });
  }
}

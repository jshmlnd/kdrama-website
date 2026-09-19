const SOURCES = new Set(['myasiantv.com.lv']);
const PLAYER = new Set(['catalog.dramavibe.cfd']);
const MEDIA = new Set(['cdn.dramav2.xyz', 'cdn.drama3.click', 'storage.dramavibe.cfd']);
const SUBTITLE_API = new Set(['storage.dramavibe.cfd']);
const USER_AGENT = 'Mozilla/5.0 (compatible; MeiDrama/1.0)';

function value(value) {
  return Array.isArray(value) ? value[0] : value;
}

function allowed(raw, hosts) {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && hosts.has(url.hostname) ? url : null;
  } catch {
    return null;
  }
}

function proxyUrl(target, referrer, type = 'media') {
  const key = type === 'subtitle' ? 'subtitle' : 'url';
  return `/api/stream?${key}=${encodeURIComponent(target)}&ref=${encodeURIComponent(referrer)}`;
}

async function getText(url, headers = {}) {
  const response = await fetch(url, { headers: { 'user-agent': USER_AGENT, ...headers } });
  if (!response.ok) throw new Error(`Upstream ${response.status}`);
  return { text: await response.text(), url: response.url || url };
}

async function getJson(url, headers = {}) {
  const response = await fetch(url, { headers: { 'user-agent': USER_AGENT, ...headers } });
  if (!response.ok) throw new Error(`Upstream ${response.status}`);
  return response.json();
}

async function resolveEpisode(raw) {
  const source = allowed(raw, SOURCES);
  if (!source) throw new Error('Unsupported episode source');
  const page = await getText(source.href);
  const iframeMatch = page.text.match(/<iframe\b[^>]*\bsrc=["']([^"']+)/i);
  const iframe = iframeMatch && allowed(new URL(iframeMatch[1].replace(/&amp;/g, '&'), page.url).href, PLAYER);
  if (!iframe) throw new Error('Player not found');

  const embed = await getText(iframe.href, { referer: source.href });
  const playlistMatch = embed.text.match(/(?:window\.__playlist|var\s+src)\s*=\s*["']([^"']+\.m3u8[^"']*)/i);
  const playlist = playlistMatch && allowed(new URL(playlistMatch[1], embed.url).href, MEDIA);
  if (!playlist) throw new Error('Playlist not found');

  let subtitles = [];
  const subtitleMatch = embed.text.match(/var\s+subApi\s*=\s*["']([^"']+)/i);
  const subtitleApi = subtitleMatch && allowed(new URL(subtitleMatch[1], embed.url).href, SUBTITLE_API);
  if (subtitleApi) {
    try {
      const list = await getJson(subtitleApi.href, { referer: iframe.href, origin: iframe.origin });
      subtitles = Array.isArray(list)
        ? list.flatMap((subtitle) => {
          const url = allowed(subtitle?.url, MEDIA);
          return url ? [{ lang: subtitle.lang, label: subtitle.lang?.toUpperCase(), url: proxyUrl(url.href, iframe.href, 'subtitle') }] : [];
        })
        : [];
    } catch {}
  }

  return { url: proxyUrl(playlist.href, iframe.href), subtitles };
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
    const target = allowed(subtitle || value(req.query?.url), MEDIA);
    const referrer = allowed(value(req.query?.ref) || 'https://catalog.dramavibe.cfd/player_embed.php', PLAYER);
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
      const vtt = target.pathname.endsWith('.srt')
        ? `WEBVTT\n\n${text.replace(/\r/g, '').replace(/^\d+\s*$/gm, '').replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')}`
        : text;
      res.setHeader('Content-Type', 'text/vtt');
      return res.status(200).send(vtt);
    }
    if (target.pathname.endsWith('.m3u8') || type.includes('mpegurl')) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      return res.status(200).send(rewriteManifest(await upstream.text(), target.href, referrer.href));
    }

    res.setHeader('Content-Type', type);
    return res.status(200).send(Buffer.from(await upstream.arrayBuffer()));
  } catch (error) {
    return res.status(502).json({ error: error.message || 'stream unavailable' });
  }
}

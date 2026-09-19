import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { ArrowLeft, Check, ChevronDown, Info, Link2, LockKeyhole, Play, Send, Share2, Star } from 'lucide-react';
import { fetchDrama, fetchStream, resolveEpisodeStream } from '../lib/api.js';
import Nav from '../components/Nav.jsx';
import VideoPlayer from '../components/VideoPlayer.jsx';
import { routes } from '../lib/routes.js';

export default function Watch({ ...navProps }) {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [drama, setDrama] = useState(null);
  const [detailStatus, setDetailStatus] = useState('loading');
  const [src, setSrc] = useState('');
  const [subtitles, setSubtitles] = useState([]);
  const [streamStatus, setStreamStatus] = useState('loading');
  const [playerError, setPlayerError] = useState(false);
  const requestedEpisode = searchParams.get('episode');

  useEffect(() => {
    const controller = new AbortController();
    setDrama(null);
    setDetailStatus('loading');
    fetchDrama(slug, { signal: controller.signal })
      .then((result) => {
        if (!result) throw new Error('Drama not found');
        setDrama(result);
        setDetailStatus('ready');
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setDetailStatus('error');
      });
    return () => controller.abort();
  }, [slug]);

  const activeEpisode = drama?.episodes.find((episode) => episode.number === requestedEpisode) ?? drama?.episodes[0];

  useEffect(() => {
    const controller = new AbortController();
    setSrc('');
    setSubtitles([]);
    setPlayerError(false);
    if (!activeEpisode?.id && !activeEpisode?.url) {
      setStreamStatus('unavailable');
      return () => controller.abort();
    }

    setStreamStatus('loading');
    const streamRequest = activeEpisode.url
      ? resolveEpisodeStream(activeEpisode.url, { signal: controller.signal })
      : fetchStream(activeEpisode.id, { signal: controller.signal });
    streamRequest
      .then((stream) => {
        setSrc(stream?.url || stream || '');
        setSubtitles(stream?.subtitles || []);
        setStreamStatus(stream?.url || stream ? 'ready' : 'empty');
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setStreamStatus('empty');
      });
    return () => controller.abort();
  }, [activeEpisode]);

  async function shareEpisode() {
    try {
      if (navigator.share) await navigator.share({ title: drama.title, url: window.location.href });
      else await navigator.clipboard.writeText(window.location.href);
      navProps.onNotify?.(navigator.share ? 'Episode shared.' : 'Episode link copied.');
    } catch {
      navProps.onNotify?.('Sharing was cancelled.');
    }
  }

  return (
    <>
      <Nav {...navProps} />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-7 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link to={routes.discover} className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-content transition hover:text-white"><ArrowLeft size={16} /> Back to discover</Link>
          <span className="hidden items-center gap-2 text-xs text-neutral-content sm:flex"><span className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_#ff4d8d]" /> MeiDrama player</span>
        </div>

        {detailStatus === 'loading' && <div className="glass rounded-2xl p-12 text-center text-sm text-neutral-content">Loading drama details...</div>}
        {detailStatus === 'error' && <div role="alert" className="glass rounded-2xl p-12 text-center text-sm text-neutral-content">This drama could not be found in the catalog.</div>}
        {drama && (
          <div className="grid gap-6 lg:grid-cols-[1fr_285px]">
            <section>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#110b15] shadow-2xl shadow-black/30">
                <div className="flex items-center justify-between border-b border-white/8 px-4 py-3 sm:px-5">
                  <div className="min-w-0"><p className="truncate text-sm font-bold text-white">{drama.title}</p><p className="mt-0.5 text-[11px] text-neutral-content">Episode {activeEpisode?.number || '-'} · {drama.status || 'Catalog title'}</p></div>
                  <button type="button" aria-label="Share episode" onClick={shareEpisode} className="grid size-9 place-items-center rounded-lg text-neutral-content transition hover:bg-white/8 hover:text-white"><Share2 size={16} /></button>
                </div>
                {src && !playerError ? <VideoPlayer title={`${drama.title} episode ${activeEpisode?.number || ''}`} src={src} subtitles={subtitles} onError={() => setPlayerError(true)} /> : (
                  <div className="relative grid aspect-video place-items-center overflow-hidden bg-[#0d0911] p-6 text-center">
                    <div className="absolute size-64 rounded-full bg-primary/10 blur-3xl" />
                    <div className="relative max-w-sm">
                      {streamStatus === 'loading' ? <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-2 border-white/15 border-t-primary" /> : <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary"><LockKeyhole size={22} /></span>}
                      <p className="text-sm font-bold text-white">{streamStatus === 'loading' ? 'Finding your stream...' : playerError ? 'This stream needs another look.' : 'This episode is taking a tiny intermission.'}</p>
                      <p className="mt-2 text-xs leading-5 text-neutral-content">{streamStatus === 'loading' ? 'Hang tight while we get everything ready.' : playerError ? 'The video source failed to load. Try another episode.' : streamStatus === 'unavailable' ? 'This episode has no stream source.' : 'The direct stream could not be resolved. Check back soon.'}</p>
                    </div>
                  </div>
                )}
              </div>

              <div id="details" className="scroll-mt-28 mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-content"><span className="rounded-full bg-primary/12 px-2.5 py-1 font-bold text-primary">Episode {activeEpisode?.number || '-'}</span>{drama.year && <span>{drama.year}</span>}{drama.status && <span>{drama.status}</span>}{drama.network && <span>{drama.network}</span>}</div>
                  <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">{drama.title}</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-content">{drama.synopsis || `Settle in for episode ${activeEpisode?.number || 'one'} of ${drama.title}.`}</p>
                  <p className="mt-3 text-xs text-neutral-content">{drama.genres.join(' · ')}{drama.country ? ` · ${drama.country}` : ''}</p>
                </div>
                <div className="flex shrink-0 gap-2"><button type="button" onClick={() => document.getElementById('details')?.scrollIntoView()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-white/10"><Info size={15} /> Details</button></div>
              </div>
            </section>

            <aside className="glass h-fit rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between"><div><p className="text-sm font-bold text-white">Episodes</p><p className="mt-1 text-xs text-neutral-content">{drama.episodes.length} available</p></div><span className="rounded-lg border border-white/10 px-2.5 py-2 text-xs text-neutral-content">Season 1 <ChevronDown size={13} className="ml-1 inline" /></span></div>
              <div className="mt-5 max-h-[31rem] space-y-1.5 overflow-y-auto pr-1">
                {drama.episodes.map((episode, index) => {
                  const number = episode.number || String(index + 1);
                  const active = activeEpisode === episode;
                  return <Link key={`${episode.url}-${number}`} to={routes.watch(slug, number)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${active ? 'bg-primary/12 text-white' : 'text-neutral-content hover:bg-white/6 hover:text-white'}`}><span className={`grid size-7 place-items-center rounded-lg text-xs font-bold ${active ? 'bg-primary text-primary-content' : 'bg-white/7'}`}>{active ? <Check size={14} /> : number}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">Episode {number}</span><span className="mt-0.5 block text-[10px] opacity-70">{episode.id ? 'Stream available' : 'Stream Available'}</span></span>{active && <Play size={13} fill="currentColor" />}</Link>;
                })}
              </div>
              <p className="mt-4 flex items-center gap-1.5 px-2 text-[10px] leading-4 text-neutral-content"><Star size={12} /> Select an episode to update the player.</p>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}

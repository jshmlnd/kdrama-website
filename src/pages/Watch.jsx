import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { collectorScript, proxyStreamUrl } from '../lib/kisskh.js';

function StreamPlayer({ src }) {
  const ref = useRef(null);
  useEffect(() => {
    const video = ref.current;
    if (!video || !src) return;
    let cancelled = false;
    import('hls.js').then(({ default: Hls }) => {
      if (cancelled) return;
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(video);
        ref.current._hls = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      }
    });
    return () => {
      cancelled = true;
      ref.current?._hls?.destroy();
    };
  }, [src]);

  return <video ref={ref} controls className="aspect-video w-full rounded-xl bg-black" />;
}

export default function Watch() {
  const [stream, setStream] = useState(() => localStorage.getItem('hallyuwave_stream') ?? '');
  const [copied, setCopied] = useState(false);

  const copyScript = async () => {
    await navigator.clipboard.writeText(collectorScript());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="mx-auto max-w-4xl p-6">
      <Link to="/" className="text-sm text-neutral-content hover:text-primary">← Back</Link>
      <h1 className="mt-4 mb-6 text-2xl font-bold">Watch</h1>

      <section className="glass mb-6 rounded-box p-6">
        <h2 className="font-semibold">1 · Capture a stream URL from your kisskh session</h2>
        <p className="mt-1 mb-4 text-sm text-neutral-content">
          Open a kisskh episode in this browser, paste the collector into DevTools console, then open/refresh an
          episode. It captures the authenticated stream URL (which carries the short-lived kkey) and copies the
          Worker proxy link to your clipboard.
        </p>
        <div className="flex flex-wrap gap-3">
          <a className="btn btn-primary" href="https://kisskh.is" target="_blank" rel="noreferrer">
            Open kisskh
          </a>
          <button className="btn btn-outline" onClick={copyScript}>
            {copied ? 'Copied!' : 'Copy collector script'}
          </button>
        </div>
      </section>

      <section className="glass mb-6 rounded-box p-6">
        <h2 className="font-semibold">2 · Paste the proxy link</h2>
        <p className="mt-1 mb-4 text-sm text-neutral-content">
          Or drop any raw <code className="text-accent">.m3u8</code> URL — it gets routed through the Worker
          proxy automatically.
        </p>
        <input
          type="text"
          value={stream}
          onChange={(e) => { setStream(e.target.value); localStorage.setItem('hallyuwave_stream', e.target.value); }}
          placeholder="https://kdramaapi.../proxy?url=...  or  https://cdn/.../index.m3u8"
          aria-label="Stream URL"
          className="input w-full bg-white/10 focus:border-primary focus:outline-none"
        />
      </section>

      {stream && (
        <section className="glass overflow-hidden rounded-box p-3">
          <StreamPlayer src={proxyStreamUrl(stream.trim())} />
        </section>
      )}
    </main>
  );
}
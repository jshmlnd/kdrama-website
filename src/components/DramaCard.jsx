import { useEffect, useRef, useState } from 'react';
import { Bookmark, Play, Tv2 } from 'lucide-react';
import { Link } from 'react-router';
import { fetchDrama } from '../lib/api.js';
import { routes } from '../lib/routes.js';

export default function DramaCard({ drama, inList = false, onToggle }) {
  const genres = drama.genres ?? (drama.genre ? [drama.genre] : []);
  const genre = genres[0] ?? 'Drama';
  const hue = [...drama.slug].reduce((total, character) => total + character.charCodeAt(0), 0) % 360;
  const cardRef = useRef(null);
  const [poster, setPoster] = useState(drama.image ?? '');

  useEffect(() => {
    if (poster || !drama.slug) return undefined;
    const load = () => fetchDrama(drama.slug).then((detail) => detail?.image && setPoster(detail.image)).catch(() => {});
    if (typeof IntersectionObserver === 'undefined') {
      load();
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      load();
    }, { rootMargin: '300px' });
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [drama.slug, poster]);

  const displayDrama = poster && !drama.image ? { ...drama, image: poster } : drama;

  return (
    <article ref={cardRef} className="group min-w-0">
      <div className="relative aspect-[0.82] overflow-hidden rounded-2xl border border-white/10 bg-[#211526] shadow-lg shadow-black/10">
        <div className="absolute inset-0" style={{ background: `linear-gradient(145deg, hsl(${hue} 45% 18%), hsl(${(hue + 55) % 360} 65% 38%), hsl(${(hue + 95) % 360} 70% 58%))` }} />
        {poster && <img src={poster} alt={`${drama.title} poster`} loading="lazy" className="relative h-full w-full object-cover opacity-85 mix-blend-screen transition duration-700 group-hover:scale-105 group-hover:opacity-100" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#120b18] via-transparent to-black/10" />
        <div className="absolute inset-x-4 top-4 z-10 flex items-start justify-between gap-2">
          <span className="rounded-full border border-white/15 bg-black/25 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-md">{drama.status || 'Drama'}</span>
          <button
            type="button"
            aria-label={`${inList ? 'Remove' : 'Add'} ${drama.title} ${inList ? 'from' : 'to'} my list`}
            aria-pressed={inList}
            onClick={() => onToggle?.(displayDrama)}
            className={`grid size-9 place-items-center rounded-full border border-white/15 bg-black/25 text-white backdrop-blur-md transition hover:bg-primary hover:text-primary-content ${inList ? 'bg-primary text-primary-content' : ''}`}
          >
            <Bookmark size={15} fill={inList ? 'currentColor' : 'none'} />
          </button>
        </div>
        <div className="absolute inset-x-4 bottom-4">
          <div className="mb-3 flex items-center gap-3 text-xs font-semibold text-white/80">
            {drama.year && <span>{drama.year}</span>}
            <span>{genre}</span>
          </div>
          <h3 className="font-display text-3xl leading-[0.95] text-white">{drama.title}</h3>
          <Link to={routes.watch(drama.slug)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-xs font-bold text-[#1a0e1d] transition after:absolute after:inset-0 after:rounded-2xl sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100">
            <Play size={13} fill="currentColor" /> Watch now
          </Link>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between px-1 text-xs text-neutral-content">
        <span>{genres.length ? genres.join(' · ') : 'Drama'}</span>
        <span className="flex shrink-0 items-center gap-1"><Tv2 size={13} /> Subtitles</span>
      </div>
    </article>
  );
}

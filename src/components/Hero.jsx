import { useEffect, useState } from 'react';
import { ArrowUpRight, CircleCheckBig, Heart, Play, Star } from 'lucide-react';
import { Link } from 'react-router';
import { fetchDrama } from '../lib/api.js';
import { routes } from '../lib/routes.js';

export default function Hero({ drama, total = 0 }) {
  const [poster, setPoster] = useState(drama?.image ?? '');
  const title = drama?.title ?? 'Stories worth staying up for';
  const watchPath = drama ? routes.watch(drama.slug) : routes.discover;

  useEffect(() => {
    setPoster(drama?.image ?? '');
    if (!drama?.slug || drama.image) return undefined;
    const controller = new AbortController();
    fetchDrama(drama.slug).then((detail) => {
      if (!controller.signal.aborted) setPoster(detail?.image ?? '');
    }).catch(() => {});
    return () => controller.abort();
  }, [drama?.image, drama?.slug]);

  return (
    <section className="hero-shell relative mb-12 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#17101f] shadow-2xl shadow-black/20 sm:mb-16 sm:rounded-[2rem]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(255,77,141,0.2),transparent_28%),linear-gradient(110deg,#17101f_15%,rgba(23,16,31,0.7)_55%,rgba(23,16,31,0.15))]" />
      <div className="relative grid min-h-0 items-center gap-12 px-5 py-10 sm:min-h-[540px] sm:gap-10 sm:px-10 sm:py-12 lg:grid-cols-[1fr_0.8fr] lg:px-16 lg:py-14">
        <div className="max-w-xl">
          <div className="mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-primary sm:mb-6 sm:text-xs sm:tracking-[0.2em]">
            <CircleCheckBig size={19} />
            Curated for your next late night
          </div>
          <h1 className="font-display max-w-2xl text-5xl font-medium leading-[0.93] tracking-[-0.04em] text-white sm:text-7xl sm:leading-[0.9] lg:text-[5.5rem]">
            Stories worth <span className="italic text-primary">staying up</span> for.
          </h1>
          <p className="mt-6 max-w-lg text-sm leading-6 text-neutral-content sm:mt-7 sm:text-lg sm:leading-7">
            Find the romances that linger, the thrillers that keep you guessing, and the comfort shows you will return to.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-9">
            <Link to={routes.discover} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-content shadow-[0_10px_30px_rgba(255,77,141,0.25)] transition hover:-translate-y-0.5 hover:bg-[#ff679c] sm:w-auto">
              Explore the collection <ArrowUpRight size={17} />
            </Link>
            <Link to={watchPath} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/6 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/10 sm:w-auto">
              <Play size={16} fill="currentColor" /> Quick play
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/10 pt-5 text-xs text-neutral-content sm:mt-10 sm:gap-6 sm:pt-6 sm:text-sm">
            <span><strong className="mr-1 text-white">{total || '...'}</strong> dramas in the collection</span>
            <span><strong className="mr-1 text-white">Live</strong> drama updates</span>
            <span className="flex items-center gap-1"><Heart size={14} className="fill-primary text-primary" /> Made for <span className='text-primary'>Jimei</span></span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[300px] sm:max-w-[360px] lg:mr-0">
          <div className="absolute -inset-5 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative aspect-[0.78] overflow-hidden rounded-[1.6rem] border border-white/20 bg-[#2a182d] shadow-2xl shadow-black/50">
              {poster ? <img src={poster} alt={`${drama.title} poster`} className="h-full w-full object-cover object-center opacity-90" /> : <div className="h-full w-full bg-[radial-gradient(circle_at_70%_25%,rgba(255,143,184,0.85),transparent_24%),linear-gradient(145deg,#29163b,#b32e72_55%,#f3a18e)]" />}
            <div className="absolute inset-0 bg-gradient-to-t from-[#170d1d] via-transparent to-black/10" />
            <div className="absolute left-5 top-5 rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">Spotlight / 01</div>
            <div className="absolute inset-x-5 bottom-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Featured from the catalog</p>
              <h2 className="font-display text-4xl leading-none text-white">{title}</h2>
              <div className="mt-4 flex items-center gap-3 text-xs text-white/75">
                {drama?.genres?.[0] && <span>{drama.genres[0]}</span>}
                {drama?.year && <span>{drama.year}</span>}
                {drama?.status && <span>{drama.status}</span>}
              </div>
            </div>
          </div>
          <Link to={watchPath} className="absolute -bottom-5 -left-8 hidden items-center gap-3 rounded-2xl border border-white/10 bg-[#211426]/90 p-3 shadow-xl backdrop-blur-md transition hover:border-primary/50 sm:flex">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary"><Play size={16} fill="currentColor" /></span>
            <div><p className="text-xs font-semibold text-white">Open featured title</p><p className="mt-0.5 text-[11px] text-neutral-content">{drama?.status || 'Explore the catalog'}</p></div>
          </Link>
        </div>
      </div>
    </section>
  );
}

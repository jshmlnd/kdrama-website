import { useState } from 'react';
import { ArrowUpRight, Clock3, Flame, Play, Tv2 } from 'lucide-react';
import { Link } from 'react-router';
import Nav from '../components/Nav.jsx';
import Hero from '../components/Hero.jsx';
import DramaCard from '../components/DramaCard.jsx';
import { useCatalog } from '../lib/useCatalog.js';
import { routes } from '../lib/routes.js';

export default function Home({ watchlist, onToggleWatchlist, ...navProps }) {
  const { status, dramas, error } = useCatalog();
  const [query, setQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('All titles');
  const normalizedQuery = query.trim().toLowerCase();
  const genres = ['All titles', ...new Set(dramas.flatMap((drama) => drama.genres))].slice(0, 7);
  const filteredDramas = dramas.filter((drama) => {
    const matchesGenre = activeGenre === 'All titles' || drama.genres.includes(activeGenre);
    const matchesQuery = !normalizedQuery || `${drama.title} ${drama.genres.join(' ')}`.toLowerCase().includes(normalizedQuery);
    return matchesGenre && matchesQuery;
  });
  const savedDrama = watchlist[0];

  return (
    <>
      <Nav {...navProps} query={query} onQuery={setQuery} />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <Hero drama={dramas[0]} total={dramas.length} />
        <section id="trending" className="scroll-mt-28">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="section-kicker"><Flame size={14} /> The good stuff</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Find your next <span className="font-display font-medium italic text-primary">favorite.</span></h2>
            </div>
            <Link to={routes.discover} className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-content transition hover:text-primary">View all titles <ArrowUpRight size={16} /></Link>
          </div>

          <div className="scrollbar-none mt-7 flex gap-2 overflow-x-auto pb-2">
            {genres.map((genre) => <button key={genre} type="button" onClick={() => setActiveGenre(genre)} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${activeGenre === genre ? 'border-primary bg-primary text-primary-content' : 'border-white/10 bg-white/5 text-neutral-content hover:border-white/20 hover:text-white'}`}>{genre}</button>)}
          </div>

          {status === 'loading' && <div className="glass mt-6 rounded-2xl p-10 text-center text-sm text-neutral-content">Finding the latest dramas...</div>}
          {status === 'error' && <div role="alert" className="glass mt-6 rounded-2xl p-10 text-center text-sm text-neutral-content">The catalog is taking a short intermission. Try again soon{error ? ` (${error})` : ''}.</div>}
          {status === 'ready' && (filteredDramas.length ? <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">{filteredDramas.slice(0, 12).map((drama) => <DramaCard key={drama.slug} drama={drama} inList={watchlist.some((item) => item.slug === drama.slug)} onToggle={onToggleWatchlist} />)}</div> : <div className="glass mt-6 rounded-2xl p-10 text-center text-sm text-neutral-content">No dramas match that search yet.</div>)}
        </section>

        <section id="continue" className="mt-20 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#17101f] p-6 sm:p-8">
            <div className="absolute -right-16 -top-24 size-72 rounded-full bg-primary/15 blur-3xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div><p className="section-kicker"><Clock3 size={14} /> Your collection</p><h2 className="mt-2 text-2xl font-bold text-white">Keep the good ones close.</h2></div>
              <Link to={routes.myList} className="hidden rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-neutral-content transition hover:border-white/20 hover:text-white sm:block">See my list</Link>
            </div>
            {savedDrama ? (
              <div className="relative mt-7 flex gap-3 sm:gap-4">
                <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-[#47223e]">{savedDrama.image && <img src={savedDrama.image} alt="" className="h-full w-full object-cover opacity-80" />}</div>
                <div className="min-w-0 pt-1"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Saved for later</p><h3 className="mt-2 truncate text-lg font-semibold text-white">{savedDrama.title}</h3><p className="mt-1 text-xs text-neutral-content">{savedDrama.genres?.join(' · ') || 'Drama'}</p><Link to={routes.watch(savedDrama.slug)} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-white hover:text-primary">Watch now <Play size={12} fill="currentColor" /></Link></div>
              </div>
            ) : (
              <div className="relative mt-7"><p className="text-sm leading-6 text-neutral-content">Your list is empty. Save a title and it will appear here.</p><Link to={routes.discover} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-white">Explore dramas <ArrowUpRight size={16} /></Link></div>
            )}
          </div>
          <div className="glass rounded-2xl p-6 sm:p-8"><p className="section-kicker"><Tv2 size={14} /> Made for fans</p><h2 className="mt-3 font-display text-4xl leading-none text-white">A calmer way to find your next obsession.</h2><p className="mt-4 text-sm leading-6 text-neutral-content">Browse by mood, save what catches your eye, and settle in when the timing feels right.</p><Link to={routes.genres} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-white">Browse genres <ArrowUpRight size={16} /></Link></div>
        </section>
      </main>
      <footer className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-white/8 px-4 py-8 text-xs text-neutral-content sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><span className="font-semibold text-white">Mei<span className="text-primary">Drama</span></span><span>For the stories that stay with you.</span></footer>
    </>
  );
}

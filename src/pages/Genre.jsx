import { Link, useParams } from 'react-router';
import { ArrowUpRight, Layers3 } from 'lucide-react';
import Nav from '../components/Nav.jsx';
import DramaCard from '../components/DramaCard.jsx';
import { useCatalog } from '../lib/useCatalog.js';
import { genreSlug, routes } from '../lib/routes.js';

export default function Genre({ watchlist, onToggleWatchlist, ...navProps }) {
  const { genre: selectedSlug } = useParams();
  const { status, dramas, error } = useCatalog();
  const genres = [...new Set(dramas.flatMap((drama) => drama.genres))].sort();
  const selectedGenre = genres.find((genre) => genreSlug(genre) === selectedSlug) ?? '';
  const results = selectedGenre ? dramas.filter((drama) => drama.genres.some((genre) => genreSlug(genre) === genreSlug(selectedGenre))) : dramas;

  return (
    <>
      <Nav {...navProps} />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="section-kicker"><Layers3 size={14} /> Browse by mood</p><h1 className="mt-3 font-display text-5xl leading-none text-white sm:text-8xl">{selectedGenre || 'Every genre'}</h1></div><Link to={routes.discover} className="inline-flex items-center gap-2 text-sm font-bold text-neutral-content hover:text-primary">Search the collection <ArrowUpRight size={16} /></Link></div>
        <div className="mt-10 flex gap-2 overflow-x-auto border-b border-white/10 pb-5"><Link to={routes.genres} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${!selectedSlug ? 'border-primary bg-primary text-primary-content' : 'border-white/10 bg-white/5 text-neutral-content hover:text-white'}`}>All genres</Link>{genres.map((genre) => <Link key={genre} to={routes.genre(genre)} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${genreSlug(selectedGenre) === genreSlug(genre) ? 'border-primary bg-primary text-primary-content' : 'border-white/10 bg-white/5 text-neutral-content hover:text-white'}`}>{genre}</Link>)}</div>
        {status === 'error' ? <div role="alert" className="glass mt-8 rounded-2xl p-10 text-center text-sm text-neutral-content">The catalog could not be loaded. Try again soon{error ? ` (${error})` : ''}.</div> : status === 'loading' ? <div className="glass mt-8 rounded-2xl p-10 text-center text-sm text-neutral-content">Finding titles by genre...</div> : results.length ? <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">{results.map((drama) => <DramaCard key={drama.slug} drama={drama} inList={watchlist.some((item) => item.slug === drama.slug)} onToggle={onToggleWatchlist} />)}</div> : <div className="glass mt-8 rounded-2xl p-10 text-center text-sm text-neutral-content">No titles are available in this genre yet.</div>}
      </main>
    </>
  );
}

import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import Nav from '../components/Nav.jsx';
import DramaCard from '../components/DramaCard.jsx';
import { useCatalog } from '../lib/useCatalog.js';

export default function Discover({ watchlist, onToggleWatchlist, ...navProps }) {
  const { status, dramas, error } = useCatalog();
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const results = dramas.filter((drama) => !normalizedQuery || `${drama.title} ${drama.genres.join(' ')}`.toLowerCase().includes(normalizedQuery));

  return (
    <>
      <Nav {...navProps} query={query} onQuery={setQuery} />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <div className="max-w-2xl"><p className="section-kicker"><Search size={14} /> The full collection</p><h1 className="mt-3 font-display text-6xl leading-none text-white sm:text-8xl">Find your <span className="italic text-primary">next</span> favorite.</h1><p className="mt-5 text-sm leading-6 text-neutral-content sm:text-base">Search every title in the live catalog, then save the ones you want to remember.</p></div>
        <div className="mt-12 flex items-center justify-between gap-4 border-b border-white/10 pb-4"><p className="flex items-center gap-2 text-sm font-semibold text-white"><SlidersHorizontal size={16} className="text-primary" /> {status === 'ready' ? `${results.length} titles` : 'Loading titles...'}</p><span className="text-xs text-neutral-content">Search updates as you type</span></div>
        {status === 'error' ? <div role="alert" className="glass mt-8 rounded-2xl p-10 text-center text-sm text-neutral-content">The catalog could not be loaded. Try again soon{error ? ` (${error})` : ''}.</div> : status === 'loading' ? <div className="glass mt-8 rounded-2xl p-10 text-center text-sm text-neutral-content">Finding the latest dramas...</div> : results.length ? <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">{results.map((drama) => <DramaCard key={drama.slug} drama={drama} inList={watchlist.some((item) => item.slug === drama.slug)} onToggle={onToggleWatchlist} />)}</div> : <div className="glass mt-8 rounded-2xl p-10 text-center text-sm text-neutral-content">No titles match &quot;{query}&quot;.</div>}
      </main>
    </>
  );
}

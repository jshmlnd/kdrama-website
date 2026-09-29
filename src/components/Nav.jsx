import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Crown, Menu, Search, X } from 'lucide-react';
import { routes } from '../lib/routes.js';
import { useCatalog } from '../lib/useCatalog.js';

export default function Nav({ query = '', onQuery }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const { dramas } = useCatalog();
  const links = [['Discover', routes.discover], ['Genres', routes.genres], ['My list', routes.myList]];
  const normalized = query.trim().toLowerCase();
  const suggestions = useMemo(
    () => (normalized && onQuery ? dramas.filter((drama) => drama.title.toLowerCase().includes(normalized)).slice(0, 6) : []),
    [dramas, normalized, onQuery],
  );

  return (
    <nav className="site-nav glass backdrop-blur-xl sticky top-4 z-20 mx-4 mt-4 flex max-w-7xl flex-wrap items-center gap-3 rounded-2xl px-3 py-3 sm:px-5 xl:mx-auto">
      <div className="flex items-center gap-4">
        <Link to={routes.home} className="flex shrink-0 items-center gap-2.5 text-lg font-extrabold tracking-tight text-white" onClick={() => setMenuOpen(false)}>
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-content shadow-[0_0_24px_rgba(255,77,141,0.3)]"><Crown size={19} /></span>
          <span className="font-display">Mei<span className="italic font-display text-primary">Drama</span></span>
        </Link>
        <div className="hidden items-center gap-1 text-sm text-neutral-content md:flex">
          {links.map(([label, to]) => <Link key={to} to={to} className="rounded-full px-3 py-2 transition hover:bg-white/8 hover:text-white">{label}</Link>)}
        </div>
      </div>

      {onQuery && (
        <label className="relative order-3 flex h-10 basis-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-neutral-content transition focus-within:border-primary/60 focus-within:bg-white/8 md:order-none md:ml-auto md:w-full md:max-w-xs md:basis-auto">
          <Search size={16} />
          <input
            type="search"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            onFocus={() => setSuggestOpen(true)}
            onBlur={() => setTimeout(() => setSuggestOpen(false), 100)}
            onKeyDown={(event) => event.key === 'Escape' && setSuggestOpen(false)}
            placeholder="Search a title..."
            aria-label="Search dramas"
            aria-expanded={suggestOpen && suggestions.length > 0}
            className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-neutral-content/70 sm:text-sm"
          />
          {suggestOpen && suggestions.length > 0 && (
            <div role="listbox" aria-label="Search suggestions" className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#160f1c]/95 shadow-2xl backdrop-blur-xl">
              {suggestions.map((drama) => (
                <Link
                  key={drama.slug}
                  role="option"
                  aria-selected="false"
                  to={routes.watch(drama.slug)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setSuggestOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-white/8"
                >
                  {drama.image && <img src={drama.image} alt="" loading="lazy" className="h-10 w-7 shrink-0 rounded object-cover" />}
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-white">{drama.title}</span>
                    <span className="block text-[10px] text-neutral-content">{[drama.year, drama.genres[0]].filter(Boolean).join(' · ')}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </label>
      )}

      <div className="ml-auto flex items-center gap-2 md:ml-0">
        <button type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen((open) => !open)} className="grid size-10 place-items-center rounded-xl border border-white/10 text-neutral-content md:hidden">
          {menuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>

      {menuOpen && (
        <div className="basis-full border-t border-white/10 pt-2 md:hidden">
          {links.map(([label, to]) => <Link key={to} to={to} onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-3 text-sm text-neutral-content hover:bg-white/8 hover:text-white">{label}</Link>)}
        </div>
      )}
    </nav>
  );
}

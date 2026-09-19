import { useState } from 'react';
import { Link } from 'react-router';
import { Crown, Menu, Search, X } from 'lucide-react';
import { routes } from '../lib/routes.js';

export default function Nav({ query = '', onQuery }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [['Discover', routes.discover], ['Genres', routes.genres], ['My list', routes.myList]];

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
        <label className="order-3 flex h-10 basis-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-neutral-content transition focus-within:border-primary/60 focus-within:bg-white/8 md:order-none md:ml-auto md:w-full md:max-w-xs md:basis-auto">
          <Search size={16} />
          <input type="search" value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search a title..." aria-label="Search dramas" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-content/70" />
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

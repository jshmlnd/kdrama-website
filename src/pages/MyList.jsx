import { Bookmark, Compass } from 'lucide-react';
import { Link } from 'react-router';
import Nav from '../components/Nav.jsx';
import DramaCard from '../components/DramaCard.jsx';
import { routes } from '../lib/routes.js';

export default function MyList({ watchlist, onToggleWatchlist, ...navProps }) {
  return (
    <>
      <Nav {...navProps} />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <div className="max-w-2xl"><p className="section-kicker"><Bookmark size={14} /> Saved for later</p><h1 className="mt-3 font-display text-6xl leading-none text-white sm:text-8xl">Your <span className="italic text-primary">list.</span></h1><p className="mt-5 text-sm leading-6 text-neutral-content sm:text-base">A personal shelf for the stories you are not ready to let go of.</p></div>
        {watchlist.length ? <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">{watchlist.map((drama) => <DramaCard key={drama.slug} drama={drama} inList onToggle={onToggleWatchlist} />)}</div> : <div className="glass mt-12 max-w-xl rounded-3xl p-8 sm:p-10"><span className="grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary"><Compass size={22} /></span><h2 className="mt-5 text-2xl font-bold text-white">Nothing saved yet.</h2><p className="mt-2 text-sm leading-6 text-neutral-content">Browse the catalog and tap the bookmark whenever a title feels like your next watch.</p><Link to={routes.discover} className="mt-6 inline-flex rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-content transition hover:bg-[#ff679c]">Explore the collection</Link></div>}
      </main>
    </>
  );
}

import { Link } from 'react-router';

export default function Nav({ query, onQuery }) {
  return (
    <nav className="glass sticky top-3 z-10 mx-3 mt-3 flex max-w-6xl items-center gap-6 rounded-box px-6 py-3.5 xl:mx-auto">
      <Link to="/" className="text-xl font-extrabold tracking-tight">
        Mei<span className="text-primary">Drama</span>
      </Link>
      <Link to="/watch" className="text-sm text-neutral-content hover:text-primary">Watch</Link>
      <input
        type="search"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder="Search dramas…"
        aria-label="Search dramas"
        className="input input-sm ml-auto w-full max-w-sm rounded-field bg-white/10 focus:border-primary focus:outline-none"
      />
    </nav>
  );
}

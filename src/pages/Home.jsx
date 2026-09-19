import { useEffect, useState } from 'react';
import { fetchList } from '../lib/api.js';
import Nav from '../components/Nav.jsx';
import Hero from '../components/Hero.jsx';
import DramaCard from '../components/DramaCard.jsx';
import PlayerModal from '../components/PlayerModal.jsx';

export default function Home() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [dramas, setDramas] = useState([]);

  useEffect(() => {
    fetchList().then(setDramas);
  }, []);

  const q = query.toLowerCase();
  const list = dramas.filter((d) => (d.title + ' ' + d.genre).toLowerCase().includes(q));

  return (
    <>
      <Nav query={query} onQuery={setQuery} />
      <main className="mx-auto max-w-6xl p-6">
        <Hero />
        <div id="trending" className="mb-4 mt-9 flex items-baseline gap-3.5 scroll-mt-24">
          <h2 className="text-2xl font-bold">Trending Now</h2>
          <span className="text-sm text-neutral-content">{list.length} titles</span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5">
          {list.map((d) => <DramaCard key={d.id} drama={d} onOpen={setSelected} />)}
        </div>
      </main>
      <PlayerModal drama={selected} onClose={() => setSelected(null)} />
    </>
  );
}
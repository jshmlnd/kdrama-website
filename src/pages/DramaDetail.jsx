import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { fetchDrama } from '../lib/api.js';

export default function DramaDetail() {
  const { id } = useParams();
  const [drama, setDrama] = useState(null);

  useEffect(() => {
    fetchDrama(id).then(setDrama);
  }, [id]);

  if (!drama) {
    return (
      <main className="mx-auto max-w-4xl p-6 pt-24 text-center">
        <p className="text-neutral-content">Loading…</p>
        <Link to="/" className="text-primary hover:underline">← Back home</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <Link to="/" className="text-sm text-neutral-content hover:text-primary">← Back</Link>
      <div className="glass mt-4 overflow-hidden rounded-box">
        <div
          className="flex aspect-[21/9] items-end p-7 text-3xl font-bold [text-shadow:0_2px_10px_rgba(0,0,0,0.6)]"
          style={{ background: `linear-gradient(160deg, hsl(${drama.hue},70%,45%), hsl(${drama.hue + 40},60%,20%))` }}
        >
          {drama.title}
        </div>
        <div className="p-7">
          <div className="mb-5 flex items-center gap-3 text-sm text-neutral-content">
            {drama.genre && <span className="badge badge-primary badge-sm">{drama.genre}</span>}
            {drama.year && <span>{drama.year}</span>}
            {drama.rating && <span className="text-accent">★ {drama.rating}</span>}
          </div>
          <div className="flex aspect-video items-center justify-center rounded-xl border border-white/10 bg-black text-sm text-neutral-content">
            ▶ &nbsp;Stream placeholder — hook up your video source here
          </div>
        </div>
      </div>
    </main>
  );
}
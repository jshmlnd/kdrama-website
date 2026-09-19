import { useEffect } from 'react';
import { Link } from 'react-router';

export default function PlayerModal({ drama, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!drama) return null;
  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-6 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass w-full max-w-2xl rounded-box p-7">
        <button onClick={onClose} aria-label="Close" className="float-right text-2xl text-neutral-content hover:text-primary">×</button>
        <h3 className="mb-1 text-2xl font-bold">{drama.title}</h3>
        <div className="mb-4 text-sm text-neutral-content">{drama.year} · {drama.genre} · ★ {drama.rating}</div>
        <div className="flex aspect-video items-center justify-center rounded-xl border border-white/10 bg-black text-sm text-neutral-content">
          ▶ &nbsp;Stream placeholder — hook up your video source here
        </div>
        <Link to={`/drama/${drama.id}`} className="mt-4 inline-block text-sm text-primary hover:underline">
          Full details →
        </Link>
      </div>
    </div>
  );
}

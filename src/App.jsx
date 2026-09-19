import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import Home from './pages/Home.jsx';
import Watch from './pages/Watch.jsx';
import Discover from './pages/Discover.jsx';
import Genre from './pages/Genre.jsx';
import MyList from './pages/MyList.jsx';
import Notification from './components/Notification.jsx';
import { routes } from './lib/routes.js';

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [watchlist, setWatchlist] = useState(() => {
    const saved = readStorage('meidrama_watchlist', []);
    return Array.isArray(saved) ? saved : [];
  });
  const [notice, setNotice] = useState('');

  useEffect(() => localStorage.setItem('meidrama_watchlist', JSON.stringify(watchlist)), [watchlist]);

  function toggleWatchlist(drama) {
    const exists = watchlist.some((item) => item.slug === drama.slug);
    const saved = {
      slug: drama.slug,
      title: drama.title,
      year: drama.year,
      genres: drama.genres,
      status: drama.status,
      image: drama.image,
    };
    setWatchlist((current) => exists ? current.filter((item) => item.slug !== drama.slug) : [...current, saved]);
    setNotice(exists ? `${drama.title} removed from your list.` : `${drama.title} saved to your list.`);
  }

  const shared = { watchlist, onToggleWatchlist: toggleWatchlist, onNotify: setNotice };

  return (
    <BrowserRouter>
      <Routes>
        <Route path={routes.home} element={<Home {...shared} />} />
        <Route path={routes.discover} element={<Discover {...shared} />} />
        <Route path={routes.genres} element={<Genre {...shared} />} />
        <Route path="/genres/:genre" element={<Genre {...shared} />} />
        <Route path={routes.myList} element={<MyList {...shared} />} />
        <Route path="/watch/:slug" element={<Watch {...shared} />} />
        <Route path="*" element={<Navigate to={routes.home} replace />} />
      </Routes>
      <Notification message={notice} onClose={() => setNotice('')} />
    </BrowserRouter>
  );
}

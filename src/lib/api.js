// ponytail: API data endpoints currently 500 (worker-side); mock list is the
// fallback. Remove fallback + hue gradients when the API is stable.
const API = 'https://kdramaapi.joshuaklein-malonda.workers.dev';

const mock = [
  { id: 1,  title: 'Crash Landing on You', year: 2019, genre: 'Romance',        rating: 9.1, hue: 340 },
  { id: 2,  title: 'Vincenzo',             year: 2021, genre: 'Crime Comedy',   rating: 8.9, hue: 280 },
  { id: 3,  title: 'Squid Game',           year: 2021, genre: 'Thriller',       rating: 8.7, hue: 200 },
  { id: 4,  title: 'Goblin',               year: 2016, genre: 'Fantasy',        rating: 9.2, hue: 250 },
  { id: 5,  title: 'Business Proposal',    year: 2022, genre: 'Rom-com',        rating: 8.5, hue: 320 },
  { id: 6,  title: 'My Mister',            year: 2018, genre: 'Drama',          rating: 9.3, hue: 220 },
  { id: 7,  title: 'Kingdom',              year: 2019, genre: 'Historical',     rating: 8.8, hue: 0   },
  { id: 8,  title: 'Hometown Cha-Cha-Cha', year: 2021, genre: 'Slice of Life',  rating: 8.6, hue: 160 },
  { id: 9,  title: 'Itaewon Class',        year: 2020, genre: 'Drama',          rating: 8.4, hue: 30  },
  { id: 10, title: 'Alchemy of Souls',     year: 2022, genre: 'Fantasy',        rating: 8.7, hue: 260 },
  { id: 11, title: 'Twenty-Five Twenty-One', year: 2022, genre: 'Coming-of-age', rating: 8.9, hue: 300 },
  { id: 12, title: 'The Glory',            year: 2022, genre: 'Revenge',        rating: 8.8, hue: 350 },
];

function hueOf(title) {
  let s = 0;
  for (const c of title) s += c.charCodeAt(0);
  return s % 360;
}

function toDrama(x) {
  return {
    id: x.id,
    title: x.title ?? x.name ?? '',
    year: Number(x.year) || null,
    rating: Number(x.rating) || null,
    genre: Array.isArray(x.genre) ? x.genre.join(', ') : (x.genre ?? ''),
    image: x.image ?? x.cover ?? x.poster ?? null,
    hue: x.hue ?? hueOf(x.title ?? ''),
  };
}

async function get(path) {
  const r = await fetch(API + path);
  if (!r.ok) throw new Error(`API ${r.status}`);
  return r.json();
}

export async function fetchList() {
  try {
    const data = await get('/list?page=1&type=1&country=0&order=1');
    const list = Array.isArray(data) ? data : (data.data ?? data.list ?? data.items ?? []);
    return list.map(toDrama);
  } catch {
    return mock.map(toDrama);
  }
}

export async function fetchDrama(id) {
  try {
    return toDrama(await get(`/drama/${id}`));
  } catch {
    const m = mock.find((x) => String(x.id) === String(id));
    return m ? toDrama(m) : null;
  }
}
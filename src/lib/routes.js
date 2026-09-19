export const routes = {
  home: '/',
  discover: '/discover',
  genres: '/genres',
  genre: (name) => `/genres/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'))}`,
  myList: '/my-list',
  watch: (slug, episode) => {
    const path = `/watch/${encodeURIComponent(slug)}`;
    return episode ? `${path}?episode=${encodeURIComponent(episode)}` : path;
  },
};

export function genreSlug(name) {
  return name.toLowerCase().replace(/\s+/g, '-');
}

import { useEffect, useState } from 'react';
import { fetchCatalog } from './api.js';

export function useCatalog() {
  const [state, setState] = useState({ status: 'loading', dramas: [], error: '' });

  useEffect(() => {
    fetchCatalog()
      .then((dramas) => setState({ status: 'ready', dramas, error: '' }))
      .catch((error) => setState({ status: 'error', dramas: [], error: error.message }));
  }, []);

  return state;
}

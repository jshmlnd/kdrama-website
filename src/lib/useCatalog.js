import { useEffect, useState } from 'react';
import { fetchCatalog } from './api.js';

export function useCatalog() {
  const [state, setState] = useState({ status: 'loading', dramas: [], error: '' });

  useEffect(() => {
    const controller = new AbortController();
    fetchCatalog({ signal: controller.signal })
      .then((dramas) => setState({ status: 'ready', dramas, error: '' }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ status: 'error', dramas: [], error: error.message });
      });
    return () => controller.abort();
  }, []);

  return state;
}

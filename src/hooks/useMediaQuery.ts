import { useState, useEffect } from 'react';

// ============================================
// HOOK: useMediaQuery
// React hook to track CSS media queries (e.g. tablet, mobile viewport ranges)
// ============================================

export default function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query, matches]);

  return matches;
}

import { useEffect, useState } from 'react';

/**
 * Subscribe to a CSS media query and return whether it currently matches.
 * Re-renders when the match state changes (responds to viewport resize, OS-level
 * preference toggles, etc.). Returns `false` when run outside a browser environment
 * (SSR / unit tests without a window stub) so consumers can rely on a stable boolean.
 */
export const useMatchMedia = (query: string): boolean => {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent): void => {
      setMatches(e.matches);
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
};

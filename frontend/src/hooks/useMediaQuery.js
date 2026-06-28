/**
 * useMediaQuery — Returns true if the given CSS media query matches.
 * Updates automatically on window resize.
 *
 * @param {string} query  e.g. '(max-width: 768px)'
 * @returns {boolean}
 */
import { useState, useEffect } from 'react';

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);

    // Modern API
    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
    } else {
      // Legacy Safari
      mql.addListener(handler);
    }

    setMatches(mql.matches);

    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handler);
      } else {
        mql.removeListener(handler);
      }
    };
  }, [query]);

  return matches;
}

export default useMediaQuery;

import { useEffect, useState } from 'react';

/** Returns true for the specified duration after mount, then false. Zero or negative skips entirely. */
export const useMinDelay = (ms: number): boolean => {
  const [active, setActive] = useState(ms > 0);

  useEffect(() => {
    if (ms <= 0) return;
    const timer = setTimeout(() => setActive(false), ms);
    return () => clearTimeout(timer);
  }, [ms]);

  return active;
};

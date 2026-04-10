import { useEffect, useState } from 'react';

/** Returns true for the specified duration after mount, then false */
export const useMinDelay = (ms: number): boolean => {
  const [active, setActive] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setActive(false), ms);
    return () => clearTimeout(timer);
  }, [ms]);

  return active;
};

import { useState, useEffect, useCallback } from 'react';
import { isVerbose as getVerbose, setVerbose as saveVerbose } from '@/shared/utils/verbose';

/** Reactive hook for verbose logging state */
export function useVerbose() {
  const [verbose, setVerboseState] = useState(getVerbose);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'afp-verbose-logs') {
        setVerboseState(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setVerbose = useCallback((on: boolean) => {
    saveVerbose(on);
    setVerboseState(on);
    // Manually dispatch storage event for same-tab updates
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'afp-verbose-logs',
        newValue: String(on),
      }),
    );
  }, []);

  return { verbose, setVerbose };
}

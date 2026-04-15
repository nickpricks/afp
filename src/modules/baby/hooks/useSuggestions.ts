import { useMemo } from 'react';

import { computeActiveSuggestions, type Suggestion } from '@/modules/baby/suggestions';
import type { Child } from '@/modules/baby/types';

/** Returns active suggestions for a single child */
export function useSuggestions(child: Child | null | undefined): Suggestion[] {
  return useMemo(() => {
    if (!child) return [];
    return computeActiveSuggestions(child);
  }, [child]);
}

/** Returns active suggestions across all children (for dashboard/toast aggregation) */
export function useAllSuggestions(children: Child[] | null | undefined): Suggestion[] {
  return useMemo(() => {
    if (!children || children.length === 0) return [];
    return children.flatMap((c) => computeActiveSuggestions(c));
  }, [children]);
}

import { useState } from 'react';

import { CONFIG } from '@/constants/config';
import { TimeRange } from '@/shared/types';

/** Snapshot of list control state — time-range, page, page size, show-all override. */
export interface ListControlsState {
  timeRange: TimeRange;
  pageSize: number;
  page: number;
  showAll: boolean;
}

/** Full list controls API: state + setters returned by useListControls. */
export interface ListControlsHandle extends ListControlsState {
  setTimeRange: (range: TimeRange) => void;
  setPageSize: (size: number) => void;
  setPage: (page: number) => void;
  setShowAll: (showAll: boolean) => void;
}

/**
 * Bundled session state for list controls. Per-list, never persisted.
 *
 * Note on `timeRange`: most lists own this directly via the hook, but some pages
 * (e.g. ExpenseListPage) hoist `timeRange` to share it across multiple lists
 * + summary. Those lists accept `timeRange`/`onTimeRangeChange` as props and
 * ignore the hook's own `timeRange`/`setTimeRange` (pagination + showAll still
 * come from the hook). The dead members on the returned handle are intentional —
 * keeping the API uniform avoids per-list hook variants.
 */
export function useListControls(defaults?: Partial<ListControlsState>): ListControlsHandle {
  const [timeRange, setTimeRangeState] = useState<TimeRange>(defaults?.timeRange ?? TimeRange.All);
  const [pageSize, setPageSizeState] = useState<number>(
    defaults?.pageSize ?? CONFIG.LIST_DEFAULT_PAGE_SIZE,
  );
  const [page, setPage] = useState<number>(defaults?.page ?? 1);
  const [showAll, setShowAll] = useState<boolean>(defaults?.showAll ?? false);

  /** Time-range change resets pagination and clears the show-all override */
  const setTimeRange = (range: TimeRange) => {
    setTimeRangeState(range);
    setPage(1);
    setShowAll(false);
  };

  /** Page-size change resets to page 1 (current page may not exist at the new size) */
  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setPage(1);
  };

  return { timeRange, pageSize, page, showAll, setTimeRange, setPageSize, setPage, setShowAll };
}

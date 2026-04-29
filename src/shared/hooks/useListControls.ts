import { useState } from 'react';

import { TimeRange } from '@/shared/types';

export interface ListControlsState {
  timeRange: TimeRange;
  pageSize: number;
  page: number;
  showAll: boolean;
}

export interface ListControlsHandle extends ListControlsState {
  setTimeRange: (range: TimeRange) => void;
  setPageSize: (size: number) => void;
  setPage: (page: number) => void;
  setShowAll: (showAll: boolean) => void;
}

/** Bundled session state for list controls. Per-list, never persisted. */
export function useListControls(defaults?: Partial<ListControlsState>): ListControlsHandle {
  const [timeRange, setTimeRangeState] = useState<TimeRange>(defaults?.timeRange ?? TimeRange.All);
  const [pageSize, setPageSizeState] = useState<number>(defaults?.pageSize ?? 25);
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

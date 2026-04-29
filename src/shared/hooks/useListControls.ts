import { useEffect, useState } from 'react';

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
  const [timeRange, setTimeRange] = useState<TimeRange>(defaults?.timeRange ?? TimeRange.All);
  const [pageSize, setPageSize] = useState<number>(defaults?.pageSize ?? 25);
  const [page, setPage] = useState<number>(defaults?.page ?? 1);
  const [showAll, setShowAll] = useState<boolean>(defaults?.showAll ?? false);

  useEffect(() => {
    setPage(1);
    setShowAll(false);
  }, [timeRange]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  return { timeRange, pageSize, page, showAll, setTimeRange, setPageSize, setPage, setShowAll };
}

import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useListControls } from '../useListControls';
import { CONFIG } from '@/constants/config';
import { TimeRange } from '@/shared/types';

/** Tests for useListControls page-reset and showAll behaviors. */
describe('useListControls', () => {
  it('initializes with All range, default page size, page 1, showAll false', () => {
    const { result } = renderHook(() => useListControls());
    expect(result.current.timeRange).toBe(TimeRange.All);
    expect(result.current.pageSize).toBe(CONFIG.LIST_DEFAULT_PAGE_SIZE);
    expect(result.current.page).toBe(1);
    expect(result.current.showAll).toBe(false);
  });

  it('accepts custom defaults', () => {
    const { result } = renderHook(() =>
      useListControls({ timeRange: TimeRange.Month, pageSize: 50 }),
    );
    expect(result.current.timeRange).toBe(TimeRange.Month);
    expect(result.current.pageSize).toBe(50);
  });

  it('resets page to 1 when timeRange changes', () => {
    const { result } = renderHook(() => useListControls());
    act(() => result.current.setPage(5));
    expect(result.current.page).toBe(5);

    act(() => result.current.setTimeRange(TimeRange.Week));
    expect(result.current.page).toBe(1);
  });

  it('resets page to 1 when pageSize changes', () => {
    const { result } = renderHook(() => useListControls());
    act(() => result.current.setPage(3));

    act(() => result.current.setPageSize(50));
    expect(result.current.page).toBe(1);
  });

  it('resets showAll to false when timeRange changes', () => {
    const { result } = renderHook(() => useListControls());
    act(() => result.current.setShowAll(true));
    expect(result.current.showAll).toBe(true);

    act(() => result.current.setTimeRange(TimeRange.Week));
    expect(result.current.showAll).toBe(false);
  });

  it('keeps showAll when only page changes', () => {
    const { result } = renderHook(() => useListControls());
    act(() => result.current.setShowAll(true));
    act(() => result.current.setPage(2));
    expect(result.current.showAll).toBe(true);
  });
});

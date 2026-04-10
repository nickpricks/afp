import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMinDelay } from '@/shared/hooks/useMinDelay';

describe('useMinDelay', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true initially and false after the delay', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useMinDelay(1000));

    expect(result.current).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current).toBe(false);
    vi.useRealTimers();
  });

  it('cleans up the timer on unmount', () => {
    vi.useFakeTimers();
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
    const { result: _result, unmount } = renderHook(() => useMinDelay(500));

    unmount();
    expect(clearSpy).toHaveBeenCalled();
    vi.useRealTimers();
  });
});

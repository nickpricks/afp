import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from '@testing-library/react';
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

import { SceneClimber } from '../SceneClimber';
import { SceneAthlete } from '../SceneAthlete';
import { SceneReader } from '../SceneReader';

describe('SceneClimber', () => {
  it('renders an SVG with the staircase', () => {
    const { container } = render(<SceneClimber />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(container.querySelector('.loading-stairs')).toBeInTheDocument();
    expect(container.querySelector('.loading-climber')).toBeInTheDocument();
  });
});

describe('SceneAthlete', () => {
  it('renders an SVG with the athlete figure', () => {
    const { container } = render(<SceneAthlete />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(container.querySelector('.loading-athlete')).toBeInTheDocument();
  });
});

describe('SceneReader', () => {
  it('renders an SVG with spectacles and papers', () => {
    const { container } = render(<SceneReader />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(container.querySelector('.loading-reader-head')).toBeInTheDocument();
    expect(container.querySelector('.loading-paper-left')).toBeInTheDocument();
  });
});

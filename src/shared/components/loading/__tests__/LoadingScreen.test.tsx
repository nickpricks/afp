import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { useMinDelay } from '@/shared/hooks/useMinDelay';

/** Tests for useMinDelay timer behavior and cleanup. */
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
    const { unmount } = renderHook(() => useMinDelay(500));

    unmount();
    expect(clearSpy).toHaveBeenCalled();
    vi.useRealTimers();
  });
});

import { SceneClimber } from '../SceneClimber';
import { SceneAthlete } from '../SceneAthlete';
import { SceneReader } from '../SceneReader';
import { LoadingScreen } from '../LoadingScreen';

/** Tests for SceneClimber staircase SVG rendering. */
describe('SceneClimber', () => {
  it('renders an SVG with the staircase', () => {
    const { container } = render(<SceneClimber />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(container.querySelector('.loading-stairs')).toBeInTheDocument();
    expect(container.querySelector('.loading-climber')).toBeInTheDocument();
  });
});

/** Tests for SceneAthlete boxer figure SVG rendering. */
describe('SceneAthlete', () => {
  it('renders an SVG with the athlete figure', () => {
    const { container } = render(<SceneAthlete />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(container.querySelector('.loading-athlete')).toBeInTheDocument();
  });
});

/** Tests for SceneReader spectacles-and-papers SVG rendering. */
describe('SceneReader', () => {
  it('renders an SVG with spectacles and papers', () => {
    const { container } = render(<SceneReader />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(container.querySelector('.loading-reader-head')).toBeInTheDocument();
    expect(container.querySelector('.loading-paper-left')).toBeInTheDocument();
  });
});

/** Tests for LoadingScreen random-scene selection and brand text. */
describe('LoadingScreen', () => {
  it('renders one of the three scenes', () => {
    const { container } = render(<LoadingScreen />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('shows brand text by default', () => {
    render(<LoadingScreen />);
    expect(screen.getByLabelText('It Started On April Fools Day')).toBeInTheDocument();
  });

  it('hides brand text when showText is false', () => {
    render(<LoadingScreen showText={false} />);
    expect(screen.queryByLabelText('It Started On April Fools Day')).not.toBeInTheDocument();
  });
});

import { AnimationViewer } from '../../AnimationViewer';

/** Tests for AnimationViewer scene-toggle and text-checkbox controls. */
describe('AnimationViewer', () => {
  it('renders all three scenes when All is selected', () => {
    const { container } = render(<AnimationViewer />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(3);
  });

  it('renders the text toggle checkbox', () => {
    render(<AnimationViewer />);
    expect(screen.getByLabelText('Show text')).toBeInTheDocument();
  });
});

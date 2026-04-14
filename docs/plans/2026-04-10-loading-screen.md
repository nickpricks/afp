# Loading Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add three randomized stick-figure loading animations (climber, athlete, reader) shown during auth resolution and page transitions, plus a dedicated animation viewer page.

**Architecture:** A `LoadingScreen` shell component randomly selects one of three SVG scene components on mount. All keyframe animations live in a shared CSS file. A `useMinDelay` hook enforces 1s minimum display. Route components are lazy-loaded with `<Suspense fallback={<LoadingScreen />}>` for page transition coverage.

**Tech Stack:** React 19, SVG, CSS keyframes, React.lazy + Suspense, vitest + testing-library

**Spec:** `docs/specs/2026-04-10-loading-screen-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/shared/hooks/useMinDelay.ts` | Hook: returns `true` for N ms after mount, then `false` |
| Create | `src/themes/loading.css` | All `@keyframes` for loading animations (shared across 3 scenes) |
| Create | `src/shared/components/loading/SceneClimber.tsx` | SVG: 5-step staircase + climbing stick figure |
| Create | `src/shared/components/loading/SceneAthlete.tsx` | SVG: running/boxing stick figure |
| Create | `src/shared/components/loading/SceneReader.tsx` | SVG: head+torso with spectacles + papers |
| Create | `src/shared/components/loading/LoadingScreen.tsx` | Shell: bg, random scene pick, brand text |
| Create | `src/shared/components/AnimationViewer.tsx` | Viewer page: pill switcher + text checkbox |
| Create | `src/shared/components/loading/__tests__/LoadingScreen.test.tsx` | Tests for LoadingScreen + useMinDelay |
| Modify | `src/index.css:12` | Add `@import './themes/loading.css'` |
| Modify | `src/shared/components/Layout.tsx:16-21` | Replace `"Loading..."` with `<LoadingScreen />` + `useMinDelay` |
| Modify | `src/App.tsx` | Lazy-load route components + Suspense fallback |
| Modify | `src/constants/routes.ts` | Add `AppPath.Animations` + `ROUTES.ANIMATIONS` |
| Modify | `src/shared/components/DebugPage.tsx` | Add link to Animation Viewer |

---

### Task 1: useMinDelay Hook

**Files:**
- Create: `src/shared/hooks/useMinDelay.ts`
- Create: `src/shared/components/loading/__tests__/LoadingScreen.test.tsx`

- [x] **Step 1: Write the failing test**

```tsx
// src/shared/components/loading/__tests__/LoadingScreen.test.tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// We'll import useMinDelay once it exists
// import { useMinDelay } from '@/shared/hooks/useMinDelay';

describe('useMinDelay', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true initially and false after the delay', () => {
    vi.useFakeTimers();
    const { useMinDelay } = require('@/shared/hooks/useMinDelay');
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
    const { useMinDelay } = require('@/shared/hooks/useMinDelay');
    const { unmount } = renderHook(() => useMinDelay(500));

    unmount();
    expect(clearSpy).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/shared/components/loading/__tests__/LoadingScreen.test.tsx`
Expected: FAIL — module `@/shared/hooks/useMinDelay` not found

- [x] **Step 3: Write the hook**

```ts
// src/shared/hooks/useMinDelay.ts
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
```

- [x] **Step 4: Run test to verify it passes**

Run: `bunx vitest run src/shared/components/loading/__tests__/LoadingScreen.test.tsx`
Expected: 2 tests PASS

- [x] **Step 5: Commit**

```bash
git add src/shared/hooks/useMinDelay.ts src/shared/components/loading/__tests__/LoadingScreen.test.tsx
git commit -m "feat(loading): add useMinDelay hook with tests"
```

---

### Task 2: Loading CSS Keyframes

**Files:**
- Create: `src/themes/loading.css`
- Modify: `src/index.css:12`

- [x] **Step 1: Create the shared keyframes CSS file**

```css
/* src/themes/loading.css */

/* ── Loading Screen Animations ──────────────────────────────── */

/* Staircase draws itself via stroke-dashoffset */
.loading-stairs {
  stroke-dasharray: 200;
  stroke-dashoffset: 200;
  animation: loading-draw 0.8s ease-out forwards;
}

/* Step flash — each step lights up when climber arrives */
.loading-step {
  opacity: 0;
  animation: loading-step-flash 3s ease infinite;
}

/* Climber translates across 5 steps */
.loading-climber {
  will-change: transform;
  animation: loading-climb 3s ease infinite;
}

/* Accent glow halo on all figures */
.loading-glow {
  animation: loading-glow-pulse 2s ease-in-out infinite;
}

/* Two-frame walk cycle — frame A (stride: arms/legs spread) */
.loading-frame-a {
  animation: loading-frame-toggle 0.6s step-end infinite;
}

/* Two-frame walk cycle — frame B (gather: arms/legs compact) */
.loading-frame-b {
  animation: loading-frame-toggle 0.6s step-end infinite;
  animation-direction: reverse;
}

/* Athlete running phase */
.loading-athlete {
  will-change: transform;
  animation: loading-athlete-bounce 3s ease infinite;
}

/* Athlete punch combo */
.loading-punch-a {
  animation: loading-frame-toggle 0.4s step-end infinite;
}

.loading-punch-b {
  animation: loading-frame-toggle 0.4s step-end infinite;
  animation-direction: reverse;
}

/* Reader head tilt */
.loading-reader-head {
  animation: loading-reader-tilt 3s ease infinite;
}

/* Reader paper shuffle */
.loading-paper-left {
  animation: loading-paper-left-move 3s ease infinite;
}

.loading-paper-right {
  animation: loading-paper-right-move 3s ease infinite;
}

/* Brand text letter fade-up */
.loading-letter {
  display: inline-block;
  opacity: 0;
  animation: loading-letter-in 0.4s ease forwards;
}

/* ── Keyframes ──────────────────────────────────────────────── */

@keyframes loading-draw {
  to { stroke-dashoffset: 0; }
}

@keyframes loading-step-flash {
  0% { opacity: 0; }
  4% { opacity: 0.9; }
  20% { opacity: 0; }
}

/* Climber feet-on-step positions: figure origin at feet */
@keyframes loading-climb {
  0%, 8%   { transform: translate(22px, 98px); }
  16%, 24% { transform: translate(46px, 81px); }
  32%, 40% { transform: translate(70px, 64px); }
  48%, 56% { transform: translate(94px, 47px); }
  64%, 80% { transform: translate(118px, 30px); }
  90%, 100% { transform: translate(22px, 98px); }
}

@keyframes loading-frame-toggle {
  0%  { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes loading-glow-pulse {
  0%, 100% { opacity: 0.08; }
  50% { opacity: 0.25; }
}

@keyframes loading-letter-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Athlete: subtle vertical bounce while running/boxing */
@keyframes loading-athlete-bounce {
  0%, 100% { transform: translateY(0); }
  25%      { transform: translateY(-2px); }
  50%      { transform: translateY(0); }
  75%      { transform: translateY(-2px); }
}

/* Reader: head tilts left then right */
@keyframes loading-reader-tilt {
  0%, 20%  { transform: rotate(0deg); }
  30%, 50% { transform: rotate(-6deg); }
  60%, 80% { transform: rotate(6deg); }
  90%, 100% { transform: rotate(0deg); }
}

/* Reader: left paper shifts up when being read */
@keyframes loading-paper-left-move {
  0%, 20%  { transform: translateY(0); }
  30%, 50% { transform: translateY(-3px); }
  60%, 100% { transform: translateY(0); }
}

/* Reader: right paper shifts up when being read */
@keyframes loading-paper-right-move {
  0%, 50%  { transform: translateY(0); }
  60%, 80% { transform: translateY(-3px); }
  90%, 100% { transform: translateY(0); }
}
```

- [x] **Step 2: Add import to index.css**

In `src/index.css`, after line 12 (`@import './themes/effects.css';`), add:

```css
@import './themes/loading.css';
```

- [x] **Step 3: Verify build compiles**

Run: `bun run build 2>&1 | tail -3`
Expected: Build succeeds (CSS file is valid, import resolves)

- [x] **Step 4: Commit**

```bash
git add src/themes/loading.css src/index.css
git commit -m "feat(loading): add shared loading animation keyframes"
```

---

### Task 3: SceneClimber Component

**Files:**
- Create: `src/shared/components/loading/SceneClimber.tsx`

- [x] **Step 1: Add render test to the test file**

Append to `src/shared/components/loading/__tests__/LoadingScreen.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { SceneClimber } from '../SceneClimber';

describe('SceneClimber', () => {
  it('renders an SVG with the staircase', () => {
    const { container } = render(<SceneClimber />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(container.querySelector('.loading-stairs')).toBeInTheDocument();
    expect(container.querySelector('.loading-climber')).toBeInTheDocument();
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/shared/components/loading/__tests__/LoadingScreen.test.tsx`
Expected: FAIL — `SceneClimber` module not found

- [x] **Step 3: Create SceneClimber component**

```tsx
// src/shared/components/loading/SceneClimber.tsx

const STEP_DELAYS = [0, 0.42, 0.96, 1.5, 2.04];

/** SVG stick figure climbing a 5-step staircase — ported from Floor-Tracker */
export function SceneClimber() {
  return (
    <svg viewBox="0 0 140 110" className="w-48 overflow-visible" aria-hidden="true">
      {/* Staircase outline — draws itself on mount */}
      <polyline
        className="loading-stairs"
        points="10,98 34,98 34,81 58,81 58,64 82,64 82,47 106,47 106,30 130,30"
        fill="none"
        stroke="var(--text-subtle)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Step flash highlights */}
      {Array.from({ length: 5 }, (_, i) => {
        const x = 10 + i * 24;
        const y = 98 - i * 17;
        return (
          <line
            key={i}
            x1={x} y1={y} x2={x + 24} y2={y}
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="loading-step"
            style={{ animationDelay: `${STEP_DELAYS[i]}s` }}
          />
        );
      })}

      {/* Climbing stick figure — origin at feet */}
      <g className="loading-climber">
        <circle cx="0" cy="-10" r="12" fill="var(--accent)" className="loading-glow" />
        <circle cx="0" cy="-18" r="3.5" fill="var(--accent)" />
        <line x1="0" y1="-14.5" x2="0" y2="-6" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />

        {/* Frame A: stride */}
        <g className="loading-frame-a">
          <line x1="0" y1="-12" x2="-4" y2="-8" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="0" y1="-12" x2="4.5" y2="-9" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="0" y1="-6" x2="3.5" y2="-0.5" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="0" y1="-6" x2="-3" y2="1" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
        </g>

        {/* Frame B: gather */}
        <g className="loading-frame-b">
          <line x1="0" y1="-12" x2="-2" y2="-8" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="0" y1="-12" x2="2.5" y2="-8.5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="0" y1="-6" x2="1.5" y2="0.5" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="0" y1="-6" x2="-1" y2="0.5" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `bunx vitest run src/shared/components/loading/__tests__/LoadingScreen.test.tsx`
Expected: All tests PASS (useMinDelay × 2 + SceneClimber × 1)

- [x] **Step 5: Commit**

```bash
git add src/shared/components/loading/SceneClimber.tsx src/shared/components/loading/__tests__/LoadingScreen.test.tsx
git commit -m "feat(loading): add SceneClimber SVG component"
```

---

### Task 4: SceneAthlete Component

**Files:**
- Create: `src/shared/components/loading/SceneAthlete.tsx`
- Modify: `src/shared/components/loading/__tests__/LoadingScreen.test.tsx`

- [x] **Step 1: Add render test**

Append to the test file:

```tsx
import { SceneAthlete } from '../SceneAthlete';

describe('SceneAthlete', () => {
  it('renders an SVG with the athlete figure', () => {
    const { container } = render(<SceneAthlete />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(container.querySelector('.loading-athlete')).toBeInTheDocument();
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/shared/components/loading/__tests__/LoadingScreen.test.tsx`
Expected: FAIL — `SceneAthlete` module not found

- [x] **Step 3: Create SceneAthlete component**

```tsx
// src/shared/components/loading/SceneAthlete.tsx

/** SVG stick figure alternating between running and boxing poses */
export function SceneAthlete() {
  return (
    <svg viewBox="0 0 80 80" className="w-48 overflow-visible" aria-hidden="true">
      {/* Ground line */}
      <line
        x1="10" y1="72" x2="70" y2="72"
        stroke="var(--text-subtle)" strokeWidth="1.5" strokeLinecap="round"
        className="loading-stairs"
      />

      {/* Figure group — subtle bounce */}
      <g className="loading-athlete" style={{ transformOrigin: '40px 72px' }}>
        {/* Glow halo */}
        <circle cx="40" cy="42" r="14" fill="var(--accent)" className="loading-glow" />

        {/* Head */}
        <circle cx="40" cy="30" r="4" fill="var(--accent)" />

        {/* Torso */}
        <line x1="40" y1="34" x2="40" y2="52" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />

        {/* Frame A: running stride — arms pumping, legs spread */}
        <g className="loading-frame-a">
          {/* Arms */}
          <line x1="40" y1="38" x2="33" y2="44" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="40" y1="38" x2="48" y2="42" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          {/* Legs */}
          <line x1="40" y1="52" x2="34" y2="65" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
          <line x1="34" y1="65" x2="32" y2="72" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
          <line x1="40" y1="52" x2="47" y2="63" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
          <line x1="47" y1="63" x2="50" y2="72" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Frame B: boxing guard — fists up, compact stance */}
        <g className="loading-frame-b">
          {/* Arms — fists raised */}
          <line x1="40" y1="38" x2="34" y2="34" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="34" cy="33" r="1.5" fill="var(--accent)" />
          <line x1="40" y1="38" x2="47" y2="36" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="47" cy="35" r="1.5" fill="var(--accent)" />
          {/* Legs — wider boxing stance */}
          <line x1="40" y1="52" x2="33" y2="72" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
          <line x1="40" y1="52" x2="47" y2="72" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `bunx vitest run src/shared/components/loading/__tests__/LoadingScreen.test.tsx`
Expected: All tests PASS

- [x] **Step 5: Commit**

```bash
git add src/shared/components/loading/SceneAthlete.tsx src/shared/components/loading/__tests__/LoadingScreen.test.tsx
git commit -m "feat(loading): add SceneAthlete SVG component"
```

---

### Task 5: SceneReader Component

**Files:**
- Create: `src/shared/components/loading/SceneReader.tsx`
- Modify: `src/shared/components/loading/__tests__/LoadingScreen.test.tsx`

- [x] **Step 1: Add render test**

Append to the test file:

```tsx
import { SceneReader } from '../SceneReader';

describe('SceneReader', () => {
  it('renders an SVG with spectacles and papers', () => {
    const { container } = render(<SceneReader />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(container.querySelector('.loading-reader-head')).toBeInTheDocument();
    expect(container.querySelector('.loading-paper-left')).toBeInTheDocument();
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/shared/components/loading/__tests__/LoadingScreen.test.tsx`
Expected: FAIL — `SceneReader` module not found

- [x] **Step 3: Create SceneReader component**

```tsx
// src/shared/components/loading/SceneReader.tsx

/** SVG head+torso stick figure with spectacles, comparing two papers */
export function SceneReader() {
  return (
    <svg viewBox="0 0 80 70" className="w-48 overflow-visible" aria-hidden="true">
      {/* Desk line */}
      <line
        x1="15" y1="60" x2="65" y2="60"
        stroke="var(--text-subtle)" strokeWidth="1.5" strokeLinecap="round"
        className="loading-stairs"
      />

      {/* Glow halo */}
      <circle cx="40" cy="32" r="14" fill="var(--accent)" className="loading-glow" />

      {/* Head group — tilts left/right */}
      <g className="loading-reader-head" style={{ transformOrigin: '40px 24px' }}>
        {/* Head */}
        <circle cx="40" cy="18" r="5" fill="var(--accent)" />

        {/* Spectacles — two circles with bridge */}
        <circle cx="37" cy="18" r="2.5" fill="none" stroke="var(--accent)" strokeWidth="0.8" />
        <circle cx="43" cy="18" r="2.5" fill="none" stroke="var(--accent)" strokeWidth="0.8" />
        <line x1="39.5" y1="18" x2="40.5" y2="18" stroke="var(--accent)" strokeWidth="0.8" />
        {/* Temple arms */}
        <line x1="34.5" y1="18" x2="33" y2="16" stroke="var(--accent)" strokeWidth="0.8" strokeLinecap="round" />
        <line x1="45.5" y1="18" x2="47" y2="16" stroke="var(--accent)" strokeWidth="0.8" strokeLinecap="round" />
      </g>

      {/* Torso */}
      <line x1="40" y1="23" x2="40" y2="42" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />

      {/* Left arm + paper */}
      <g className="loading-paper-left">
        <line x1="40" y1="30" x2="28" y2="38" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Paper — angled rectangle */}
        <rect x="20" y="36" width="10" height="14" rx="1"
          fill="none" stroke="var(--accent)" strokeWidth="1"
          transform="rotate(-5 25 43)" />
        <line x1="22" y1="40" x2="28" y2="40" stroke="var(--accent)" strokeWidth="0.5" opacity="0.5" transform="rotate(-5 25 43)" />
        <line x1="22" y1="43" x2="27" y2="43" stroke="var(--accent)" strokeWidth="0.5" opacity="0.5" transform="rotate(-5 25 43)" />
      </g>

      {/* Right arm + paper */}
      <g className="loading-paper-right">
        <line x1="40" y1="30" x2="52" y2="38" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Paper — angled rectangle */}
        <rect x="50" y="36" width="10" height="14" rx="1"
          fill="none" stroke="var(--accent)" strokeWidth="1"
          transform="rotate(5 55 43)" />
        <line x1="52" y1="40" x2="58" y2="40" stroke="var(--accent)" strokeWidth="0.5" opacity="0.5" transform="rotate(5 55 43)" />
        <line x1="52" y1="43" x2="57" y2="43" stroke="var(--accent)" strokeWidth="0.5" opacity="0.5" transform="rotate(5 55 43)" />
      </g>
    </svg>
  );
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `bunx vitest run src/shared/components/loading/__tests__/LoadingScreen.test.tsx`
Expected: All tests PASS

- [x] **Step 5: Commit**

```bash
git add src/shared/components/loading/SceneReader.tsx src/shared/components/loading/__tests__/LoadingScreen.test.tsx
git commit -m "feat(loading): add SceneReader SVG component"
```

---

### Task 6: LoadingScreen Shell

**Files:**
- Create: `src/shared/components/loading/LoadingScreen.tsx`
- Modify: `src/shared/components/loading/__tests__/LoadingScreen.test.tsx`

- [x] **Step 1: Add tests for LoadingScreen**

Append to the test file:

```tsx
import { LoadingScreen } from '../LoadingScreen';

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
```

- [x] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/shared/components/loading/__tests__/LoadingScreen.test.tsx`
Expected: FAIL — `LoadingScreen` module not found

- [x] **Step 3: Create LoadingScreen component**

```tsx
// src/shared/components/loading/LoadingScreen.tsx
import { useMemo } from 'react';

import { SceneClimber } from '@/shared/components/loading/SceneClimber';
import { SceneAthlete } from '@/shared/components/loading/SceneAthlete';
import { SceneReader } from '@/shared/components/loading/SceneReader';

const SCENES = [SceneClimber, SceneAthlete, SceneReader] as const;

export const BRAND_TEXT = 'IT STARTED ON APRIL FOOLS DAY';

interface LoadingScreenProps {
  showText?: boolean;
}

/** Full-screen loading overlay with a randomly selected stick-figure animation */
export function LoadingScreen({ showText = true }: LoadingScreenProps) {
  const Scene = useMemo(() => SCENES[Math.floor(Math.random() * SCENES.length)], []);

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-8">
      <Scene />

      {showText && (
        <div
          className="font-mono text-[11px] tracking-[0.25em] uppercase flex"
          aria-label="It Started On April Fools Day"
        >
          {BRAND_TEXT.split('').map((char, i) => (
            <span
              key={i}
              className="loading-letter text-fg-subtle"
              style={{ animationDelay: `${0.3 + i * 0.06}s` }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `bunx vitest run src/shared/components/loading/__tests__/LoadingScreen.test.tsx`
Expected: All tests PASS

- [x] **Step 5: Commit**

```bash
git add src/shared/components/loading/LoadingScreen.tsx src/shared/components/loading/__tests__/LoadingScreen.test.tsx
git commit -m "feat(loading): add LoadingScreen shell with random scene + brand text"
```

---

### Task 7: Integrate into Layout (Auth Gate)

**Files:**
- Modify: `src/shared/components/Layout.tsx:1-21`

- [x] **Step 1: Update Layout imports and loading state**

Replace the loading block in `Layout.tsx`. Add imports at top:

```tsx
import { LoadingScreen } from '@/shared/components/loading/LoadingScreen';
import { useMinDelay } from '@/shared/hooks/useMinDelay';
```

Replace lines 16-22 (the `if (isLoading)` block) with:

```tsx
  const minDelayActive = useMinDelay(1000);

  if (isLoading || minDelayActive) {
    return <LoadingScreen />;
  }
```

Note: `useMinDelay` must be called unconditionally (React hook rules), so declare it before the early returns.

- [x] **Step 2: Verify the app builds**

Run: `bun run build 2>&1 | tail -3`
Expected: Build succeeds

- [x] **Step 3: Run existing tests to verify no regressions**

Run: `bunx vitest run`
Expected: All tests PASS

- [x] **Step 4: Commit**

```bash
git add src/shared/components/Layout.tsx
git commit -m "feat(loading): replace Loading... text with LoadingScreen in Layout"
```

---

### Task 8: Lazy-Load Routes with Suspense

**Files:**
- Modify: `src/App.tsx`

- [x] **Step 1: Convert static imports to React.lazy**

Replace the component imports (lines 11-20) with lazy imports and add a Suspense wrapper:

```tsx
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from '@/shared/auth/auth-context';
import { ToastProvider } from '@/shared/errors/toast-context';
import { ErrorBoundary } from '@/shared/errors/ErrorBoundary';
import { Layout } from '@/shared/components/Layout';
import { ModuleGate } from '@/shared/components/ModuleGate';
import { AdminGate } from '@/shared/components/AdminGate';
import { LoadingScreen } from '@/shared/components/loading/LoadingScreen';
import { ModuleId } from '@/shared/types';
import { ROUTES } from '@/constants/routes';
import { CONFIG } from '@/constants/config';
import { applyTheme } from '@/themes/themes';

const InviteRedeem = lazy(() => import('@/shared/auth/InviteRedeem').then(m => ({ default: m.InviteRedeem })));
const AdminPanel = lazy(() => import('@/admin/components/AdminPanel').then(m => ({ default: m.AdminPanel })));
const InviteGenerator = lazy(() => import('@/admin/components/InviteGenerator').then(m => ({ default: m.InviteGenerator })));
const DebugPage = lazy(() => import('@/shared/components/DebugPage').then(m => ({ default: m.DebugPage })));
const ProfilePage = lazy(() => import('@/shared/components/ProfilePage').then(m => ({ default: m.ProfilePage })));
const BodyPage = lazy(() => import('@/modules/body/components/BodyPage').then(m => ({ default: m.BodyPage })));
const ExpenseListPage = lazy(() => import('@/modules/expenses/pages/ExpenseListPage').then(m => ({ default: m.ExpenseListPage })));
const AddExpensePage = lazy(() => import('@/modules/expenses/pages/AddExpensePage').then(m => ({ default: m.AddExpensePage })));
const BabyLanding = lazy(() => import('@/modules/baby/components/BabyLanding').then(m => ({ default: m.BabyLanding })));
const ChildDetail = lazy(() => import('@/modules/baby/components/ChildDetail').then(m => ({ default: m.ChildDetail })));
const Dashboard = lazy(() => import('@/shared/components/Dashboard').then(m => ({ default: m.Dashboard })));
const AnimationViewer = lazy(() => import('@/shared/components/AnimationViewer').then(m => ({ default: m.AnimationViewer })));
```

- [x] **Step 2: Wrap Routes with Suspense**

Replace the `<Routes>` block in the App component with:

```tsx
<Suspense fallback={<LoadingScreen />}>
  <Routes>
    <Route path={ROUTES.INVITE} element={<InviteRedeem />} />
    <Route element={<Layout />}>
      <Route path={ROUTES.HOME} element={<Dashboard />} />
      <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
      <Route path={ROUTES.BODY} element={<ModuleGate moduleId={ModuleId.Body}><BodyPage /></ModuleGate>} />
      <Route path={ROUTES.BUDGET} element={<ModuleGate moduleId={ModuleId.Budget}><ExpenseListPage /></ModuleGate>} />
      <Route path={ROUTES.BUDGET_ADD} element={<ModuleGate moduleId={ModuleId.Budget}><AddExpensePage /></ModuleGate>} />
      <Route path={ROUTES.BABY} element={<ModuleGate moduleId={ModuleId.Baby}><BabyLanding /></ModuleGate>} />
      <Route path={ROUTES.BABY_CHILD} element={<ModuleGate moduleId={ModuleId.Baby}><ChildDetail /></ModuleGate>} />
      <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
      <Route path={ROUTES.ADMIN} element={<AdminGate><AdminPanel /></AdminGate>} />
      <Route path={ROUTES.ADMIN_INVITES} element={<AdminGate><InviteGenerator /></AdminGate>} />
      <Route path={ROUTES.DEBUG} element={<DebugPage />} />
      <Route path={ROUTES.ANIMATIONS} element={<AnimationViewer />} />
    </Route>
  </Routes>
</Suspense>
```

- [x] **Step 3: Verify build and tests**

Run: `bun run build 2>&1 | tail -3 && bunx vitest run`
Expected: Build succeeds, all tests PASS

- [x] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat(loading): lazy-load routes with Suspense + LoadingScreen fallback"
```

---

### Task 9: Route + AnimationViewer Page

**Files:**
- Modify: `src/constants/routes.ts`
- Create: `src/shared/components/AnimationViewer.tsx`
- Modify: `src/shared/components/DebugPage.tsx`
- Modify: `src/shared/components/loading/__tests__/LoadingScreen.test.tsx`

- [x] **Step 1: Add route constant**

In `src/constants/routes.ts`, add to `AppPath` enum:

```ts
Animations = '/animations',
```

Add to `ROUTES`:

```ts
ANIMATIONS: AppPath.Animations,
```

- [x] **Step 2: Add AnimationViewer test**

Append to the test file:

```tsx
import { AnimationViewer } from '../../AnimationViewer';

describe('AnimationViewer', () => {
  it('renders all three scenes when "All" is selected', () => {
    const { container } = render(<AnimationViewer />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(3);
  });

  it('renders the text toggle checkbox', () => {
    render(<AnimationViewer />);
    expect(screen.getByLabelText('Show text')).toBeInTheDocument();
  });
});
```

- [x] **Step 3: Run test to verify it fails**

Run: `bunx vitest run src/shared/components/loading/__tests__/LoadingScreen.test.tsx`
Expected: FAIL — `AnimationViewer` module not found

- [x] **Step 4: Create AnimationViewer component**

```tsx
// src/shared/components/AnimationViewer.tsx
import { useState } from 'react';

import { SceneClimber } from '@/shared/components/loading/SceneClimber';
import { SceneAthlete } from '@/shared/components/loading/SceneAthlete';
import { SceneReader } from '@/shared/components/loading/SceneReader';
import { BRAND_TEXT } from '@/shared/components/loading/LoadingScreen';

const TABS = ['All', 'Climber', 'Athlete', 'Reader'] as const;
type Tab = (typeof TABS)[number];

/** Dedicated page for previewing loading animations with scene and text controls */
export function AnimationViewer() {
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [showText, setShowText] = useState(true);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-lg font-bold mb-4">Animation Viewer</h1>

      {/* Pill switcher */}
      <div className="flex gap-1 mb-4 bg-surface-card rounded-lg p-1 border border-line w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-accent text-fg-on-accent'
                : 'text-fg-muted hover:text-fg'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Text checkbox */}
      <label className="flex items-center gap-2 mb-6 text-sm text-fg-muted cursor-pointer">
        <input
          type="checkbox"
          checked={showText}
          onChange={(e) => setShowText(e.target.checked)}
          className="accent-[var(--accent)]"
        />
        Show text
      </label>

      {/* Scene display */}
      <div className={`grid gap-8 ${activeTab === 'All' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1'}`}>
        {(activeTab === 'All' || activeTab === 'Climber') && (
          <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-surface border border-line">
            <SceneClimber />
            {showText && <BrandText />}
            <p className="text-xs text-fg-muted">Climber</p>
          </div>
        )}
        {(activeTab === 'All' || activeTab === 'Athlete') && (
          <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-surface border border-line">
            <SceneAthlete />
            {showText && <BrandText />}
            <p className="text-xs text-fg-muted">Athlete</p>
          </div>
        )}
        {(activeTab === 'All' || activeTab === 'Reader') && (
          <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-surface border border-line">
            <SceneReader />
            {showText && <BrandText />}
            <p className="text-xs text-fg-muted">Reader</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Staggered letter reveal for the brand text */
function BrandText() {
  return (
    <div
      className="font-mono text-[9px] tracking-[0.2em] uppercase flex flex-wrap justify-center"
      aria-label="It Started On April Fools Day"
    >
      {BRAND_TEXT.split('').map((char, i) => (
        <span
          key={i}
          className="loading-letter text-fg-subtle"
          style={{ animationDelay: `${0.3 + i * 0.06}s` }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </div>
  );
}
```

- [x] **Step 5: Add link in DebugPage**

In `src/shared/components/DebugPage.tsx`, add import at top:

```tsx
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
```

After the `<DevBench />` div (before the closing `</div>` of the component), add:

```tsx
<div className="mt-6">
  <Link
    to={ROUTES.ANIMATIONS}
    className="text-sm text-accent hover:underline"
  >
    Animation Viewer →
  </Link>
</div>
```

- [x] **Step 6: Run tests to verify**

Run: `bunx vitest run src/shared/components/loading/__tests__/LoadingScreen.test.tsx`
Expected: All tests PASS

- [x] **Step 7: Verify full build**

Run: `bun run build 2>&1 | tail -3`
Expected: Build succeeds

- [x] **Step 8: Commit**

```bash
git add src/constants/routes.ts src/shared/components/AnimationViewer.tsx src/shared/components/DebugPage.tsx src/shared/components/loading/__tests__/LoadingScreen.test.tsx
git commit -m "feat(loading): add AnimationViewer page with scene switcher + text toggle"
```

---

### Task 10: Run Full Test Suite + Lint

**Files:** None (verification only)

- [x] **Step 1: Run full unit test suite**

Run: `bunx vitest run`
Expected: All tests PASS (295 existing + ~9 new = ~304)

- [x] **Step 2: Run lint**

Run: `bun run lint`
Expected: 0 errors

- [x] **Step 3: Run E2E tests**

Run: `bun run test:e2e`
Expected: All 42 E2E tests PASS

- [x] **Step 4: Run build**

Run: `bun run build`
Expected: Build succeeds with no errors

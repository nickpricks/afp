# Loading Screen Design — 2026-04-10

## Overview

Three animated stick-figure SVG scenes, randomly selected on each mount. Shown during auth resolution (1s minimum) and page transitions. Brand text configurable. Dedicated animation viewer page for previewing all scenes.

## Scenes

### Scene 1 — Climber (ported from Floor-Tracker)

- 5-step staircase draws itself via `stroke-dashoffset` animation
- Stick figure climbs step by step using translate keyframes
- Two-frame walk cycle: stride (arms/legs spread) and gather (compact), toggling every 0.3s
- Accent-colored glow halo pulses on torso
- 3s loop

### Scene 2 — Athlete

- Full stick figure centered in viewport
- Two-phase loop (~1.5s each, 3s total):
  - **Running**: arms pumping, legs striding — same two-frame stride/gather technique as climber
  - **Boxing**: fists up, jab/cross alternation — two frames (jab extended / guard position)
- Same glow halo as climber

### Scene 3 — Reader

- Head and torso only (no legs — seated implied)
- Round spectacles on face (two small SVG circles with bridge line)
- Holds two papers (simple rectangles, angled slightly)
- Alternates looking left paper → right paper (subtle head tilt + paper position shift)
- Occasional chin-stroke frame for variety
- 3s loop

### Shared Animation Properties

- All scenes use `var(--accent)` for figure/glow, `var(--text-subtle)` for background elements — fully theme-aware across all 10 themes
- Same glow halo effect (opacity pulse 0.08 → 0.25)
- SVG `viewBox` sized consistently so all scenes occupy the same visual footprint
- CSS animations defined in a shared `loading.css` file; scenes reference class names

## Brand Text

"IT STARTED ON APRIL FOOLS DAY" displayed below the animation with staggered letter reveal (0.06s delay per character, fade-up from 4px below).

Controlled by `showText` prop on `LoadingScreen`:

```ts
interface LoadingScreenProps {
  showText?: boolean; // default: true
}
```

Hardcoded to `true` at all call sites for now. The prop exists so it can be toggled off in the future without code changes.

## Where It Appears

### 1. Auth Gate (Layout.tsx)

Replaces the current `"Loading..."` text at `Layout.tsx:16-21`. Renders `<LoadingScreen />` while `isLoading` is true.

**Minimum display time**: 1s. A `useMinDelay(1000)` hook returns `true` for 1000ms after mount, then `false`. The loading screen shows while `isLoading || minDelayActive`. This ensures the animation has time to play even when auth resolves instantly (e.g., dev mode).

### 2. Page Transitions (App.tsx)

Route components wrapped in `React.lazy()` with `<Suspense fallback={<LoadingScreen />}>`. Each navigation to a lazy-loaded page shows a randomly selected loading scene.

### 3. Animation Viewer Page

Accessible from the Debug page (dev mode). Dedicated page for previewing loading animations.

**Controls:**
- **Pill switcher**: All | Climber | Athlete | Reader — selects which scene(s) to display
- **"Show text" checkbox**: Toggles the brand text on/off for preview

When "All" is selected, renders all 3 scenes in a grid. Individual selection shows one scene full-width, looping continuously.

Route: added to existing debug/profile navigation. Not a module-gated route.

## File Structure

```
src/shared/components/loading/
  LoadingScreen.tsx      — shell: full-screen bg-surface, random scene pick, brand text, showText prop
  SceneClimber.tsx       — SVG: 5-step staircase + climbing stick figure
  SceneAthlete.tsx       — SVG: running/boxing stick figure
  SceneReader.tsx        — SVG: head+torso with spectacles + papers

src/shared/components/AnimationViewer.tsx  — viewer page with pill switcher + text checkbox

src/themes/loading.css   — all @keyframes for loading animations (shared across scenes)

src/shared/hooks/useMinDelay.ts  — useMinDelay(ms): returns true for N ms, then false
```

**6 new files**, 1 modified CSS import (`index.css` imports `loading.css`).

## Hook: useMinDelay

```ts
/** Returns true for the specified duration after mount, then false */
const useMinDelay = (ms: number): boolean => {
  const [active, setActive] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setActive(false), ms);
    return () => clearTimeout(timer);
  }, [ms]);
  return active;
};
```

~8 lines. Used in Layout.tsx to combine with `isLoading`.

## Integration Points

- `Layout.tsx`: Replace `"Loading..."` div with `<LoadingScreen />` + `useMinDelay`
- `App.tsx`: Wrap route content in `<Suspense fallback={<LoadingScreen />}>`
- `index.css`: Add `@import './themes/loading.css'`
- Debug page: Add link/route to Animation Viewer
- `constants/routes.ts`: Add `AppPath.AnimationViewer` if routed (or inline in debug page)

## Randomization

`LoadingScreen` picks a scene on mount:

```ts
const SCENES = [SceneClimber, SceneAthlete, SceneReader] as const;
const Scene = SCENES[Math.floor(Math.random() * SCENES.length)];
```

Each mount gets an independent random pick. No persistence — refreshing or navigating gives a new random scene.

## Timing

- All scenes loop on a 3s cycle
- Auth gate: minimum 1s display, loops until auth resolves
- Page transitions: shows for the duration of the lazy load (typically <1s in dev, variable in prod)
- Animation viewer: loops indefinitely

## Polish (post-implementation review, 2026-04-10)

1. **Brand text wraps mid-word** — "APRIL F / OOLS DAY" in 3-col grid. Fix: `whitespace-nowrap` or smaller text in "All" view
2. **Visual weight inconsistency** — Climber viewBox 140×110, Athlete 80×80, Reader 80×70. All get `w-48` but Climber figure appears smaller. Normalize visual weight
3. **Athlete scene sparse** — Climber has staircase, Reader has desk+papers, Athlete just a ground line. Add environmental detail (bag outline, track marks)
4. **"All" grid cards clinical** — plain `border border-line`. Use `bg-[var(--accent-muted)]` tint like DashboardCards
5. **Single scene view wastes space** — full-width card with empty space. Center vertically or make card more substantial

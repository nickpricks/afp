# Phase 2i — Themes 2.0 (Atmosphere & Glyphs) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make AFP's 10 themes feel like distinct *rooms* by layering atmosphere CSS behind content, replacing emoji particles with shape-primitive glyphs, refactoring particle motion to read as parallax depth, and replacing the intensity slider with a 5-tier button row.

**Architecture:** (1) Pure CSS atmosphere via `body.theme-X::before/::after` per theme file — no data-model change. (2) `<GlyphPrimitive>` registry component dispatched from `AmbientEffects` when `effect.content === ''`. (3) Single random "depth" value drives scale + opacity + size + duration in particles for parallax illusion. (4) `<IntensityTierPicker>` replaces the range input; legacy values bucket on read via `bucketIntensity()`.

**Tech Stack:** React 19, Vite 8, TypeScript (strict), Tailwind v4, Vitest, RTL, Bun.

**Source spec:** `docs/specs/2026-04-30-phase2i-themes-2.0-design.md` (commit `4f6c1f7`)
**Branch:** `feat/the-atmosphere-thickens` (continues from `0.2.16` polish commit `4f6c1f7`)
**Version target:** `0.2.17`

---

## Design Decisions Locked (from brainstorm Q1–Q7)

| Decision | Choice | Rationale |
|---|---|---|
| Atmosphere coverage | All 10 themes (Charcoal explicitly silent) | Consistency-is-king; partial coverage creates two-class theme system |
| Atmosphere contract | Pure CSS in each theme file via `body.theme-X::before` | Static, decorative, unique per theme. No data layer. No JS bundle cost. |
| Glyph contract | Empty-content sentinel (`effect.content === ''`) dispatches to `GlyphPrimitive` | Zero data-model change; existing `string` field accommodates `''`; Patronus path untouched. |
| Patronus | Keep filtered emoji animals | Filter already abstracts them away from emoji register; "no emoji" rule exists to fix register clashes which don't apply here. |
| Particle scaling | Depth-correlated (single `r5` driving 4 CSS vars) | Parallax illusion vs random confetti — same code complexity, way better feel. |
| Slider UX | 5-button tier row | Matches AFP's pill-row pattern (time-range, payment methods); discrete clicks = atomic saves; mental-model clarity. |
| Legacy `effectIntensity` migration | Bucket on read | Non-destructive; no migration script; disk values preserved until next user click. |

---

## File Structure

### Create (8 new files)
| Path | Responsibility |
|---|---|
| `src/shared/utils/intensity.ts` | `INTENSITY_TIERS` const + `bucketIntensity()` |
| `src/shared/utils/__tests__/intensity.test.ts` | bucketIntensity unit tests |
| `src/shared/components/IntensityTierPicker.tsx` | 5-button tier picker |
| `src/shared/components/__tests__/IntensityTierPicker.test.tsx` | Picker tests |
| `src/shared/components/glyph-primitives.tsx` | 8 glyph components + `GlyphPrimitive` dispatcher |
| `src/shared/components/__tests__/glyph-primitives.test.tsx` | Glyph dispatch tests |
| `src/shared/components/__tests__/AmbientEffects.test.tsx` | New AmbientEffects test (no existing file) |
| `src/shared/components/__tests__/bench-generators.test.ts` | Bench generator tests (no existing file) |

### Modify (15 existing files)
| Path | Change |
|---|---|
| `src/shared/components/AmbientEffects.tsx` | Depth-correlated scaling + `GlyphPrimitive` dispatch |
| `src/shared/components/ProfilePage.tsx` | Replace range input with `<IntensityTierPicker>`; bucket legacy values on read |
| `src/themes/themes.ts` | Set `content: ''` for 8 redesigned effects (snowflakes, leaves, stars, hearts, ink, bubbles, embers, wisps) |
| `src/themes/__tests__/themes.test.ts` | Assert content invariants (`''` for redesigned, populated for Patronus) |
| `src/themes/family-blue.css` | Add atmosphere `::before` block + reduced-motion |
| `src/themes/garden-path.css` | Add atmosphere |
| `src/themes/lullaby.css` | Add atmosphere |
| `src/themes/rose-quartz.css` | Add atmosphere |
| `src/themes/marauders-map.css` | Add atmosphere (folds + vignette) |
| `src/themes/neon-glow.css` | Add atmosphere (CRT + chromatic aberration) |
| `src/themes/deep-mariana.css` | Add atmosphere (caustic ripples) |
| `src/themes/industrial-furnace.css` | Add atmosphere (molten glow) |
| `src/themes/expecto-patronum.css` | Add atmosphere (silver mist + stars) |
| `src/shared/components/bench-generators.ts` | Add `benchMeal`, `benchNeed`, `benchMilestone` generators |
| `src/shared/components/DevBench.tsx` | 3 new generator buttons + Theme Tour button |
| `package.json` | `0.2.16` → `0.2.17` |
| `CHANGELOG.md` | New `[0.2.17]` block |
| `docs/ROADMAP.md` | Phase 2i row → ✅ Done; Session 17 entry |

### Untouched (not in scope)
- `src/themes/charcoal.css` — silence-by-design preserved
- Patronus emoji rendering path in `THEME_DEFINITIONS` and `AmbientEffects`

---

## Phase A — Slider Foundation (Tasks 1–3)

### Task 1: `bucketIntensity` util + `INTENSITY_TIERS` const

**Files:**
- Create: `src/shared/utils/intensity.ts`
- Create: `src/shared/utils/__tests__/intensity.test.ts`

**Why first:** Foundation for both the picker and ProfilePage; pure function, easy TDD.

- [ ] **Step 1: Write failing tests**

Create `src/shared/utils/__tests__/intensity.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { bucketIntensity, INTENSITY_TIERS } from '../intensity';

describe('bucketIntensity', () => {
  it('maps 0 to 0', () => {
    expect(bucketIntensity(0)).toBe(0);
  });
  it('maps 1-37 to 25', () => {
    expect(bucketIntensity(1)).toBe(25);
    expect(bucketIntensity(15)).toBe(25);
    expect(bucketIntensity(37)).toBe(25);
  });
  it('maps 38-62 to 50', () => {
    expect(bucketIntensity(38)).toBe(50);
    expect(bucketIntensity(50)).toBe(50);
    expect(bucketIntensity(62)).toBe(50);
  });
  it('maps 63-87 to 75', () => {
    expect(bucketIntensity(63)).toBe(75);
    expect(bucketIntensity(75)).toBe(75);
    expect(bucketIntensity(87)).toBe(75);
  });
  it('maps 88-100 to 100', () => {
    expect(bucketIntensity(88)).toBe(100);
    expect(bucketIntensity(100)).toBe(100);
  });
  it('clamps values above 100 to 100', () => {
    expect(bucketIntensity(150)).toBe(100);
  });
  it('clamps negative values to 0', () => {
    expect(bucketIntensity(-10)).toBe(0);
  });
});

describe('INTENSITY_TIERS', () => {
  it('has 5 tiers in ascending value order', () => {
    expect(INTENSITY_TIERS).toHaveLength(5);
    expect(INTENSITY_TIERS.map((t) => t.value)).toEqual([0, 25, 50, 75, 100]);
  });
  it('every tier has a non-empty label', () => {
    INTENSITY_TIERS.forEach((tier) => {
      expect(tier.label.length).toBeGreaterThan(0);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
bunx vitest run src/shared/utils/__tests__/intensity.test.ts
```
Expected: FAIL — `Cannot find module '../intensity'`.

- [ ] **Step 3: Implement intensity util**

Create `src/shared/utils/intensity.ts`:

```ts
/** A single intensity tier — discrete value mapped to a user-facing label. */
export interface IntensityTier {
  value: number;
  label: string;
}

/**
 * The 5 intensity tiers backing `<IntensityTierPicker>` and `bucketIntensity()`.
 *
 * TODO(nick): Final wording is your call. Proposal: Off · Subtle · Standard · Lively · Maximum.
 * Could also be theme-flavored (Off · Whisper · Hum · Pulse · Roar) — see spec learning-mode slot.
 */
export const INTENSITY_TIERS: readonly IntensityTier[] = [
  { value: 0, label: 'Off' },
  { value: 25, label: 'Subtle' },
  { value: 50, label: 'Standard' },
  { value: 75, label: 'Lively' },
  { value: 100, label: 'Maximum' },
] as const;

/**
 * Maps any intensity value to the nearest tier.
 * `0 → 0`, `1-37 → 25`, `38-62 → 50`, `63-87 → 75`, `88+ → 100`.
 * Negative values clamp to `0`; values above `100` clamp to `100`.
 */
export const bucketIntensity = (value: number): number => {
  if (value <= 0) return 0;
  if (value >= 88) return 100;
  if (value >= 63) return 75;
  if (value >= 38) return 50;
  return 25;
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
bunx vitest run src/shared/utils/__tests__/intensity.test.ts
```
Expected: 9 passing.

- [ ] **Step 5: Commit**

```bash
git add src/shared/utils/intensity.ts src/shared/utils/__tests__/intensity.test.ts
git commit -m "feat(themes): add INTENSITY_TIERS + bucketIntensity util"
```

---

### Task 2: `<IntensityTierPicker>` component

**Files:**
- Create: `src/shared/components/IntensityTierPicker.tsx`
- Create: `src/shared/components/__tests__/IntensityTierPicker.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/shared/components/__tests__/IntensityTierPicker.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntensityTierPicker } from '../IntensityTierPicker';

describe('<IntensityTierPicker>', () => {
  it('renders 5 buttons with tier labels', () => {
    render(<IntensityTierPicker value={50} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Off' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Subtle' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Standard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lively' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Maximum' })).toBeInTheDocument();
  });

  it('marks the matching tier active by aria-pressed', () => {
    render(<IntensityTierPicker value={50} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Standard' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Off' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('buckets a legacy value to the nearest tier for active state', () => {
    render(<IntensityTierPicker value={30} onChange={() => {}} />);
    // 30 buckets to 25 → Subtle is active
    expect(screen.getByRole('button', { name: 'Subtle' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('fires onChange with the tier value when clicked', () => {
    const onChange = vi.fn();
    render(<IntensityTierPicker value={0} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Lively' }));
    expect(onChange).toHaveBeenCalledWith(75);
  });

  it('does not fire onChange when clicking the already-active tier', () => {
    const onChange = vi.fn();
    render(<IntensityTierPicker value={50} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Standard' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
bunx vitest run src/shared/components/__tests__/IntensityTierPicker.test.tsx
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `src/shared/components/IntensityTierPicker.tsx`:

```tsx
import { INTENSITY_TIERS, bucketIntensity } from '@/shared/utils/intensity';

interface IntensityTierPickerProps {
  value: number;
  onChange: (value: number) => void;
}

/**
 * Five-button tier row for `effectIntensity`. Atomic clicks (no drag),
 * matches AFP's pill-row pattern (time-range, payment methods).
 * Legacy values bucket to the nearest tier for active-state display.
 */
export function IntensityTierPicker({ value, onChange }: IntensityTierPickerProps) {
  const activeValue = bucketIntensity(value);
  return (
    <div className="flex gap-2" data-testid="intensity-tier-picker">
      {INTENSITY_TIERS.map((tier) => {
        const isActive = tier.value === activeValue;
        return (
          <button
            key={tier.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => {
              if (!isActive) onChange(tier.value);
            }}
            className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition ${
              isActive
                ? 'border-accent bg-accent text-fg-on-accent'
                : 'border-line text-fg-muted hover:border-accent/50'
            }`}
          >
            {tier.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
bunx vitest run src/shared/components/__tests__/IntensityTierPicker.test.tsx
```
Expected: 5 passing.

- [ ] **Step 5: Commit**

```bash
git add src/shared/components/IntensityTierPicker.tsx src/shared/components/__tests__/IntensityTierPicker.test.tsx
git commit -m "feat(themes): add IntensityTierPicker component"
```

---

### Task 3: Replace range input in `ProfilePage` with the new picker

**Files:**
- Modify: `src/shared/components/ProfilePage.tsx` (the existing slider block at ~line 512–531 inside `AppearanceSection`)

- [ ] **Step 1: Read the existing slider block**

Open `src/shared/components/ProfilePage.tsx` and locate the section starting with `{/* Effects Intensity */}`. The current code is the range input + "Off"/"Max" labels.

- [ ] **Step 2: Add the picker import**

In `src/shared/components/ProfilePage.tsx`, add to the import block near the top:

```ts
import { IntensityTierPicker } from '@/shared/components/IntensityTierPicker';
```

- [ ] **Step 3: Replace the range input markup**

In `AppearanceSection`, replace the entire `{/* Effects Intensity */}` block (the `div.mt-4.border-t...` containing the range input) with:

```tsx
{/* Effects Intensity */}
<div className="mt-4 border-t border-line pt-4">
  <p className="mb-2 text-sm text-fg">Ambient Effects</p>
  <IntensityTierPicker value={intensity} onChange={onIntensityChange} />
</div>
```

The hook `onIntensityChange` is already wired to `handleIntensityChange` in the parent — it persists to Firestore and updates state. Behavior preserved; UI changes from slider to button row.

- [ ] **Step 4: Run lint + tests**

```bash
bun run lint && bunx vitest run
```
Expected: all green. ProfilePage tests should still pass — they don't reference the slider directly.

- [ ] **Step 5: Manual visual check (optional but recommended)**

```bash
bun run dev
```
Navigate to `/profile` → Customize → confirm 5-button tier row replaces the slider. Click each tier; verify active styling jumps and toast fires once per click.

- [ ] **Step 6: Commit**

```bash
git add src/shared/components/ProfilePage.tsx
git commit -m "feat(themes): replace intensity slider with tier picker in Profile"
```

---

## Phase B — Glyph Primitives (Tasks 4–5)

### Task 4: `<GlyphPrimitive>` registry — 8 components

**Files:**
- Create: `src/shared/components/glyph-primitives.tsx`
- Create: `src/shared/components/__tests__/glyph-primitives.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/shared/components/__tests__/glyph-primitives.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { GlyphPrimitive } from '../glyph-primitives';

describe('<GlyphPrimitive>', () => {
  const knownEffects = [
    'snowflakes', 'leaves', 'stars', 'hearts',
    'ink', 'bubbles', 'embers', 'wisps',
  ];

  it.each(knownEffects)('renders a non-empty element for effect "%s"', (id) => {
    const { container } = render(<GlyphPrimitive effectId={id} />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders a fallback shape for an unknown effect ID', () => {
    const { container } = render(<GlyphPrimitive effectId="not-a-real-effect" />);
    // Fallback: a div with circular bg.
    expect(container.firstChild).not.toBeNull();
  });

  it('snowflake renders an SVG element', () => {
    const { container } = render(<GlyphPrimitive effectId="snowflakes" />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('heart renders pure-CSS shapes (no SVG)', () => {
    const { container } = render(<GlyphPrimitive effectId="hearts" />);
    expect(container.querySelector('svg')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
bunx vitest run src/shared/components/__tests__/glyph-primitives.test.tsx
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the registry**

Create `src/shared/components/glyph-primitives.tsx`:

```tsx
/**
 * Shape-primitive glyphs that replace emoji in ambient particle effects.
 * Each glyph picks up the theme accent via `currentColor` so themes can
 * re-tint the particle without per-theme rules.
 *
 * Patronus animals are NOT in this registry — they keep their filtered
 * emoji rendering via `effect.content` in THEME_DEFINITIONS.
 */
interface GlyphProps {
  effectId: string;
}

const SnowflakeGlyph = () => (
  <svg viewBox="0 0 20 20" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round">
    <line x1="10" y1="2" x2="10" y2="18" />
    <line x1="2" y1="10" x2="18" y2="10" />
    <line x1="4.5" y1="4.5" x2="15.5" y2="15.5" />
    <line x1="15.5" y1="4.5" x2="4.5" y2="15.5" />
    <path d="M10 4 L8.5 5.5 M10 4 L11.5 5.5 M10 16 L8.5 14.5 M10 16 L11.5 14.5 M4 10 L5.5 8.5 M4 10 L5.5 11.5 M16 10 L14.5 8.5 M16 10 L14.5 11.5" />
  </svg>
);

const LeafGlyph = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" opacity="0.7">
    <path d="M12 2 C 16 6, 20 10, 18 18 C 14 22, 8 20, 6 16 C 4 10, 8 6, 12 2 Z" />
  </svg>
);

const StarGlyph = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, currentColor 60%, transparent 100%)',
      boxShadow: '0 0 6px 1px currentColor',
    }}
  />
);

const HeartGlyph = () => (
  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '60%',
        height: '85%',
        background: 'currentColor',
        borderRadius: '50% 50% 0 0',
        transform: 'rotate(-45deg)',
        transformOrigin: '100% 100%',
      }}
    />
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        width: '60%',
        height: '85%',
        background: 'currentColor',
        borderRadius: '50% 50% 0 0',
        transform: 'rotate(45deg)',
        transformOrigin: '0 100%',
      }}
    />
  </div>
);

const InkBlotGlyph = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background:
        'radial-gradient(ellipse at 40% 55%, currentColor 0%, currentColor 35%, transparent 65%), radial-gradient(circle at 70% 40%, currentColor 0%, currentColor 25%, transparent 50%), radial-gradient(circle at 30% 30%, currentColor 0%, transparent 30%)',
      filter: 'blur(0.4px)',
    }}
  />
);

const BubbleGlyph = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      background:
        'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.55) 0%, transparent 50%, transparent 100%)',
      border: '1px solid currentColor',
      opacity: 0.6,
    }}
  />
);

const EmberGlyph = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      background:
        'radial-gradient(ellipse at 50% 100%, #ffaa44 0%, currentColor 35%, transparent 80%)',
      filter: 'blur(0.5px)',
    }}
  />
);

const WispGlyph = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      background: 'radial-gradient(ellipse, currentColor 0%, transparent 80%)',
      filter: 'blur(2px)',
      opacity: 0.6,
    }}
  />
);

const FallbackGlyph = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      background: 'currentColor',
      opacity: 0.4,
    }}
  />
);

const REGISTRY: Record<string, () => JSX.Element> = {
  snowflakes: SnowflakeGlyph,
  leaves: LeafGlyph,
  stars: StarGlyph,
  hearts: HeartGlyph,
  ink: InkBlotGlyph,
  bubbles: BubbleGlyph,
  embers: EmberGlyph,
  wisps: WispGlyph,
};

/** Renders the registered shape primitive for a given effect ID, or a fallback. */
export function GlyphPrimitive({ effectId }: GlyphProps) {
  const Component = REGISTRY[effectId] ?? FallbackGlyph;
  return <Component />;
}
```

> **Note:** React 19 has no global `JSX.Element`. If `tsc` complains, replace `Record<string, () => JSX.Element>` with `Record<string, () => React.ReactElement>` and add `import * as React from 'react';` at the top.

- [ ] **Step 4: Run tests + typecheck**

```bash
bunx vitest run src/shared/components/__tests__/glyph-primitives.test.tsx
bunx tsc --noEmit
```
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/shared/components/glyph-primitives.tsx src/shared/components/__tests__/glyph-primitives.test.tsx
git commit -m "feat(themes): add glyph-primitives registry (8 shape glyphs)"
```

---

### Task 5: Wire `GlyphPrimitive` into `AmbientEffects` and flip `THEME_DEFINITIONS`

**Files:**
- Create: `src/shared/components/__tests__/AmbientEffects.test.tsx`
- Modify: `src/shared/components/AmbientEffects.tsx`
- Modify: `src/themes/themes.ts`
- Modify: `src/themes/__tests__/themes.test.ts`

- [ ] **Step 1: Write the new AmbientEffects test (no existing file)**

Create `src/shared/components/__tests__/AmbientEffects.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { AmbientEffects } from '../AmbientEffects';
import { ThemeId } from '@/themes/themes';

describe('<AmbientEffects>', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: false,
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
  });

  it('returns null when intensity is 0', () => {
    const { container } = render(<AmbientEffects themeId={ThemeId.FamilyBlue} intensity={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when prefers-reduced-motion matches', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('reduce'),
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    const { container } = render(<AmbientEffects themeId={ThemeId.FamilyBlue} intensity={100} />);
    expect(container.firstChild).toBeNull();
  });

  it('dispatches to GlyphPrimitive for empty-content effects (Family Blue snowflakes)', () => {
    const { container } = render(<AmbientEffects themeId={ThemeId.FamilyBlue} intensity={100} />);
    // Family Blue's snowflake effect now has content === '' → should render an SVG.
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders text content for Patronus effects (animal emoji preserved)', () => {
    const { container } = render(<AmbientEffects themeId={ThemeId.ExpectoPatronum} intensity={100} />);
    // At least one particle should contain an emoji (text content), not just SVG.
    const text = container.textContent ?? '';
    // Spirit animals: 🦌🐺🦅🦦🐎🐈🦉🐇🐕🦢🦡🐉
    expect(/[🦌🐺🦅🦦🐎🐈🦉🐇🐕🦢🦡🐉]/u.test(text)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bunx vitest run src/shared/components/__tests__/AmbientEffects.test.tsx
```
Expected: tests for `intensity=0` and `prefers-reduced-motion` pass; tests for SVG dispatch and Patronus text fail (because content is currently emoji for Family Blue — no SVG yet).

- [ ] **Step 3: Modify `AmbientEffects.tsx` render to dispatch on empty content**

In `src/shared/components/AmbientEffects.tsx`, locate the JSX `{p.content || (...)}`. Replace with:

```tsx
import { GlyphPrimitive } from '@/shared/components/glyph-primitives';
// ...
{particles.map((p) => (
  <div key={p.id} className={`fx-particle fx-${p.type} effect-${p.effectId}`} style={p.style}>
    {p.content ? p.content : <GlyphPrimitive effectId={p.effectId} />}
  </div>
))}
```

Add the `GlyphPrimitive` import at the top of the file with the other imports.

- [ ] **Step 4: Flip 8 effects in `THEME_DEFINITIONS` to empty content**

In `src/themes/themes.ts`, set `content: ''` for the 8 redesigned effects. Patronus (`patronus`) keeps the emoji string. Leave `wisps` content empty too — it's a primitive, not Patronus.

For each theme's effects array, change:

```ts
// Family Blue — was:
effects: [{ id: 'snowflakes', type: 'fall', content: '❄', maxParticles: 30, baseSpeed: 8 }],
// Becomes:
effects: [{ id: 'snowflakes', type: 'fall', content: '', maxParticles: 30, baseSpeed: 8 }],
```

Apply the same `content: ''` change to:
- Garden Path → `leaves`
- Lullaby → `stars`
- Rose Quartz → `hearts`
- Marauder's Map → `ink`
- Deep Mariana → `bubbles` (the `crt` overlay has empty content already, leave it)
- Industrial Furnace → `embers`
- Expecto Patronum → `wisps` (the `patronus` effect KEEPS its emoji string)

Charcoal stays unchanged (empty effects array).

- [ ] **Step 5: Extend `themes.test.ts` with content invariants**

Open `src/themes/__tests__/themes.test.ts` and add a new `describe` block:

```ts
import { THEME_DEFINITIONS, ThemeId } from '../themes';

describe('Phase 2i content invariants', () => {
  const REDESIGNED_EFFECT_IDS = ['snowflakes', 'leaves', 'stars', 'hearts', 'ink', 'bubbles', 'embers', 'wisps'];

  it('all redesigned effects have empty content', () => {
    for (const theme of Object.values(THEME_DEFINITIONS)) {
      for (const effect of theme.effects) {
        if (REDESIGNED_EFFECT_IDS.includes(effect.id)) {
          expect(effect.content).toBe('');
        }
      }
    }
  });

  it('Patronus animal effect keeps its emoji content', () => {
    const patronus = THEME_DEFINITIONS[ThemeId.ExpectoPatronum].effects.find((e) => e.id === 'patronus');
    expect(patronus).toBeDefined();
    expect(patronus!.content.length).toBeGreaterThan(0);
    expect(patronus!.content).toContain(',');  // comma-separated animal list
  });

  it('Charcoal has no effects', () => {
    expect(THEME_DEFINITIONS[ThemeId.Charcoal].effects).toEqual([]);
  });
});
```

- [ ] **Step 6: Run all relevant tests**

```bash
bunx vitest run src/themes/__tests__/themes.test.ts src/shared/components/__tests__/AmbientEffects.test.tsx src/shared/components/__tests__/glyph-primitives.test.tsx
```
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add src/shared/components/AmbientEffects.tsx src/themes/themes.ts src/themes/__tests__/themes.test.ts src/shared/components/__tests__/AmbientEffects.test.tsx
git commit -m "feat(themes): dispatch GlyphPrimitive for empty-content effects"
```

---

## Phase C — Depth-Correlated Scaling (Task 6)

### Task 6: Refactor `AmbientEffects` randomization to use a single depth value

**Files:**
- Modify: `src/shared/components/AmbientEffects.tsx`
- Modify: `src/shared/components/__tests__/AmbientEffects.test.tsx`

- [ ] **Step 1: Add a depth-correlation test**

Append to `src/shared/components/__tests__/AmbientEffects.test.tsx`:

```tsx
describe('depth-correlated scaling', () => {
  it('scale, opacity, size, and duration are all derived from the same particle seed', () => {
    const { container } = render(<AmbientEffects themeId={ThemeId.FamilyBlue} intensity={100} />);
    const particles = container.querySelectorAll('.fx-particle');
    expect(particles.length).toBeGreaterThan(0);

    // For each particle, the relationship between scale and opacity should be monotonic
    // (close = high scale + high opacity; far = low scale + low opacity).
    // Sample any 2 particles and verify ordering matches.
    const samples = Array.from(particles).slice(0, 5).map((el) => {
      const style = (el as HTMLElement).style;
      return {
        scale: parseFloat(style.getPropertyValue('--fx-scale')),
        opacity: parseFloat(style.getPropertyValue('--fx-opacity')),
      };
    });

    samples.sort((a, b) => a.scale - b.scale);
    // After sorting by scale ascending, opacity should also be ascending (or flat — within rounding).
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i].opacity).toBeGreaterThanOrEqual(samples[i - 1].opacity - 0.01);
    }
  });
});
```

- [ ] **Step 2: Run the test (it should fail with current independent-random code)**

```bash
bunx vitest run src/shared/components/__tests__/AmbientEffects.test.tsx -t 'depth-correlated'
```
Expected: FAIL — current code uses independent randoms so scale and opacity won't correlate.

- [ ] **Step 3: Refactor the randomization block in `AmbientEffects.tsx`**

In `src/shared/components/AmbientEffects.tsx`, locate the `for` loop that builds `style`. Replace the `'--fx-scale'`, `'--fx-opacity'`, `'--fx-size'`, and `'--fx-duration'` lines with the depth-correlated math:

```ts
// Replace these lines:
//   '--fx-scale': `${0.8 + r8 * 0.7}`,
//   '--fx-opacity': effect.type === 'sweep' ? '0.15' : `${0.3 + r9 * 0.5}`,
//   '--fx-size': `${14 + r10 * 12}px`,
//   '--fx-duration': `${effect.baseSpeed + (r4 * 4 - 2)}s`,

// With (depth-correlated; single source drives all four):
const depth = r5;                     // 0 = far, 1 = close
const jitter = (r4 - 0.5) * 0.1;      // tiny ±5% noise on duration only

// TODO(nick): tune these constants while watching motion in the browser.
//   Proposed ranges: scale 0.5–1.5, opacity 0.25–0.8, size 10–26px, duration 1×–2× baseSpeed.

'--fx-scale':    `${0.5 + depth * 1.0}`,
'--fx-opacity':  effect.type === 'sweep' ? '0.15' : `${0.25 + depth * 0.55}`,
'--fx-size':     `${10 + depth * 16}px`,
'--fx-duration': `${effect.baseSpeed * (2 - depth) * (1 + jitter)}s`,
```

> **Note:** `r5` and `r4` are still computed in the loop (existing code already calls `seededRandom` for each). Existing `r8`, `r9`, `r10` are no longer needed but leaving them as no-ops is harmless. Recommended: simplify by removing the unused `r8`, `r9`, `r10` definitions to keep the code readable.

- [ ] **Step 4: Run the depth test + full suite**

```bash
bunx vitest run src/shared/components/__tests__/AmbientEffects.test.tsx
bun run lint
```
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/shared/components/AmbientEffects.tsx src/shared/components/__tests__/AmbientEffects.test.tsx
git commit -m "refactor(themes): depth-correlated particle scaling (parallax illusion)"
```

---

## Phase D — Atmosphere CSS per theme (Tasks 7–15)

> **Pattern note:** Each task in this phase follows the same shape: add a `body.theme-X::before` (and optional `::after`) block to the theme's CSS file, with a `@media (prefers-reduced-motion: reduce)` opt-out. No automated tests — atmosphere CSS is verified manually via the dev server (and via Theme Tour once Task 19 lands).

> **TODO(nick) — learning slot:** The CSS values shown for each theme (gradient angles, opacities, vignette intensity) are starting points. Tune them while watching the actual page. The spec calls this out explicitly for Marauder's Map.

### Task 7: Marauder's Map atmosphere (first — validates pattern)

**Files:**
- Modify: `src/themes/marauders-map.css`

- [ ] **Step 1: Add the atmosphere block at the bottom of `marauders-map.css`**

Append to `src/themes/marauders-map.css`:

```css
/* ── Phase 2i — Atmosphere: aged parchment ── */
body.theme-marauders-map::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  background:
    /* Diagonal fold creases */
    linear-gradient(105deg, transparent 48%, rgba(120, 90, 50, 0.08) 49%, rgba(120, 90, 50, 0.08) 51%, transparent 52%),
    linear-gradient(15deg, transparent 73%, rgba(120, 90, 50, 0.06) 74%, rgba(120, 90, 50, 0.06) 76%, transparent 77%),
    /* Sepia edge vignette */
    radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(90, 60, 30, 0.18) 100%);
}

@media (prefers-reduced-motion: reduce) {
  body.theme-marauders-map::before { animation: none; }
}
```

- [ ] **Step 2: Visual verify**

```bash
bun run dev
```
Open `/profile` → Customize → click Marauder's Map. Confirm:
- Faint diagonal fold lines visible across the full viewport
- Sepia darkening at corners (vignette)
- Content (cards, headers) renders in front; atmosphere stays behind
- Scroll: atmosphere stays fixed (doesn't repaint)

- [ ] **Step 3: Lint**

```bash
bun run lint
```
Expected: green.

- [ ] **Step 4: Commit**

```bash
git add src/themes/marauders-map.css
git commit -m "feat(themes): atmosphere for Marauder's Map (parchment + vignette)"
```

---

### Task 8: Garden Path atmosphere (dappled light)

**Files:**
- Modify: `src/themes/garden-path.css`

- [ ] **Step 1: Append atmosphere block**

```css
/* ── Phase 2i — Atmosphere: dappled light ── */
body.theme-garden-path::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  background:
    radial-gradient(circle at 25% 35%, rgba(187, 247, 178, 0.5) 0%, transparent 30%),
    radial-gradient(circle at 75% 60%, rgba(254, 243, 167, 0.4) 0%, transparent 35%),
    radial-gradient(circle at 50% 85%, rgba(187, 247, 178, 0.3) 0%, transparent 25%);
  animation: garden-dapple 24s ease-in-out infinite alternate;
}

@keyframes garden-dapple {
  from { background-position: 0% 0%, 0% 0%, 0% 0%; }
  to   { background-position: 4% -3%, -3% 4%, 2% 2%; }
}

@media (prefers-reduced-motion: reduce) {
  body.theme-garden-path::before { animation: none; }
}
```

- [ ] **Step 2: Visual verify (dev server, click Garden Path theme)**

- [ ] **Step 3: Commit**

```bash
git add src/themes/garden-path.css
git commit -m "feat(themes): atmosphere for Garden Path (dappled light)"
```

---

### Task 9: Lullaby atmosphere (vellum nightlight)

**Files:**
- Modify: `src/themes/lullaby.css`

- [ ] **Step 1: Append atmosphere block**

```css
/* ── Phase 2i — Atmosphere: vellum nightlight ── */
body.theme-lullaby::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  background: radial-gradient(ellipse at center, rgba(255, 248, 232, 0.45) 0%, transparent 65%);
}

body.theme-lullaby::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  /* Faint paper grain via inline SVG noise */
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.9'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.12'/></svg>");
  opacity: 0.5;
}
```

No animation — vellum + nightlight are static. No reduced-motion block needed.

- [ ] **Step 2: Visual verify**

- [ ] **Step 3: Commit**

```bash
git add src/themes/lullaby.css
git commit -m "feat(themes): atmosphere for Lullaby (vellum nightlight)"
```

---

### Task 10: Rose Quartz atmosphere (pearlescent shimmer)

**Files:**
- Modify: `src/themes/rose-quartz.css`

- [ ] **Step 1: Append atmosphere block**

```css
/* ── Phase 2i — Atmosphere: pearlescent shimmer ── */
body.theme-rose-quartz::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  background: conic-gradient(
    from 45deg,
    rgba(244, 114, 182, 0.08),
    rgba(254, 226, 240, 0.15),
    rgba(244, 114, 182, 0.08),
    rgba(254, 226, 240, 0.15),
    rgba(244, 114, 182, 0.08)
  );
  animation: rose-shimmer 60s linear infinite;
}

@keyframes rose-shimmer {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  body.theme-rose-quartz::before { animation: none; }
}
```

- [ ] **Step 2: Visual verify**

- [ ] **Step 3: Commit**

```bash
git add src/themes/rose-quartz.css
git commit -m "feat(themes): atmosphere for Rose Quartz (pearlescent shimmer)"
```

---

### Task 11: Family Blue atmosphere (cloud drift)

**Files:**
- Modify: `src/themes/family-blue.css`

- [ ] **Step 1: Append atmosphere block**

```css
/* ── Phase 2i — Atmosphere: cloud drift ── */
body.theme-family-blue::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  background:
    linear-gradient(180deg, #c4dcfd 0%, #e8f1ff 50%, #f0f7ff 100%),
    radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.7) 0%, transparent 40%),
    radial-gradient(ellipse at 70% 60%, rgba(255, 255, 255, 0.5) 0%, transparent 50%);
  background-blend-mode: normal;
  animation: family-clouds 40s ease-in-out infinite alternate;
  opacity: 0.6;
}

@keyframes family-clouds {
  from { background-position: 0% 0%, 0% 0%, 0% 0%; }
  to   { background-position: 0% 0%, 5% 2%, -4% -2%; }
}

@media (prefers-reduced-motion: reduce) {
  body.theme-family-blue::before { animation: none; }
}
```

- [ ] **Step 2: Visual verify**

- [ ] **Step 3: Commit**

```bash
git add src/themes/family-blue.css
git commit -m "feat(themes): atmosphere for Family Blue (cloud drift)"
```

---

### Task 12: Neon Glow atmosphere (CRT raster + chromatic aberration)

**Files:**
- Modify: `src/themes/neon-glow.css`

- [ ] **Step 1: Append atmosphere block**

```css
/* ── Phase 2i — Atmosphere: CRT raster + chromatic aberration ── */
body.theme-neon-glow::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  background:
    /* Persistent scanlines */
    repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255, 184, 3, 0.06) 2px, rgba(255, 184, 3, 0.06) 3px),
    /* Red chromatic aberration tint at edges */
    radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(255, 0, 80, 0.1) 100%);
}

body.theme-neon-glow::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  /* Cyan chromatic aberration tint, slightly offset */
  background: radial-gradient(ellipse at 50% 50%, transparent 70%, rgba(0, 255, 255, 0.08) 100%);
  transform: translateX(2px);
}

/* No animation — CRT raster is static. Existing `.effect-crt::after` is for Deep Mariana,
   not Neon Glow — they don't conflict (different theme classes). */
```

- [ ] **Step 2: Visual verify — pay special attention to text legibility (chromatic edges shouldn't fight reading)**

- [ ] **Step 3: Commit**

```bash
git add src/themes/neon-glow.css
git commit -m "feat(themes): atmosphere for Neon Glow (CRT raster + chromatic aberration)"
```

---

### Task 13: Deep Mariana atmosphere (caustic ripples)

**Files:**
- Modify: `src/themes/deep-mariana.css`

- [ ] **Step 1: Append atmosphere block**

```css
/* ── Phase 2i — Atmosphere: caustic ripples ── */
body.theme-deep-mariana::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(0, 232, 154, 0.08) 0%, transparent 35%),
    radial-gradient(ellipse at 70% 70%, rgba(0, 180, 200, 0.06) 0%, transparent 40%),
    radial-gradient(ellipse at 50% 50%, rgba(0, 232, 154, 0.04) 0%, transparent 50%);
  animation: mariana-current 30s ease-in-out infinite alternate;
}

@keyframes mariana-current {
  from { background-position: 0% 0%, 0% 0%, 0% 0%; }
  to   { background-position: 8% 4%, -6% -3%, 4% -5%; }
}

@media (prefers-reduced-motion: reduce) {
  body.theme-deep-mariana::before { animation: none; }
}
```

- [ ] **Step 2: Visual verify — note that `.effect-crt::after` (existing CRT scanline overlay for Mariana) coexists. They should layer cleanly.**

- [ ] **Step 3: Commit**

```bash
git add src/themes/deep-mariana.css
git commit -m "feat(themes): atmosphere for Deep Mariana (caustic ripples)"
```

---

### Task 14: Industrial Furnace atmosphere (molten glow)

**Files:**
- Modify: `src/themes/industrial-furnace.css`

- [ ] **Step 1: Append atmosphere block**

```css
/* ── Phase 2i — Atmosphere: molten glow ── */
body.theme-industrial-furnace::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  background: radial-gradient(
    ellipse at 50% 110%,
    rgba(255, 104, 32, 0.35) 0%,
    rgba(255, 104, 32, 0.15) 25%,
    transparent 50%
  );
  animation: furnace-pulse 6s ease-in-out infinite alternate;
}

@keyframes furnace-pulse {
  from { opacity: 0.85; }
  to   { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  body.theme-industrial-furnace::before { animation: none; }
}
```

- [ ] **Step 2: Visual verify**

- [ ] **Step 3: Commit**

```bash
git add src/themes/industrial-furnace.css
git commit -m "feat(themes): atmosphere for Industrial Furnace (molten glow)"
```

---

### Task 15: Expecto Patronum atmosphere (silver mist + starlight)

**Files:**
- Modify: `src/themes/expecto-patronum.css`

- [ ] **Step 1: Append atmosphere block**

```css
/* ── Phase 2i — Atmosphere: silver mist + starlight ── */
body.theme-expecto-patronum::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(184, 212, 232, 0.04) 30%,
    rgba(184, 212, 232, 0.02) 50%,
    rgba(184, 212, 232, 0.05) 70%,
    transparent 100%
  );
  animation: patronum-mist 45s ease-in-out infinite alternate;
}

body.theme-expecto-patronum::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  background-image:
    radial-gradient(circle at 15% 25%, rgba(255, 255, 255, 0.8) 0.5px, transparent 1px),
    radial-gradient(circle at 80% 60%, rgba(255, 255, 255, 0.6) 0.5px, transparent 1px),
    radial-gradient(circle at 40% 85%, rgba(255, 255, 255, 0.5) 0.5px, transparent 1px),
    radial-gradient(circle at 90% 15%, rgba(255, 255, 255, 0.7) 0.5px, transparent 1px);
}

@keyframes patronum-mist {
  from { background-position: 0% 0%; }
  to   { background-position: 0% 6%; }
}

@media (prefers-reduced-motion: reduce) {
  body.theme-expecto-patronum::before { animation: none; }
}
```

- [ ] **Step 2: Visual verify — confirm mist drifts vertically and stars hold position**

- [ ] **Step 3: Commit**

```bash
git add src/themes/expecto-patronum.css
git commit -m "feat(themes): atmosphere for Expecto Patronum (silver mist + stars)"
```

---

## Phase E — DevBench Catch-Up (Tasks 16–19)

### Task 16: Add `benchMeal` generator

**Files:**
- Modify: `src/shared/components/bench-generators.ts`
- Create: `src/shared/components/__tests__/bench-generators.test.ts`

- [ ] **Step 1: Read existing generator pattern**

Open `src/shared/components/bench-generators.ts` and locate `benchFeed` (line ~284). Mirror its shape — `(date?: string): string`, calls `ensureChild()`, returns the new entry's ID, pushes to localStorage via the `push()` helper.

- [ ] **Step 2: Write a failing test for `benchMeal`**

Create `src/shared/components/__tests__/bench-generators.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { benchMeal, BASE, ensureChild } from '../bench-generators';

beforeEach(() => {
  localStorage.clear();
});

describe('benchMeal', () => {
  it('creates a meal entry under children/{id}/meals', () => {
    const childId = ensureChild();
    const id = benchMeal();
    expect(id).toBeTruthy();
    const key = `${BASE}:children:${childId}:meals`;
    const stored = JSON.parse(localStorage.getItem(key) ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(id);
  });

  it('honors a custom date param', () => {
    const id = benchMeal('2026-04-15');
    const childId = ensureChild();
    const key = `${BASE}:children:${childId}:meals`;
    const stored = JSON.parse(localStorage.getItem(key) ?? '[]');
    const entry = stored.find((e: { id: string }) => e.id === id);
    expect(entry.date).toBe('2026-04-15');
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
bunx vitest run src/shared/components/__tests__/bench-generators.test.ts
```
Expected: FAIL — `benchMeal` doesn't exist.

- [ ] **Step 4: Implement `benchMeal`**

Append to `src/shared/components/bench-generators.ts` (after `benchFeed`):

```ts
import type { MealEntry } from '@/modules/baby/types';
import { MealType, MealPortion } from '@/modules/baby/types';

const MEAL_TYPES = [MealType.Breakfast, MealType.Lunch, MealType.Dinner, MealType.Snack];
const MEAL_PORTIONS = [MealPortion.None, MealPortion.Bite, MealPortion.Little, MealPortion.Some, MealPortion.Most, MealPortion.All, MealPortion.Extra];
const MEAL_LABELS = ['Oatmeal', 'Banana mash', 'Rice & dal', 'Roti', 'Idli', 'Apple slice', 'Cheese cube', 'Yogurt'];

/** Adds a random meal entry under the child. */
export const benchMeal = (date?: string): string => {
  const childId = ensureChild();
  const id = crypto.randomUUID();
  const entry: MealEntry = {
    id,
    date: date ?? pick([todayStr(), daysAgo(rand(1, 5))]),
    time: randTime(),
    type: pick(MEAL_TYPES),
    label: pick(MEAL_LABELS),
    portion: pick(MEAL_PORTIONS),
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    notes: '',
  };
  const key = `${BASE}:children:${childId}:meals`;
  push(key, entry);
  return id;
};
```

> **Note:** Verify `MealEntry`, `MealType`, and `MealPortion` exports in `src/modules/baby/types.ts`. If field names differ (e.g. `kind` vs `type`), match the canonical type. The plan assumes the spec's described shape from CLAUDE.md.

- [ ] **Step 5: Run tests to verify they pass**

```bash
bunx vitest run src/shared/components/__tests__/bench-generators.test.ts
```
Expected: 2 passing.

- [ ] **Step 6: Wire into DevBench buttons**

In `src/shared/components/DevBench.tsx`, find the buttons section near the existing Feed/Sleep/Growth/Diaper buttons. Add:

```tsx
<button onClick={() => bulk(benchMeal, 1)} className="...">+1 Meal</button>
<button onClick={() => bulk(benchMeal, 100)} className="...">+100 Meals</button>
<button onClick={() => bulk(benchMeal, 1000)} className="...">+1k Meals</button>
```

(Match the existing button styling and the `bulk` helper signature already in DevBench.)

- [ ] **Step 7: Commit**

```bash
git add src/shared/components/bench-generators.ts src/shared/components/__tests__/bench-generators.test.ts src/shared/components/DevBench.tsx
git commit -m "feat(bench): add benchMeal generator + DevBench buttons"
```

---

### Task 17: Add `benchNeed` generator

**Files:**
- Modify: `src/shared/components/bench-generators.ts`
- Modify: `src/shared/components/__tests__/bench-generators.test.ts`
- Modify: `src/shared/components/DevBench.tsx`

- [ ] **Step 1: Add a failing test for `benchNeed`**

Append to `bench-generators.test.ts`:

```ts
import { benchNeed } from '../bench-generators';

describe('benchNeed', () => {
  it('creates a need entry under children/{id}/needs', () => {
    const childId = ensureChild();
    const id = benchNeed();
    const key = `${BASE}:children:${childId}:needs`;
    const stored = JSON.parse(localStorage.getItem(key) ?? '[]');
    expect(stored.find((e: { id: string }) => e.id === id)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run and verify failure**

```bash
bunx vitest run src/shared/components/__tests__/bench-generators.test.ts -t 'benchNeed'
```
Expected: FAIL.

- [ ] **Step 3: Implement `benchNeed`**

Append to `bench-generators.ts`:

```ts
import type { NeedEntry } from '@/modules/baby/types';
import { NeedStatus } from '@/modules/baby/types';

const NEED_LABELS = ['Onesie 6m', 'Sippy cup', 'Crib sheet', 'Diaper rash cream', 'Teether', 'Stroller cover', 'Bath toy'];
const NEED_STATUSES = [NeedStatus.Wishlist, NeedStatus.Have, NeedStatus.Outgrown];

/** Adds a random need entry under the child. */
export const benchNeed = (date?: string): string => {
  const childId = ensureChild();
  const id = crypto.randomUUID();
  const entry: NeedEntry = {
    id,
    date: date ?? pick([todayStr(), daysAgo(rand(1, 30))]),
    label: pick(NEED_LABELS),
    status: pick(NEED_STATUSES),
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const key = `${BASE}:children:${childId}:needs`;
  push(key, entry);
  return id;
};
```

> **Note:** Confirm `NeedEntry` shape in `src/modules/baby/types.ts`. Adjust field names if the actual type differs.

- [ ] **Step 4: Run test, verify pass**

```bash
bunx vitest run src/shared/components/__tests__/bench-generators.test.ts -t 'benchNeed'
```
Expected: passing.

- [ ] **Step 5: Wire DevBench buttons**

In `src/shared/components/DevBench.tsx`, near the existing baby-module buttons, add (matching the existing button class strings used for Feed/Sleep/Growth/Diaper buttons in this file):

```tsx
<button onClick={() => bulk(benchNeed, 1)} className="...">+1 Need</button>
<button onClick={() => bulk(benchNeed, 100)} className="...">+100 Needs</button>
<button onClick={() => bulk(benchNeed, 1000)} className="...">+1k Needs</button>
```

Also add `benchNeed` to the existing imports from `./bench-generators` at the top of `DevBench.tsx`.

- [ ] **Step 6: Commit**

```bash
git add src/shared/components/bench-generators.ts src/shared/components/__tests__/bench-generators.test.ts src/shared/components/DevBench.tsx
git commit -m "feat(bench): add benchNeed generator + DevBench buttons"
```

---

### Task 18: Add `benchMilestone` generator

**Files:**
- Modify: `src/shared/components/bench-generators.ts`
- Modify: `src/shared/components/__tests__/bench-generators.test.ts`
- Modify: `src/shared/components/DevBench.tsx`

- [ ] **Step 1: Add a failing test**

```ts
import { benchMilestone } from '../bench-generators';

describe('benchMilestone', () => {
  it('creates a milestone entry under children/{id}/milestones', () => {
    const childId = ensureChild();
    const id = benchMilestone();
    const key = `${BASE}:children:${childId}:milestones`;
    const stored = JSON.parse(localStorage.getItem(key) ?? '[]');
    expect(stored.find((e: { id: string }) => e.id === id)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run and verify failure**

- [ ] **Step 3: Implement `benchMilestone`**

```ts
import type { MilestoneEntry } from '@/modules/baby/types';
import { MilestoneCategory } from '@/modules/baby/types';

const MILESTONE_CATEGORIES = [
  MilestoneCategory.Motor,
  MilestoneCategory.Language,
  MilestoneCategory.Social,
  MilestoneCategory.Cognitive,
  MilestoneCategory.Hobby,
  MilestoneCategory.Other,
];
const MILESTONE_LABELS = [
  'First steps', 'First word', 'First laugh', 'First tooth',
  'Sat unsupported', 'Crawled', 'Pulled to stand', 'Said "mama"',
  'Pointed', 'Waved', 'Built a tower of 3 blocks',
];

/** Adds a random milestone entry under the child. */
export const benchMilestone = (date?: string): string => {
  const childId = ensureChild();
  const id = crypto.randomUUID();
  const entry: MilestoneEntry = {
    id,
    date: date ?? pick([todayStr(), daysAgo(rand(7, 365))]),
    label: pick(MILESTONE_LABELS),
    category: pick(MILESTONE_CATEGORIES),
    mediaUrl: null,
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const key = `${BASE}:children:${childId}:milestones`;
  push(key, entry);
  return id;
};
```

- [ ] **Step 4: Run test, verify pass**

```bash
bunx vitest run src/shared/components/__tests__/bench-generators.test.ts -t 'benchMilestone'
```
Expected: passing.

- [ ] **Step 5: Wire DevBench buttons**

In `src/shared/components/DevBench.tsx`, near the existing baby-module buttons, add:

```tsx
<button onClick={() => bulk(benchMilestone, 1)} className="...">+1 Milestone</button>
<button onClick={() => bulk(benchMilestone, 100)} className="...">+100 Milestones</button>
<button onClick={() => bulk(benchMilestone, 1000)} className="...">+1k Milestones</button>
```

Also add `benchMilestone` to the existing imports from `./bench-generators` at the top of `DevBench.tsx`.

- [ ] **Step 6: Commit**

```bash
git add src/shared/components/bench-generators.ts src/shared/components/__tests__/bench-generators.test.ts src/shared/components/DevBench.tsx
git commit -m "feat(bench): add benchMilestone generator + DevBench buttons"
```

---

### Task 19: Add Theme Tour button to DevBench

**Files:**
- Modify: `src/shared/components/DevBench.tsx`

- [ ] **Step 1: Add tour state + handlers**

In `src/shared/components/DevBench.tsx`, add at the top of the component:

```tsx
import { applyTheme, THEME_DEFINITIONS, ThemeId, useActiveThemeId } from '@/themes/themes';
import { useState, useRef } from 'react';

// ... inside component ...
const activeThemeId = useActiveThemeId();
const [tourRunning, setTourRunning] = useState(false);
const tourTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const originalThemeRef = useRef<ThemeId | null>(null);

const stopTour = () => {
  if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
  tourTimeoutRef.current = null;
  if (originalThemeRef.current) {
    applyTheme(originalThemeRef.current, 'system');
    originalThemeRef.current = null;
  }
  setTourRunning(false);
};

const startTour = () => {
  originalThemeRef.current = activeThemeId;
  const themeIds = Object.values(THEME_DEFINITIONS).map((t) => t.id);
  setTourRunning(true);
  let i = 0;
  const tick = () => {
    if (i >= themeIds.length) {
      stopTour();
      return;
    }
    applyTheme(themeIds[i]!, 'system');
    i++;
    tourTimeoutRef.current = setTimeout(tick, 3000);
  };
  tick();
};
```

- [ ] **Step 2: Add tour button in the JSX**

Add a section in the rendered DevBench JSX:

```tsx
<section className="border-t border-line pt-4 mt-4">
  <h3 className="text-sm font-semibold text-fg-muted uppercase tracking-wide mb-2">Theme Tour</h3>
  <p className="text-xs text-fg-muted mb-2">
    Cycles through all 10 themes (3s hold each). Press Stop to abort and restore the original theme.
  </p>
  {!tourRunning && (
    <button onClick={startTour} className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-fg-on-accent">
      Start Tour
    </button>
  )}
  {tourRunning && (
    <button onClick={stopTour} className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600">
      Stop Tour
    </button>
  )}
</section>
```

- [ ] **Step 3: Manual verify**

```bash
bun run dev
```
Open `/debug` (or wherever DevBench renders). Click Start Tour. Confirm:
- Themes cycle every 3 seconds
- Atmosphere + glyphs visible per theme
- Stop button restores original theme
- Tour terminates after Expecto Patronum (last theme)

- [ ] **Step 4: Lint**

```bash
bun run lint
```
Expected: green.

- [ ] **Step 5: Commit**

```bash
git add src/shared/components/DevBench.tsx
git commit -m "feat(bench): add Theme Tour button (cycles all 10 themes, 3s hold)"
```

---

## Phase F — Wrap-Up (Task 20)

### Task 20: Version bump + CHANGELOG + ROADMAP

**Files:**
- Modify: `package.json`
- Modify: `CHANGELOG.md`
- Modify: `docs/ROADMAP.md`

- [ ] **Step 1: Bump `package.json` version**

In `package.json`, change `"version": "0.2.16"` → `"version": "0.2.17"`.

- [ ] **Step 2: Add `[0.2.17]` block to `CHANGELOG.md`**

Insert above `## [0.2.16]`:

```markdown
## [0.2.17] — 2026-04-30 (Phase 2i — Themes 2.0: Atmosphere & Glyphs)

### Added
- **Atmosphere layer per theme** — 9 of 10 themes now ship with a CSS-only `body.theme-X::before` (and optional `::after`) atmosphere block running behind content. Charcoal stays silent by design. Each theme honors `prefers-reduced-motion` per-theme.
- **`<GlyphPrimitive>` registry** — 8 shape-primitive glyph components (Snowflake, Leaf, Star, Heart, InkBlot, Bubble, Ember, Wisp) replace emoji in particle effects. Pure CSS or inline SVG, theme-tinted via `currentColor`. Patronus animals preserved as filtered emoji.
- **Depth-correlated particle scaling** — `AmbientEffects` refactored: a single random "depth" value drives scale (0.5–1.5), opacity (0.25–0.8), size (10–26 px), and duration (1×–2× baseSpeed). Reads as parallax atmosphere, not random confetti.
- **`<IntensityTierPicker>`** — 5-button tier row replaces the 0–100 slider in Profile. Off · Subtle · Standard · Lively · Maximum. Atomic clicks, matches AFP's pill-row pattern.
- **`bucketIntensity()` util + `INTENSITY_TIERS`** — `src/shared/utils/intensity.ts`. Legacy values bucket on read; no migration script.
- **DevBench Meals/Needs/Milestones generators** — `benchMeal`, `benchNeed`, `benchMilestone` close the gap with newer baby modules. Each anchors at `todayStr()` so sticky day headers (Phase 2h) actually display `Today`/`Yesterday`.
- **DevBench Theme Tour button** — cycles through all 10 themes with a 3-second hold each. Visual regression QA in one click.

### Changed
- **`THEME_DEFINITIONS.effects[].content`** — set to `''` for the 8 redesigned effects (snowflakes/leaves/stars/hearts/ink/bubbles/embers/wisps). Patronus animals retain their emoji string.
- **Profile intensity control** — slider replaced by tier-button row.

### Tests
- 4 new test files: `intensity.test.ts`, `IntensityTierPicker.test.tsx`, `glyph-primitives.test.tsx`, `AmbientEffects.test.tsx`, `bench-generators.test.ts`.
- Existing `themes.test.ts` extended with content invariants for Phase 2i.

---

```

- [ ] **Step 3: Update `docs/ROADMAP.md`**

In `docs/ROADMAP.md`:

(a) Update last-updated line:
```
Last updated: 2026-04-30
```
(no change if same date as 0.2.16 — verify)

(b) Update the Phase Progress table row:
```
| Phase 2i (Themes 2.0 — Atmosphere & Glyphs) | ✅ Done | 20/20 | Atmosphere ×9 themes (Charcoal silent), 8 shape-primitive glyphs, depth-correlated scaling, tier-button slider, DevBench catch-up + Theme Tour. Phase 2j (Iconography) split as separate future spec. |
```

(c) Insert a new Done-section entry above the Session 16 entry:

```markdown
### 2026-04-30 — Session 17 (Phase 2i Themes 2.0 implementation, v0.2.17)

- [x] **Atmosphere ×9 themes** — Family Blue (cloud drift), Garden Path (dappled light), Lullaby (vellum nightlight), Rose Quartz (pearlescent shimmer), Marauder's Map (parchment + vignette), Neon Glow (CRT raster + chromatic aberration), Deep Mariana (caustic ripples), Industrial Furnace (molten glow), Expecto Patronum (silver mist + stars). Charcoal silent by design.
- [x] **8 shape-primitive glyphs** — Snowflake (SVG line-art), Leaf (SVG teardrop), Star (CSS radial-gradient + glow), Heart (CSS rotated rectangles), InkBlot (CSS stacked radial-gradients), Bubble (CSS sphere + highlight), Ember (CSS radial-gradient), Wisp (CSS blurred ellipse). Patronus emoji animals preserved.
- [x] **Depth-correlated particle scaling** — single `r5` depth value drives scale, opacity, size, duration with small jitter. Reads as parallax atmosphere.
- [x] **`<IntensityTierPicker>`** — 5-button tier row replaces range slider in Profile. `bucketIntensity()` handles legacy values on read (no migration).
- [x] **DevBench Bench A** — `benchMeal`, `benchNeed`, `benchMilestone` generators + buttons. All anchor at `todayStr()`.
- [x] **DevBench Theme Tour** — cycles all 10 themes (3s hold). Stop button restores the original theme.
- [x] **Version**: 0.2.16 → 0.2.17

---

```

- [ ] **Step 4: Verify the full pre-commit checklist**

```bash
bun run lint && bunx vitest run
```
Expected: lint green; all tests pass (existing 520 + new from this phase).

- [ ] **Step 5: Commit**

```bash
git add package.json CHANGELOG.md docs/ROADMAP.md
git commit -m "chore: bump 0.2.17 + Phase 2i CHANGELOG/ROADMAP"
```

---

## Post-Implementation Checklist

After Task 20 ships, before merging the branch:

- [ ] Run the full pre-commit checklist one more time: `bun run lint && bunx vitest run` (expect all green)
- [ ] Manual DevBench Theme Tour pass — click through all 10 themes, verify atmosphere + glyphs render correctly with no console errors
- [ ] Verify reduced-motion: macOS System Settings → Accessibility → Display → Reduce Motion. Confirm particles stop and atmosphere animations pause across all themes.
- [ ] DevTools Performance — capture a 5-second trace on Industrial Furnace (most layered atmosphere) and Garden Path (most overlapping radial-gradients). Confirm no scroll-driven repaints from atmosphere layers.
- [ ] Squash the branch per Nick's preference (`git rebase -i master` → squash all into one Phase 2i commit, or per-commit history retained on the merge — Nick's call when finishing).
- [ ] Open PR or merge to master per Nick's usual workflow.

---

## Risks & Open Issues

- **Browser fidelity** — `conic-gradient` (Rose Quartz) and `repeating-linear-gradient` (Neon Glow) render slightly differently on Safari vs. Chrome. The Theme Tour helps catch this; visual regression on real Safari recommended.
- **Atmosphere paint cost** — `position: fixed` should keep paint off scroll. Verify in DevTools, especially for Garden Path (3 overlapping radial-gradients with animation).
- **Per-effect color in Glyphs** — fallback uses `currentColor`. If a theme's `--color-accent` is too light/dark for the particle to read against the bg, the glyph will be hard to see. Visual check during Theme Tour catches this.
- **Bench generator field name drift** — types in `src/modules/baby/types.ts` may have evolved since spec written; confirm `MealEntry`, `NeedEntry`, `MilestoneEntry` field names match before committing the generators.

# Nattu Kaka's Review — `feat/the-fine-print`

**Date:** 2026-05-01
**Branch:** `feat/the-fine-print` (vs `master`)
**Reviewer:** Nattu Kaka (blunt mode, TS/React)
**Scope:** Particle size tier picker + viewport-aware scaling + glyph 80% render parity
**Commits reviewed:**

- `99928ee` feat(themes): glyph render parity at 80% of container (matches emoji cell)
- `4f8a20d` feat(themes): viewport-aware particle size multiplier (mobile 0.65x)
- `2028ee8` feat(themes): SizeTierPicker (Small/Medium/Large) + effectSize on UserProfile
- `cec6dd2` test(e2e): mobile viewport regression for particle size scaling
- `8e62c76` chore(docs): wrap-up CHANGELOG + README + ROADMAP for 0.2.17.2

---

## Verdict

Ladke, this one is *mostly* clean. TDD is visible (3 commits, tests alongside features), the tier picker mirrors `IntensityTierPicker` like a sibling should, and the `GlyphWrapper` DRY pass is genuinely good. **But** — you let magic numbers leak in like a careless tap. Five different files now know that "100 means medium" and that's five files too many. Fix the constants, then we're done.

---

## The Real Problems (Fix These)

### 1. Magic number `100` for "default effect size" — duplicated in 3 places

Badmash, this is the textbook violation.

```tsx
// src/shared/components/AmbientEffects.tsx:69
effectSize = 100,

// src/shared/components/Layout.tsx:59
effectSize={profile.effectSize ?? 100}

// src/shared/components/ProfilePage.tsx:94
const [size, setSize] = useState<number>(profile?.effectSize ?? 100);
```

You **already have** `EFFECT_SIZE_TIERS[1].value === 100` sitting right there in `effectSize.ts`. Either:

```ts
// src/shared/utils/effectSize.ts
export const EFFECT_SIZE_DEFAULT = 100;
// or, derived:
export const EFFECT_SIZE_DEFAULT = EFFECT_SIZE_TIERS[1].value;
```

Then import it in all three sites. Tomorrow when "default" becomes 110 because someone says "Medium feels small," you change it once, not three times. This is the whole point of constants.

### 2. Magic numbers in `bucketEffectSize` — bounds are decoupled from tier values

```ts
// src/shared/utils/effectSize.ts
if (value <= 84) return 70;
if (value >= 121) return 140;
return 100;
```

Beta, where do `84` and `121` come from? The midpoint between 70/100 is 85, between 100/140 is 120. So `<= 84` should be `< 85` and `>= 121` should be `> 120` — close to half but not exactly, and someone reading this has to do the arithmetic to verify. **Either** derive from tier values:

```ts
const [SMALL, MEDIUM, LARGE] = EFFECT_SIZE_TIERS.map(t => t.value);
const SMALL_MAX = Math.floor((SMALL + MEDIUM) / 2);   // 85
const LARGE_MIN = Math.ceil((MEDIUM + LARGE) / 2);    // 120
```

…**or** at minimum name them: `BUCKET_SMALL_MAX = 84`, `BUCKET_LARGE_MIN = 121`. As-is, if anyone changes a tier value, the buckets silently lie. The test `bucketEffectSize(84)` returns `70`, `bucketEffectSize(85)` returns `100` — that boundary should be expressed in terms of the tier definitions, not as a frozen 84.

### 3. `'(max-width: 640px)'` and `0.65` / `1.0` repeated in `useViewportSizeMultiplier`

```tsx
// src/shared/components/AmbientEffects.tsx:39-46
const [multiplier, setMultiplier] = useState(() =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches ? 0.65 : 1.0,
);
useEffect(() => {
  const mql = window.matchMedia('(max-width: 640px)');
  const handler = (e: MediaQueryListEvent): void => {
    setMultiplier(e.matches ? 0.65 : 1.0);
  };
```

The query string lives twice. `0.65` lives twice. `1.0` lives twice. Beta, you know better:

```ts
const MOBILE_MQ = '(max-width: 640px)';
const MOBILE_PARTICLE_MULTIPLIER = 0.65;
const DESKTOP_PARTICLE_MULTIPLIER = 1.0;
```

And `640px` matches Tailwind's `sm` breakpoint — that's an AFP-wide constant waiting to happen in `constants/config.ts` (`CONFIG.MOBILE_BREAKPOINT_PX`). Add it.

### 4. `||` fallback on config — Standard #3 violation

```tsx
// src/shared/components/ProfilePage.tsx:69
modules: existingProfile?.modules || DEFAULT_MODULES,
```

This was there before, but you touched `saveAppearance`, so it's in scope. `||` masks `0`, empty objects, etc. Use `??`:

```tsx
modules: existingProfile?.modules ?? DEFAULT_MODULES,
```

`ModuleConfig` is an object so `||` is *probably* safe today — but "probably safe today" is exactly the bug class `??` was added to TypeScript to prevent.

---

## While You're At It

### `'80%'` literal repeated 12 times in `glyph-primitives.tsx`

You wrote a JSDoc that says *"All glyphs render at 80% of their container"* — beautiful documentation of the convention. Then you typed `'80%'` twelve times. That's not a convention, that's a copy-paste promise. One constant at the top:

```tsx
const GLYPH_INNER_SIZE = '80%';
```

Then `width={GLYPH_INNER_SIZE}` everywhere. The day someone wants 75% you change one line, not twelve.

### `saveAppearance` now takes 6 positional params

```tsx
saveAppearance(uid, themeId, colorMode, intensity, size, profile)
```

Ladke, when the parameter list reads like a serial number you've stopped designing the function. Switch to an options object:

```tsx
const saveAppearance = async (params: {
  uid: string;
  theme: string;
  colorMode: ColorMode;
  effectIntensity: number;
  effectSize: number;
  existingProfile: UserProfile | null;
}) => { ... }
```

Call sites become self-documenting and you stop swapping `intensity` and `size` by accident at 1am. You also stop the diff cascade you just suffered (every callback signature touched).

### `useViewportSizeMultiplier` lives in `AmbientEffects.tsx`

It's a generic hook. The day BabyDashboard or Stats wants viewport-aware sizing, you'll either copy-paste this (bad) or fish it out of an unrelated component file (worse). Put it in `src/shared/hooks/useViewportSizeMultiplier.ts`. Single Responsibility, Standard #16.

### "Silent fail" comment in slider/picker handlers

```tsx
// Silent fail for real-time picker to avoid toast spam
```

Beta, "silent fail" is the politest name for "I have no error handling strategy." If `saveAppearance` rejects 200 times in a row because Firestore is down, the user never knows their settings aren't persisting. Acceptable for v1, but flag it: debounced toast, or a single "reconnecting" indicator. Not now — but on the backlog. The pattern is now duplicated across three handlers (`intensity`, `color mode` toast-eats-error, `size`); when a fourth shows up, fix the cause not the comment.

### E2E `page.waitForTimeout(300)`

```ts
// e2e/the-fine-print.spec.ts:54
await page.waitForTimeout(300);
```

Yaar, `waitForTimeout` is the single most-flake-causing API in Playwright. The useMemo re-runs synchronously when `viewportMultiplier` updates — wait for an *observable* signal instead. For example: capture a desktop particle's `--fx-size`, resize, then `expect(...).toBeLessThan(initial)` with a polling expect. Not urgent, but this test will start failing on a slow CI box.

### Tests use raw strings for theme/intensity labels

```tsx
.getByText('Family Blue', { exact: true })
.getByRole('button', { name: 'Standard', exact: true })
```

These are domain values — `THEME_DEFINITIONS[ThemeId.FamilyBlue].name` and the intensity tier label respectively. Tests breaking when you rename "Standard" to "Default" is exactly the kind of churn the enum/constants discipline avoids in app code. Lower priority — tests are allowed some literal strings — but if you're already importing `ThemeId`, derive labels too.

---

## What You Did Right

- **Tier picker is a faithful sibling of `IntensityTierPicker`** — same pill-row pattern, same `aria-pressed`, same `data-testid`. Consistency-is-king, you remembered.
- **`bucketEffectSize` for legacy values** — Shabash. You thought about users with old `effectSize` values that don't match tiers. Migration thinking baked into the picker.
- **`GlyphWrapper` DRY pass** — extracting the centering wrapper killed real duplication and made the 80% rule obvious. The JSDoc at the top of the file explaining the convention is exactly the right amount of comment.
- **`UserProfile.effectSize?: number` (optional)** — correctly modeled. Old profiles don't have it; consumers handle absence.
- **Tests at viewport boundary in E2E** — `375 → 1280` viewport switch verifies the actual mobile/desktop scaling user-visible behavior, not just the unit math. That's good test architecture.
- **TDD discipline visible in commit history** — `feat → fix → fix → test(e2e)` is a proper test-driven cadence, not an afterthought.

---

## Roadmap Note

- **`MOBILE_BREAKPOINT_PX = 640` constant** in `constants/config.ts` — this is the third or fourth time `640` will hide somewhere in the codebase as a literal. Promote it. Then the next viewport-aware feature has a single source.
- **Debounced save toast strategy** — three handlers now use "silent fail to avoid toast spam." Fourth time = build a `useDebouncedSaveStatus` hook with a visible-once "reconnecting" indicator. Track in ROADMAP.
- **Hook extraction `useViewportSizeMultiplier`** — when the second consumer appears (Stats? Baby chart?), promote to `src/shared/hooks/`.

---

## Action Punch List

| # | Severity | File | Fix |
|---|----------|------|-----|
| 1 | P0 | `src/shared/utils/effectSize.ts` | Export `EFFECT_SIZE_DEFAULT` constant; consume in `AmbientEffects.tsx`, `Layout.tsx`, `ProfilePage.tsx` |
| 2 | P0 | `src/shared/utils/effectSize.ts` | Derive bucket bounds from tier values (or name them as constants) |
| 3 | P0 | `src/shared/components/AmbientEffects.tsx` | Extract `MOBILE_MQ`, `MOBILE_PARTICLE_MULTIPLIER`, `DESKTOP_PARTICLE_MULTIPLIER` to module top |
| 4 | P0 | `src/shared/components/ProfilePage.tsx:69` | `\|\|` → `??` on `existingProfile?.modules` |
| 5 | P1 | `src/shared/components/glyph-primitives.tsx` | Extract `const GLYPH_INNER_SIZE = '80%'`; replace 12 literals |
| 6 | P1 | `src/shared/components/ProfilePage.tsx` | `saveAppearance` → options-object signature |
| 7 | P2 | `src/shared/components/AmbientEffects.tsx` | Move `useViewportSizeMultiplier` to `src/shared/hooks/` |
| 8 | P2 | `e2e/the-fine-print.spec.ts:54` | Replace `waitForTimeout(300)` with polling `expect` on `--fx-size` |
| 9 | P3 | tests | Derive theme/intensity labels from constants instead of raw strings |

---

That's it, Beta. Three magic-number violations, one `||` to flip, one positional-param fan-out to clean up. Two hours of work tops. Don't let `100` stay in three files when this lands on master — that's the kind of debt that *compounds*.

— Kaka

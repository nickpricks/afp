# 💡 Sharma Ji's Code Review — `feat/the-fine-print`

**Date:** 2026-05-01
**Branch:** `feat/the-fine-print`
**Reviewer:** Sharma Ji (mentor-mode)
**Scope:** All commits since `master` (`522f0e7..8e62c76`) — viewport-aware particle scaling, `SizeTierPicker`, glyph primitive 80% render parity, `effectSize` on `UserProfile`.

---

## Files Under Review

```
CHANGELOG.md                                            |  22 ++
CLAUDE.md                                               |  15 ++
README.md                                               |   6 +-
docs/ROADMAP.md                                         |  13 ++
e2e/the-fine-print.spec.ts                              | 135 ++++
package.json                                            |   2 +-
src/shared/components/AmbientEffects.tsx                |  31 ++-
src/shared/components/Layout.tsx                        |   1 +
src/shared/components/ProfilePage.tsx                   |  52 +++-
src/shared/components/SizeTierPicker.tsx                |  39 +++
src/shared/components/__tests__/AmbientEffects.test.tsx | 118 ++++
src/shared/components/__tests__/SizeTierPicker.test.tsx |  51 +++
src/shared/components/__tests__/glyph-primitives.test.tsx|  48 +++
src/shared/components/glyph-primitives.tsx              | 242 +++---
src/shared/types.ts                                     |   1 +
src/shared/utils/__tests__/effectSize.test.ts           |  50 +++
src/shared/utils/effectSize.ts                          |  23 +
17 files changed, 730 insertions(+), 119 deletions(-)
```

---

## What's Working Well

**Strong test discipline** (`__tests__/effectSize.test.ts`, `__tests__/SizeTierPicker.test.tsx`, `__tests__/AmbientEffects.test.tsx`, `e2e/the-fine-print.spec.ts`) — Beta. The unit-test → integration-test → E2E pyramid is exactly right. You tested the bucket function's boundary values (84, 85, 120, 121), then the picker's a11y attrs, then the full viewport→particle→DOM size pipeline. Boundary coverage of `bucketEffectSize` is *chef's kiss*.

**Backward-compatible schema** (`src/shared/types.ts:62`) — Making `effectSize?: number` optional with a `?? 100` fallback in `Layout.tsx:59` is the right call. No migration script, no broken profiles. This is the *graceful degradation* principle applied to data shape.

**Glyph SRP refactor** (`src/shared/components/glyph-primitives.tsx`) — Lovely composition: `GlyphWrapper` owns centering, each `*Glyph` owns its shape, a `REGISTRY` map dispatches by id, and `FallbackGlyph` covers the unknown case. Open–Closed principle in action — adding a 9th effect means one entry in the registry, no `switch`-statement surgery.

**Comments that earn their keep** (`src/shared/components/AmbientEffects.tsx:115-124`) — That depth-correlation comment block is a model: it explains the *why* behind specific magic constants (3:1 ratio, 0.25–0.8 opacity, ±5% jitter) so the next reader understands the visual intent, not just the math. Most codebases have the inverse problem — comments restating *what* the code already says. This one earns its line count.

**Pattern reuse** (`SizeTierPicker.tsx` mirrors `IntensityTierPicker.tsx`) — Consistency-is-king at work. Same structure, same a11y attrs, same Tailwind classes. Future devs land in either component and feel at home.

---

## Suggestions

### [SOLID — Open/Closed] — `src/shared/components/ProfilePage.tsx:55-72`

The `saveAppearance` function now takes 6 positional parameters: `(uid, theme, colorMode, effectIntensity, effectSize, existingProfile)`. Each new appearance dimension grows this signature, and **every callsite has to pass current state for every other field** — see lines 136, 150, 164, 178. That's 4 callsites × 6 params = 24 places where a `(intensity, size)` swap silently compiles (both are `number`).

→ **Suggestion:** Extract a parameter object:

```ts
type AppearanceSettings = Pick<
  UserProfile,
  'theme' | 'colorMode' | 'effectIntensity' | 'effectSize'
>;

const saveAppearance = (
  uid: string,
  settings: AppearanceSettings,
  existing: UserProfile | null,
) => { /* ... */ };
```

Each handler then merges only its diff: `saveAppearance(uid, { ...current, effectSize: newSize }, profile)`. Catches the swap-bug at the type level *and* shrinks the four nearly-identical callbacks into one. The "next dimension" (motion-reduce, contrast-boost, font-scale…) won't grow this signature.

---

### [DRY — Hooks] — `src/shared/components/AmbientEffects.tsx:12-27, 39-52`

`usePrefersReducedMotion` and `useViewportSizeMultiplier` are the same matchMedia subscribe/unsubscribe ceremony — initial state from `matchMedia(q).matches`, effect hooks `change` listener, returns derived value. ~28 lines, 90% duplicated.

→ **Suggestion:** Extract `useMatchMedia(query: string): boolean` once, then derive each consumer:

```ts
function useMatchMedia(query: string): boolean { /* shared subscribe logic */ }

const prefersReducedMotion = useMatchMedia('(prefers-reduced-motion: reduce)');
const isMobile = useMatchMedia('(max-width: 640px)');
const viewportMultiplier = isMobile ? 0.65 : 1.0;
```

Both call-sites get simpler, the lifecycle bug surface (forgetting to remove a listener) shrinks to one place, and the next theme feature that needs `(hover: hover)` or `(prefers-color-scheme: dark)` is one line away.

---

### [SRP / Component Composition] — `SizeTierPicker.tsx` ↔ `IntensityTierPicker.tsx`

Now that two tier pickers exist with identical structure (5-button vs 3-button row, same a11y, same Tailwind classes, same bucket-on-display behavior), you've hit the *rule-of-three threshold for awareness, not yet refactor*.

→ **Suggestion:** Don't refactor today — but if a third tier picker shows up (say a "Motion Speed" picker for animation duration), pull both into a generic `<TierPicker tiers={...} value bucket={...} testId={...} />`. Watch for it; it's coming.

---

### [Performance — Inline style allocation] — `src/shared/components/glyph-primitives.tsx:33-181`

Every `*Glyph` component allocates a fresh `style={{}}` object on every render. With 20+ particles on screen and the parent `useMemo` re-running on viewport/intensity changes, that's a lot of garbage.

→ **Suggestion:** Two paths, increasing in payoff:

- **(a)** Hoist the static style objects to module-level `const HEART_LEFT_LOBE_STYLE = {...}`. Quick win, zero behavior change.
- **(b)** Move the CSS-only glyphs (Heart, Star, Bubble, Ember, Wisp, Fallback) to actual CSS classes. They use `currentColor` already, so theme tinting still works. The whole module shrinks to ~30 lines, paint cost drops, and you get free CSS-cascade tricks (e.g., `@keyframes` for embers).

---

### [Tight coupling — `--fx-scale` × `--fx-size`] — `src/shared/components/AmbientEffects.tsx:127, 143, 147`

`sizeMultiplier` is applied to **both** `--fx-scale` (line 143) and `--fx-size` in pixels (line 147). If your CSS for `.fx-particle` uses `transform: scale(var(--fx-scale))` *and* `font-size: var(--fx-size)` (or `width/height`), the multiplier compounds — a 0.65 mobile factor becomes 0.42 of the desktop final size.

→ **Suggestion:** Audit `index.css` / particle CSS to see which variable actually drives final size. If both are read, pick one to apply the multiplier to. Worth a comment in the code stating the intent: *"viewport scaling lives on `--fx-size`; `--fx-scale` is depth-only"* (or vice versa).

---

### [Magic number / readability] — `src/shared/utils/effectSize.ts:18-23`

The thresholds 84 and 121 are *just* asymmetric enough to require a head-tilt — between 70/100 the midpoint is 85 and between 100/140 it's 120, so the boundaries are biased one tick toward the smaller tier on each side.

→ **Suggestion:** One short comment ("Inclusive thresholds bias toward Small/Medium when on the boundary") or — cleaner still — derive them: `const SMALL_MAX = (70 + 100) / 2 - 1`. Future-you (or future-Saurav) will read a derivation faster than literals.

---

### [Data integrity / UX] — Bucket-on-display drift

After `bucketEffectSize`, the UI shows `Small` highlighted for a stored `effectSize: 60` — but storage stays at 60 until the user clicks. Other places in the app (the actual particle renderer in `AmbientEffects.tsx`) use the raw 60, not the bucket. Visual/state mismatch.

→ **Suggestion:** Two options.
1. Eagerly normalize on first profile load (fire-and-forget save when `effectSize !== bucketEffectSize(effectSize)`).
2. Pass the bucketed value to `AmbientEffects` from `Layout.tsx`.

Option 2 is non-invasive; option 1 cleans the data over time. Either way, today's behavior is "Small label, not-quite-Small particles."

---

## Quick Wins

1. **Hoist inline styles in `glyph-primitives.tsx`** to module-level consts (~6 declarations, zero behavior change, immediate paint savings with N=20+ particles).
2. **`GlyphWrapper` double-percent indirection** — wrapper is `100% × 100%`, then every inner element is `80%`. Could just have `GlyphWrapper` render at `80%` directly with `flex` centering, and inner shapes fill `100%`. Less mental layering for the next reader.

---

## Testing Gaps

1. **Round-trip persistence** — no test that `effectSize` saves to the storage adapter and reloads correctly. The `?? 100` fallback in `Layout.tsx:59` is untested for the "absent field" path. Add an integration test using the localStorage adapter: save profile with `effectSize: 70` → reload → assert `Small` is active.

2. **`saveAppearance` failure paths** — the comment says *"Silent fail for real-time picker to avoid toast spam"* (`ProfilePage.tsx:175`), but there's no test confirming silent. If someone removes the `.catch()` accidentally, the test won't catch it. A small unit test with a rejecting adapter mock would lock the contract.

3. **E2E click-and-verify** — `e2e/the-fine-print.spec.ts:128-134` only checks Medium is the default; no test clicks `Large` and verifies particle `--fx-size` actually grew. The viewport-scaling test does this for screen size, but the **picker → effect** end-to-end isn't covered.

4. **Reduced-motion + size interaction** — what happens if a user picks `Large` then enables reduced-motion? Current code returns no particles (correct), but no test guards against a future regression that, say, computes size before checking reduced-motion.

---

## Overall

This is a polished, deliberate piece of work — the kind of small feature that *looks* trivial but actually has 4–5 nice-to-have decisions baked in (legacy bucket fallback, viewport awareness, glyph parity at 80%, atomic clicks instead of drag, optional schema field). Tests are exemplary. The refactor opportunities are mostly **forward-looking hygiene** rather than fixes — particularly the `saveAppearance` parameter object, which I'd push for *before* the next appearance dimension lands. Sweep that one in a small follow-up PR and this module will stay clean for the next three features.

Beautiful work, beta. Keep the SRP discipline — the glyph-primitives refactor is a great template to point future contributors at.

---

## Architectural Notes

Notice the architectural rhythm here:

```
effectSize.ts        (pure math — bucket, tiers)
       ↓
SizeTierPicker.tsx   (presentation)
       ↓
ProfilePage.tsx      (state + persistence)
       ↓
AmbientEffects.tsx   (consumer)
```

Each layer has one job and reads top-to-bottom. That's a *good* dependency graph — no cycles, no leaks. When refactoring, preserve this layering.

The `bucketX` + `X_TIERS` pair is a small but reusable design idiom in this codebase (intensity + size now). Consider extracting it as a documented pattern in `CLAUDE.md` so the next contributor reaches for it instead of inventing a fresh one.

---

## Recommended Next Actions

| Priority | Action | Effort | File(s) |
|---|---|---|---|
| P1 | Refactor `saveAppearance` to parameter-object signature | ~30 min | `ProfilePage.tsx` |
| P2 | Extract `useMatchMedia(query)` and consume from both hooks | ~15 min | `AmbientEffects.tsx` |
| P2 | Audit `--fx-scale` vs `--fx-size` CSS to confirm no double-multiplier | ~10 min | `index.css`, `AmbientEffects.tsx` |
| P3 | Add round-trip persistence test for `effectSize` | ~20 min | new test file |
| P3 | Hoist inline styles in `glyph-primitives.tsx` | ~10 min | `glyph-primitives.tsx` |
| P4 | Document `bucketX` + `X_TIERS` idiom in `CLAUDE.md` | ~5 min | `CLAUDE.md` |

— Sharma Ji 🙏

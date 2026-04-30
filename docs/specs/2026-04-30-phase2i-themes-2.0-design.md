# Phase 2i — Themes 2.0: Atmosphere & Glyphs

**Date:** 2026-04-30
**Branch:** `feat/the-atmosphere-thickens`
**Version target:** `0.2.17`
**Predecessor:** Phase 2h (Universal List Controls, shipped as `0.2.15`) and the four low-risk theme/effects polish edits (`0.2.16` patch on the same branch)
**Successor:** Phase 2j — Iconography (separate spec, `0.2.18`)

## Summary

AFP currently has 10 themes that differ in color, font, and a single layer of foreground emoji particles. They feel like *different palettes*, not *different rooms*. Phase 2i closes that gap by:

1. Giving each non-Charcoal theme a **CSS-only atmosphere layer** behind content
2. Replacing the 8 emoji-based particles with **CSS or inline-SVG shape primitives** that match each theme's typographic register
3. Refactoring particle randomization into **depth-correlated scaling** so motion reads as parallax atmosphere instead of confetti
4. Replacing the 0–100 intensity slider with a **5-tier button row** matching AFP's existing pill-row pattern
5. Catching up the **DevBench** with generators for Meals / Needs / Milestones, anchored at the most recent date
6. Adding a **Theme Tour** button to DevBench for visual regression QA across all 10 themes

Charcoal remains intentionally silent — no atmosphere, no particles. Patronus animal effects keep their filtered emoji rendering as a deliberate, documented exception.

## Goals

- Every non-Charcoal theme expresses its identity at three layers — atmosphere, particles, typography — instead of one
- Particle motion reads as natural atmosphere (depth illusion) rather than uniformly distributed visual noise
- Intensity control matches the rest of AFP's UX vocabulary (pill rows, atomic clicks)
- DevBench can populate the app with realistic content for visual QA, with records anchored at present-day so the new sticky day headers actually show `Today` / `Yesterday`
- Visual regression of all 10 themes is reproducible via a single button (Theme Tour)

## Non-Goals

- **Patronus animal redesign** — current filtered emoji approach is preserved (Q5 decision); the silvery `filter: blur + drop-shadow` already abstracts them away from their stock emoji rendering
- **Per-effect scale tuning** (`scaleRange` on `ThemeEffectConfig`) — depth correlation is enough for v1; per-effect tuning is a follow-up if specific themes need it
- **Viewport / time-of-day adaptive scaling** — out of scope for this phase
- **New themes** — works on the existing 10
- **Atmosphere data model** — atmosphere lives in CSS, not `THEME_DEFINITIONS` (Q2 decision)
- **Animation choreography between atmosphere and particles** — they coexist independently, no orchestrated sequencing
- **Iconography (per-row category icons)** — split into Phase 2j (`0.2.18`)
- **Seed-everything DevBench generator** — deferred (Bench B from brainstorm)

## Constraints and Boundaries

- **Charcoal stays silent** — no atmosphere, no particles. Documented as feature in `src/themes/README.md`
- **`prefers-reduced-motion` honored at every layer** — AmbientEffects already has the early-return (shipped in this session). Atmosphere CSS must honor it per-theme via `@media (prefers-reduced-motion: reduce) { body.theme-X::before { animation: none; } }`
- **Existing `effectIntensity: number` data unchanged** — slider rewrite reuses the field, just constrains future writes to {0, 25, 50, 75, 100}. Legacy values bucket on read; no migration script
- **Squashes with the four low-risk edits** already on this branch (`feat/the-atmosphere-thickens`)
- **No new Firestore fields, no rules changes, no security review needed**

## Architecture and Contracts

### Atmosphere — pure CSS per theme

Each theme's CSS file gains an atmosphere block. Illustrative example (specific values — angles, opacities, vignette intensity — are tunable in implementation; see Learning-Mode slot below):

```css
/* marauders-map.css */
body.theme-marauders-map::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  background:
    linear-gradient(105deg, transparent 48%, rgba(120,90,50,0.08) 49% 51%, transparent 52%),
    linear-gradient(15deg, transparent 73%, rgba(120,90,50,0.06) 74% 76%, transparent 77%),
    radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(90,60,30,0.18) 100%);
}

@media (prefers-reduced-motion: reduce) {
  body.theme-marauders-map::before { animation: none; }
}
```

- Atmosphere sits at `z-index: -1` — behind content, in front of body bg
- Themes that need two layers (e.g. Marauder's Map = folds + vignette) use both `::before` and `::after`
- Animated atmospheres declare `@keyframes` in the same theme file
- Charcoal omits the rule entirely
- `position: fixed` (not absolute) so the layer doesn't repaint on scroll

### Glyph rendering — extend `AmbientEffects.tsx`

The existing render pipeline outputs `{p.content}` as text inside a styled div. New contract:

- If `effect.content` is non-empty → render as text (Patronus emoji path, unchanged)
- If `effect.content` is empty (`''`) → dispatch to a `<GlyphPrimitive effectId={...} />` component that switches on the effect ID and renders the right CSS shape or inline SVG

```tsx
{p.content ? p.content : <GlyphPrimitive effectId={p.effectId} />}
```

`GlyphPrimitive` lives in `src/shared/components/glyph-primitives.tsx` — one file, 8 small components (`SnowflakeGlyph`, `LeafGlyph`, `StarGlyph`, `HeartGlyph`, `InkBlotGlyph`, `BubbleGlyph`, `EmberGlyph`, `WispGlyph`). Pure render, no state. Migration: in `THEME_DEFINITIONS`, set `content: ''` for the 8 redesigned effects; Patronus keeps `content` populated with the comma-separated emoji list.

### Depth-correlated scaling

Replace three independent randoms (`scale`, `opacity`, `duration`) with a single depth value driving all four CSS vars:

```ts
const depth = r5;            // 0 = far, 1 = close
const jitter = (r6 - 0.5) * 0.1;  // tiny ±5% noise

'--fx-scale':    `${0.5 + depth * 1.0}`,
'--fx-opacity':  `${0.25 + depth * 0.55}`,
'--fx-size':     `${10 + depth * 16}px`,
'--fx-duration': `${effect.baseSpeed * (2 - depth) * (1 + jitter)}s`,
```

Far particles: small + faint + slow. Close particles: big + bright + fast. Net effect: same number of CSS-var assignments, but they tell a coherent story instead of independently random ones.

### Slider — tier-button row

Replace the `<input type="range">` with a 5-button row mirroring AFP's existing pill-row patterns (time-range pills, payment-method bubbles):

```tsx
const TIERS = [
  { value: 0,   label: 'Off' },
  { value: 25,  label: 'Subtle' },
  { value: 50,  label: 'Standard' },
  { value: 75,  label: 'Lively' },
  { value: 100, label: 'Maximum' },
] as const;
```

- Active tier: `border-accent bg-accent text-fg-on-accent`
- Inactive: `border-line text-fg-muted hover:border-accent/50`
- Click → atomic save (one tier change = one Firestore write = one toast)
- `effectIntensity: number` field unchanged on disk; bucketing utility maps legacy values: `0 → 0, 1-37 → 25, 38-62 → 50, 63-87 → 75, 88-100 → 100`

The labels themselves ("Subtle", "Standard", "Lively", "Maximum") are a learning-mode contribution slot — final wording is the user's call.

## Per-Axis Designs (Approved Directions)

### Atmosphere ×9 themes (Charcoal silent)

| Theme | Atmosphere | Motion |
|---|---|---|
| Family Blue | Sky-to-paler-sky vertical gradient with two soft cloud blooms | Slow oscillation |
| Garden Path | Dappled green/gold radial pools | Slow drift |
| Lullaby | Vellum nightlight vignette + paper grain | Static |
| Rose Quartz | Pearlescent conic-gradient shimmer | Slow rotation |
| Charcoal | — (intentional silence) | — |
| Marauder's Map | Diagonal fold creases + sepia edge vignette | Static |
| Neon Glow | CRT raster + chromatic aberration tint | Subtle vertical drift |
| Deep Mariana | Overlapping caustic bio-green pools | Slow current |
| Industrial Furnace | Molten orange radial at viewport bottom | Slow pulse |
| Expecto Patronum | Silver mist bands + faint stars | Drifting fog |

### Glyph primitives ×8 effects

| Effect | New approach | Tech |
|---|---|---|
| Snowflake | 6-axis line crystal with optional barbs | Inline SVG (currentColor) |
| Leaf | Teardrop with central vein, two tones | Inline SVG |
| Star | Glow halo via radial-gradient + box-shadow | Pure CSS |
| Heart | Two rotated rounded rectangles | Pure CSS |
| Ink-blot | Stacked radial-gradients with blur (replaces footprints 👣) | Pure CSS |
| Bubble | Radial sphere with highlight + thin border | Pure CSS |
| Ember | Yellow-hot core fading through orange to dark red | Pure CSS |
| Wisp | Blurred elongated ellipse, low-opacity silver | Pure CSS |

Patronus animal emoji are preserved (filtered render).

### Particle scaling

Single random `depth ∈ [0, 1]` per particle drives scale (0.5–1.5), opacity (0.25–0.8), size (10–26 px), and duration (1×–2× of `effect.baseSpeed`). Constants are a learning-mode contribution slot — tunable in implementation.

### Intensity slider

5-tier button row, atomic save, legacy bucketing on read. Tier labels as proposed unless overridden in implementation.

## DevBench Updates (Bench A)

### New generators

Add to `src/shared/components/bench-generators.ts`:

- `generateMeals(count: number, startDate?: string): MealEntry[]`
- `generateNeeds(count: number, startDate?: string): NeedEntry[]`
- `generateMilestones(count: number, startDate?: string): MilestoneEntry[]`

Each generator follows the existing pattern (pure functions returning arrays, ×1/×100/×1k buttons in `DevBench.tsx`).

### Date anchor refactor

All generators (existing + new) anchor at the most recent possible date and work backwards:

- Default `startDate` = `todayStr()`
- Records spread backwards across days based on `count`
- Existing generators that *hardcode* a past anchor get updated to accept a `startDate` param. Generators that already use `todayStr()` or a relative anchor are left alone.

This makes the new sticky day headers (`Today` / `Yesterday` / `Wed 30 Apr`) actually exercised by bench data.

If a shared `recentDateSpread(count, days)` helper doesn't already exist, extract it into `src/shared/utils/date.ts` to keep generators DRY.

### Theme Tour button

A new button in `DevBench.tsx` cycles through all 10 themes with a 3-second hold each:

- Click → applies `Family Blue`, waits 3s, applies `Garden Path`, waits 3s, ... ends back at the user's original theme
- Implements as a `setInterval` chain that calls `applyTheme(themeId, colorMode)` per step
- Stop button to abort mid-tour
- Dev-only (`if (!isFirebaseConfigured) return null` guard, same pattern as other DevBench features)

Tour is purely visual — useful for the implementer to verify all 10 atmospheres + glyphs render correctly without manually navigating Profile → Customize 10 times.

## Testing Strategy

### Programmatic tests

**`src/themes/__tests__/themes.test.ts`** — extend with:
- Every theme except Charcoal has either an atmosphere CSS rule or an empty effects array (no theme silently falls through both)
- Glyph effects (the 8 redesigned) have `content === ''`
- Patronus effects keep `content` populated
- All migrated theme IDs still resolve to a valid current ID

**`src/shared/components/__tests__/AmbientEffects.test.tsx`** — extend with:
- When `intensity = 0`, returns `null`
- When `prefersReducedMotion` matches, returns `null` (already covered)
- Particle count = `floor(maxParticles × intensity / 100)`
- For empty-content effects, renders `<GlyphPrimitive>`; for non-empty, renders text
- Depth-correlated: scale, opacity, and duration all derive from the same particle's base seed (verify by sampling outputs and confirming correlation)

**`src/shared/components/__tests__/glyph-primitives.test.tsx`** — new:
- Renders the right shape for each effect ID
- Falls through to a sensible default for unknown effect IDs

**`src/shared/components/__tests__/IntensityTierPicker.test.tsx`** — new:
- 5 buttons render with correct labels
- Active state derived from current value (with bucketing for legacy values)
- Click fires `onChange` with the tier value
- `bucketIntensity()` unit tests: `0 → 0, 30 → 25, 65 → 75`, etc.

**`src/shared/components/__tests__/bench-generators.test.ts`** — extend with:
- New generators produce records of correct shape and count
- Default `startDate` is today; records spread backwards
- Custom `startDate` honored

### Visual verification (no automation)

- Atmosphere CSS visual fidelity per theme
- Glyph aesthetic correctness (CSS gradients and SVG don't read in JSDOM)
- Particle motion in the browser (animation timing, depth illusion)

The Theme Tour button automates the *cycling* but not the *judging* — humans verify visually.

## Phasing (Implementation Order)

1. **Foundation** — `IntensityTier` enum, `bucketIntensity()` util, `<IntensityTierPicker>` (small isolated change, easy to test)
2. **Glyphs** — `glyph-primitives.tsx` registry + tests; flip `THEME_DEFINITIONS` content to `''` for the 8 effects; verify Patronus path untouched
3. **Depth scaling** — refactor `AmbientEffects.tsx` (single random `r5` driving 4 CSS vars); update existing tests
4. **Atmosphere** — one theme at a time. Recommend Marauder's Map first (most distinctive, validates the `::before`/`::after` pattern); Family Blue last (most subtle, easiest to over-tune). Each with a `prefers-reduced-motion` block.
5. **DevBench catch-up** — Meals/Needs/Milestones generators; refactor existing generators for `startDate` anchor
6. **Theme Tour button** — wired last, validates the whole stack visually

## Risks

- **CSS fidelity drift across browsers** — `conic-gradient` (Rose Quartz shimmer) and `repeating-linear-gradient` (Neon Glow scanlines) are baseline-supported but render slightly differently on Safari vs. Chrome. Mitigation: visual check on both. `clip-path` is only used inside the heart glyph, which has a paired-rectangles fallback anyway.
- **Atmosphere paint cost** — `body::before` with multiple radial-gradients can spike paint. Mitigation: `position: fixed` means the layer doesn't repaint on scroll. Verify in DevTools Performance for Industrial Furnace (most layered) and Garden Path (most overlapping radial-gradients).
- **Depth illusion weakness at low intensity** — at the `Subtle` tier (25%), fewer particles = less opportunity for parallax to read. Mitigation: accept it; "Subtle" tier is *meant* to feel quiet.
- **Legacy `effectIntensity` values** — bucketing on read means a user with stored `30` sees "Subtle" (25-bucket) but their disk value stays `30` until they next click a tier. Acceptable; non-destructive.

## Backwards Compatibility

- `THEME_DEFINITIONS.effects[].content` accepts `''` — no data migration; existing entries already typed as `string`
- `effectIntensity: number` field unchanged; legacy values bucket via `bucketIntensity()`
- No new Firestore fields, no rules changes, no security review needed
- Existing `prefers-reduced-motion` early-return preserved; atmosphere CSS joins the same opt-out

## Learning-Mode Contribution Slots

During implementation the user writes the meaningful 5–10 lines for:

1. **Marauder's Map atmosphere CSS** — fold-line angles, vignette intensity, sepia tone (aesthetic call)
2. **Depth-scaling constants** — proposed ranges (`0.5–1.5` scale, `0.25–0.8` opacity, `1×–2×` duration) are starting points; tune while watching the actual effect
3. **`IntensityTier` labels** — "Off · Subtle · Standard · Lively · Maximum" is a proposal but final wording is the user's call

## Version Cut

- **`0.2.16`** — the four low-risk theme/effects polish edits already on this branch (reduced-motion early return, ThemeSwatch mini-mockup, deterministic sweep opacity, Charcoal silence-by-design note). Tag at the foundation step or commit before atmosphere work begins.
- **`0.2.17`** — Phase 2i (this spec): atmosphere + glyphs + depth scaling + tier slider + DevBench catch-up + Theme Tour
- **`0.2.18` (future)** — Phase 2j Iconography: per-row category icons across Body / Baby / Budget. Floors keep their existing Unicode `↑` / `↓` arrows. Separate spec.

## Open Questions for Implementation

- Default `startDate` for generators — confirmed today, but if some generators want a different anchor (e.g. growth measurements that should spread across weeks rather than days), make `startDate` and `daysSpan` independent params
- Theme Tour timing — 3 seconds per theme is a guess; tune during implementation if too fast/slow
- Final `IntensityTier` label set (see learning-mode slot)
- Whether to extract a shared `<RowTime + RowAmount>` style util once Phase 2j arrives — premature optimization for now

## Related Documents

- `docs/specs/2026-04-10-themes-design.md` — original 10-theme roster spec
- `docs/plans/2026-04-25-enhanced-themes-plan.md` — Phase 2f enhancement plan
- `docs/plans/2026-04-29-phase2h-list-controls.md` — predecessor phase (universal list controls)
- `src/themes/README.md` — theme system reference, including the Charcoal silence-by-design note added in this branch

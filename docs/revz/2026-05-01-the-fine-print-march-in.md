# 2026-05-01 — Drill Sergeant Code Review: `feat/the-fine-print`

**Reviewer:** Lead PM (40-year veteran, started on COBOL/Fortran)
**Branch:** `feat/the-fine-print` → `master`
**Scope:** 17 files changed, +730 / −119

## Payload

- `SizeTierPicker` component (Small / Medium / Large)
- Viewport-aware particle multiplier (mobile 0.65×, desktop 1.0×)
- Glyph 80%-of-cell render parity (matches emoji cell padding)
- `effectSize` field on `UserProfile`

---

## 🔴 MISSION CRITICAL

None. No data-loss risks, no security holes, no SPOFs in this branch. The storage write is `?? 100` guarded for legacy profiles — old `UserProfile` documents without `effectSize` will not crash the renderer. Disciplined defense.

---

## 🟡 SOP VIOLATIONS

### [1] `e2e/the-fine-print.spec.ts:56` — hard `waitForTimeout(300)`

The spec uses `await page.waitForTimeout(300)` to wait for the viewport multiplier change to propagate.

**Order:** Project's own `CLAUDE.md` already cites: "Playwright `isVisible()` returns immediately — DO NOT USE arbitrary waits." This test will flake on slow CI and on a busy CPU. Replace with `expect.poll()` polling `--fx-size` on a particle until average drops below `desktop * 0.85`, or wait on a snapshot of element styles changing. Hard sleeps are how you court-martial a green CI run.

### [2] `src/shared/components/AmbientEffects.tsx:38–52` — magic numbers

`0.65`, `1.0`, and `'(max-width: 640px)'` are inlined.

**Order:** Move them into `src/shared/utils/effectSize.ts` as `MOBILE_SIZE_MULTIPLIER = 0.65`, `DESKTOP_SIZE_MULTIPLIER = 1.0`, and `MOBILE_BREAKPOINT_PX = 640`. The 20-Point Audit (#4) already prosecutes magic numbers (`PAGE_SIZE`, `METERS_PER_KM`). Don't open a new front. Co-locate the constant with the tier table where it belongs.

### [3] `src/shared/components/ProfilePage.tsx:56–73` — positional 6-arg signature

`saveAppearance(uid, theme, colorMode, intensity, size, profile)` is a positional 6-arg signature called from four handlers.

**Order:** Every new field on `UserProfile` is going to drag a callsite tax across four handlers. That is a single point of failure waiting for the next intern to add the seventh argument in the wrong slot. Refactor to:

```ts
saveAppearance(uid, { theme, colorMode, intensity, size }, profile)
```

Object params. Or you'll be back here next quarter.

### [4] `src/shared/components/ProfilePage.tsx:165, :185` — silent-fail saves

`// Silent fail for real-time slider/picker to avoid toast spam`

**Order:** Acknowledged UX trade-off, but in 1987 we still wrote to a log even when we suppressed user-facing alerts. A `console.warn` (or `vlog()` per your storage logging pattern) at minimum. Right now a Firestore permission regression on this write is invisible. Don't let a legitimate tactical decision become a blind spot.

---

## ⚪ TECHNICAL DEBT LIABILITY

### [5] `src/shared/components/glyph-primitives.tsx` — repeated `'80%'` literals

`GlyphWrapper` is a fine refactor and brings parity to the 80%-of-container rule. But every glyph repeats `width: '80%', height: '80%'` inline. Consider a `GLYPH_INNER_PCT = '80%'` constant or push it into the wrapper via a prop.

### [6] `src/shared/utils/effectSize.ts:18` — `bucketEffectSize` boundary rationale

The boundaries (≤84 → 70, ≥121 → 140, else → 100) work but the rationale is undocumented. Add a one-liner: "midpoints 85 / 120 round-down" so the next dev doesn't think the cutoffs are arbitrary.

### [7] `src/shared/components/__tests__/AmbientEffects.test.tsx` — duplicate `matchMedia` stubs

Three `describe` blocks each rebuild the `matchMedia` stub. Hoist a helper `stubMatchMedia(isMobile: boolean)` to de-dupe. Test bloat is still bloat.

### [8] CHANGELOG / ROADMAP / README split (8e62c76)

Docs wrap-up was committed separately. That is correct discipline. Noted with respect.

---

## Assessment Notes

- Every exported function has a header. ✅
- No unused imports. ✅
- `useMemo` deps include `theme`, `themeId`, `intensity`, `prefersReducedMotion`, `viewportMultiplier`, `effectSize`. Particle list will rebuild when any of these flip. ✅
- `mql.addEventListener('change', ...)` returns the unsubscribe — no leaks. ✅
- 8 new vitest cases + 4 new e2e cases. Coverage on the three behavioral changes (80% glyph, viewport multiplier, tier picker) is real. ✅
- Branch is on the comedy queue (`the-fine-print`) — not on a reserved trial-ending beat. ✅

---

## Verdict: **NEEDS REWORK** (light)

Solid mission. No mission-critical defects. Four SOP violations to clean before this lands on master:

1. Replace the 300ms sleep in the E2E spec with a deterministic poll.
2. Extract `0.65`, `1.0`, `640` into named constants in `effectSize.ts`.
3. Convert `saveAppearance` to an object-param signature.
4. Log silent-fail saves through `console.warn` / `vlog`.

After those, this is deploy-ready. The viewport-multiplier discipline and the glyph parity refactor are the kind of work I respect — measured, tested, with a fallback for legacy profiles. In 1987 we'd have written this in 6,000 lines of COBOL and still missed the size bucket. You did it in 730.

Not bad.

Now go fix the rework items. Dismissed.

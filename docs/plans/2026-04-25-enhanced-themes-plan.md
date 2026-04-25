# Plan: Enhanced Ambient Theme System Implementation

**Date:** 2026-04-25
**Feature:** Granular Ambient Effects (0-100% Intensity)

## Task 1: Update Data Structures & Types
**Goal:** Prepare `UserProfile` and `ThemeDefinition` for the new system.effectIntensity

1.  **Modify `src/shared/types.ts`**:
    - Update `UserProfile` interface: Add `effectIntensity: number`.
    - (Optional) Remove `effectCount` and `effectSize` if confirmed they are unused.
2.  **Modify `src/themes/themes.ts`**:
    - Update `ThemeDefinition` type to use a more structured `effects` configuration.
    - Update `THEME_DEFINITIONS` with new metadata (maxParticles, type, content).
    - Update `applyTheme` to skip applying `.effect-{name}` classes for particles (keep it for overlays like CRT).

**Verification:**
- `npm run lint` and `tsc` to ensure type consistency.

## Task 2: Refactor Behavioral CSS
**Goal:** Create reusable animation utilities in `src/themes/effects.css`.

1.  **Modify `src/themes/effects.css`**:
    - Add generic `@keyframes` for `fx-fall`, `fx-rise`, `fx-twinkle`, `fx-float`.
    - Add utility classes that use CSS variables for randomization (`--fx-left`, `--fx-delay`, etc.).
    - Retain legacy classes temporarily to avoid breaking the UI during transition.

**Verification:**
- Inspect `effects.css` for valid CSS syntax.

## Task 3: Create `AmbientEffects` Component
**Goal:** Implement the logic for rendering dynamic particles.

1.  **Create `src/shared/components/AmbientEffects.tsx`**:
    - Use `useMemo` to generate particle metadata based on `themeId` and `intensity`.
    - Map `intensity` (0-100) to particle count.
    - Render a list of elements with behavior-specific classes and inline styles.
2.  **Modify `src/shared/components/Layout.tsx`**:
    - Replace the static `<div className="fx-ambient" />` with `<AmbientEffects />`.
    - Pass `themeId` and `intensity` from `profile`.

**Verification:**
- Verify particles appear on themes like `Family Blue` or `Garden Path`.

## Task 4: Update Profile Page UI
**Goal:** Add the intensity slider and ensure persistence.

1.  **Modify `src/shared/components/ProfilePage.tsx`**:
    - Add `effectIntensity` to the `AppearanceSection`.
    - Implement a `Range` input (0-100).
    - Update `saveAppearance` to persist the new field to Firestore/localStorage.
    - Ensure live preview works by updating local state before saving.

**Verification:**
- Drag slider to 0: All particles disappear.
- Drag slider to 100: Maximum particles appear.
- Refresh page: Settings persist.

## Task 5: Cleanup
**Goal:** Remove legacy CSS and types.

1.  **Modify `src/themes/effects.css`**: Remove theme-specific pseudo-element rules.
2.  **Modify `src/themes/themes.ts`**: Finalize `ThemeDefinition` and remove migration shims.

**Verification:**
- Full app smoke test across multiple themes.

# Spec: Enhanced Ambient Theme System (v2)

**Date:** 2026-04-25
**Status:** Approved (Draft)
**Goal:** Transform static ambient effects into a granular (0-100%), dynamic particle system while optimizing the existing theme structure.

## 1. Current vs. Proposed System

| Feature | Current System | Enhanced System (Proposed) |
| :--- | :--- | :--- |
| **Particle Count** | Fixed at 2 (via `::before`/`::after`). | Dynamic (0 to ~30+ based on intensity). |
| **Logic** | CSS Classes on `<html>` + global CSS. | React Component (`AmbientEffects`) + CSS Utilities. |
| **Customization** | Binary (On/Off via Reduced Motion). | Granular (0-100% slider). |
| **Randomization** | Static (fixed positions in CSS). | Randomized per-particle (position, delay, speed). |
| **Performance** | Constant overhead. | Scales with user preference; optimized with `will-change`. |
| **Maintenance** | Hardcoded per theme in `effects.css`. | Decoupled behavioral animations; easy to add new effects. |

## 2. Data Shape

### User Profile (`src/shared/types.ts`)
Update `UserProfile` to replace legacy `effectCount`/`effectSize` with a single intensity value:
- `effectIntensity: number` (0 to 100). Default: 50.

### Theme Definitions (`src/themes/themes.ts`)
Refactor `ThemeDefinition` to support behavioral configurations:
```typescript
export type ThemeEffectConfig = {
  id: ThemeEffect;
  type: 'fall' | 'rise' | 'twinkle' | 'float' | 'sweep' | 'overlay';
  content: string;      // Emoji or empty for CSS-only shapes
  maxParticles: number; // Density at 100% intensity
  baseSpeed: number;    // Animation duration multiplier
};
```

## 3. Technical Approach

### 3.1 Component: `AmbientEffects.tsx`
A new shared component rendered in `Layout.tsx`:
- Props: `themeId`, `intensity`.
- Logic:
  - Calculates `count = Math.floor(maxParticles * (intensity / 100))`.
  - Generates an array of unique `Particle` objects.
  - Randomized CSS variables:
    - `--fx-left`: 0% to 100%
    - `--fx-delay`: 0s to 12s
    - `--fx-duration`: `baseSpeed` ± 2s
    - `--fx-size`: 0.8 to 1.5 scale

### 3.2 Behavioral CSS (`src/themes/effects.css`)
Refactor to generic animation utilities:
- `.fx-fall`: Translates Y from -10vh to 110vh with slight rotation.
- `.fx-rise`: Translates Y from 110vh to -10vh.
- `.fx-twinkle`: Opacity and scale pulsation at fixed coordinates.
- `.fx-float`: Gentle swaying motion.

### 3.3 Performance
- Particles use `position: fixed` and `will-change: transform`.
- The container uses `pointer-events: none` to ensure zero interaction interference.
- High intensity is capped per theme to prevent DOM bloat.

## 4. UI/UX: Profile Page
- **Range Slider**: A 0-100% slider labeled "Effect Intensity".
- **Live Preview**: As the user slides, particles are added or removed immediately from the background without a page reload.

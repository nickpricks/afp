# Phase 2f: Theme System — Design Spec

## Overview

Implement 10 themes (replacing the current 7), with distinct font pairings, configurable ambient effects per theme, and user-level effect customization in Profile. Source of truth: `SAM/design-samples/theme-showcase-all.html`.

## Theme Roster

### Keep (3, unchanged CSS)

| Theme | ID | Light+Dark | Accent | Fonts |
|-------|----|-----------|--------|-------|
| Family Blue | `family-blue` | Both | `#60a5fa` | Syne / system-ui |
| Deep Mariana | `deep-mariana` | Dark only | `#00e89a` | Syne / JetBrains Mono |
| Industrial Furnace | `industrial-furnace` | Dark only | `#ff6820` | Syne / JetBrains Mono |

### Rename (1)

| Old | New | ID Change |
|-----|-----|-----------|
| Night City: Apartment | Neon Glow | `night-city-apartment` → `neon-glow` |

### Drop (3, remove files + enum + definitions)

- Summit Instrument (`summit-instrument`)
- Corporate Glass (`corporate-glass`)
- Night City: Elevator (`night-city-elevator`)

### Add (6, new CSS files)

| Theme | ID | Light+Dark | Accent | Display Font | Body Font |
|-------|----|-----------|--------|-------------|-----------|
| Garden Path | `garden-path` | Both | `#16a34a` / `#22c55e` (dark) | DM Serif Display | system-ui |
| Lullaby | `lullaby` | Both | `#e8a44a` / `#ebb244` (dark) | Quicksand | Nunito |
| Rose Quartz | `rose-quartz` | Both | `#f472b6` | Playfair Display | system-ui |
| Charcoal | `charcoal` | Both | `#71717a` / `#a1a1aa` (dark) | Syne | JetBrains Mono |
| Marauder's Map | `marauders-map` | Both | `#c8a96e` | Cinzel | JetBrains Mono |
| Expecto Patronum | `expecto-patronum` | Dark only | `#b8d4e8` | Cinzel | JetBrains Mono |

## Color Palettes

All hex values from the approved showcase. Each light+dark theme has both variants in one CSS file.

### Garden Path

- Light: `bg:#f4f9f4` `card:#fff` `accent:#16a34a` `text:#1a2e1a` `muted:#6b8a6b` `border:#d4e5d4`
- Dark: `bg:#0a150a` `card:#132013` `accent:#22c55e` `text:#d0e8d0` `muted:#4a6a4a` `border:#1a301a`

### Lullaby

- Light: `bg:#faf6ef` `card:#fff` `accent:#e8a44a` `text:#3d3529` `muted:#8a7e6e` `border:#e8dfd2`
- Dark: `bg:#221c0e` `card:#2c2416` `accent:#ebb244` `text:#e4d8c0` `muted:#8a7c58` `border:#3a3020`

### Rose Quartz

- Light: `bg:#fdf2f8` `card:#fff` `accent:#f472b6` `text:#2e1a24` `muted:#8a6a7a` `border:#e8d0dc`
- Dark: `bg:#261a28` `card:#322434` `accent:#f472b6` `text:#ecdee4` `muted:#907080` `border:#443040`

### Charcoal

- Light: `bg:#fafafa` `card:#fff` `accent:#71717a` `text:#18181b` `muted:#a1a1aa` `border:#e4e4e7`
- Dark: `bg:#0c0c0e` `card:#18181b` `accent:#a1a1aa` `text:#e4e4e7` `muted:#52525b` `border:#27272a`

### Marauder's Map

- Light: `bg:#f5f0e0` `card:#fffdf5` `accent:#c8a96e` `text:#3a2e1a` `muted:#8a7a5a` `border:#ddd0b0`
- Dark: `bg:#100e08` `card:#1a1610` `accent:#c8a96e` `text:#d0c4a8` `muted:#5a5038` `border:#2a2418`

### Neon Glow (rename, CSS changes for ID only)

- Dark: `bg:#0d0505` `card:#141010` `accent:#ffb803` `text:#d0d0d0` `muted:#505050` `border:#2a2020`

### Expecto Patronum

- Dark: `bg:#080a10` `card:#0e1218` `accent:#b8d4e8` `text:#90a8b8` `muted:#4a5a68` `border:#182028`

## Font Loading

Single Google Fonts `<link>` in `index.html` with `&display=swap`:

```
Syne:wght@400;600;700;800
Orbitron:wght@400;600;700
JetBrains Mono:wght@400;500
Quicksand:wght@400;600;700
Nunito:wght@400;600;700
DM Serif Display
Playfair Display:wght@400;600;700
Cinzel:wght@400;600;700
```

8 font families total. All loaded upfront (negligible bandwidth for a 1-3 user app). If performance becomes an issue, switch to dynamic per-theme loading later.

### Font Application

`applyTheme()` sets CSS variables on `<html>`:
- `--font-display` — heading/display font
- `--font-body` — body/paragraph font

`index.css` maps these to Tailwind via `@theme`. Body and heading elements pick them up automatically.

Currently `THEME_DEFINITIONS` has `fonts: FontPair` but `applyTheme()` never applies them to the DOM. This spec closes that gap.

## Ambient Effects

### Effect Types

| Effect | Themes | Visuals | Technique |
|--------|--------|---------|-----------|
| `snowflakes` | Family Blue | Gray-blue snowflake chars drifting down | Emoji ❄ + CSS fall animation |
| `leaves` | Garden Path | Colored leaf emoji falling with rotation | Emoji 🍂🍃🍁 + CSS fall animation |
| `stars` | Lullaby | Golden star/sparkle emoji twinkling | Emoji ⭐✨ + CSS scale/opacity pulse |
| `hearts` | Rose Quartz | Pink hearts floating up + sparkle stars | Emoji 💖❤✨ + CSS float + pulse |
| `ink` | Marauder's Map | Footprint emoji appearing/fading in place | Emoji 👣 + CSS scale/opacity |
| `scanline` | Neon Glow | Gold horizontal line sweeping top→bottom | CSS gradient + translate |
| `crt` | Deep Mariana | Static horizontal scanline overlay | CSS repeating-linear-gradient on `::after` |
| `bubbles` | Deep Mariana | Green circles rising from bottom | CSS circles + translate animation |
| `embers` | Industrial Furnace | Orange/amber circles rising from bottom | CSS circles + translate animation |
| `wisps` | Expecto Patronum | Silvery mist blobs rising + ghost sparkles | CSS radial-gradient blobs + emoji ✨⭐ |
| (none) | Charcoal | Clean — minimal by design | — |

### Effect Architecture

Each theme's `THEME_DEFINITIONS` entry declares:

```ts
type ThemeEffect = 'snowflakes' | 'leaves' | 'stars' | 'hearts' | 'ink' | 'scanline' | 'crt' | 'bubbles' | 'embers' | 'wisps';

interface ThemeDefinition {
  // ... existing fields ...
  effects: ThemeEffect[];
  defaultParticleCount: number;  // e.g. 5
  defaultParticleSize: 'small' | 'medium' | 'large';
}
```

### Effect Rendering

- `.fx-ambient` container div in `Layout.tsx` (already exists as pattern from Floor-Tracker)
- `applyTheme()` adds/removes effect classes on `<html>` (e.g., `.effect-snowflakes`)
- CRT is a `::after` pseudo-element on `<html>` (static, not particle-based)
- All other effects use positioned elements inside `.fx-ambient`
- All effects respect `prefers-reduced-motion: reduce` — disabled entirely
- CSS animations in `effects.css`, one section per effect

### User Customization (Profile Page)

**Theme Picker UX:** Inline expandable section (Option A). A "Customize Theme" button below the current theme name expands to show a mini showcase grid (2-col, each card: accent swatch + name + font sample). Tap to select, collapse. Can be upgraded to bottom sheet (B) or dedicated page (C) later — the showcase card component is reusable.

After theme selection, effect controls appear:

- **Particle count** — slider: 0 (off) → 10 (busy), default from theme's `defaultParticleCount`
- **Particle size** — selector: Small / Medium / Large, default from theme's `defaultParticleSize`
- Stored in `UserProfile` alongside `theme` and `colorMode`
- `applyTheme()` reads these values and adjusts CSS variables (`--fx-count`, `--fx-size-min`, `--fx-size-max`)

## File Changes

### Create (8 CSS files + enum/definition updates)

```
src/themes/garden-path.css
src/themes/lullaby.css
src/themes/rose-quartz.css
src/themes/charcoal.css
src/themes/marauders-map.css
src/themes/expecto-patronum.css
src/themes/neon-glow.css          (rename from night-city-apartment.css)
```

### Delete (3 CSS files)

```
src/themes/summit-instrument.css
src/themes/corporate-glass.css
src/themes/night-city-elevator.css
```

### Modify

```
src/themes/themes.ts               — ThemeId enum (drop 3, rename 1, add 6), THEME_DEFINITIONS (all 10), FontPair updates, ThemeEffect type, applyTheme() font/effect logic
src/index.css                       — Update @import list (drop 3, add 6+rename), add --font-display/--font-body to @theme
src/themes/effects.css              — All ambient effect CSS (snowflakes, leaves, stars, hearts, ink, scanline, crt, bubbles, embers, wisps)
src/shared/components/Layout.tsx    — Add .fx-ambient container div
src/shared/components/ProfilePage.tsx — Add effect controls (particle count slider, size selector)
src/shared/types.ts                 — Add effectCount/effectSize to UserProfile (optional fields)
public/index.html                   — Add Google Fonts <link>
src/themes/README.md                — Update for new roster
```

### Tests

- Unit: Theme definitions complete (all 10 IDs, all have required fields)
- Unit: `applyTheme()` sets font CSS variables
- Unit: `applyTheme()` adds/removes effect classes
- Unit: `isValidThemeId()` accepts new IDs, rejects old
- E2E: Theme picker shows all 10 themes in Profile

## Migration

- Users with `summit-instrument`, `corporate-glass`, or `night-city-elevator` saved in profile fall back to `family-blue` (default)
- Users with `night-city-apartment` auto-migrate to `neon-glow` via `isValidThemeId()` check + mapping

## Loading Screen Integration

The loading screen (`LoadingScreen.tsx`) already uses `bg-surface` and `var(--accent)` — it automatically adapts to whatever theme is active. No changes needed.

## Loading Screen Polish (from prior review)

These 5 items should be addressed as part of this phase or immediately after:

1. Brand text wraps mid-word in 3-col grid — add `whitespace-nowrap` or smaller text
2. Visual weight inconsistency across scene viewBoxes — normalize
3. Athlete scene sparse — add environmental detail
4. "All" grid cards clinical — use `bg-[var(--accent-muted)]` tint
5. Single scene view wastes space — center or make card more substantial

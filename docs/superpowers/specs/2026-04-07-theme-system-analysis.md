# Theme System Analysis & Design Recommendations

**Date:** 2026-04-07
**Phase:** 2f (Themes) — for later use
**Status:** Reference document, not actionable yet

---

## Current Architecture

```
applyTheme(themeId, colorMode)
  → applies .theme-{id} to <html>
  → applies/removes .dark class
  → CSS custom properties cascade
  → @theme in index.css maps to Tailwind tokens (bg-surface, text-fg, etc.)
  → ProfilePage persists to Firestore
```

## 7 Themes

| Theme | ID | Family | Dark Only | Accent | Font Pair |
|-------|-----|--------|-----------|--------|-----------|
| Family Blue | `family-blue` | Family | No | `#60a5fa` | Syne / system-ui |
| Summit Instrument | `summit-instrument` | Summit | No | `#f59e0b` | Syne / system-ui |
| Corporate Glass | `corporate-glass` | Corporate | No | `#0070c0` | Syne / system-ui |
| Night City Elevator | `night-city-elevator` | Cyberpunk | Yes | `#00f0ff` cyan | Orbitron / JetBrains Mono |
| Night City Apartment | `night-city-apartment` | Cyberpunk | Yes | `#ffb803` gold | Orbitron / JetBrains Mono |
| Deep Mariana | `deep-mariana` | Deep | Yes | `#00e89a` green | Syne / JetBrains Mono |
| Industrial Furnace | `industrial-furnace` | Industrial | Yes | `#ff6820` orange | Syne / JetBrains Mono |

## 14 CSS Custom Properties Per Theme

```
--bg-primary          Main background
--bg-secondary        Secondary background
--bg-card             Card/section background
--bg-card-hover       Card hover state
--accent              Primary accent color
--accent-hover        Accent hover state
--accent-muted        Transparent accent (15-20% opacity)
--text-primary        Primary text
--text-secondary      Secondary text
--text-muted          Muted text
--text-on-accent      Text on accent background
--border              Border color
--border-light        Light border
--success / --error / --warning   Status colors
```

## Tailwind Mapping (@theme in index.css)

```
--color-surface       ← --bg-primary
--color-surface-secondary ← --bg-secondary
--color-surface-card  ← --bg-card
--color-accent        ← --accent
--color-accent-hover  ← --accent-hover
--color-fg            ← --text-primary
--color-fg-secondary  ← --text-secondary
--color-fg-muted      ← --text-muted
--color-fg-on-accent  ← --text-on-accent
--color-line          ← --border
--color-success       ← --success
--color-error         ← --error
--color-warning       ← --warning
```

## Dark Mode Strategy

- **Class-based:** `.theme-{id}.dark` overrides custom properties
- **Three modes:** light / dark / system (respects `prefers-color-scheme`)
- **Dark-only themes:** `darkOnly: true` forces dark class regardless of user preference
- **Light themes (3):** Family Blue, Summit Instrument, Corporate Glass have both variants
- **Dark themes (4):** Night City x2, Deep Mariana, Industrial Furnace are dark-only

## Theme Picker UI

- 4-column grid of theme buttons with 2-color preview swatches (bg + accent)
- Active theme highlighted with `border-accent ring-2 ring-accent/30`
- Color mode picker: Light / Dark / System buttons below theme grid
- Dark-only themes hide the color mode picker (or should — verify)

## Persistence Flow

```
User picks theme in ProfilePage
  → applyTheme(themeId, colorMode) applies to DOM immediately
  → saveAppearance(uid, theme, colorMode) writes to Firestore
  → Auth listener picks up profile change
  → useActiveThemeId() hook detects DOM class change reactively
```

## Design Observations (from CLAUDE.md Known Issues)

- **Overall contrast low:** Family Blue (`#60a5fa` on white) feels washed out. Needs stronger card shadows or darker text contrast
- **Stats score lacks context:** "45.4" has no goal/target reference
- **Floors recent list flat:** All rows identical styling

## Phase 2f Roadmap Items

| Item | Status |
|------|--------|
| 3 new themes — Lullaby, NurseryOs, MidnightFeed CSS | Not started |
| Ambient effects — per-theme animations | Not started |
| Apply design samples to components | Not started |

## Design Samples (SAM/design-samples/)

Three HTML mockups for theme-aware Body Stats variants:
- **stats-A-warm-instrument.html** → Family Blue / Summit — progress ring, terracotta, DM Serif Display
- **stats-B-dense-editorial.html** → Corporate Glass — big bold score, data table, Fraunces serif
- **stats-C-playful-streak.html** → Night City / Deep Mariana — streak banner, XP bar, GitHub heatmap

## Frontend Design Recommendations (parked for Phase 2f)

### Font Loading
Currently fonts are defined in `ThemeDefinition` but not dynamically loaded. Phase 2f should:
- Add Google Fonts `<link>` or `@font-face` declarations per theme
- Apply `font-family` via CSS custom property (`--font-display`, `--font-body`)
- Map to Tailwind via `@theme { --font-family-display: var(--font-display) }`

### Ambient Effects (effects.css is empty)
Ideas from design samples:
- Subtle particle/gradient animation on dark themes
- CSS `backdrop-filter` for glass effects on Corporate Glass
- Warm glow/grain overlay for Summit Instrument

### Contrast Fixes
- Family Blue: bump `--text-primary` from `#1e293b` to `#0f172a` for stronger contrast
- Add `shadow-sm` to cards by default (currently flat)
- Consider `--bg-card` slightly off-white (`#fafbfc`) instead of pure `#ffffff`

### Theme Preview Enhancement
Current 2-color swatch is basic. Consider:
- 3-color swatch (bg + card + accent)
- Mini mockup showing a card with text
- Theme name in the theme's own accent color

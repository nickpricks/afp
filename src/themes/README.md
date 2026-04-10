# themes/

CSS custom properties per theme, mapped to Tailwind via `@theme` in index.css.

## Roster (10 themes)

### Light + Dark (6)
- **Family Blue** — sky blue, family (default) · Syne / system-ui · snowflakes
- **Garden Path** — organic green, nature · DM Serif Display / system-ui · leaves
- **Lullaby** — warm gold, nursery · Quicksand / Nunito · stars
- **Rose Quartz** — soft pink, elegant · Playfair Display / system-ui · hearts
- **Charcoal** — silver/zinc, minimal · Syne / JetBrains Mono · none
- **Marauder's Map** — parchment gold, magic · Cinzel / JetBrains Mono · ink

### Dark Only (4)
- **Neon Glow** — neon gold, cyberpunk · Orbitron / JetBrains Mono · scanline
- **Deep Mariana** — bio-green, deep ocean · Syne / JetBrains Mono · CRT + bubbles
- **Industrial Furnace** — molten orange, industrial · Syne / JetBrains Mono · embers
- **Expecto Patronum** — ghostly silver, magic · Cinzel / JetBrains Mono · wisps

## Files

- **themes.ts** — `ThemeId` enum, `THEME_DEFINITIONS`, `ThemeEffect`, `applyTheme()`, `resolveThemeId()`, `useActiveThemeId()`
- **effects.css** — Ambient effect animations (snowflakes, leaves, stars, hearts, ink, scanline, crt, bubbles, embers, wisps)
- **buttons.css** — Shared button styles
- **loading.css** — Loading screen animations
- **[theme-name].css** — Per-theme CSS custom properties

## Adding a Theme

1. New CSS file in `src/themes/` with light (`.theme-{id}`) and optional dark (`.theme-{id}.dark`) variants
2. Import in `src/index.css`
3. New `ThemeId` enum member
4. Entry in `THEME_DEFINITIONS` with fonts, effects, preview colors

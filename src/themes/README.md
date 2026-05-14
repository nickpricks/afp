# themes/

CSS custom properties per theme, mapped to Tailwind via `@theme` in index.css.

## Roster (10 themes)

### Light + Dark (6)
- **Family Blue** — sky blue, family (default) -- Syne / system-ui -- snowflakes
- **Garden Path** — organic green, nature -- DM Serif Display / system-ui -- leaves
- **Lullaby** — warm gold, nursery -- Quicksand / Nunito -- stars
- **Rose Quartz** — soft pink, elegant -- Playfair Display / system-ui -- hearts
- **Charcoal** — silver/zinc, minimal -- Syne / JetBrains Mono -- none
- **Marauder's Map** — parchment gold, magic -- Cinzel / JetBrains Mono -- ink

### Dark Only (4)
- **Neon Glow** — neon gold, cyberpunk -- Orbitron / JetBrains Mono -- scanline
- **Deep Mariana** — bio-green, deep ocean -- Syne / JetBrains Mono -- CRT + bubbles
- **Industrial Furnace** — molten orange, industrial -- Syne / JetBrains Mono -- embers
- **Expecto Patronum** — ghostly silver, magic -- Cinzel / JetBrains Mono -- wisps

## Files

- **themes.ts** — `ThemeId` enum, `THEME_DEFINITIONS`, `ThemeEffect`, `ThemeDefinition`, `ColorMode`, `applyTheme()`, `resolveThemeId()`, `isValidThemeId()`, `useActiveThemeId()`
- **effects.css** — Ambient effect animations (snowflakes, leaves, stars, hearts, ink, scanline, crt, bubbles, embers, wisps)
- **buttons.css** — Shared button styles
- **loading.css** — Loading screen animations
- **family-blue.css** — Family Blue theme
- **garden-path.css** — Garden Path theme
- **lullaby.css** — Lullaby theme
- **rose-quartz.css** — Rose Quartz theme
- **charcoal.css** — Charcoal theme
- **marauders-map.css** — Marauder's Map theme
- **neon-glow.css** — Neon Glow theme
- **deep-mariana.css** — Deep Mariana theme
- **industrial-furnace.css** — Industrial Furnace theme
- **expecto-patronum.css** — Expecto Patronum theme

## Tests

- `__tests__/themes.test.ts` — Theme definitions, migration, and effect configuration

## Design notes

- **Charcoal ships with `effects: []` by design.** It is the deliberate quiet zone for users who want zero ambient motion or decoration — minimal aesthetic, minimal noise. Do not "fix" the empty effects array by adding a default; the absence is the feature.
- **Glyphs are shape primitives via `<GlyphPrimitive>`** for 8 effects (snowflakes/leaves as SVG, stars/hearts/ink/bubbles/embers/wisps as pure CSS). Patronus animals stay as filtered emoji because their silvery filter abstracts them out of any direct register clash with the theme typography. Glyphs render at `GLYPH_INNER_SIZE` (80%) of the particle container to match the visual cell padding of emoji content.
- **Atmosphere ×9 themes** ship a CSS-only `body.theme-X::before` (and optional `::after`) layer running behind content. Charcoal stays silent. Each theme honors `prefers-reduced-motion` per-theme.

## Adding a Theme

1. New CSS file in `src/themes/` with light (`.theme-{id}`) and optional dark (`.theme-{id}.dark`) variants
2. Import in `src/index.css`
3. New `ThemeId` enum member
4. Entry in `THEME_DEFINITIONS` with fonts, effects, preview colors

## Implementation Notes

### Depth-scaling math (AmbientEffects.tsx)

Particle depth is modelled by a single random `depth` value (0–1) per particle, seeded
deterministically. It drives four properties simultaneously so motion reads as parallax
atmosphere rather than independently-random confetti:

- **Scale** — `0.5 + depth * 1.0` → 0.5–1.5×
- **Opacity** — `0.25 + depth * 0.55` → 0.25–0.8
- **Size** — `10 + depth * 16` → 10–26 px
- **Duration** — `effect.baseSpeed * (2 - depth)` → 2× for far particles, 1× for close ones,
  plus ±5% jitter (`(r7 - 0.5) * 0.1`) to prevent mechanical synchronization

### Atmosphere CSS contract

Every animated atmosphere layer follows this boilerplate:

```css
body.theme-X::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  /* theme-specific gradient / animation */
}

@media (prefers-reduced-motion: reduce) {
  body.theme-X::before { animation: none; }
}
```

Themes that need two independent layers add a matching `::after` block (Lullaby, Neon Glow,
Expecto Patronum). Both blocks must carry `pointer-events: none; z-index: -1` so they never
intercept clicks or appear above content. The `prefers-reduced-motion` block should disable
animations without removing the static gradient background, so the atmosphere tint remains
for users who opt out of motion.

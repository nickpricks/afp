# e2e/

Playwright end-to-end tests for AFP.

## Structure

Total: **82 tests across 4 spec files** (run `bunx playwright test --list` for the live count).

- `app.spec.ts` — App shell + per-module flows (header, routing, body/budget/baby modules, admin panel, profile, route guards, theme application + persistence)
- `flows.spec.ts` — Multi-step interaction flows
- `themes-2.0.spec.ts` — Phase 2i regression coverage: atmosphere CSS (all 10 themes), glyph dispatch (SVG vs CSS-div vs emoji), intensity tier picker (Off/Maximum effect on particle count), reduced-motion short-circuit, and DevBench Theme Tour
- `the-fine-print.spec.ts` — Phase 2i fine-print regression: viewport-aware particle size scaling (mobile 0.65× vs desktop), `<SizeTierPicker>` rendering and active-state, picker → AmbientEffects pipeline (clicking Large grows `--fx-size`). Tier labels derived from `INTENSITY_TIERS` / `EFFECT_SIZE_TIERS` so renames don't break tests

## Test Areas

- App shell (header, navigation, routing)
- Body module (config gate, floors, stats, walking, running, cycling)
- Budget module (expenses, income, payment methods)
- Baby module (child creation, feeds, sleep, growth, diaper)
- Admin panel (invites, user management)
- Profile page (theme selection, color mode, intensity + size tier pickers)
- Route guards (module gates, admin gates)
- Themes 2.0 (atmosphere CSS, glyph primitives, depth-correlated scaling, viewport-aware particle size)

## Conventions

- Run with `bun run test:e2e`
- Tests use Playwright browser automation against the dev server
- Dev mode bypass (no Firebase) enables full test coverage without auth

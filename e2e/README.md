# e2e/

Playwright end-to-end tests for AFP.

## Structure

- `app.spec.ts` -- 42 tests across 11 describe blocks

## Test Areas

- App shell (header, navigation, routing)
- Body module (config gate, floors, stats, walking, running, cycling)
- Budget module (expenses, income, payment methods)
- Baby module (child creation, feeds, sleep, growth, diaper)
- Admin panel (invites, user management)
- Profile page (theme selection, settings)
- Route guards (module gates, admin gates)
- Themes (application, persistence)

## Conventions

- Run with `bun run test:e2e`
- Tests use Playwright browser automation against the dev server
- Dev mode bypass (no Firebase) enables full test coverage without auth

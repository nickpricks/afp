# src/

App entry point and global setup.

## Files

- **main.tsx** — React root render
- **App.tsx** — Provider tree, route definitions (uses `ROUTES` constants + `ModuleGate`/`AdminGate` guards)
- **index.css** — Tailwind v4 directives + theme CSS imports via `@theme`
- **test-setup.ts** — Vitest global test configuration (jest-dom matchers)
- **pwa.d.ts** — Type declarations for vite-plugin-pwa
- **vite-env.d.ts** — Vite client type reference

## Directories

- `shared/` — Cross-cutting infrastructure (auth, storage, errors, UI shell, types, utils)
- `modules/` — Feature modules (body, expenses, baby)
- `admin/` — TheAdminNick admin panel + invite management
- `constants/` — App config, routes (AppPath enum), DB paths, error messages
- `themes/` — 7 CSS theme files + theme definitions

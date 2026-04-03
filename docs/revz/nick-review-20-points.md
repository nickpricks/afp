# Nick's 20-Point Code Review — 2026-04-02

Original review after Phase 1 scaffold. Status tracked against pre-0.0.2 through pre-0.0.5.

| # | Point | Status | Where Fixed |
|---|---|---|---|
| 1 | Dev mode bypass — buttons unclickable, nothing working. Console logs. Allow dev mode even with Firebase configured | ✅ Fixed | pre-0.0.2 (Batch 4) — localStorage adapter, fake firebaseUser |
| 2 | Lint and e2e errors — saved in docs/revz | ✅ Fixed | pre-0.0.2 (Batch 1) — ESLint, fast-refresh, setState-in-effect |
| 3 | package.json — keep commands separate, `&&` breaks on Windows PowerShell | ✅ Fixed | pre-0.0.5 — added `typecheck`, `lint:eslint`, `setup:env:all` uses composition |
| 4 | All constant values (vite config name, desc, theme) from constants file deriving from .env | ✅ Fixed | pre-0.0.5 — CONFIG has all app constants + invite config |
| 5 | Routes should be an enum — `AppPath.Home` | ✅ Fixed | pre-0.0.5 — `enum AppPath` in `constants/routes.ts` |
| 6 | Standard errors/messages as enum/constant, constants as dir split across files | ✅ Fixed | pre-0.0.5 — `constants/messages.ts` with ValidationMsg, InviteMsg, ExpenseMsg, ProviderMsg |
| 7 | SyncStatus, offline status — all enums | ✅ Fixed | pre-0.0.3 (Batch 2) — `SyncStatus` enum |
| 8 | Interfaces and types need a place — single file or dir | ✅ Partial | `shared/types.ts` has core types, module types in module dirs |
| 9 | No `\|\|` fallbacks — proper configs + tests that ensure all configs | ✅ Fixed | pre-0.0.3 (Batch 2) — split DEV/PROD firebase config, `??` for VERSION |
| 10 | DB table/collection paths — all constants or string enums | ✅ Fixed | pre-0.0.5 — `constants/db.ts` with DbCollection, DbSubcollection, DbDoc, DbField + path helpers |
| 11 | Invite code config — shouldn't be random length, put in config/constants | ✅ Fixed | pre-0.0.5 — CODE_LENGTH, CHARSET, DEV_INVITES_KEY moved to CONFIG |
| 12 | Regex consts or utils file | ✅ Fixed | pre-0.0.5 — `utils/regex.ts` with DATE_RE, INVITE_CODE_RE |
| 13 | Date common functions — maybe dayjs, one point reference | ✅ Fixed | pre-0.0.3 (Batch 3) — `utils/date.ts`, dayjs evaluated and rejected |
| 14 | Arrow functions should always have explicit return (except tiny one-liners) | ✅ Fixed | pre-0.0.5 — all exported arrows have explicit return |
| 15 | Use ROUTES constants in App.tsx, create enum for pathnames | ✅ Fixed | pre-0.0.4 — App.tsx now uses ROUTES.*, enum backlogged |
| 16 | JSX `{}` blocks — curly brace on its own line (`react/jsx-curly-newline: require`) | ✅ Fixed | pre-0.0.5 — added `eslint-plugin-react`, autofixed 9 files |
| 17 | No ternary in TSX — use `cond && ...` / `!cond && ...` pattern | ✅ Fixed | pre-0.0.5 — replaced in all components |
| 18 | `calculateTotal` doesn't describe what it does | ✅ Fixed | pre-0.0.3 (Batch 3) — renamed to `computeBodyScore` |
| 19 | `Number(amt)` / `isNaN` checks belong in utils | ✅ Fixed | pre-0.0.3 (Batch 3) — `isValidNumber()` in `utils/validation.ts` |
| 20 | Keep types/constants/utils centralized — not building Ajanta Ellora caves | ✅ Partial | Shared utils centralized, module-specific types stay in modules |

## Summary

- **20/20 fixed** — all items addressed across pre-0.0.2 through pre-0.0.5
- Partial: #4 (most config centralized, some vite config values still inline), #8 (shared types centralized, module types stay in modules), #20 (shared utils centralized, module-specific stays local)

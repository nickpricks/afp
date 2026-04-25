# Nick's Code Standards — Living Doc

_Started 2026-04-02 after AFP Phase 1 scaffold. Updated 2026-04-10._
_Stack: React 19 + TypeScript + TSX. Go to follow._

---

## Current Standards

| # | Standard | Rule | Exception |
|---|---|---|---|
| 1 | **Naming — every name is a story** | `compute*` for derivation/scoring. Never `calculate*` or `get*` for aggregation. Even tiny helpers deserve real names. Short aliases (`cwf`) are OK if JSDoc covers both. | — |
| 2 | **Enums over strings — everywhere** | Routes → `AppPath.*`. DB paths → `DbCollection.*`. Messages → `constants/messages.ts`. Status → enum. If a string appears more than once and represents a domain concept, it's an enum. | — |
| 3 | **No `\|\|` fallbacks on config/env** | Use `??` only. `\|\|` silences misconfiguration in prod. DEV and PROD configs are separate objects — no merged config with fallbacks. | One-liners with optional UI display strings — low priority. |
| 4 | **Arrow functions — explicit return** | All exported arrow functions show the `return`. Keeps intent visible and JSDoc accurate. | Genuine minified one-liners where intent is obvious (`a => a * 2`). |
| 5 | **JSDoc on every exported function** | One-line `/** */` minimum. If the function has an alias, JSDoc covers both. Bad name = bad JSDoc = bad function. The doc forces the name to be honest. | — |
| 6 | **Import order** | React → external packages → internal components → helpers/hooks/utils → constants/types (always last). One blank line between groups. | — |
| 7 | **No ternary in JSX** | Use `cond && <X />` and `!cond && <X />`. Ternaries in JSX read like puzzles. | `className` ternaries are fine (`className={isActive ? 'a' : 'b'}`). Nested ternaries: never, anywhere. |
| 8 | **JSX curly newlines** | Multiline JSX expressions get `{` and `}` on their own lines. `bunx eslint --fix` handles it. | Single-expression one-liners. |
| 9 | **Constants centralized — not Ajanta Ellora caves** | `constants/config.ts` for `CONFIG.*`. `constants/routes.ts` for `AppPath`. `constants/db.ts` for Firestore paths. `constants/messages.ts` for strings. No magic numbers inline — ever. | Module-specific constants may live in the module if genuinely local. |
| 10 | **Utils extracted — if it appears twice** | `utils/date.ts`, `utils/validation.ts`, `utils/regex.ts`, `utils/sort.ts`, `utils/format.ts`. If a function is written in 2+ places, it belongs in utils. Even if it "seems like only one case" — try to make it a util. | — |
| 11 | **Result\<T\> on async — never void** | Every async operation returns `Result<T>`. Use `ok()`, `err()`, `isOk()`, `isErr()`. `void` return = silent failure waiting to happen. | — |
| 12 | **Hooks in separate files from providers** | `useAuth` in `useAuth.ts`, not `auth-context.tsx`. Context + Provider files export Context and Provider only. Required by react-refresh/fast-refresh. | — |
| 13 | **Single responsibility — one job, minimal lines** | A function does one job. A file does one concern. If you explain it with "and" — split it. Prefer many small focused files over fewer large ones. If you can't name a function cleanly, it's doing too much. | — |
| 14 | **Numeric enum trap** | `Object.values(NumericEnum)` returns both values AND reverse-mapped strings. Always filter: `.filter(v => typeof v === 'number')`. Prefer string enums — they don't have this issue. | — |
| 15 | **`package.json` scripts — no `&&` chaining** | `&&` breaks on Windows PowerShell `;;` works. Keep scripts separate. Use script composition (one script calls others) or even better use MakeFile (suggested but not mandatory). | — |

---

## AFP Phase 1 Audit (original, 2026-04-02)

Original review after Phase 1 scaffold. All 20 items fixed across pre-0.0.2 through pre-0.0.5.

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

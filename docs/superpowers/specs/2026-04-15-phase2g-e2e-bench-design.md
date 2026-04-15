# Phase 2g: E2E Interaction Tests + Benchmarks

**Date:** 2026-04-15
**Status:** Approved
**ROADMAP ref:** Phase 2g (8 items, 0/8 complete)

---

## 1. Goals

Add 5 multi-step Playwright tests that exercise real user flows (form fill, submit, reload, verify persistence) and 1 benchmark script that measures build time, bundle size, and test duration.

The existing 42 E2E tests in `app.spec.ts` verify that UI elements render. These new tests verify that **user workflows actually work end-to-end**, including data persistence across page reloads.

---

## 2. File Structure

| File | Purpose | New/Modified |
|---|---|---|
| `e2e/flows.spec.ts` | 5 interaction flow tests | New |
| `e2e/helpers.ts` | Shared helpers (`ensureBodyConfigured`, etc.) | New |
| `e2e/app.spec.ts` | Import `ensureBodyConfigured` from helpers | Modified (import only) |
| `scripts/bench.ts` | Build time, bundle size, test duration | New |
| `package.json` | Add `build:bench` script | Modified |

`app.spec.ts` keeps all 42 existing tests untouched. The only change is extracting the inline `ensureBodyConfigured` function to `helpers.ts` and replacing it with an import.

---

## 3. Interaction Flow Tests (`e2e/flows.spec.ts`)

All flows run in dev mode (localStorage adapter, all modules enabled, TheAdminNick role).

### 3.1 Budget Full Expense Flow

1. Navigate to `/budget/add`
2. Fill: date (today), category (first option), amount `150`, description `"Groceries test"`
3. Select payment method bubble (Cash)
4. Click "Add Expense"
5. **Immediate check**: verify success toast, navigate to `/budget`, verify "Groceries test" and "150" visible in list
6. **Reload** `/budget` — verify "Groceries test" and "150" still present

### 3.2 Body Configure, Log Floors, Switch Tab, Log Walk

1. Navigate to `/body` (fresh localStorage)
2. Save default config via `ensureBodyConfigured(page)`
3. Click Floors tab — tap up button 3 times — verify summary shows "3 up"
4. Click Walking tab — fill `500` in distance input — click "Log Walk"
5. **Immediate check**: verify "500" appears in activity list
6. **Reload** `/body` — Floors tab: verify "3 up" persists — Walking tab: verify "500" persists

### 3.3 Payment Bubble Toggle

1. Navigate to `/budget/add`
2. Click "Cash" bubble — verify active styling (`bg-accent text-fg-on-accent` classes)
3. Click "Cash" again — verify deselected (no active styling)
4. Click "UPI" — verify UPI active, Cash not active
5. No reload — this tests UI toggle behavior, not persistence

### 3.4 Body Gear Reconfigure

1. Navigate to `/body`, save default config (Floors + Walking enabled, Running off)
2. Verify Running tab is NOT visible in tab bar
3. Click gear button (⚙) — verify config form appears
4. Enable Running checkbox — click Save
5. **Immediate check**: verify Running tab now visible in tab bar
6. **Reload** `/body` — verify Running tab still present

### 3.5 Baby Add Child, Log Feed, Verify

1. Navigate to `/baby`
2. Fill name `"Test Baby"`, DOB `"2025-06-01"`, keep default module checkboxes
3. Click "Add Child" — verify success toast, page navigates to child detail
4. Locate Feeds section — fill feed form (type, amount, notes) — submit
5. **Immediate check**: verify feed entry appears in recent list
6. **Reload** — navigate back to child detail — verify feed entry persists

---

## 4. Verification Strategy

Each flow (except 3.3) uses a two-phase assertion:

1. **Immediate**: after submit, verify the entry/change is visible on page (React state updated correctly)
2. **Reload**: `page.reload()` or re-navigate, then verify the same data is still present (localStorage adapter round-trip works)

The reload step is the primary value — it catches bugs where state updates but storage writes fail or reads don't reconstruct properly.

---

## 5. Shared Helpers (`e2e/helpers.ts`)

Extracted from `app.spec.ts`:

- `ensureBodyConfigured(page)` — navigates to `/body`, saves default config if config form is showing
- `addChild(page, name, dob)` — fills and submits the add-child form, waits for toast (new helper for flow 3.5)

Both `app.spec.ts` and `flows.spec.ts` import from `helpers.ts`.

---

## 6. Benchmark Script (`scripts/bench.ts`)

Single Bun script. Run via `bun run build:bench`.

### Measurements

| Metric | Method |
|---|---|
| **Build time** | Shell out `bun run build`, measure with `performance.now()` delta |
| **Bundle size** | Glob `dist/assets/*.js` + `dist/assets/*.css`, sum file sizes. Report total and largest chunk |
| **Unit test duration** | Shell out `bunx vitest run`, parse timing from stdout |
| **E2E test duration** | Shell out `bunx playwright test`, parse timing from stdout |

### Output

Formatted table to stdout:

```
AFP Build Bench
───────────────────────────────
Build time       4.2s
Bundle (total)   312 KB
  largest chunk  148 KB (vendor.js)
Unit tests       6.1s (320 tests)
E2E tests        28.3s (47 tests)
───────────────────────────────
```

No file output. CI can capture stdout if needed later.

### Notes

- Runs in Bun runtime (not Vite) — no `@/` path aliases, use relative imports
- Uses `Bun.spawn` for shelling out to build/test commands
- E2E bench requires dev server not already running on port 3005 (Playwright config starts its own)

---

## 7. Package.json Changes

```json
{
  "scripts": {
    "build:bench": "bun scripts/bench.ts"
  }
}
```

---

## 8. What This Does NOT Include

- No changes to existing 42 E2E tests (beyond the helper import refactor)
- No CI integration for benchmarks (stdout only)
- No benchmark history tracking or regression detection
- No visual regression testing (screenshots)
- No Firebase/production E2E tests (all tests run in dev mode with localStorage)

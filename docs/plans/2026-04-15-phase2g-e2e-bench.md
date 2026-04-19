# Phase 2g: E2E Interaction Tests + Benchmarks — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5 multi-step Playwright E2E interaction tests and 1 benchmark script to complete Phase 2g.

**Architecture:** New `e2e/flows.spec.ts` for interaction tests (separate from existing 42 presence tests in `e2e/app.spec.ts`). Shared helpers extracted to `e2e/helpers.ts`. Benchmark script at `scripts/bench.ts` run via `bun run build:bench`.

**Tech Stack:** Playwright, Bun, Vite

**Spec:** `docs/superpowers/specs/2026-04-15-phase2g-e2e-bench-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `e2e/helpers.ts` | Create | Shared E2E helpers (`ensureBodyConfigured`, `addChild`) |
| `e2e/app.spec.ts` | Modify (import only) | Replace inline `ensureBodyConfigured` with import from `helpers.ts` |
| `e2e/flows.spec.ts` | Create | 5 interaction flow tests |
| `scripts/bench.ts` | Create | Build time, bundle size, test duration measurements |
| `package.json` | Modify | Add `build:bench` script |

---

## Task 1: Extract shared helpers

**Files:**
- Create: `e2e/helpers.ts`
- Modify: `e2e/app.spec.ts` (lines 1–20)

- [ ] **Step 1: Create `e2e/helpers.ts`**

```ts
import { expect, type Page } from '@playwright/test';

/**
 * Saves body config with default selections (Floors + Walking + Running).
 * Must be called before testing body tabs — the config form gates them.
 */
export async function ensureBodyConfigured(page: Page) {
  await page.goto('/body');
  // Wait for lazy-loaded route to render — either config form or tabbed interface
  const configOrTabs = page.getByText(/Configure Body Tracking|Stats/);
  await expect(configOrTabs.first()).toBeVisible({ timeout: 10000 });
  // If config form is showing, save it (fresh localStorage = always first visit)
  const saveBtn = page.getByRole('button', { name: 'Save Configuration' });
  if (await saveBtn.isVisible()) {
    await saveBtn.click();
    await expect(page.getByRole('button', { name: 'Stats' })).toBeVisible();
  }
}

/**
 * Adds a child via the baby onboarding form and waits for the success toast.
 * Returns the child name for downstream assertions.
 */
export async function addChild(page: Page, name: string, dob: string) {
  await page.goto('/baby');
  await expect(page.getByPlaceholder("Baby's name")).toBeVisible({ timeout: 10000 });
  await page.getByPlaceholder("Baby's name").fill(name);
  await page.locator('input[type="date"]').fill(dob);
  await page.getByRole('button', { name: 'Add Child' }).click();
  await expect(page.getByText('Child added')).toBeVisible({ timeout: 10000 });
}
```

- [ ] **Step 2: Update `e2e/app.spec.ts` — replace inline function with import**

Replace lines 1–20 of `e2e/app.spec.ts`. The original file starts with:

```ts
import { test, expect, type Page } from '@playwright/test';

// Dev mode: Firebase not configured, all modules enabled, TheAdminNick role, localStorage adapter

/**
 * Saves body config with default selections (Floors + Walking + Running).
 * Must be called before testing body tabs — the config form gates them.
 */
async function ensureBodyConfigured(page: Page) {
  await page.goto('/body');
  // Wait for lazy-loaded route to render — either config form or tabbed interface
  const configOrTabs = page.getByText(/Configure Body Tracking|Stats/);
  await expect(configOrTabs.first()).toBeVisible({ timeout: 10000 });
  // If config form is showing, save it (fresh localStorage = always first visit)
  const saveBtn = page.getByRole('button', { name: 'Save Configuration' });
  if (await saveBtn.isVisible()) {
    await saveBtn.click();
    await expect(page.getByRole('button', { name: 'Stats' })).toBeVisible();
  }
}
```

Replace with:

```ts
import { test, expect } from '@playwright/test';

import { ensureBodyConfigured } from './helpers';

// Dev mode: Firebase not configured, all modules enabled, TheAdminNick role, localStorage adapter
```

- [ ] **Step 3: Run existing E2E tests to verify no regression**

Run: `bunx playwright test`
Expected: All 42 tests pass (same as before).

- [ ] **Step 4: Commit**

```
feat: extract shared E2E helpers to e2e/helpers.ts
```

---

## Task 2: Flow 1 — Budget full expense

**Files:**
- Create: `e2e/flows.spec.ts` (this task creates the file with the first test)

**Context:**
- The add expense form is at `/budget/add`. It has: date input, category `<select>`, subcategory `<select>` (conditional), amount input (placeholder "Amount"), payment method bubbles, note input (placeholder "Note (optional)"), and "Add Expense" submit button.
- The default payment method is already selected (UPI — first quick method). The default category is the first in `getAllCategoryIds()`.
- After submit, `AddExpensePage` navigates to `/expenses` (note: this is a mismatched route — the actual list lives at `/budget`). The test must navigate to `/budget` manually to verify the entry.
- On the `/budget` list page, expenses are rendered by `ExpenseList` component. Each expense row shows the amount and note text.

- [ ] **Step 1: Create `e2e/flows.spec.ts` with budget flow test**

```ts
import { test, expect } from '@playwright/test';

import { ensureBodyConfigured, addChild } from './helpers';

// All flow tests run in dev mode: localStorage adapter, all modules enabled, TheAdminNick role.

test.describe('Flow: Budget full expense', () => {
  test('fill form → submit → verify in list → reload → verify persists', async ({ page }) => {
    // Navigate to add expense page
    await page.goto('/budget/add');
    await expect(page.getByPlaceholder('Amount')).toBeVisible({ timeout: 10000 });

    // Fill the form — category defaults to first option, payment method defaults to UPI
    await page.getByPlaceholder('Amount').fill('150');
    await page.getByPlaceholder('Note (optional)').fill('Groceries test');

    // Submit
    await page.getByRole('button', { name: 'Add Expense' }).click();

    // Immediate check: navigate to budget list and verify entry appears
    await page.goto('/budget');
    await expect(page.getByText('150')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Groceries test')).toBeVisible();

    // Reload and verify persistence
    await page.reload();
    await expect(page.getByText('150')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Groceries test')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the new test to verify it passes**

Run: `bunx playwright test e2e/flows.spec.ts`
Expected: 1 test passes.

- [ ] **Step 3: Commit**

```
test: add E2E flow — budget full expense with persistence check
```

---

## Task 3: Flow 2 — Body configure, log floors, switch tab, log walk

**Files:**
- Modify: `e2e/flows.spec.ts`

**Context:**
- `ensureBodyConfigured(page)` saves default config (Floors + Walking enabled).
- Floors tab: two `button.rounded-2xl` elements — first is up, second is down. Summary line is `p.text-sm.text-fg-muted` showing "X up (Ym) / Z down (Wm)".
- Walking tab: distance input with placeholder "Distance", unit toggle (m/km), "Log Walk" submit button. Logged entries appear below the form.
- Tab buttons are in a bar inside `main` — use `page.locator('main button', { hasText: 'Floors' }).first()` to target tab buttons (not quick action pills).

- [ ] **Step 1: Add body flow test to `flows.spec.ts`**

Append this `test.describe` block after the budget flow block:

```ts
test.describe('Flow: Body configure → log floors → log walk', () => {
  test('configure → floors up ×3 → walking 500m → reload → verify all persists', async ({ page }) => {
    // Configure body module with defaults
    await ensureBodyConfigured(page);

    // Switch to Floors tab and tap up 3 times
    await page.locator('main button', { hasText: 'Floors' }).first().click();
    const upButton = page.locator('button.rounded-2xl').first();
    const summary = page.locator('p.text-sm.text-fg-muted');
    await upButton.click();
    await upButton.click();
    await upButton.click();
    await expect(summary).toContainText('3 up');

    // Switch to Walking tab and log a walk
    await page.locator('main button', { hasText: 'Walking' }).first().click();
    await page.getByPlaceholder('Distance').fill('500');
    await page.getByRole('button', { name: 'Log Walk' }).click();

    // Immediate check: walk entry visible
    await expect(page.getByText('500')).toBeVisible({ timeout: 5000 });

    // Reload and verify persistence
    await page.reload();
    await expect(page.locator('main button', { hasText: 'Floors' }).first()).toBeVisible({ timeout: 10000 });

    // Verify floors persisted
    await page.locator('main button', { hasText: 'Floors' }).first().click();
    await expect(page.locator('p.text-sm.text-fg-muted')).toContainText('3 up');

    // Verify walk persisted
    await page.locator('main button', { hasText: 'Walking' }).first().click();
    await expect(page.getByText('500')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the test**

Run: `bunx playwright test e2e/flows.spec.ts`
Expected: 2 tests pass.

- [ ] **Step 3: Commit**

```
test: add E2E flow — body floors + walking with persistence
```

---

## Task 4: Flow 3 — Payment bubble toggle

**Files:**
- Modify: `e2e/flows.spec.ts`

**Context:**
- Payment method bubbles on `/budget/add` use `rounded-full border` base class. Active state adds `border-accent bg-accent text-fg-on-accent`. Inactive state: `border-line bg-surface-card text-fg-muted`.
- Quick methods shown by default: UPI (📲 UPI), UPI+CC (📲 UPI+CC), CC (💳 CC).
- Clicking "More..." expands to show Cash (💵 Cash), IMPS, RTGS, NEFT.
- Toggle: clicking an active bubble deselects it (`setPaymentMethod(null)`), clicking another selects the new one.
- Default selection: UPI is pre-selected on mount.

- [ ] **Step 1: Add payment toggle test to `flows.spec.ts`**

Append this `test.describe` block:

```ts
test.describe('Flow: Payment bubble toggle', () => {
  test('select → deselect → select another → verify styling', async ({ page }) => {
    await page.goto('/budget/add');
    await expect(page.getByText('Payment Method')).toBeVisible({ timeout: 10000 });

    // Expand to show all methods
    await page.getByText('More...').click();

    // Cash bubble — find by short label text
    const cashBubble = page.locator('button.rounded-full', { hasText: 'Cash' });
    const upiBubble = page.locator('button.rounded-full', { hasText: 'UPI' }).first();

    // UPI is pre-selected by default — verify active styling
    await expect(upiBubble).toHaveClass(/bg-accent/);

    // Click Cash — Cash becomes active, UPI deselects
    await cashBubble.click();
    await expect(cashBubble).toHaveClass(/bg-accent/);
    await expect(upiBubble).not.toHaveClass(/bg-accent/);

    // Click Cash again — deselects (no active method)
    await cashBubble.click();
    await expect(cashBubble).not.toHaveClass(/bg-accent/);

    // Click UPI again — reselects
    await upiBubble.click();
    await expect(upiBubble).toHaveClass(/bg-accent/);
  });
});
```

- [ ] **Step 2: Run the test**

Run: `bunx playwright test e2e/flows.spec.ts`
Expected: 3 tests pass.

- [ ] **Step 3: Commit**

```
test: add E2E flow — payment bubble toggle styling
```

---

## Task 5: Flow 4 — Body gear reconfigure

**Files:**
- Modify: `e2e/flows.spec.ts`

**Context:**
- After `ensureBodyConfigured(page)`, the default config has Floors + Walking enabled, Running OFF.
- The gear button (⚙) is in the tab bar with `aria-label="Settings"`.
- Clicking gear shows `BodyConfigForm` pre-filled with current config.
- Running checkbox: `page.getByLabel('Running')` (or the text "Running" next to a checkbox in the config form).
- After saving, the tab bar updates to include a "Running" tab button.
- Note: The config form shows checkboxes with labels like "Floors", "Walking", "Running", "Cycling". In the config form context, these are `<label>` elements wrapping checkboxes. But `getByLabel` matches the checkbox input. The existing E2E test (`app.spec.ts` line 69) uses `page.getByText('Running', { exact: true })` to find the label text in config form.

- [ ] **Step 1: Add gear reconfigure test to `flows.spec.ts`**

Append this `test.describe` block:

```ts
test.describe('Flow: Body gear reconfigure', () => {
  test('enable Running via gear → verify tab appears → reload → verify persists', async ({ page }) => {
    // Configure with defaults (Floors + Walking, Running OFF)
    await ensureBodyConfigured(page);

    // Verify Running tab is NOT visible
    const runningTab = page.locator('main button', { hasText: 'Running' }).first();
    await expect(runningTab).not.toBeVisible();

    // Click gear button to open config form
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByText('Configure Body Tracking')).toBeVisible({ timeout: 5000 });

    // Enable Running checkbox — click the label text to toggle
    await page.getByLabel('Running').check();

    // Save configuration
    await page.getByRole('button', { name: 'Save Configuration' }).click();

    // Immediate check: Running tab now visible
    await expect(page.locator('main button', { hasText: 'Running' }).first()).toBeVisible({ timeout: 5000 });

    // Reload and verify persistence
    await page.reload();
    await expect(page.locator('main button', { hasText: 'Stats' }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('main button', { hasText: 'Running' }).first()).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the test**

Run: `bunx playwright test e2e/flows.spec.ts`
Expected: 4 tests pass.

- [ ] **Step 3: Commit**

```
test: add E2E flow — body gear reconfigure with persistence
```

---

## Task 6: Flow 5 — Baby add child, log feed, verify

**Files:**
- Modify: `e2e/flows.spec.ts`

**Context:**
- `addChild(page, name, dob)` from helpers handles the add-child form and waits for toast.
- After adding a child, the page auto-navigates to `/baby/{childId}` (ChildDetail view).
- ChildDetail has tabs: Dashboard, Feeding, Sleep, Growth, Diapers. Default tab is "Dashboard".
- Click "Feeding" tab to go to FeedLog.
- FeedLog form: feed type buttons (Bottle is default), date input, time input, amount input (label "Amount (ml/g)" — visible when type is Bottle or Solid Food), notes text input (placeholder "Notes"), "Log Feed" submit button.
- After logging, the entry appears in "Recent Feeds" section below the form.
- Feed entries show the feed type label (e.g., "Bottle") and the amount + notes if present.

- [ ] **Step 1: Add baby flow test to `flows.spec.ts`**

Append this `test.describe` block:

```ts
test.describe('Flow: Baby add child → log feed → verify', () => {
  test('add child → feeding tab → log feed → reload → verify persists', async ({ page }) => {
    // Add a child via helper
    await addChild(page, 'Test Baby', '2025-06-01');

    // Should auto-navigate to child detail — wait for child name heading
    await expect(page.getByRole('heading', { name: 'Test Baby' })).toBeVisible({ timeout: 10000 });

    // Click Feeding tab
    await page.getByRole('button', { name: 'Feeding' }).click();
    await expect(page.getByRole('button', { name: 'Log Feed' })).toBeVisible({ timeout: 5000 });

    // Bottle is default type. Fill amount and notes.
    await page.locator('input[type="number"]').fill('120');
    await page.getByPlaceholder('Notes').fill('Morning bottle');

    // Submit
    await page.getByRole('button', { name: 'Log Feed' }).click();

    // Immediate check: feed appears in Recent Feeds
    await expect(page.getByText('Bottle')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('120 ml/g')).toBeVisible();
    await expect(page.getByText('Morning bottle')).toBeVisible();

    // Reload and verify persistence
    await page.reload();
    // After reload, we're back on the child detail page. Re-navigate to Feeding tab.
    await expect(page.getByRole('heading', { name: 'Test Baby' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Feeding' }).click();
    await expect(page.getByText('Bottle')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('120 ml/g')).toBeVisible();
    await expect(page.getByText('Morning bottle')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run all flow tests**

Run: `bunx playwright test e2e/flows.spec.ts`
Expected: 5 tests pass.

- [ ] **Step 3: Run ALL E2E tests to verify no regression**

Run: `bunx playwright test`
Expected: 47 tests pass (42 existing + 5 new).

- [ ] **Step 4: Commit**

```
test: add E2E flow — baby add child + log feed with persistence
```

---

## Task 7: Benchmark script

**Files:**
- Create: `scripts/bench.ts`
- Modify: `package.json`

**Context:**
- This script runs in Bun runtime (NOT Vite) — no `@/` path aliases. Use `Bun.spawn` to shell out.
- `bun run build` runs `tsc -b && vite build`, outputs to `dist/`.
- `bunx vitest run` runs unit tests. Timing is printed at the end (e.g., "Tests  320 passed (6.1s)").
- `bunx playwright test` runs E2E tests. Timing printed at the end (e.g., "47 passed (28.3s)").
- Bundle files are in `dist/assets/` — JS chunks (`*.js`) and CSS files (`*.css`).
- The script should cleanly handle cases where `dist/` doesn't exist yet (build hasn't been run) — run the build first.

- [ ] **Step 1: Create `scripts/bench.ts`**

```ts
import { Glob } from 'bun';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';

/** Runs a command and returns { stdout, stderr, durationMs } */
async function timedRun(cmd: string[]): Promise<{ stdout: string; stderr: string; durationMs: number }> {
  const start = performance.now();
  const proc = Bun.spawn(cmd, { stdout: 'pipe', stderr: 'pipe' });
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  await proc.exited;
  return { stdout, stderr, durationMs: performance.now() - start };
}

/** Formats bytes into human-readable KB */
function formatKB(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/** Formats milliseconds into seconds */
function formatSec(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

async function main() {
  console.log('\nAFP Build Bench');
  console.log('─'.repeat(45));

  // 1. Build time
  const build = await timedRun(['bun', 'run', 'build']);
  console.log(`Build time        ${formatSec(build.durationMs)}`);

  // 2. Bundle size
  const distAssets = join(process.cwd(), 'dist', 'assets');
  let totalBytes = 0;
  let largestBytes = 0;
  let largestName = '';

  const glob = new Glob('*.{js,css}');
  for await (const file of glob.scan(distAssets)) {
    const filePath = join(distAssets, file);
    const info = await stat(filePath);
    totalBytes += info.size;
    if (info.size > largestBytes) {
      largestBytes = info.size;
      largestName = file;
    }
  }

  console.log(`Bundle (total)    ${formatKB(totalBytes)}`);
  console.log(`  largest chunk   ${formatKB(largestBytes)} (${largestName})`);

  // 3. Unit test duration
  const unit = await timedRun(['bunx', 'vitest', 'run']);
  const unitMatch = unit.stdout.match(/(\d+)\s+passed/);
  const unitCount = unitMatch ? unitMatch[1] : '?';
  console.log(`Unit tests        ${formatSec(unit.durationMs)} (${unitCount} tests)`);

  // 4. E2E test duration
  const e2e = await timedRun(['bunx', 'playwright', 'test']);
  const e2eMatch = e2e.stdout.match(/(\d+)\s+passed/);
  const e2eCount = e2eMatch ? e2eMatch[1] : '?';
  console.log(`E2E tests         ${formatSec(e2e.durationMs)} (${e2eCount} tests)`);

  console.log('─'.repeat(45));
}

main();
```

- [ ] **Step 2: Add `build:bench` script to `package.json`**

In `package.json`, add to the `"scripts"` section:

```json
"build:bench": "bun scripts/bench.ts"
```

Add it after the `"clean:test"` entry (last existing script).

- [ ] **Step 3: Run the benchmark**

Run: `bun run build:bench`
Expected: Output similar to:

```
AFP Build Bench
─────────────────────────────────────────────
Build time        X.Xs
Bundle (total)    XXX.X KB
  largest chunk   XXX.X KB (vendor-XXXX.js)
Unit tests        X.Xs (320 tests)
E2E tests         XX.Xs (47 tests)
─────────────────────────────────────────────
```

- [ ] **Step 4: Commit**

```
feat: add build:bench script — build time, bundle size, test duration
```

---

## Task 8: Final verification + ROADMAP update

**Files:**
- Modify: `docs/ROADMAP.md`

- [ ] **Step 1: Run full test suite**

Run: `bunx playwright test`
Expected: 47 tests pass (42 existing + 5 flows).

Run: `bunx vitest run`
Expected: All unit tests pass (count should match what bench reported).

- [ ] **Step 2: Update ROADMAP.md — mark Phase 2g items as done**

In `docs/ROADMAP.md`, update the Phase Progress table row for 2g:

```markdown
| Phase 2g (E2E + Bench) | ✅ Done | 8/8 | Interactive E2E flows + build/bundle/test benchmarks |
```

Update each item in the Phase 2g section to show done status with strikethrough:

```markdown
| ~~🔨~~ | ~~E2E: Budget full expense flow (fill form → submit → verify in list)~~ | 2g | DONE |
| ~~🔨~~ | ~~E2E: Body configure → log floors → switch tab → log walk → verify~~ | 2g | DONE |
| ~~🔨~~ | ~~E2E: Payment bubble toggle (select → deselect → verify styling)~~ | 2g | DONE |
| ~~🔨~~ | ~~E2E: Body gear reconfigure (click gear → enable running → save → verify tab)~~ | 2g | DONE |
| ~~🔨~~ | ~~E2E: Baby add child → navigate to child → log feed → verify in recent~~ | 2g | DONE |
| ~~🔨~~ | ~~Bench: build time measurement (vite build with timing)~~ | 2g | DONE |
| ~~🔨~~ | ~~Bench: bundle size report from dist/~~ | 2g | DONE |
| ~~🔨~~ | ~~Bench: test suite duration tracking (unit + E2E)~~ | 2g | DONE |
```

Update the Total row: steps should increase by 8 (176 + 8 = 184, or whatever the current total is after all done items).

- [ ] **Step 3: Commit**

```
docs: mark Phase 2g complete in ROADMAP
```

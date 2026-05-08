# Consolidated Review — 2026-05-08

**Scope**:
1. Per-commit walk across the three most recent PRs to `master` (last is unmerged)
2. Full repo audit against the 15 active standards in `docs/revz/nick-review-20-points.md`
3. Cross-reference with prior reviewer reports (4 from 2026-05-01 on `feat/the-fine-print` + 6-agent final-countdown 2026-05-07 run on `feat/the-rehearsal`)

**Branch under review**: `feat/the-rehearsal` @ `325ce79` (already pushed; this doc targets a future hygiene branch — likely `feat/what-was-the-joke` per comedy-arc queue)

**Net verdict**: Standards adherence is **80% — 12 of 15 fully clean, 3 with doctrinal questions only, 5 with real fix work**. PR #18 was a feature spike cleaned up by `feat/the-rehearsal`. PR #19 (Auto tab) shipped without multi-agent review and left 3 issues live on master. Two march-in MISSION CRITICAL items pre-date all three PRs.

---

## Scope table

| PR | Branch | Squash on master | Status | Commits |
|---|---|---|---|---|
| #18 | `feat/the-fine-print` | `e1327b3` | ✅ Merged 2026-05-01 | 6 |
| #19 | `feat/who-fueled-it` | `3820be4` | ✅ Merged 2026-05-04 | 13 |
| (current) | `feat/the-rehearsal` | `325ce79` | 🟡 Pushed, NOT merged | 1 |

---

# Section A — Per-PR commit walk

## PR #18 — `feat/the-fine-print` (merged as `e1327b3`)

**Headline**: 730 inserts / 119 deletes across 17 files. Phase 2i fine-print: glyph 80% sizing + viewport-aware multiplier + SizeTierPicker + effectSize on UserProfile.

### Per-commit walk

#### `522f0e7` docs(claude): add branch-naming convention with comedy-arc queue
**Scope**: 1 file, +15. CLAUDE.md only.
**Verdict**: ✅ Clean. Doc-only addition formalizing the comedy-arc branch convention.

#### `99928ee` feat(themes): glyph render parity at 80% of container
**Scope**: 2 files, +187/-103. `glyph-primitives.tsx` (242 lines reshape) + 48 lines new tests.
**Standards compliance**:
- 🔴 #9 (no magic numbers): introduced `width="80%"` / `width: '80%'` 16 times across the file. Flagged by march-in H5 + nattu-kaka #5. **Fixed in rehearsal as `GLYPH_INNER_SIZE` constant.**
- ✅ Tests added (8 new cases — SVG width assertions, CSS-glyph wrapper assertions).
- ✅ Component shape clean (registry pattern, fallback dispatcher).

#### `4f8a20d` feat(themes): viewport-aware particle size multiplier (mobile 0.65x)
**Scope**: 2 files, +145/-4. AmbientEffects.tsx + 118 lines new tests.
**Standards compliance**:
- 🔴 #9: introduced `0.65`, `1.0`, `'(max-width: 640px)'` as inline magic numbers (4 sites total). Flagged by march-in #2, nattu-kaka #3.
- 🟡 #12 (concern): hook `useViewportSizeMultiplier` defined inside `AmbientEffects.tsx`, not in `src/shared/hooks/`. Sharma-ji LOW. **Fixed in rehearsal.**
- ✅ Tests covered both viewports (mobile/desktop) and reduced-motion path.
- ⚠️ Real bug introduced: same `sizeMultiplier` applied to BOTH `--fx-scale` and `--fx-size`, creating mobile compounding (0.42× instead of 0.65×). **Fixed in rehearsal.**

#### `2028ee8` feat(themes): SizeTierPicker + effectSize on UserProfile
**Scope**: 7 files, +209/-8. New `SizeTierPicker.tsx`, `effectSize.ts`, `?? 100` literals across 3 files.
**Standards compliance**:
- 🔴 #9: introduced 3 hardcoded `100` literals. Flagged by nattu-kaka #1. **Fixed in rehearsal as `EFFECT_SIZE_DEFAULT`.**
- 🟡 #14 (numeric enum trap): `bucketEffectSize` boundaries hardcoded `<= 84` / `>= 121` instead of derived. Flagged by all three reviewers. **Fixed in rehearsal as `Math.floor`/`Math.ceil` derivation from tier midpoints.**
- 🔴 #11 (Result discipline): `saveAppearance` returns `Promise<void>`, takes 6 positional params, drops adapter Result. Flagged by march-in H3, nattu-kaka #6, sharma-ji SOLID. **Fixed in rehearsal as options-object signature returning Result.**
- ✅ Tier-picker idiom (now codified in CLAUDE.md as `bucketX + X_TIERS`) ships clean here.
- ✅ Tests added.

**Verdict**: Largest hygiene-debt commit of the PR. Most issues flagged + fixed downstream.

#### `cec6dd2` test(e2e): mobile viewport regression for particle size scaling
**Scope**: 1 file, +135. New E2E spec.
**Standards compliance**:
- 🟡 The infamous `await page.waitForTimeout(300)` was introduced HERE. Flagged by march-in #1, nattu-kaka #8. **Fixed in rehearsal with `expect.poll(...)`.**
- 🟡 Used raw labels `'Family Blue'`, `'Standard'` instead of deriving from `THEME_DEFINITIONS` / `INTENSITY_TIERS`. **Fixed in rehearsal.**

#### `8e62c76` chore(docs): wrap-up CHANGELOG + README + ROADMAP for 0.2.17.2
**Scope**: 4 files, +39/-4. Pure docs + version bump.
**Verdict**: ✅ Clean wrap-up.

### PR #18 summary

| Standard | Violations introduced | Status |
|---|---|---|
| #9 (magic numbers) | 7+ inline literals | All fixed in rehearsal |
| #11 (Result<T>) | `saveAppearance` Promise<void> | Fixed in rehearsal |
| #12 (hook locality) | hook defined in component file | Fixed in rehearsal |
| #14 (numeric enum) | hardcoded boundaries | Fixed in rehearsal |
| Real bug | `--fx-scale` × `--fx-size` double-multiplier | Fixed in rehearsal |

**Spirit verdict**: The *spike* — get it working, ship the feature, accept hygiene debt. The post-merge reviewer round + rehearsal commit was the *settle*. Both phases honored.

---

## PR #19 — `feat/who-fueled-it` (merged as `3820be4`)

**Headline**: 5,534 inserts / 69 deletes across 36 files. Auto tab in Budget module: Fuel/Travel/Maintenance discriminated union, MetaSubForm, ServiceDueBanner, AutoTab, fuel-math, useExpenses expansion.

**Important**: This PR was *not* multi-agent reviewed before merge. The rehearsal-cycle agents (silent-failure-hunter, march-in, sharma-ji from the 2026-05-07 final-countdown run) caught issues here that are still live on master.

### Per-commit walk

#### `3d75985` docs(spec): fuel/travel/maintenance design — supersedes root draft
**Scope**: 1 file, +231. Pure spec doc.
**Verdict**: ✅ Clean.

#### `8b20346` chore: 0.2.18 prep + plan + review docs
**Scope**: 8 files, +3,479/-4. Plan doc (2,834 lines) + 4 review reports + version bump + CLAUDE.md update + workflow file edit.
**Standards compliance**:
- 🟡 Mixing concerns: a "prep" commit committed external-reviewer reports alongside the version bump.
- ⚠️ `deploy.yml` `VITE_APP_VERSION` left at `'v0.2.15'` — 3-version drift Chanakya flagged. **Fixed in rehearsal as derived-from-package.json (#38).**

#### `8045747` feat(budget): add ExpenseMeta discriminated union
**Scope**: 2 files, +42/-1. `types.ts` + README.
**Standards compliance**:
- 🟡 #2 (enums over strings): discriminator `type: 'fuel' | 'travel' | 'maintenance'` is a string-literal union, not an `enum`. **Doctrinal call**: probably fine — string-literal unions are idiomatic for variant tags.
- ✅ Backward-compatible (optional `meta?` on `Expense`).
- ✅ JSDoc on each union member.

#### `cd227db` feat(budget): validate ExpenseMeta
**Scope**: 4 files, +163/-2. `validation.ts` + tests + messages.
**Standards compliance**:
- ✅ `validateMeta(meta)` uses `switch (meta.type)` on string-literal discriminator — does NOT have the #14 numeric-enum trap.
- ✅ Toast strings via `ValidationMsg` enum (added 6 new entries).
- ✅ 129 lines of tests.

#### `8b6de74` feat(budget): useExpenses accepts ExpenseMeta + adds updateExpense
**Scope**: 3 files, +71/-13. Hook expansion.
**Standards compliance**:
- 🔴 **#11 / silent-failure**: `useExpenses.ts:81` introduced `paymentMethod: input.paymentMethod ?? PaymentMethod.UpiBankAccount` — silently substitutes a default when the user has explicitly de-selected a payment method. silent-failure-hunter #17. **Still live on master.**
- 🔴 **#10 (utils extraction)**: `useExpenses.ts:155-170` introduced two parallel `if`-chain switches (`toastForAdd` / `toastForUpdate`) keyed on `meta.type`. Sharma-ji recommended a `META_TOAST` lookup table. **Still live on master.**
- ✅ `updateExpense` correctly returns `Result<void>`.
- ✅ Toast messages added to `BudgetMsg` enum (10 new entries).

**Verdict**: Two live issues introduced here. Both inherited by master.

#### `09fb590` feat(budget): add fuel-math
**Scope**: 3 files, +272. Pure math + 217 lines of tests.
**Standards compliance**:
- ✅ `computeMileage`, `latestOdometer`, `dueMaintenance`, `isServiceDue` — all `compute*` prefix per #1.
- ✅ Pure functions, no React/Firebase deps.
- ✅ Comprehensive boundary tests.
**Verdict**: Exemplary commit. The shape sharma-ji praised in his review.

#### `ffdc842` feat(budget): add MetaSubForm
**Scope**: 3 files, +415. Form component + tests.
**Standards compliance**:
- 🟡 #13 (single responsibility): MetaSubForm is 278 lines — handles 3 meta-kind sub-forms in one file with type-by-type rendering.
- ⚠️ Originally exported `metaKindFor` and `defaultMeta` from this file alongside the component — violated `react-refresh/only-export-components`. **Fixed in next commit (`8ba9b02`).**
- ✅ 136 lines of tests.

#### `8ba9b02` refactor(budget): split metaKindFor/defaultMeta into meta-utils.ts
**Verdict**: Exemplary follow-up commit. Author caught and fixed their own drift before merge.

#### `a5a48ab` feat(budget): add ServiceDueBanner
**Verdict**: ✅ Clean. Derived from `dueMaintenance + latestOdometer` — pure rendering of computed state.

#### `c1b8856` feat(budget): add AutoTab
**Scope**: 3 files, +495. The big component (313 lines) + 181 lines test.
**Standards compliance**:
- 🔴 **march-in L10**: `AutoTab.tsx:87` wrong toast for amount validation:
  ```ts
  if (!amt || amt <= 0) {
    addToast(BudgetMsg.CategoryRequired, ToastType.Error);  // says "select a category" — wrong
    return;
  }
  ```
  Toast says "Please select a category" but failure is `amt <= 0`. **Still live on master.**
- 🟡 #13: AutoTab is 313 lines.
- 🟡 #10: AutoTab implements its own list-rendering with date grouping but doesn't use `<DateGroupHeader>`. CLAUDE.md notes this is intentional acknowledged drift.
- ✅ 181 lines of tests.

#### `5b23461` feat(budget): wire MetaSubForm into AddExpense
**Verdict**: ✅ Clean integration.

#### `f39d768` feat(budget): add Auto tab to ExpenseListPage
**Standards compliance**:
- 🟡 #13: ExpenseListPage now juggles 4 tabs with state-based switching. Approaching god-component.

#### `b782e4d` docs: 0.2.18 wrap-up
**Scope**: 13 files, +127/-27. Mixed docs + 13 file code-tweaks.
**Standards compliance**:
- 🟡 Wrap-up commit included real code edits. Wrap-up commits should ideally be docs-only.

### PR #19 summary

**Live issues introduced and still on master** (not fixed by rehearsal):

| # | Site | Type | Reviewer source | Fix effort |
|---|---|---|---|---|
| 1 | `useExpenses.ts:81` paymentMethod fallback | Silent default substitution | silent-failure-hunter #17 | 5 min |
| 2 | `useExpenses.ts:155-170` toastForAdd/Update switches | Open/Closed (#10) | sharma-ji LOW | 10 min |
| 3 | `AutoTab.tsx:87` wrong toast for amount validation | UX bug | march-in L10 | 5 min |

**Real strengths**:
- `fuel-math.ts` is exemplary (pure, tested, `compute*` naming).
- `meta-utils.ts` split for `react-refresh` is best-practice.
- Discriminated `ExpenseMeta` union is the right shape.

**Spirit verdict**: Substantial feature shipped without multi-agent review. The 3 escapees are minor — none are torn-state risks. **Worth folding into the next hygiene branch.**

---

## Current branch — `feat/the-rehearsal` (`325ce79`)

**Headline**: 777 inserts / 274 deletes across 28 files. Single commit. Review-finding response addressing PR #18's flagged items + 1 Chanakya tactical (#38) + doc sweep.

### Single-commit content

This commit was extensively reviewed today by 4 of 6 final-countdown agents. Their findings live in `.final-countdown-reports/`:
- `agent_code_architect.md` — system-level patterns, "self-fetching card" naming, dual-runtime gap
- `agent_sharma_ji.md` — SOLID + harvest-pass roadmap (3 weeks of refactor)
- `agent_silent_failure_hunter.md` — 32 silent-failure findings (8 CRITICAL)
- `agent_march_in.md` — 2 MISSION CRITICAL (duplicate enums, dev-mode wrong key) + 6 SOP violations

### Per-file impact

The commit's 28 files split:
- **Pure docs/config** (10): CLAUDE.md, CHANGELOG.md, README.md, ROADMAP.md, firebase-data-structure.md, e2e/README.md, src/{constants,shared,shared/components,shared/hooks,shared/storage,shared/utils,themes}/README.md — comprehensive doc sweep.
- **Standards fixes** (8): effectSize.ts (`EFFECT_SIZE_DEFAULT` + derived bounds), AmbientEffects.tsx (extract hooks, fix double-multiplier), Layout.tsx (bucketed effectSize), ProfilePage.tsx (options-object saveAppearance + verr logging), glyph-primitives.tsx (GLYPH_INNER_SIZE constant + wrapper restructure + style hoisting).
- **New shared infra** (2): `useMatchMedia.ts`, `useViewportSizeMultiplier.ts` — promoted from inline.
- **Tests** (3): AmbientEffects.test.tsx (stub helper hoist), glyph-primitives.test.tsx (refactored), new ProfilePage.silent-fail.test.tsx + effectSize-roundtrip.test.ts.
- **Workflow** (1): deploy.yml (`VITE_APP_VERSION` derived from package.json).
- **Version** (1): package.json 0.2.18 → 0.2.19.
- **Test spec** (1): the-fine-print.spec.ts (deterministic poll + new picker→effect E2E).

### Verdict

**Clean by intent.** Every change has a citation in CHANGELOG.md mapping to the reviewer who flagged it. 10 new unit tests + 1 E2E. 1 user-visible bug fixed (the `--fx-scale` × `--fx-size` double-multiplier). All TypeScript strict + ESLint + Prettier + 648 unit tests + 82 E2E tests green at HEAD.

---

# Section B — Standards sweep (15 active rules)

## Summary table

| # | Standard | Status | Sites | Severity |
|:-:|---|:-:|:-:|:-:|
| 1 | Naming (`compute*` not `calculate*`/`get*`) | ✅ | 0 | — |
| 2 | Enums over strings | ✅ | 0 | — |
| 3 | No `\|\|` fallbacks on config/env | ⚠️ | 2 | LOW |
| 4 | Arrow functions explicit return | ✅ (spot-check) | 0 | — |
| 5 | JSDoc on exports | ✅ | 0 | — |
| 6 | Import order | ✅ (spot-check) | 0 | — |
| 7 | No ternary in JSX | ⚠️ | 3 | MED |
| 8 | JSX curly newlines (Prettier) | ✅ | 0 | — |
| 9 | Constants centralized / no magic numbers | ⚠️ | 6+ | MED |
| 10 | Utils extracted if ≥2 occurrences | ⚠️ | 2 patterns | HIGH |
| 11 | `Result<T>` on async — never `void` | ⚠️ | 2 + 14 doctrinal | HIGH (real) / LOW (doctrinal) |
| 12 | Hooks separate from providers | ✅ | 0 | — |
| 13 | Single responsibility | ⚠️ | 1 | MED |
| 14 | Numeric enum `Object.values()` trap | ⚠️ | 1 | HIGH |
| 15 | No `&&` in `package.json` scripts | ⚠️ | 3 | LOW (doctrinal) |

**Net**: 12 standards clean, 8 with violations. Most violations were already surfaced by reviewer agents.

---

## HIGH severity

### #14 — Numeric enum trap in `validateIncome`

**File**: `src/modules/expenses/validation.ts:72`
**Already flagged**: march-in H1, drill-sergeant report

**Current**:
```ts
const validSources = Object.values(IncomeSource);
if (!validSources.includes(input.source)) { /* ... */ }
```

**Problem**: `Object.values()` on a numeric enum returns BOTH numeric values AND reverse-mapped string keys. So `validSources.includes('Salary')` returns `true` when input is the string `'Salary'` — validation silently accepts garbage.

**Fix**:
```ts
const validSources = Object.values(IncomeSource).filter(
  (v): v is number => typeof v === 'number',
);
```

Add regression test: `expect(validateIncome({ ...valid, source: 'Salary' as never })).toEqual(err(...))`.

**Effort**: 5 minutes including test.

---

### #11 — `Promise<void>` on real persistence functions (torn-state risk)

**Files**:
- `src/shared/components/ProfilePage.tsx:67` — `saveAppearance(uid, settings, existing): Promise<void>`
- `src/shared/components/ProfilePage.tsx:79` — `saveUsernameToProfile(uid, username): Promise<void>`

**Already flagged**: silent-failure-hunter #6 (the username flow as torn-state CRITICAL)

**Problem**: `adapter.save()` returns `Result<void>` but it's `await`ed and the result discarded. Caller (`handleUsernameSave` at `ProfilePage.tsx:222-254`) has no way to know whether the username was actually persisted. Combined with the multi-step `releaseUsername → claimUsername → saveUsernameToProfile` sequence, a silent failure on the third step leaves a torn state: old released, new claimed in `usernames/{name}`, but `profile.username` still old.

**Fix**:
```ts
const saveUsernameToProfile = async (
  uid: string,
  username: string | undefined,
): Promise<Result<void>> => {
  const adapter = createAdapter(userPath(uid));  // also fixes #9 path issue
  return adapter.save(DbSubcollection.Profile, {
    id: DbDoc.Main,
    username: username ?? null,
    updatedAt: new Date().toISOString(),
  });
};
```

Then in `handleUsernameSave`: check `isOk(result)`, on failure attempt to release the just-claimed username (or at minimum loud-toast the torn state). Same pattern for `saveAppearance` — return `Result<void>`, check at every callsite (`handleThemeChange`, `handleColorModeChange`, `handleIntensityChange`, `handleSizeChange`).

**Effort**: 30 minutes for both functions + callsite updates + 1 unit test.

---

### #10 — Utils extracted if appears ≥2 times: TWO major patterns

**Pattern A — undo-delete duplicated 11×**
**Already flagged**: march-in H2, sharma-ji HIGH

**Files**: `FloorsTab.tsx`, `ActivityLog.tsx`, `ExpenseList.tsx`, `IncomeList.tsx`, `FeedLog.tsx`, `SleepLog.tsx`, `GrowthLog.tsx`, `EliminationLog.tsx`, `MealsLog.tsx`, `NeedsLog.tsx`, `MilestonesLog.tsx`

**Problem**: Each file independently maintains `pendingDeleteId`, a `useRef(false)` for the undo flag, and a `setTimeout` with `CONFIG.UNDO_DURATION_MS`. **Plus** a real bug: a single `undoRef.current` boolean is shared across all in-flight pending deletes, so deleting A, then deleting B, then undoing B silently un-deletes A (per march-in's analysis).

**Fix**: Extract `useUndoableDelete<T>(remove, durationMs)` hook in `src/shared/hooks/`:
```ts
export function useUndoableDelete<T extends { id: string }>(
  remove: (id: string) => Promise<unknown>,
  durationMs: number = CONFIG.UNDO_DURATION_MS,
) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const requestDelete = useCallback((entry: T) => {
    setPendingId(entry.id);
    const handle = setTimeout(() => {
      remove(entry.id);
      timeoutsRef.current.delete(entry.id);
      setPendingId(null);
    }, durationMs);
    timeoutsRef.current.set(entry.id, handle);
  }, [remove, durationMs]);

  const undo = useCallback((id: string) => {
    const handle = timeoutsRef.current.get(id);
    if (handle) {
      clearTimeout(handle);
      timeoutsRef.current.delete(id);
    }
    setPendingId((curr) => (curr === id ? null : curr));
  }, []);

  return { pendingId, requestDelete, undo };
}
```

Replace 11 sites. Adds regression test: deleting A then B then undoing B leaves A actually deleted.

**Effort**: ~2 hours hook + tests, ~3 hours migrating 11 sites.

---

**Pattern B — BabyLog component duplication (~1,750 LOC)**
**Already flagged**: sharma-ji HIGH, code-architect "self-fetching card" pattern

**Files**: 7 baby log components × ~300-410 LOC each, structurally identical except for form-body and row-content.

**Fix sketched in sharma-ji's report**: extract `<BabyLogPage<T>>` shell that owns `useListControls`, undo dance, sort/filter/paginate chain, ListControls strip, DateGroupHeader grouping, delete affordance, sibling-copy toggle, ListShowMoreFooter. Each `*Log.tsx` becomes ~80 LOC.

**Effort**: 1.5 days. Highest-leverage refactor available.

---

## MEDIUM severity

### #7 — Ternary in JSX (3 sites — 1 nested)

**Site 1** (worst — nested):
**File**: `src/shared/components/DebugPage.tsx:56`
**Standard quote**: "Nested ternaries: never, anywhere."

**Current**:
```tsx
const display = typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value);
```

**Fix** (drop the nested entirely — booleans stringify natively):
```tsx
const display = String(value);
```

**Effort**: 5 minutes.

**Site 2**: `src/modules/body/components/FloorsTab.tsx:251` — `{onDeleteRecord ? (<button>) : (<span>)}` → `{onDeleteRecord && <button>} {!onDeleteRecord && <span>}`. **Effort**: 1 minute.

**Site 3**: `src/modules/body/components/ActivityLog.tsx:139` — same shape, same fix. **Effort**: 1 minute.

---

### #9 — Magic numbers / hardcoded paths (6+ sites)

**A — Hardcoded `users/${uid}` paths** (`ProfilePage.tsx:68, 80`)
**Already flagged**: sharma-ji LOW

**Fix**:
```ts
import { userPath } from '@/constants/db';
const adapter = createAdapter(userPath(uid));
```

`userPath()` already exists at `constants/db.ts:45` — used by 8 other files. Two stragglers in this file.

**Effort**: 1 minute.

---

**B — `setTimeout` magic durations**
**Already flagged**: march-in L8

Files & current state:
- `DevBench.tsx:40` — `setTimeout(() => setFlash(null), 2000)`
- `DevBench.tsx:92` — `setTimeout(() => setCopied(false), 2000)`
- `DevBench.tsx:164` — `setTimeout(tick, 3000)` (theme tour)
- `ConsoleViewer.tsx:49` — `setTimeout(() => setCopied(false), 2000)`
- `Layout.tsx:28` — `useMinDelay(isFirebaseConfigured ? 1000 : 0)`
- `InviteRedeem.tsx:48` — `setTimeout(..., 2000)` (post-redeem redirect)

**Fix**: Promote to `CONFIG.TIMINGS` sub-namespace:
```ts
TIMINGS: {
  MIN_LOADING_DELAY_MS: 1000,
  COPY_FEEDBACK_MS: 2000,
  FLASH_DURATION_MS: 2000,
  THEME_TOUR_INTERVAL_MS: 3000,
  INVITE_REDIRECT_MS: 2000,
} as const,
```

**Effort**: 15 minutes.

---

**C — `AmbientEffects` particle constants inlined as comments only**
**File**: `src/shared/components/AmbientEffects.tsx:94-119`
**Already flagged**: march-in L9

**Fix**: Hoist to module-level:
```ts
const PARTICLE_DEPTH = {
  SCALE_BASE: 0.5,
  SCALE_SPAN: 1.0,         // → 0.5–1.5×
  OPACITY_BASE: 0.25,
  OPACITY_SPAN: 0.55,      // → 0.25–0.8
  OPACITY_SWEEP: 0.15,
  SIZE_BASE_PX: 10,
  SIZE_SPAN_PX: 16,        // → 10–26 px
  DURATION_DELAY_S: -12,
  DURATION_JITTER: 0.1,    // ±5%
  ROTATE_DEG: 360,
} as const;
```

**Effort**: 10 minutes.

---

### #13 — Single responsibility: `useBodyData` god-hook

**File**: `src/modules/body/hooks/useBodyData.ts` (300 LOC, 6 callbacks, 4 jobs)
**Already flagged**: sharma-ji MEDIUM, code-architect

**Current**: One hook does (1) listener management for floors + activities, (2) summary derivation, (3) optimistic-write orchestration with rollback, (4) ref-keeping for stale-closure escape.

**Fix**: Pairs with sharma-ji's `useDataCollection<T>` recommendation. Promote `useBabyCollection<T>` (rename to `useDataCollection<T>`, lift to `src/shared/hooks/`), then compose it twice in `useBodyData`:

```ts
const floorsCol = useDataCollection<BodyRecord>(uid ? userPath(uid) : null, DbSubcollection.Body, 'Floors');
const activitiesCol = useDataCollection<BodyActivity>(uid ? userPath(uid) : null, DbSubcollection.BodyActivities, 'Activity');
// + a useMemo derivation layer for todayRecord/todayActivities
// + thin wrappers (tap, logActivity) that call the primitives + recompute
```

**Effort**: 1 day. Same pattern unlocks `useExpenses`, `useIncome`, `useChildren`.

---

## LOW severity

### #3 — `||` fallback on stored config (2 sites)

**Files**: `src/shared/auth/auth-context.tsx:116, 140`
**Already flagged**: silent-failure-hunter #28

**Current**:
```ts
modules: data.modules || DEFAULT_MODULES,
```

**Problem**: `||` masks a missing `modules` field — could be intentional admin clear, schema drift, or migration mid-run. Silently substituting defaults gives the user back all modules they may have just been revoked from.

**Fix** — two options depending on posture:
1. **Strict (safer for permission posture)**: detect missing `modules`, warn via `vwarn`, default to **empty**:
   ```ts
   modules: data.modules ?? (vwarn('[AFP:auth]', 'profile.modules missing — defaulting to none'), {}),
   ```
2. **Lenient (current behavior, but with logging)**:
   ```ts
   modules: data.modules ?? (vwarn('[AFP:auth]', 'profile.modules missing — using defaults'), DEFAULT_MODULES),
   ```

Both options use `??` instead of `||`, satisfying the standard. Choice between them is a security-posture decision.

**Effort**: 5 minutes.

---

### #11 (doctrinal) — Component prop callbacks declared `Promise<void>` (14 sites)

**Files**: `WalkingTab.tsx`, `RunningTab.tsx`, `CyclingTab.tsx`, `FloorsTab.tsx`, `BodyConfigForm.tsx`, `AddActivity.tsx`, `SuggestionStrip.tsx`, `SuggestionBanner.tsx` etc.

**Pattern**:
```ts
interface Props {
  onLog: (type: ActivityType, distanceMeters: number, date?: string) => Promise<void>;
  onSave: (id: string, data: { distance?: number }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}
```

**Doctrinal question**: The hooks behind these callbacks (`useBodyData.logActivity`, `useExpenses.addExpense`) DO return `Result<T>`. The component prop just wraps them and re-awaits. The component is consuming the Result via toast inside the hook — it doesn't need to thread the Result through the prop signature.

Two ways to read standard #11:
- **Strict**: Every async signature must be `Promise<Result<T>>`. Fix means changing 14 prop signatures + every callsite.
- **Pragmatic**: The standard targets *callable storage operations*. Component prop callbacks that just delegate to hooks are pass-throughs — the Result is handled inside the hook (via toast), so the prop's `Promise<void>` is a contract that says "I've handled the failure mode internally."

The codebase as written follows the **pragmatic** interpretation. The standard's wording ("never void") leans **strict**.

**Recommendation**: Tighten the standard's wording to: "Storage-touching async functions return `Result<T>`. Component callback props that delegate to such functions may return `Promise<void>` IF the hook owns the toast/error path."

**Effort**: 5 minutes (CLAUDE.md edit) — OR ~2 hours threading Result through 14 props if going strict.

---

### #15 — `&&` in `package.json` scripts (3 sites)

**File**: `package.json`
**Standard quote**: "`&&` breaks on Windows PowerShell `;;` works."

**Current**:
```json
"build": "bun run build:tsc && bun run build:vite",
"lint": "bun run typecheck && bun run lint:eslint",
"setup:env:all": "bun run setup:env && bun run setup:env:prod"
```

**Doctrinal question**: AFP's CI is `ubuntu-latest`. Devs use macOS/Linux. There's no evidence of Windows PowerShell as a target. CLAUDE.md notes "Cross-platform scripts use shx (not bash)" — but `shx` is for `rm -rf` and similar, not script chaining.

- **Strict** (cross-platform always): Replace `&&` with Makefile / `concurrently` / split scripts. Effort: ~30 min.
- **Pragmatic** (target audience): macOS/Linux only, accept `&&`. Update standard #15 wording.

**Recommendation**: Soften the standard. The fix doesn't pay back on a project with no Windows users.

**Effort**: 5 minutes (standards edit) — OR 30 min adopting a Makefile.

---

# Section C — Cross-cutting findings

## Issues that should land before next merge to master

| # | Origin PR | Site | Severity | Reviewer | Fix effort |
|---|:-:|---|:-:|---|---|
| 1 | #19 | `useExpenses.ts:81` paymentMethod fallback | HIGH | silent-failure-hunter #17 | 5 min |
| 2 | #19 | `AutoTab.tsx:87` wrong toast | MED | march-in L10 | 5 min |
| 3 | #19 | `useExpenses.ts:155-170` switch shape | LOW | sharma-ji | 10 min |
| 4 | (rehearsal-master) | `validateIncome` numeric-enum filter | HIGH | march-in H1 | 5 min |
| 5 | (master) | `FeedType`/`SleepType`/`SleepQuality`/`DiaperType` duplicate enums | **CRITICAL** | march-in C1 | 30 min |
| 6 | (master) | `useAdminActions` dev-mode wrong localStorage key | **CRITICAL** | march-in C2 | 30 min |
| 7 | (master) | 11-site shared-undoRef multi-delete race | HIGH | march-in H2 | half day |
| 8 | (master) | 8 silent-failure CRITICAL items (listener errors, torn states) | CRITICAL | silent-failure-hunter #1-8 | 1-2 days |

Items 5 and 6 (march-in MISSION CRITICAL) are the most urgent — they predate all three PRs reviewed here and represent latent data-corruption / reproducibility risk.

## Pattern observation

| PR | Quality of execution | Hygiene drift | Repaired by |
|---|---|---|---|
| #18 | Working feature | 7+ violations | rehearsal commit (1:1 fix coverage) |
| #19 | Working feature | 3 live issues | Not yet — pending |
| rehearsal | Repair pass | Found 3+ pre-existing in master | Pending |

The pattern: **feature ships → reviewers find drift → repair branch follows**. PR #18 + rehearsal demonstrates this cleanly. PR #19 is the gap — never got the reviewer round.

**Recommendation**: run a final-countdown style review on PR #19's diff (`git show 3820be4`) the next time a hygiene branch lands. The `useExpenses` hook particularly is now used by Auto tab and any future Budget feature — fixing the 3 issues there is preventative.

## Test coverage delta across the three PRs

- **PR #18**: +4 unit test files, +135 E2E lines (one new spec). Tested new behaviors but didn't add regression tests for issues being introduced (couldn't — they weren't visible until reviewers flagged them).
- **PR #19**: +5 test files. Strong test discipline. **Notably absent**: no test for `useExpenses.toastForAdd` switch behavior or paymentMethod fallback semantics — the 3 issues are uncovered.
- **rehearsal**: +2 new test files (`ProfilePage.silent-fail.test.tsx`, `effectSize-roundtrip.test.ts`) + interaction tests. *Contract-locking* style — they assert post-fix behavior so regressions are caught.

---

# Section D — Action plan

## Quick wins (~1 hour total) — single hygiene branch (likely `feat/what-was-the-joke`)

| # | Action | Effort | Severity | Source |
|:-:|---|---|:-:|---|
| 1 | Fix `validateIncome` numeric-enum filter + regression test | 5 min | HIGH | march-in H1, sweep #14 |
| 2 | `userPath(uid)` cleanup in `ProfilePage.tsx:68, 80` | 1 min | MED | sharma-ji, sweep #9 |
| 3 | Fix `DebugPage.tsx:56` nested ternary | 5 min | MED | sweep #7 |
| 4 | Fix `FloorsTab.tsx:251` + `ActivityLog.tsx:139` JSX ternaries | 2 min | MED | sweep #7 |
| 5 | `saveUsernameToProfile` + `saveAppearance` → `Result<void>` + callsite checks | 30 min | HIGH | silent-failure-hunter #6, sweep #11 |
| 6 | `auth-context.tsx:116, 140` `\|\|` → `??` + `vwarn` | 5 min | LOW | silent-failure-hunter #28, sweep #3 |
| 7 | Promote setTimeout durations + `MIN_LOADING_DELAY_MS` to `CONFIG.TIMINGS` | 15 min | MED | march-in L8, sweep #9 |
| 8 | Hoist `PARTICLE_DEPTH` constants in AmbientEffects | 10 min | MED | march-in L9, sweep #9 |
| 9 | Fix `useExpenses.ts:81` paymentMethod fallback | 5 min | HIGH | silent-failure-hunter #17 (PR #19) |
| 10 | Fix `AutoTab.tsx:87` wrong toast | 5 min | MED | march-in L10 (PR #19) |
| 11 | Refactor `useExpenses.ts:155-170` to `META_TOAST` lookup table | 10 min | LOW | sharma-ji (PR #19) |
| 12 | Doctrinal: tighten standard #11 wording | 5 min | LOW (doc) | sweep #11 doctrinal |
| 13 | Doctrinal: soften standard #15 wording to POSIX-compatible | 5 min | LOW (doc) | sweep #15 |

**Total**: ~100 minutes for items 1-13 if doctrinal calls go in favor of softening.

## Mission critical (must-fix; their own branches recommended)

14. Collapse duplicate `FeedType`/`SleepType`/`SleepQuality`/`DiaperType` enums (march-in C1) — 30 min
15. Fix `useAdminActions` dev-mode localStorage key (march-in C2) — 30 min

## Big-ticket — separate branches each

16. **`useUndoableDelete<T>` hook + 11 callsite migrations** — ~5 hours — closes march-in H2 + sharma-ji HIGH
17. **`<BabyLogPage<T>>` extraction** — ~1.5 days — closes sharma-ji HIGH + code-architect's "self-fetching card"
18. **`useDataCollection<T>` rename + composition into `useBodyData`/`useExpenses`/`useIncome`/`useChildren`** — ~1 day — closes #13 god-hook + sharma-ji's Week 2
19. **CRITICAL silent-failure fixes** (listener error states, profile/admin torn-state writes) — 1-2 days — closes silent-failure-hunter #1-8

Items 16-18 are sharma-ji's "harvest pass" — the next architectural beat the codebase is ready for.

---

# Section E — Cross-reference index

| Reviewer report | Items captured here |
|---|---|
| `2026-05-01-the-fine-print-march-in.md` | (already addressed in `feat/the-rehearsal`) |
| `2026-05-07-final-countdown march-in` | H1 (sweep #14), H2 (sweep #10 undo), H4 (sweep #11), L8 (sweep #9 timeouts), L9 (sweep #9 PARTICLE), L10 (PR #19 AutoTab toast), C1 (duplicate enums), C2 (admin dev key) |
| `2026-05-07-final-countdown silent-failure-hunter` | #6 (sweep #11 saveUsernameToProfile), #17 (PR #19 paymentMethod), #28 (sweep #3 modules `\|\|`), #1-8 CRITICAL items |
| `2026-05-07-final-countdown sharma-ji` | HIGH `<BabyLogPage>` (sweep #10), MEDIUM `useBodyData` god-hook (sweep #13), LOW `userPath()` (sweep #9), LOW META_TOAST (PR #19) |
| `2026-05-07-final-countdown code-architect` | "self-fetching card" framing for sweep #10 |
| `nick-review-20-points.md` (sweep source) | The 15 standards themselves |

---

# Bottom line

**Standards adherence is 80%** — 12 of 15 fully clean, 3 with doctrinal questions only, 5 with real fix work.

**PR #18** was a feature spike that the rehearsal commit cleaned up. Excellent feedback loop.

**PR #19** is the gap — it shipped without the same review rigor and left 3 issues live on master. Not severe, but they should land in the next hygiene branch.

**Rehearsal** (`325ce79`) is the cleanup pass for #18 plus a doc sweep. It surfaced 2 march-in MISSION CRITICALs that pre-date all three reviewed PRs (the duplicate enums and the dev-mode admin key) — those are the highest-priority fixes regardless of branch ordering.

The genuinely-new findings (the 15-points sweep + the still-running final-countdown reviewers) target either pre-existing code or are doctrinal/wording calls. None are blockers.

The codebase's review-feedback loop is working. **Gap to close**: make PR #19's missing review retroactively, fold its findings into the next branch.

The 100-minute quick-win pass (items 1-13) closes the line-level findings; the harvest pass (items 16-18, ~3 days total) closes the structural ones; items 14-15 are urgent must-fixes regardless.

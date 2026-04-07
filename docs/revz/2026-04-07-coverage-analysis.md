# Coverage Analysis — 2026-04-07

## E2E Functional Coverage (Playwright — 38 tests)

| Page/Flow | Route | Actions Available | E2E Covered | Gaps |
|-----------|-------|-------------------|-------------|------|
| App Shell | `/` | Redirect, header, tab bar, nav, profile btn | 5/5 | — |
| Body Config | `/body` (first visit) | Form, checkboxes, floor height, save | 3/3 | Toggle individual checkboxes, change floor height |
| Body Stats | `/body` (configured) | Score, metric cards, weekly stats, quick action buttons | 2/4 | Tap quick action → tab, weekly stats values |
| Body Floors | `/body` Floors tab | ↑/↓ buttons, increment, recent list, show more, edit | 3/7 | Recent list, show more, edit, persist |
| Body Walking | `/body` Walking tab | Distance, m/km toggle, log, activity list, edit | 3/6 | List with dates, edit, km toggle |
| Body Running | `/body` Running tab | Same as walking | 0/6 | Entirely untested |
| Budget Landing | `/budget` | Summary, toggle, lists, FAB | 2/6 | Income tab, list with data, delete, summary math |
| Budget Add Expense | `/budget/add` | Category, subcategory, amount, payment, submit | 3/7 | Category changes subcats, expand methods, submit |
| Budget Add Income | `/budget/add` Income | Source, amount, payment, submit | 0/4 | Entirely untested |
| Baby Onboarding | `/baby` | Welcome, add child form, submit | 3/3 | — |
| Baby Landing | `/baby` (with children) | Child cards, view, add second | 0/3 | Entirely untested |
| Baby Child Detail | `/baby/:childId` | Tabs, back button | 0/5 | Entirely untested |
| Baby Logs | Inside child tabs | Log entries, list, edit, delete | 0/8 | Entirely untested |
| Admin | `/admin` | Panel, invite form, checkboxes, create | 5/5 | — |
| Profile | `/profile` | Account, theme, color mode, username, modules, about | 4/8 | Theme/color apply, username flow, sign out |
| Route Guards | Various | Module gates, admin gate | 3/3 | — |
| Theme | Various | Applied, dark mode | 2/2 | — |
| Debug/DevBench | `/debug` | Table, bench buttons, nuke | 0/3 | Untested |

**Total: ~38/87 actions covered = ~44% functional coverage**

---

## Unit Test Coverage (vitest v8 — 189 tests, 21 files)

**Overall: 23% statements, 14% branches, 19% functions, 23% lines**

### TypeScript files (.ts) — Logic, hooks, utilities, types

| File | Stmts | Branch | Funcs | Lines | What it contains | What's tested | What's NOT tested |
|------|-------|--------|-------|-------|------------------|---------------|-------------------|
| `constants/config.ts` | 100% | 100% | 100% | 100% | APP_NAME, VERSION, DEFAULT_THEME, config values | All exports | — |
| `constants/db.ts` | 97% | 100% | 83% | 97% | DbCollection, DbSubcollection, DbDoc, DbField enums, userPath(), childPath() | Enums, userPath | childPath() |
| `constants/messages.ts` | 100% | 100% | 100% | 100% | ValidationMsg, InviteMsg, BudgetMsg, BodyMsg, BabyMsg, ProfileMsg, ProviderMsg | All enums | — |
| `constants/routes.ts` | 100% | 100% | 100% | 100% | AppPath enum, ROUTES const | All routes | — |
| `shared/types.ts` | 100% | 100% | 100% | 100% | Result<T>, ok/err/isOk/isErr, ModuleId, UserRole, SyncStatus, all numeric enums | All helpers + enums | — |
| `modules/body/types.ts` | 100% | 100% | 100% | 100% | BodyConfig, BodyRecord, BodyActivity, DEFAULT_BODY_CONFIG | Type shapes | — |
| `modules/body/constants.ts` | 100% | 100% | 100% | 100% | BODY_DEFAULTS, SCORING_WEIGHTS, ACTIVITY_LABELS, FLOOR_HEIGHT_OPTIONS | All constants | — |
| `modules/body/scoring.ts` | 100% | 100% | 100% | 100% | computeBodyScore(), computeSteps() | All scoring math | — |
| `modules/baby/types.ts` | 100% | 100% | 100% | 100% | FeedType, SleepType, SleepQuality, DiaperType, Child, ChildConfig, entry types | Enum values + type shapes | — |
| `modules/baby/constants.ts` | 100% | 100% | 100% | 100% | FEED_TYPE_LABELS, SLEEP_TYPE_LABELS, etc. | Label maps | — |
| `modules/baby/utils.ts` | 94% | 93% | 100% | 94% | computeAge() | Newborn, months, years | Edge case: exactly 24 months |
| `modules/baby/validation.ts` | 81% | 87% | 100% | 81% | validateFeedEntry, validateSleepEntry, validateGrowthEntry, validateDiaperEntry, validateChild | Valid + invalid inputs | Some edge branches (empty quality, missing fields) |
| `modules/expenses/budget-math.ts` | 100% | 100% | 100% | 100% | computeTotalIncome, computeTotalSpent, computeCCOutstanding | Settlement exclusion, CC math | — |
| `modules/expenses/categories.ts` | 100% | 100% | 100% | 100% | CATEGORIES, PAYMENT_METHOD_LABELS, INCOME_SOURCE_LABELS, getAllCategoryIds | All labels + helpers | — |
| `modules/expenses/types.ts` | 0% | 0% | 0% | 0% | Expense, Income, BudgetConfig, CategoryDefinition, LabelDefinition types | — | Type-only file, no runtime code |
| `modules/expenses/validation.ts` | 100% | 100% | 100% | 100% | validateExpense, validateIncome | Enum validation | — |
| `shared/auth/firebase-config.ts` | 100% | 50% | 100% | 100% | DEV/PROD config, isFirebaseConfigured flag | Config detection | PROD branch (needs env vars) |
| `shared/auth/invite.ts` | 11% | 0% | 50% | 9% | generateInviteCode, createInvite, redeemInvite | Code generation only | createInvite, redeemInvite (needs Firebase mock) |
| `shared/auth/username.ts` | 12% | 0% | 17% | 12% | claimUsername, releaseUsername, isUsernameAvailable, isValidUsername | isValidUsername only | claim/release/available (needs Firebase mock) |
| `shared/auth/the-admin-nick.ts` | 0% | 0% | 0% | 0% | isCurrentUserAdmin, initializeAdmin, updateUserModules | — | All (needs Firebase mock) |
| `shared/auth/useAuth.ts` | 0% | 0% | 0% | 0% | useAuth hook (context consumer) | — | Needs AuthProvider wrapper |
| `shared/auth/google-auth.ts` | 0% | 0% | 0% | 0% | signInWithGoogle, linkGoogleAccount | — | Needs Firebase Auth mock |
| `shared/utils/date.ts` | 40% | 100% | 0% | 40% | todayStr(), nowTime() | — | Both functions (used by components, not directly tested) |
| `shared/utils/error.ts` | 50% | 0% | 0% | 50% | toErrorMessage() | — | Not directly tested |
| `shared/utils/profile.ts` | 0% | 0% | 0% | 0% | createDefaultProfile() | — | Not directly tested |
| `shared/utils/validation.ts` | 0% | 0% | 0% | 0% | isValidNumber() | — | Not directly tested |
| `shared/utils/regex.ts` | 100% | 100% | 100% | 100% | DATE_RE, INVITE_CODE_RE | Regex patterns | — |
| `shared/errors/useToast.ts` | 75% | 50% | 100% | 75% | useToast hook | Hook call | Error branch |
| `shared/hooks/useModules.ts` | 0% | 100% | 0% | 0% | useModules hook | — | Needs AuthProvider |
| `shared/hooks/useSyncStatus.ts` | 0% | 100% | 0% | 0% | useSyncStatus hook | — | Needs AuthProvider |
| `shared/storage/adapter.ts` | 0% | 0% | 0% | 0% | StorageAdapter interface | — | Type-only |
| `shared/storage/create-adapter.ts` | 0% | 0% | 0% | 0% | createAdapter factory | — | Needs integration test |
| `shared/storage/firebase-adapter.ts` | 0% | 0% | 0% | 0% | Firebase StorageAdapter | — | Needs Firebase mock |
| `shared/storage/localStorage-adapter.ts` | 0% | 0% | 0% | 0% | localStorage StorageAdapter | — | Good candidate for unit test |
| `admin/hooks/useAdmin.ts` | 0% | 0% | 0% | 0% | useAdmin hook | — | Needs AuthProvider |
| `modules/body/hooks/useBodyConfig.ts` | 0% | 0% | 0% | 0% | useBodyConfig hook | — | Needs AuthProvider + adapter mock |
| `modules/body/hooks/useBodyData.ts` | 0% | 0% | 0% | 0% | useBodyData hook (records, activities, tap, logActivity, saveRecord, updateActivity) | — | Needs AuthProvider + adapter mock |
| `modules/baby/hooks/useBabyCollection.ts` | 0% | 0% | 0% | 0% | useBabyCollection<T> generic hook | — | Needs AuthProvider + adapter mock |
| `modules/baby/hooks/useBabyData.ts` | 0% | 0% | 0% | 0% | useBabyData(childId) compositor | — | Needs AuthProvider |
| `modules/baby/hooks/useChildren.ts` | 0% | 0% | 0% | 0% | useChildren hook (CRUD) | — | Needs AuthProvider + adapter mock |
| `modules/expenses/hooks/useExpenses.ts` | 0% | 0% | 0% | 0% | useExpenses hook (CRUD + soft delete) | — | Needs AuthProvider + adapter mock |
| `modules/expenses/hooks/useIncome.ts` | 0% | 0% | 0% | 0% | useIncome hook (CRUD) | — | Needs AuthProvider + adapter mock |
| `themes/themes.ts` | 59% | 8% | 60% | 63% | ThemeId, THEME_DEFINITIONS, applyTheme, themeClass, useActiveThemeId, isValidThemeId | themeClass, isValidThemeId, THEME_DEFINITIONS | applyTheme (DOM), useActiveThemeId (observer) |

**TS summary: 15 files at 100%, 4 files at 50-99%, 22 files at 0%**

### TSX files — React components (render, effects, events)

| File | Stmts | Branch | Funcs | Lines | What it renders | What's tested | What's NOT tested |
|------|-------|--------|-------|-------|-----------------|---------------|-------------------|
| `App.tsx` | 0% | 100% | 0% | 0% | Router + providers + all routes | — | Full app render (integration) |
| `admin/AdminPanel.tsx` | 0% | 0% | 0% | 0% | Admin heading + invite generator link | — | Render |
| `admin/InviteGenerator.tsx` | 0% | 0% | 0% | 0% | Invite form: name, module checkboxes, create button, link display | — | Render, form submit, link generation |
| `shared/Layout.tsx` | 0% | 0% | 0% | 0% | Header (AFP, Google btn, profile btn, sync), main outlet, TabBar | — | Render, profile nav, loading/no-profile states |
| `shared/TabBar.tsx` | 0% | 0% | 0% | 0% | Bottom nav: Body/Budget/Baby/Admin tabs, active state | — | Render, click navigation, active highlight |
| `shared/AdminGate.tsx` | 0% | 0% | 0% | 0% | Route guard: redirect if not admin | — | Redirect logic |
| `shared/ModuleGate.tsx` | 0% | 0% | 0% | 0% | Route guard: redirect if module disabled | — | Redirect logic |
| `shared/SyncStatus.tsx` | 0% | 100% | 0% | 0% | Synced/Syncing/Error/Offline indicator | — | Render per status |
| `shared/GoogleSignInButton.tsx` | 0% | 0% | 0% | 0% | Compact/full Google sign-in button | — | Render, click |
| `shared/DebugPage.tsx` | 0% | 0% | 0% | 0% | Debug table + DevBench | — | Render |
| `shared/DevBench.tsx` | 0% | 0% | 0% | 0% | Seed buttons, nuke, flash feedback | — | Render, click seed, nuke |
| `shared/ErrorBoundary.tsx` | 0% | 0% | 0% | 0% | Catch React errors, show reload button | — | Error catch + display |
| `shared/errors/toast-context.tsx` | 97% | 86% | 93% | 96% | ToastProvider: add/remove toasts, auto-dismiss | Toast add/remove/auto-dismiss | One edge branch |
| `shared/ProfilePage.tsx` | 31% | 38% | 28% | 32% | Account, Appearance, Modules, About, Username, Changelog | Account render, theme grid, about section | Theme apply, color mode apply, username claim, changelog expand |
| `shared/InviteRedeem.tsx` | 0% | 0% | 0% | 0% | Invite code validation, redemption flow | — | Full flow (needs Firebase) |
| `body/BodyPage.tsx` | 0% | 0% | 0% | 0% | Config gate → buildTabs → tab content switch | — | Config gate, tab switching |
| `body/BodyConfigForm.tsx` | 0% | 0% | 0% | 0% | Activity checkboxes, floor height radios, save button | — | Render, toggle, save |
| `body/BodyStats.tsx` | 0% | 0% | 0% | 0% | Score, metric cards (conditional on config), weekly stats, quick actions | — | Render, conditional cards |
| `body/FloorsTab.tsx` | 0% | 0% | 0% | 0% | ↑/↓ buttons, today count, recent list, show more, inline edit | — | Render, tap, edit, show more |
| `body/WalkingTab.tsx` | 0% | 0% | 0% | 0% | AddActivity + ActivityLog for walks | — | Render |
| `body/RunningTab.tsx` | 0% | 0% | 0% | 0% | AddActivity + ActivityLog for runs | — | Render |
| `body/ActivityLog.tsx` | 0% | 0% | 0% | 0% | Sorted activity list, inline edit per row | — | Render, sort, edit |
| `body/AddActivity.tsx` | 0% | 0% | 0% | 0% | Distance input, m/km toggle, log button, defaultType | — | Render, submit |
| `body/BodyTracker.tsx` | 0% | 100% | 0% | 0% | Thin wrapper → BodyPage | — | Delegation |
| `baby/ChildDetail.tsx` | 77% | 68% | 70% | 79% | URL param read, child lookup, tabs, dashboard, back button | Render with mock child, tabs, back button | Not-found state, tab switching content |
| `baby/AddChild.tsx` | 0% | 0% | 0% | 0% | Name, DOB, module checkboxes, submit | — | Render, validation, submit |
| `baby/BabyLanding.tsx` | 0% | 0% | 0% | 0% | Children list / onboarding, navigate to child | — | Render, card click, add button |
| `baby/FeedLog.tsx` | 0% | 0% | 0% | 0% | Feed type buttons, amount, time, log button, recent list | — | Full form flow |
| `baby/SleepLog.tsx` | 0% | 0% | 0% | 0% | Sleep type, quality, start/end time, log, list | — | Full form flow |
| `baby/GrowthLog.tsx` | 0% | 0% | 0% | 0% | Weight, height, head circ, date, log, list | — | Full form flow |
| `baby/DiaperLog.tsx` | 0% | 0% | 0% | 0% | Diaper type buttons, time, log, list | — | Full form flow |
| `expenses/AddExpense.tsx` | 0% | 0% | 0% | 0% | Category dropdown, subcategory, amount, payment bubbles, submit | — | Full form flow |
| `expenses/AddIncome.tsx` | 0% | 0% | 0% | 0% | Source dropdown, amount, payment bubbles, submit | — | Full form flow |
| `expenses/BudgetSummary.tsx` | 0% | 0% | 0% | 0% | Income/Spent/Remaining/CC Outstanding cards | — | Render with data |
| `expenses/ExpenseList.tsx` | 0% | 0% | 0% | 0% | Expense rows with category emoji + payment label + delete | — | Render, delete click |
| `expenses/IncomeList.tsx` | 0% | 0% | 0% | 0% | Income rows with source emoji + amount + delete | — | Render, delete click |
| `expenses/ExpenseListPage.tsx` | 0% | 0% | 0% | 0% | BudgetSummary + toggle + list + FAB | — | Render, toggle, FAB nav |
| `expenses/AddExpensePage.tsx` | 0% | 0% | 0% | 0% | Expense/Income toggle + selected form | — | Toggle, form switch |

**TSX summary: 2 files partially covered (ProfilePage 31%, ChildDetail 77%), 1 file well covered (toast-context 97%), 35 files at 0%**

## Priority Candidates — Unit Tests

| Priority | File | Why | Effort |
|----------|------|-----|--------|
| P0 | `shared/utils/date.ts` | Used everywhere, 0% functions covered | Tiny (2 functions) |
| P0 | `shared/utils/validation.ts` | Used in forms, 0% | Tiny (1 function) |
| P0 | `shared/utils/profile.ts` | Used in auth flow, 0% | Tiny (1 function) |
| P1 | `shared/storage/localStorage-adapter.ts` | Core dev-mode adapter, 0% — no Firebase needed | Small (pure JS, testable) |
| P1 | `shared/auth/username.ts` | Only 12% — isValidUsername tested, claim/release not | Medium (mock localStorage) |
| P2 | `modules/body/hooks/useBodyData.ts` | 240 lines of hook logic, 0% | Large (needs renderHook + adapter mock) |
| P2 | `modules/expenses/hooks/useExpenses.ts` | CRUD hook, 0% | Medium (same pattern) |
| P3 | Component render tests (any .tsx at 0%) | Low ROI per file — E2E covers user flows | Large (many files) |

## Priority Candidates — E2E Tests

| Priority | Flow | What to test | Why |
|----------|------|-------------|-----|
| P0 | Budget Add Income | Switch to Income tab, fill source + amount, submit, verify toast | Crash was just fixed — needs regression test |
| P0 | Baby Child Detail | Add child → tap View → verify tabs render (Dashboard, Feeding, etc.) | Entire multi-child flow untested |
| P0 | Body Running tab | Save config with running enabled → Running tab shows, log a run | 0/6 actions covered |
| P1 | Budget with data | Seed expenses via DevBench or form → verify list renders with payment labels, summary math updates | Summary cards always show ₹0 in tests |
| P1 | Baby log entries | Inside child detail → log a feed/sleep/diaper → verify list updates | All baby log flows untested |
| P1 | Profile theme apply | Click a theme swatch → verify `<html>` class changes | Theme picker renders but apply not tested |
| P2 | Profile username | Type username → save → verify @username shows | Username claim flow untested |
| P2 | Budget delete expense | Add expense → delete → verify removed from list | Delete action untested |
| P2 | Body Floors edit | Tap a day in recent list → edit → save → verify updated | Inline edit untested |
| P3 | Debug/DevBench | Navigate to /debug → verify bench renders, click seed button | Dev tooling untested |
| P3 | Body show more | Floors tab → click "Show more" → verify expanded list | Pagination untested |

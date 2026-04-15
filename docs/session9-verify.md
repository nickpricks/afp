# Session 9 — Verification Checklist

Last verified: 2026-04-15

---

## Local Dev (verified)

| # | Change | How to verify | Status |
|---|--------|---------------|--------|
| 3 | m/km toggle fixed on mobile | Resize browser to 320px, check Walking tab toggle | PASS |
| 4 | Delete on all Body lists (x button + swipe) | Hover a row, x appears, click, undo toast. Floors + Walk/Run/Cycle | PASS |
| - | Delete hover grow effect on Baby lists | Baby, any child, Feed/Sleep/Growth/Diaper lists, hover x | PASS |
| - | Stats page redesign (compact ring, icon stat cards, pill quick actions) | `/body`, Stats tab | PASS |
| - | (+) button removed (was creating duplicates) | No more (+) on any Body row | PASS |
| - | "Reset today" on Floors tab | Floors tab, add some floors, "Reset today" appears | PASS |
| - | "+ Add missing day" date picker (all Body tabs) | Floors/Walking/Running/Cycling, bottom button | PASS |
| - | Verbose storage logging | Debug page, toggle Verbose, open console, do any action, see `[AFP:storage:local]` logs | PASS |
| - | Debug panel: user profile JSON viewer | DevBench, "User Profile" collapsible section, shows UID + JSON | PASS |
| - | Sort fix: activities sort by date (not createdAt) | Activities list shows newest-first by date | PASS |
| - | Sort fix: floors use `sortNewestFirst` | Floors list still newest-first | PASS |
| 2 | Body stale closure fix (useBodyData refs) | Add walks rapidly, no duplicates | PASS |
| - | AdminPanel 3 tabs (Invites / Users / Broadcasts) | Admin page, 3 tab buttons visible | PASS |
| - | BroadcastsTab compose form | Admin, Broadcasts tab, message/type/severity/date/target picker | PASS |
| - | AlertBanner renders nothing when no alerts | No banner visible on any page (0 notifications in dev) | PASS |
| - | Module request buttons on Profile page | Cannot verify in dev (Admin role has all modules enabled) | SKIP |
| - | Admin "View Dashboard" button in UsersTab | Cannot verify in dev (no users in localStorage adapter) | SKIP |
| - | Notification badge on admin avatar | Cannot verify in dev (0 notifications) | SKIP |

**Result:** 15/18 passed. 3 skipped (need real users with limited roles, not possible in dev mode).

---

## Production (verified on mobile 2026-04-15)

| # | Change | Status | Notes |
|---|--------|--------|-------|
| 1 | Theme restoring after refresh | PASS | Firebase `onSnapshot` reads saved theme correctly |
| 5 | Debug user Firestore doc | PASS | Shows real Firestore data on prod |
| 6 | Admin user list (`collectionGroup`) | FAIL | `permission-denied` — missing collectionGroup index for `profile` |
| 8 | Admin "View Dashboard" with real data | FAIL | Only shows own data, not other users' |
| - | Notification subcollection Firestore rules | FAIL | `permission-denied` on `useAllUsers` (same root cause as #6) |
| - | Module request end-to-end flow | FAIL | Existing user request did not work |
| - | Admin alert broadcast delivery | FAIL | Blocked by user list failure |
| - | Add expense success redirect | FAIL | Navigated to `/expenses` (no matching route) instead of `/budget` |

**Result:** 2/8 passed. 6 failed.

---

## Root Cause Analysis

| Issue | Root Cause | Fix | Status |
|-------|-----------|-----|--------|
| `useAllUsers` permission-denied | Missing Firestore collectionGroup index for `profile` collection. Rules are deployed and correct, but the query needs an explicit index. | Added `firestore.indexes.json` with collectionGroup config | Fixed (pending deploy) |
| Expense redirect to `/expenses` | `AddExpensePage.tsx` used hardcoded `'/expenses'` path instead of `ROUTES.BUDGET` (`'/budget'`) | Changed both `navigate()` calls to use `ROUTES.BUDGET` | Fixed (pending merge) |
| CI doesn't deploy indexes | `firebase-rules.yml` only deploys `--only firestore:rules`, not indexes | Updated workflow to deploy `firestore:rules,firestore:indexes` | Fixed (pending merge) |
| Node.js 20 deprecation warning | `firebase-rules.yml` missing `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` env var | Added env var to workflow | Fixed (pending merge) |

**All fixes are on `feat/the-foolproof-alibi`, uncommitted. Once merged to master, the CI will auto-deploy rules + indexes.**

---

## Deployment Checklist

After merging `feat/the-foolproof-alibi` to master:

- [ ] CI `deploy.yml` runs: lint, test, build, deploy to GitHub Pages
- [ ] CI `firebase-rules.yml` runs: deploys `firestore:rules` + `firestore:indexes`
- [ ] Verify `useAllUsers` no longer throws `permission-denied` on Admin > Users tab
- [ ] Verify expense form redirects to `/budget` after submit
- [ ] Re-test module request flow (user requests, admin approves)
- [ ] Re-test broadcast delivery (admin sends alert, user sees banner)

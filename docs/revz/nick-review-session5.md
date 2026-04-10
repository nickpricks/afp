# Nick's Manual Review — Session 5 (2026-04-08)

## What Works
- Dashboard greeting + cards ✓
- Header logo links home ✓
- FloorsTab redirect-buttons edit ✓
- ActivityLog populate-form edit ✓
- DevBench new generators (Cycle, Income, Settlement, Growth) ✓
- Baby edit pattern ✓
- Budget time-range filter + CC tab ✓

## Issues Found

### 1. FloorsTab: No way to add a missed day
**Severity:** Medium
**Description:** If you missed logging a day, there's no way to insert it. Floor-Tracker solved this with an "Add Past Day" button + date picker. AFP needs something similar — a hover/tap-between-rows "+" to insert a missing date, or a date picker button.
**Reference:** Floor-Tracker has this feature (v0.0.6, commit 59ac613)

### 2. ~~ActivityLog: Unit conversion doesn't recalculate on toggle~~ — FIXED
**Severity:** ~~Medium~~ — DONE: Toggling m↔km now converts the displayed value (×1000 or ÷1000)

### 3. ~~Budget/Income lists: No pagination — dumps everything~~ — FIXED
**Severity:** ~~High~~ — DONE: CONFIG.PAGE_SIZE (25) on all 8 lists, "Show more" + end-of-list message
**Description:** Body module has nice 7→30 "Show more" pagination. Expense and Income lists dump ALL entries with zero pagination. At ×100 bench entries this is already a wall of cards. At ×1k it will kill scroll performance.
**Fix needed:** Consistent pagination across ALL lists. Requirements:
- Default: 25 items visible
- Auto-load on scroll (infinite scroll) OR "Show more" button
- At end of list: "No more to load" message
- **Random fun messages** for end-of-list (not all, just some): "That's all folks!", "You've reached the bottom!", "Nothing more to see here"
- Configurable page size (default 25)

### 4. ~~Baby: Child creation doesn't navigate to child detail~~ — FIXED
**Severity:** ~~Medium~~ — DONE: AddChild passes child ID to onAdded, BabyLanding navigates to `/baby/{childId}`

### 5. ~~Baby: Dashboard card doesn't link to module~~ — DONE (needs E2E)
**Severity:** ~~Low~~ — DONE: DashboardCard links to `/baby`. Child detail dashboard cards tappable with icons → switch tab. Needs E2E regression test.

### 6. ~~Baby: No undo on delete~~ — FIXED
**Severity:** ~~Medium~~ — DONE: All 6 deletable lists have 10s undo toast (CONFIG.UNDO_DURATION_MS). Toast extended with action button.

### 7. ~~Multi-baby testing needed~~ — DONE (needs E2E)
**Severity:** ~~Medium~~ — Infrastructure works (multi-child, useChildren, ChildDetail routing). Needs E2E regression test for data isolation.

## TODOs (in-code notes)

| Item | Location | Priority |
|------|----------|----------|
| Baby dashboard: add option for small photo alongside child name | `ChildDetail.tsx` header + `BabyLanding.tsx` ChildCard | P3 |

## New Backlog Items from Review

| Item | Module | Effort | Priority |
|------|--------|--------|----------|
| Add missed day (date picker / insert between rows) | Body | Small | P1 |
| Unit conversion on m↔km toggle during edit | Body | Small | P1 |
| Consistent pagination on ALL lists (25 default, infinite scroll) | All | Medium | P0 |
| End-of-list fun messages | All | Tiny | P3 |
| Child creation auto-navigate to detail | Baby | Small | P1 |
| Undo toast on delete (10s timer, Floor-Tracker pattern) | All | Medium | P1 |
| Multi-baby E2E test | Baby | Medium | P2 |

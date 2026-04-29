# baby/components

UI components for the Baby module. Multi-child tracking with nested subcollections that grow with the child (infant → toddler → kid).

## Files

- **BabyLanding.tsx** — Landing page listing all children, entry point to child detail
- **ChildDetail.tsx** — Tabbed detail view for a single child. 9 possible tabs: Dashboard / Journal / Feeding / Sleep / Growth / Diapers (combined Diaper+Potty as Elimination) / Meals / Needs / Milestones. Dashboard + Journal always visible; rest gated by `ChildConfig`. DashboardTab carries a live today-stat strip sourced from `useJournalData`, plus a "See full journal →" shortcut
- **AddChild.tsx** — Form to add a new child profile with 8 module checkboxes, auto-navigates to detail on creation
- **FeedLog.tsx** — Feed tracking log (infant). Inner `RecentFeeds` groups entries by date with `<DateGroupHeader>`
- **SleepLog.tsx** — Sleep tracking log. Inner `RecentSleeps` groups entries by date with `<DateGroupHeader>`
- **GrowthLog.tsx** — Growth measurement log. Inner `RecentGrowth` groups entries by date with `<DateGroupHeader>`
- **EliminationLog.tsx** — Combined diaper/potty log with mode toggle (replaces former DiaperLog). Header label adapts: Diaper / Potty / Elimination Log. Inner sub-component groups entries by date with `<DateGroupHeader>`
- **MealsLog.tsx** — Meals tracking with auto-suggest meal type from current hour and optional 7-value portion enum (toddler+). Inner `RecentMeals` groups entries by date with `<DateGroupHeader>`
- **NeedsLog.tsx** — Wishlist/inventory tracker with status filter chips (All / Wishlist / Have / Outgrown) and lifecycle transition buttons (Bought → Outgrew). Status chips render BEFORE the `<ListControls>` strip — chip filter narrows by status, then ListControls narrows by date and paginates. Inner sub-component groups by date with `<DateGroupHeader>`
- **MilestonesLog.tsx** — Developmental firsts + custom achievements. Predefined-template quick-add chips, grouped-by-category list, optional media URL link. Phase 2h: keeps category-based grouping (not date-based) but uses `relativeDateLabel` util to render day-of-week + date next to each milestone instead of bare YYYY-MM-DD. Uses `useListControls` like the rest
- **LifeJournalView.tsx** — Narrative D/W/M aggregation view across all 7 subcollections. Uses `JournalPicker` (grain + period stepper) + `JournalCard` wrappers. Composes `useJournalData` to produce 7 summary cards (counting moments conditional)
- **JournalPicker.tsx** — Grain selector (Day/Week/Month) + previous/next period stepper with aria-labels
- **JournalCard.tsx** — Generic wrapper for a titled card with empty-state fallback, used by LifeJournalView
- **SuggestionStrip.tsx** — Age-based suggestion banner (above tabs in ChildDetail)

## Conventions

- Routing: `BabyLanding` -> `ChildDetail` (parameterized by `childId`)
- All log components use tap-to-populate-form pattern for editing
- Delete implemented with 10s undo toast (CONFIG.UNDO_DURATION_MS); inline `x` text on desktop, swipe on mobile
- All log components share signature `({ childId, siblingIds, uid })` and use `useBabyCollection<T>` directly (the legacy `useBabyData` only tracks the original 5 listeners — Feeds/Sleep/Growth/Diapers/Elimination)
- Sibling logging via `logToSiblings(uid, siblingIds, DbSubcollection.X, entryData)` when `logToAll` toggle is on
- All 7 log components (Feed, Sleep, Growth, Elimination, Meals, Needs, Milestones) use the shared list infrastructure: `useListControls` hook + `<ListControls>` strip (time-range filter, per-list page size, page jump) + `<ListShowMoreFooter>` (show-all escape hatch). Date-grouped logs render `<DateGroupHeader>` per day; MilestonesLog is the exception (category-grouped + relative date label per row)

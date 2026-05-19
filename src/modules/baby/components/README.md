# baby/components

UI components for the Baby module. Multi-child tracking with nested subcollections that grow with the child (infant → toddler → kid).

## Files

- **BabyLanding.tsx** — Landing page listing all children, entry point to child detail
- **ChildDetail.tsx** — Tabbed detail view for a single child. 10 possible tabs: Dashboard / Journal / Feeding / Sleep / Growth / Elimination (Diaper+Potty combined) / Meals / Needs / Milestones / Presents (🎁). Dashboard + Journal always visible; rest gated by `ChildConfig`. DashboardTab carries a live today-stat strip sourced from `useJournalData`, plus a "See full journal →" shortcut
- **AddChild.tsx** — Form to add a new child profile with 9 module checkboxes (feeding, sleep, growth, diapers, potty, meals, needs, milestones, presents), auto-navigates to detail on creation
- **FeedLog.tsx** — Feed tracking log (infant). Inner `RecentFeeds` groups entries by date with `<DateGroupHeader>`
- **SleepLog.tsx** — Sleep tracking log. Inner `RecentSleeps` groups entries by date with `<DateGroupHeader>`
- **GrowthLog.tsx** — Growth measurement log. Inner `RecentGrowth` groups entries by date with `<DateGroupHeader>`
- **EliminationLog.tsx** — Combined diaper/potty log with mode toggle (replaces former DiaperLog). Header label adapts: Diaper / Potty / Elimination Log. Inner sub-component groups entries by date with `<DateGroupHeader>`
- **MealsLog.tsx** — Meals tracking with auto-suggest meal type from current hour and optional 7-value portion enum (toddler+). Inner `RecentMeals` groups entries by date with `<DateGroupHeader>`
- **NeedsLog.tsx** — Wishlist/inventory tracker with status filter chips (All / Wishlist / Have / Outgrown) and lifecycle transition buttons (Bought → Outgrew). Status chips render BEFORE the `<ListControls>` strip — chip filter narrows by status, then ListControls narrows by date and paginates. Inner sub-component groups by date with `<DateGroupHeader>`. `changeStatus` uses `update({ silent: true })` so the hook's generic toast is suppressed in favor of the status-specific one (MovedToInventory / MovedToOutgrown)
- **MilestonesLog.tsx** — Developmental firsts + custom achievements. Predefined-template quick-add chips, grouped-by-category list, optional media URL link. Phase 2h: keeps category-based grouping (not date-based) but uses `relativeDateLabel` util to render day-of-week + date next to each milestone instead of bare YYYY-MM-DD. Uses `useListControls` like the rest
- **PresentsLog.tsx** — Per-child gift + finance tracking. Two sub-tabs: Finances (money received/spent/saved) and Gifts (physical objects). Each sub-tab has its own `useListControls` instance to prevent pagination state bleed. Marking a finance as Spent fires `ConfirmExpenseModal` for Budget bridge
- **ConfirmExpenseModal.tsx** — Modal that prompts the user to log a matching Budget expense when a finance entry is marked Spent. Auto-closes on confirm
- **LifeJournalView.tsx** — Narrative D/W/M aggregation view across the 7 journal-tracked subcollections. Uses `JournalPicker` (grain + period stepper) + `JournalCard` wrappers. Composes `useJournalData` to produce summary cards (counting moments conditional)
- **JournalPicker.tsx** — Grain selector (Day/Week/Month) + previous/next period stepper with aria-labels
- **JournalCard.tsx** — Generic wrapper for a titled card with empty-state fallback, used by LifeJournalView
- **BabyDashboardBanner.tsx** — Banner shown above the dashboard with a child's name + age + quick CTA
- **BabySummaryCard.tsx** — Per-child summary card on the dashboard
- **BabySuggestionsToast.tsx** — Toast that surfaces age-appropriate suggestions
- **SuggestionStrip.tsx** / **SuggestionBanner.tsx** — Age-based suggestion banners (Strip lives above tabs in ChildDetail; Banner is a per-suggestion card)

## Conventions

- Routing: `BabyLanding` -> `ChildDetail` (parameterized by `childId`)
- All log components use tap-to-populate-form pattern for editing
- Delete implemented with 10s undo toast (CONFIG.UNDO_DURATION_MS); inline `x` text on desktop, swipe on mobile
- All log components share signature `({ childId, siblingIds, uid })` and use `useBabyCollection<T>` directly (the legacy `useBabyData` only tracks the original 5 listeners — Feeds/Sleep/Growth/Diapers/Elimination)
- Sibling logging via `logToSiblings(uid, siblingIds, DbSubcollection.X, entryData)` when `logToAll` toggle is on
- Create-path gates on `Promise<boolean>` from `useBabyCollection.log`: on `saved === false`, `setSaving(false); return;` before sibling fan-out and form reset. Prevents `logToSiblings` firing after a primary-save failure
- All 8 log components (Feed, Sleep, Growth, Elimination, Meals, Needs, Milestones, Presents) use the shared list infrastructure: `useListControls` hook + `<ListControls>` strip (time-range filter, per-list page size, page jump) + `<ListShowMoreFooter>` (show-all escape hatch). Date-grouped logs render `<DateGroupHeader>` per day; MilestonesLog is the exception (category-grouped + relative date label per row)

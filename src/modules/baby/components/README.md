# baby/components

UI components for the Baby module. Multi-child tracking with nested subcollections that grow with the child (infant → toddler → kid).

## Files

- **BabyLanding.tsx** — Landing page listing all children, entry point to child detail
- **ChildDetail.tsx** — Tabbed detail view for a single child. 8 possible tabs: Dashboard / Feeding / Sleep / Growth / Diapers (combined Diaper+Potty as Elimination) / Meals / Needs / Milestones. Each tab gated by `ChildConfig`
- **AddChild.tsx** — Form to add a new child profile with 8 module checkboxes, auto-navigates to detail on creation
- **FeedLog.tsx** — Feed tracking log (infant)
- **SleepLog.tsx** — Sleep tracking log
- **GrowthLog.tsx** — Growth measurement log
- **EliminationLog.tsx** — Combined diaper/potty log with mode toggle (replaces former DiaperLog). Header label adapts: Diaper / Potty / Elimination Log
- **MealsLog.tsx** — Meals tracking with auto-suggest meal type from current hour and optional 7-value portion enum (toddler+)
- **NeedsLog.tsx** — Wishlist/inventory tracker with status filter chips (All / Wishlist / Have / Outgrown) and lifecycle transition buttons (Bought → Outgrew)
- **MilestonesLog.tsx** — Developmental firsts + custom achievements. Predefined-template quick-add chips, grouped-by-category list, optional media URL link
- **SuggestionStrip.tsx** — Age-based suggestion banner (above tabs in ChildDetail)

## Conventions

- Routing: `BabyLanding` -> `ChildDetail` (parameterized by `childId`)
- All log components use tap-to-populate-form pattern for editing
- Delete implemented with 10s undo toast (CONFIG.UNDO_DURATION_MS); inline `x` text on desktop, swipe on mobile
- All log components share signature `({ childId, siblingIds, uid })` and use `useBabyCollection<T>` directly (the legacy `useBabyData` only tracks the original 5 listeners — Feeds/Sleep/Growth/Diapers/Elimination)
- Sibling logging via `logToSiblings(uid, siblingIds, DbSubcollection.X, entryData)` when `logToAll` toggle is on

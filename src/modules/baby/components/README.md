# baby/components

UI components for the Baby module. Multi-child tracking with nested subcollections.

## Files

- **BabyLanding.tsx** — Landing page listing all children, entry point to child detail
- **ChildDetail.tsx** — Tabbed detail view for a single child (feeds, sleep, growth, diapers). Tabs gated by `ChildConfig`
- **AddChild.tsx** — Form to add a new child profile, auto-navigates to detail on creation
- **FeedLog.tsx** — Feed tracking log with add/edit/delete and type-dependent quantity/duration fields
- **SleepLog.tsx** — Sleep tracking log with add/edit/delete, default times
- **GrowthLog.tsx** — Growth measurement log with add/edit/delete, requires at least one measurement
- **DiaperLog.tsx** — Diaper change log with add/edit/delete and quick-log buttons

## Conventions

- Routing: `BabyLanding` -> `ChildDetail` (parameterized by `childId`)
- All four log components use tap-to-populate-form pattern for editing
- Delete implemented via `useBabyCollection.remove` with undo toast

# baby/components

UI components for the Baby module. Multi-child tracking with nested subcollections.

## Key Files

- `BabyLanding.tsx` -- Landing page listing all children, entry point to child detail
- `ChildDetail.tsx` -- Tabbed detail view for a single child (feeds, sleep, growth, diapers)
- `AddChild.tsx` -- Form to add a new child profile
- `FeedLog.tsx` -- Feed tracking log with add/delete
- `SleepLog.tsx` -- Sleep tracking log with add/delete
- `GrowthLog.tsx` -- Growth measurement log with add/delete
- `DiaperLog.tsx` -- Diaper change log with add/delete

## Conventions

- Routing: `BabyLanding` -> `ChildDetail` (parameterized by `childId`)
- All four log components follow the same pattern: list + inline add form + delete button
- Delete implemented via `useBabyCollection.remove`; edit (tap-to-populate-form) is still TODO

# lists/

Row-level primitives for grouped, paginated list views. Composed by Body, Baby, and Budget log components on top of `ListControls` + `ListShowMoreFooter`.

## Files

- **DateGroupHeader.tsx** — Sticky day-group header (`position: sticky; top: 0`) for grouped list views. Two-tier label: relative phrasing (`Today` / `Yesterday`) in accent color for hot dates, structural fallback (`Wed 22 Apr · Wk 17`) with ISO week number for older dates. Theme-agnostic via existing CSS variables
- **RowTime.tsx** — Tabular-nums `HH:mm` time prefix for list rows. Renders em-dash when timestamp is undefined. Uses `font-variant-numeric: tabular-nums` for column alignment across rows
- **FloorMagnitudeBar.tsx** — Inline split bar visualizing floors-up vs floors-down for a day, scaled against the daily goal. Up segment = `var(--accent)` at 100%; down segment = same color at 40% opacity; remaining filler = `var(--line)`. Used by FloorsTab only

## Tests

Tests in `__tests__/`.

# expenses/components

UI components for the Budget module (directory is `expenses/` but ModuleId is `Budget`).

## Files

- **AddExpense.tsx** — Expense entry form with category, subcategory, and payment method selection. Amount presets for quick entry
- **AddIncome.tsx** — Income entry form (numeric enum values filtered with `typeof v === 'number'`)
- **BudgetSummary.tsx** — Summary view of budget totals and breakdowns using `budget-math.ts` computation functions
- **ExpenseList.tsx** — Scrollable expense list with `sortNewestFirst`. Pagination is owned by the parent `ExpenseListPage` via `useListControls`; this component renders whatever filtered+paginated array it receives. Phase 2h: rows grouped by date under `<DateGroupHeader>` (sticky day-of-week + date), hairline `border-t` between rows, per-row card markup removed in favour of the Daily Ledger pattern
- **IncomeList.tsx** — Scrollable income list. Same Daily Ledger treatment as ExpenseList: upstream pagination, grouped by date with `<DateGroupHeader>`, hairline borders between rows
- **MetaSubForm.tsx** — Conditional sub-form rendering Fuel / Travel / Maintenance fields based on `(category, subCat)`. Owns the two-of-three input math for fuel (liters + price → amount). Used by `AddExpense.tsx` and `AutoTab.tsx`.
- **AutoTab.tsx** — Vehicle/Travel filtered tab with `<ServiceDueBanner>`, three quick-add buttons (⛽/🚕/🔧), inline form (tap-to-populate edit), and Daily Ledger list with meta badges (e.g. `⛽ 40L · ₹100/L · 12,300km · 14.5 km/L`). Old expenses without `meta` show an "incomplete" pill.
- **ReconciliationView.tsx** — Credit card reconciliation: outstanding balance, payment tracking
- **ServiceDueBanner.tsx** — Derived yellow banner shown at the top of the Auto tab when `latestOdometer ≥ mostRecentMaintenance.nextService`. In-memory dismiss only; auto-clears when a fresh maintenance entry with future `nextService` is logged.

## Conventions

- Payment method selector uses toggle pattern (click active bubble to deselect)
- Number inputs use `min`/`step` attributes to prevent negative/zero values
- Lists are paginated upstream via `useListControls` + shared `<ListControls>` strip rendered by the page-level component (`ExpenseListPage` owns the hook, applies `filterByDateRange` + `paginate`, and passes the visible slice down to `ExpenseList` / `IncomeList`)
- Daily Ledger visual: sticky `<DateGroupHeader>` per day, hairline `border-t` between rows, no per-row cards

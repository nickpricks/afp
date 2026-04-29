# expenses/components

UI components for the Budget module (directory is `expenses/` but ModuleId is `Budget`).

## Files

- **AddExpense.tsx** — Expense entry form with category, subcategory, and payment method selection. Amount presets for quick entry
- **AddIncome.tsx** — Income entry form (numeric enum values filtered with `typeof v === 'number'`)
- **BudgetSummary.tsx** — Summary view of budget totals and breakdowns using `budget-math.ts` computation functions
- **ExpenseList.tsx** — Scrollable expense list with `sortNewestFirst`. Pagination is owned by the parent `ExpenseListPage` via `useListControls`; this component renders whatever array it receives.
- **IncomeList.tsx** — Scrollable income list. Same pattern: pagination is owned upstream.
- **ReconciliationView.tsx** — Credit card reconciliation: outstanding balance, payment tracking

## Conventions

- Payment method selector uses toggle pattern (click active bubble to deselect)
- Number inputs use `min`/`step` attributes to prevent negative/zero values
- Lists are paginated upstream via `useListControls` + shared `<ListControls>` strip rendered by the page-level component

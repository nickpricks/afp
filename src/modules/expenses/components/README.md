# expenses/components

UI components for the Budget module (directory is `expenses/` but ModuleId is `Budget`).

## Files

- **AddExpense.tsx** — Expense entry form with category, subcategory, and payment method selection. Amount presets for quick entry
- **AddIncome.tsx** — Income entry form (numeric enum values filtered with `typeof v === 'number'`)
- **BudgetSummary.tsx** — Summary view of budget totals and breakdowns using `budget-math.ts` computation functions
- **ExpenseList.tsx** — Scrollable expense list with `sortNewestFirst` and `CONFIG.PAGE_SIZE` pagination
- **IncomeList.tsx** — Scrollable income list with same pagination pattern
- **ReconciliationView.tsx** — Credit card reconciliation: outstanding balance, payment tracking

## Conventions

- Payment method selector uses toggle pattern (click active bubble to deselect)
- Number inputs use `min`/`step` attributes to prevent negative/zero values
- Lists use `CONFIG.PAGE_SIZE` pagination with "Show more" button

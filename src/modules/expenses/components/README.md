# expenses/components

UI components for the Budget module (directory is `expenses/` but ModuleId is `Budget`).

## Key Files

- `AddExpense.tsx` -- Expense entry form with category and payment method selection
- `AddIncome.tsx` -- Income entry form (numeric enum values filtered with `typeof v === 'number'`)
- `BudgetSummary.tsx` -- Summary view of budget totals and breakdowns
- `ExpenseList.tsx` -- Scrollable list of recorded expenses
- `IncomeList.tsx` -- Scrollable list of recorded income entries
- `ReconciliationView.tsx` -- Income vs. expense reconciliation display

## Conventions

- Payment method selector uses toggle pattern (click active bubble to deselect)
- Number inputs use `min`/`step` attributes to prevent negative/zero values

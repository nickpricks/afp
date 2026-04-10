# expenses/pages

Route-level page components for the Budget module.

## Files

- **ExpenseListPage.tsx** — Budget landing page with 3 tabs (Expenses, Income, CC). Time-range filter via `BudgetView`, uses `filterByDateRange` from budget-math
- **AddExpensePage.tsx** — Standalone page for adding entries with Expense/Income toggle tabs

## Conventions

- Pages are wrapped by `ModuleGate` in the router (checks module is enabled for user)
- Pages compose components from `../components/` and hooks from `../hooks/`

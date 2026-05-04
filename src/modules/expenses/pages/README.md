# expenses/pages

Route-level page components for the Budget module.

## Files

- **ExpenseListPage.tsx** — Budget module page with `<BudgetSummary>`, `<ListControls>` strip (hidden on Auto tab), and a 4-tab strip: **Expenses · Income · Auto · CC**. State-based tab switching (no route change). Owns `useExpenses` + `useIncome` + `useListControls` and passes filtered/paginated slices down to list components. Renders `<AutoTab>` when active.
- **AddExpensePage.tsx** — Standalone page for adding entries with Expense/Income toggle tabs

## Conventions

- Pages are wrapped by `ModuleGate` in the router (checks module is enabled for user)
- Pages compose components from `../components/` and hooks from `../hooks/`

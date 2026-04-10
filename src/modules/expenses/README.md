# expenses/

Budget module (directory is `expenses/`, ModuleId is `Budget`). Expense + income tracking with 15 categories, payment methods, and reconciliation.

## Files

- **types.ts** — `Expense`, `Income`, `BudgetConfig`, `CategoryDefinition`, `LabelDefinition` type definitions
- **categories.ts** — 15 category definitions with emoji labels and subcategories. `PAYMENT_METHOD_LABELS`, `INCOME_SOURCE_LABELS`, `getAllCategoryIds`, `getSubCategories` helpers
- **validation.ts** — `validateExpense` returns `Result<void>` using `ValidationMsg` enum for error messages
- **budget-math.ts** — Pure computation functions: `computeTotalIncome`, `computeTotalSpent`, `computeCCOutstanding`, `filterByDateRange`

## Directories

- `components/` — UI components (AddExpense, AddIncome, BudgetSummary, ExpenseList, IncomeList, ReconciliationView)
- `hooks/` — Data hooks (useExpenses, useIncome)
- `pages/` — Route-level pages (ExpenseListPage, AddExpensePage)

## Tests

- `__tests__/validation.test.ts` — Expense validation rules
- `__tests__/categories.test.ts` — Category definitions and helpers
- `__tests__/summary.test.ts` — Budget math computations
- `__tests__/AddExpense.test.tsx` — Add expense form rendering
- `__tests__/ReconciliationView.test.tsx` — Reconciliation display

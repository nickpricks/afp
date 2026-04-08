# expenses/pages

Route-level page components for the Budget module.

## Key Files

- `ExpenseListPage.tsx` -- Budget landing page, renders expense list and summary
- `AddExpensePage.tsx` -- Standalone page for adding a new expense entry

## Conventions

- Pages are wrapped by `ModuleGate` in the router (checks module is enabled for user)
- Pages compose components from `../components/` and hooks from `../hooks/`

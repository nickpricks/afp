# expenses/hooks

Data hooks for the Budget module. Real-time Firestore listeners for expenses and income.

## Files

- **useExpenses.ts** — Expense collection listener with add/update/delete operations. `addExpense` accepts optional `meta: ExpenseMeta` for fuel/travel/maintenance tracking. Exports `updateExpense` callback for full expense replacement. Uses `DbSubcollection.Expenses`
- **useIncome.ts** — Income collection listener with add/update/delete operations. Uses `DbSubcollection.Income`

## Conventions

- Both hooks accept an optional `targetUid` parameter for admin/viewer data scoping
- Write callbacks no-op when `readOnly` (viewer mode)
- All async operations return `Result<T>`, never void
- Uses `StorageAdapter.onSnapshot` with `onError` callback for listener failure surfacing

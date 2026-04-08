# expenses/hooks

Data hooks for the Budget module. Real-time Firestore listeners for expenses and income.

## Key Files

- `useExpenses.ts` -- Expense collection listener with add/update/delete operations
- `useIncome.ts` -- Income collection listener with add/update/delete operations

## Conventions

- Both hooks accept an optional `targetUid` parameter for admin viewing other users' data
- All async operations return `Result<T>`, never void
- Uses `StorageAdapter.onSnapshot` with `onError` callback for listener failure surfacing

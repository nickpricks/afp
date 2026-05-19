# expenses/hooks

Data hooks for the Budget module. Real-time Firestore listeners for expenses and income.

## Files

- **useExpenses.ts** — Expense collection listener with full CRUD: `addExpense`, `updateExpense`, `deleteExpense`. All three return `Promise<boolean>` — they own their own toasts; callers use the boolean to gate state cleanup. `addExpense` accepts optional `meta: ExpenseMeta` for fuel/travel/maintenance tracking. `paymentMethod` is required (no silent UPI default at the hook layer — wrappers default explicitly). Uses `DbSubcollection.Expenses`
- **useIncome.ts** — Income collection listener with add/update/delete operations. Uses `DbSubcollection.Income`
- **useExpenseForm.ts** — Shared form-state hook extracted from `AddExpense` and `AutoTab`. Manages `date`, `amount`, `note`, `meta`, `paymentMethod`. (`category` + `subCat` stay outside the hook — they're persisted across submits in `AddExpense`.) Exposes `reset()` and `populate(expense)` for tap-to-edit. `populate` honors the caller's `initialPaymentMethod` choice when expense has no PM.

## Conventions

- Both hooks accept an optional `targetUid` parameter for admin/viewer data scoping
- Write callbacks no-op when `readOnly` (viewer mode)
- Data hook async operations return `Promise<boolean>` (not `Result<T>`) — hooks own their error toasts; callers gate state cleanup on the boolean. See Decision A1 in the flaw-in-the-plan cleanup spec.
- Uses `StorageAdapter.onSnapshot` with `onError` callback for listener failure surfacing
- If adapter is null (not yet ready), all write operations toast `BudgetMsg.AdapterNotReady` and return `false` — never silent no-op

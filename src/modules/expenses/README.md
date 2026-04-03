# expenses/

Expense tracking with 15 categories (Food, Shopping, Travel, Vehicle, Bills, Medical, Personal Care, Gifts, Education, Household, Finance, Entertainment, Income, Transfer, Misc) and soft-delete.

## Files

- **types.ts** -- `Expense` and `CategoryDefinition` type definitions
- **categories.ts** -- 15 category definitions with emoji labels and subcategories, plus `getAllCategoryIds` and `getSubCategories` helpers
- **validation.ts** -- `validateExpense` returns `Result<void>` using `ValidationMsg` enum for error messages
- **hooks/useExpenses.ts** -- CRUD operations with real-time sync via `createAdapter`, uses `DbSubcollection.Expenses` and `SyncStatus` enum
- **components/AddExpense.tsx** -- Expense entry form with category/subcategory selectors, uses `isValidNumber` from shared utils
- **components/ExpenseList.tsx** -- Date-sorted expense list with delete actions and empty state
- **pages/AddExpensePage.tsx** -- Route wrapper connecting `AddExpense` to the expense data hook, navigates back on success
- **pages/ExpenseListPage.tsx** -- Route wrapper connecting `ExpenseList` to the expense data hook
- **__tests__/validation.test.ts** -- Unit tests for `validateExpense` covering date, category, and amount rules

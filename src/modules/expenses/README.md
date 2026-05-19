# expenses/

Budget module (directory is `expenses/`, ModuleId is `Budget`). Expense + income tracking with 15 categories, payment methods, and reconciliation.

## Files

- **types.ts** — `Expense`, `Income`, `BudgetConfig`, `CategoryDefinition`, `LabelDefinition`, `ExpenseMeta` discriminated union, and `ExpenseMetaType` enum definitions
- **categories.ts** — 15 category definitions with emoji labels and subcategories. `PAYMENT_METHOD_LABELS`, `INCOME_SOURCE_LABELS`, `getAllCategoryIds`, `getSubCategories`, `VEHICLE_SUBCAT`, `TRAVEL_SUBCAT` helpers
- **validation.ts** — `validateExpense` returns `Result<void>` using `ValidationMsg` enum for error messages. Also validates optional `meta` union via internal `validateMeta` helper.
- **budget-math.ts** — Pure computation functions: `computeTotalIncome`, `computeTotalSpent`, `computeCCOutstanding`, `filterByDateRange`
- **fuel-math.ts** — Pure functions for fuel mileage and service-due derivations: `computeMileage`, `latestOdometer`, `dueMaintenance`, `isServiceDue`
- **meta-utils.ts** — Helpers for the meta sub-form: `metaKindFor()`, `subCatFor()`, and `defaultMeta()` — all use `switch + assertNever` for exhaustiveness on `ExpenseMetaType`
- **expense-badges.ts** — Pure badge-text helpers for Auto tab rows: `fuelBadge()`, `travelBadge()`, `maintenanceBadge()`, `renderBadge()`. Extracted from `AutoTab.tsx` to comply with `react-refresh/only-export-components`

## Directories

- `components/` — UI: AddExpense, AddIncome, BudgetSummary (timeRange-aware), ExpenseList, IncomeList, AutoTab, AutoTabRow, MetaSubForm, ServiceDueBanner, ReconciliationView, KidsFinanceTab (read-only kids aggregate), ConfirmExpenseModal (Spent→Expense bridge)
- `hooks/` — Data hooks: `useExpenses` (CRUD with `Promise<boolean>` returns), `useIncome`, `useExpenseForm` (shared form state), `useAllKidsFinances` (aggregate of all children's finances)
- `pages/` — Route-level pages (ExpenseListPage, AddExpensePage)

## Tests

- `__tests__/validation.test.ts` — Expense validation rules
- `__tests__/categories.test.ts` — Category definitions and helpers
- `__tests__/summary.test.ts` — Budget math computations
- `__tests__/AddExpense.test.tsx` — Add expense form rendering
- `__tests__/ReconciliationView.test.tsx` — Reconciliation display
- `__tests__/types.test.ts` — `ExpenseMetaType` enum members
- `__tests__/exhaustiveness.test.ts` — `assertNever` exhaustiveness checks at meta switch sites
- `__tests__/expense-badges.test.ts` — Auto tab badge rendering helpers
- `__tests__/fuel-math.test.ts` — Fuel mileage and service-due derivations
- `__tests__/meta-utils.test.ts` — `metaKindFor` and `defaultMeta` helpers
- `__tests__/MetaSubForm.test.tsx` — Meta sub-form rendering and two-of-three fuel math
- `__tests__/ServiceDueBanner.test.tsx` — Service-due banner derivation and display
- `__tests__/AutoTab.test.tsx` — Auto tab rendering and 500-row sanity
- `__tests__/useExpenses.test.ts` — Hook contract (adapter-null guard, return types)
- `__tests__/AutoTabRow.test.tsx` — AutoTab row rendering, incomplete pill, tap/delete affordances
- `__tests__/KidsFinanceTab.test.tsx` — Kids aggregate view and Spent→Expense bridge interactions
- `__tests__/useAllKidsFinances.test.tsx` — Aggregator readiness gating across multiple children

## Expense meta (Phase 2j+2k)

`Expense` carries an optional discriminated `meta` union for category-specific data:

- **`FuelMeta`** — Vehicle/Fuel expenses. Liters, ₹/L, optional odometer, trip ODO, full-tank flag. (`displayedMileage` removed in 0.2.21 — was input-only, never read.)
- **`TravelMeta`** — Travel/* expenses. Origin, destination, optional distance.
- **`MaintenanceMeta`** — Vehicle/Maintenance expenses. Odometer, optional next-service ODO, service notes.

Existing expenses without `meta` continue to work; backwards-compatible by design. All meta-discriminating switches use `assertNever` so adding a fourth variant fails to compile at every consumption site (see `exhaustiveness.test.ts`).

`firestore.rules validMeta()` mirrors the TS shape field-for-field, with nullable TS fields gated `(field == null || field is <type>)` (Wave 5b). Cross-reference comment in the rules file binds the two locations.

# expenses/components

UI components for the Budget module (directory is `expenses/` but ModuleId is `Budget`).

## Files

- **AddExpense.tsx** — Expense entry form with category, subcategory, payment method selection, and amount presets. Conditionally renders `<MetaSubForm>` when category=Vehicle/Fuel, Vehicle/Maintenance, or Travel/* — captures discriminated `meta` and passes it through `onSubmit`. Save-and-stay (no redirect). Payment method is `PaymentMethod | null` — deselect goes to `null`, hook validates and toasts `PaymentMethodRequired` on submit
- **AddIncome.tsx** — Income entry form (numeric enum values filtered with `typeof v === 'number'`)
- **BudgetSummary.tsx** — Summary card. Accepts an optional `timeRange` prop and filters Income + Spent + Remaining by it. CC Outstanding is intentionally NOT scoped to timeRange — it's a running balance ("what you currently owe"), not a period metric. Uses `budget-math.ts` for computation
- **ExpenseList.tsx** — Scrollable expense list with `sortNewestFirst`. `timeRange` + `onTimeRangeChange` are controlled props (hoisted to the page so summary + list stay in sync); pagination is owned locally via `useListControls`. Phase 2h: rows grouped by date under `<DateGroupHeader>` (sticky day-of-week + date), hairline `border-t` between rows
- **IncomeList.tsx** — Scrollable income list. Same controlled-timeRange + Daily Ledger treatment as ExpenseList
- **MetaSubForm.tsx** — Conditional sub-form rendering Fuel / Travel / Maintenance fields based on `meta.type`. Switch+`assertNever` ensures exhaustiveness. Owns the two-of-three input math for fuel (liters + price → amount via `deriveFuelTriple`). Numeric inputs route through `toFiniteNumber` (required fields) or `toFiniteOrNull` (nullable fields) so NaN never lands in state. Used by `AddExpense.tsx` and `AutoTab.tsx`
- **AutoTab.tsx** — Vehicle/Travel filtered tab with `<ServiceDueBanner>`, three quick-add buttons (⛽/🚕/🔧), inline form (tap-to-populate edit), and Daily Ledger list of `<AutoTabRow>` entries. No `<ListControls>` strip — vehicle history is small enough that pagination chrome is overhead (revisit at ~500 entries)
- **AutoTabRow.tsx** — Single row in the Auto tab list. Renders meta badges (e.g. `⛽ 40L · ₹100/L · 12,300km · 14.5 km/L`) via helpers from `expense-badges.ts`. Old expenses without `meta` show an "incomplete" pill. Tap = edit (populates form); × = delete with stopPropagation
- **KidsFinanceTab.tsx** — Read-only aggregate view of all children's finances on the Budget module's "Kids" tab. Gated on `profile.modules.baby`. "Total Kid Wealth" pill (sum of Received + Saved, excludes Spent). Spent→Expense bridge integration
- **ConfirmExpenseModal.tsx** — Cross-module modal prompting user to log a matching Budget expense when a child's finance entry is marked Spent
- **ReconciliationView.tsx** — Credit card reconciliation: outstanding balance, payment tracking
- **ServiceDueBanner.tsx** — Derived yellow banner shown at the top of the Auto tab when `latestOdometer ≥ mostRecentMaintenance.nextService`. In-memory dismiss only; auto-clears when a fresh maintenance entry with future `nextService` is logged. Single `useMemo` derivation (no per-render walks)

## Conventions

- Payment method selector uses toggle pattern (click active bubble to deselect → null); the hook layer rejects null with `BudgetMsg.PaymentMethodRequired` toast (no silent UPI fallback)
- Number inputs use `min`/`step` attributes to prevent negative/zero values; nullable numeric fields use `toFiniteOrNull` keystroke-level guard
- `timeRange` for ExpenseList/IncomeList is hoisted to `ExpenseListPage` and shared with `BudgetSummary`; pagination stays per-list via `useListControls`
- Daily Ledger visual: sticky `<DateGroupHeader>` per day, hairline `border-t` between rows, no per-row cards
- All meta-discriminating switches use `assertNever` from `@/shared/utils/types` as the default arm — compile-time exhaustiveness on new `ExpenseMetaType` variants

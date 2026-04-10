# Phase 2c: Expenses → Budget Module

> **Master plan:** [Phase 2 Master](2026-04-06-phase2-master.md)
> **Design Spec:** [Phase 2 Design](../specs/2026-04-06-phase2-design.md)

---

### Task 2c.1: Budget Types & Categories

**Files:**
- Modify: `src/modules/expenses/types.ts`
- Modify: `src/modules/expenses/categories.ts`
- Create: `src/modules/expenses/__tests__/categories.test.ts`

- [ ] **Step 1: Rename directory (optional) or keep as-is with ModuleId.Budget**

Decision: keep `src/modules/expenses/` directory name (avoid mass rename). ModuleId is `Budget` but the file path stays `expenses/`. Add comment in CLAUDE.md explaining this.

- [ ] **Step 2: Update Expense type with paymentMethod and isSettlement**

```typescript
// src/modules/expenses/types.ts
export interface Expense {
  id?: string;
  amount: number;
  category: ExpenseCategory;
  subCat: string;
  note: string;
  date: string;
  paymentMethod: PaymentMethod;
  isSettlement: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  id?: string;
  amount: number;
  source: IncomeSource;
  note: string;
  date: string;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetConfig {
  defaultView: BudgetView;
  configuredAt: string;
}
```

- [ ] **Step 3: Update categories to use numeric ExpenseCategory enum**

Map each category definition to use `ExpenseCategory.Food` etc. instead of string keys. Keep emoji labels and subcategory arrays.

- [ ] **Step 4: Add IncomeSource labels**

```typescript
// src/modules/expenses/categories.ts — add
export const INCOME_SOURCE_LABELS: Record<IncomeSource, { emoji: string; label: string }> = {
  [IncomeSource.Salary]: { emoji: '💼', label: 'Salary' },
  [IncomeSource.Business]: { emoji: '🏢', label: 'Business' },
  [IncomeSource.Interest]: { emoji: '🏦', label: 'Interest' },
  [IncomeSource.Refund]: { emoji: '🔙', label: 'Refund' },
  [IncomeSource.Other]: { emoji: '📦', label: 'Other' },
};
```

- [ ] **Step 5: Add PaymentMethod labels**

```typescript
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, { emoji: string; label: string; shortLabel: string }> = {
  [PaymentMethod.Cash]: { emoji: '💵', label: 'Cash', shortLabel: 'Cash' },
  [PaymentMethod.BankAccountImps]: { emoji: '🏦', label: 'Bank — IMPS', shortLabel: 'IMPS' },
  [PaymentMethod.BankAccountRtgs]: { emoji: '🏦', label: 'Bank — RTGS', shortLabel: 'RTGS' },
  [PaymentMethod.BankAccountNeft]: { emoji: '🏦', label: 'Bank — NEFT', shortLabel: 'NEFT' },
  [PaymentMethod.UpiBankAccount]: { emoji: '📲', label: 'UPI', shortLabel: 'UPI' },
  [PaymentMethod.UpiCreditCard]: { emoji: '📲', label: 'UPI + Credit Card', shortLabel: 'UPI+CC' },
  [PaymentMethod.CreditCard]: { emoji: '💳', label: 'Credit Card', shortLabel: 'CC' },
};
```

- [ ] **Step 6: Test and commit**

```bash
git add src/modules/expenses/
git commit -m "feat(budget): update types with PaymentMethod, Income, isSettlement"
```

### Task 2c.2: Income Hook (useIncome)

**Files:**
- Create: `src/modules/expenses/hooks/useIncome.ts`

- [ ] **Step 1: Implement useIncome hook**

Same pattern as `useExpenses` but for `income/` subcollection. CRUD operations for Income entries.

- [ ] **Step 2: Commit**

```bash
git add src/modules/expenses/hooks/useIncome.ts
git commit -m "feat(budget): add useIncome hook for income tracking"
```

### Task 2c.3: Budget Landing — List View with Summary Card

**Files:**
- Modify: `src/modules/expenses/components/ExpenseList.tsx`
- Create: `src/modules/expenses/components/BudgetSummary.tsx`
- Create: `src/modules/expenses/components/IncomeList.tsx`

- [ ] **Step 1: Create BudgetSummary card**

Computes: total income, total spent (excluding settlements), remaining. Reads from both `useExpenses` and `useIncome`.

- [ ] **Step 2: Add toggle between Expense list and Income list**

Landing page shows BudgetSummary at top, then [Expenses | Income] toggle, then the selected list.

- [ ] **Step 3: Update ExpenseList to show payment method emoji per entry**

Each row shows category emoji + label + amount + payment method emoji.

- [ ] **Step 4: Build IncomeList component**

Same pattern as ExpenseList but for income entries. Simpler (no categories, just source).

- [ ] **Step 5: Commit**

```bash
git add src/modules/expenses/components/
git commit -m "feat(budget): landing page with summary card, expense/income toggle"
```

### Task 2c.4: Add Expense — Payment Method Bubbles

**Files:**
- Modify: `src/modules/expenses/components/AddExpense.tsx`

- [ ] **Step 1: Add payment method bubble selector**

Quick bubbles: UPI (default selected), UPI+CC, CC. Expand button [···] reveals: Cash, IMPS, RTGS, NEFT.
Default value: `PaymentMethod.UpiBankAccount`.

- [ ] **Step 2: Add isSettlement checkbox**

Shown when category is Finance (11) and subCat is "Credit Card Payment" or similar. Or a manual toggle.

- [ ] **Step 3: Port Finularity UX patterns**

- Amount presets: [10] [20] [50] [100] [200] + extended [···]
- Emoji category bubbles (compact circles, expand on select)
- Category/subcategory deselect (re-tap toggle)

- [ ] **Step 4: Commit**

```bash
git add src/modules/expenses/components/AddExpense.tsx
git commit -m "feat(budget): payment method bubbles, amount presets, emoji categories"
```

### Task 2c.5: Add Income Form

**Files:**
- Create: `src/modules/expenses/components/AddIncome.tsx`
- Modify: `src/modules/expenses/pages/AddExpensePage.tsx` (rename to AddBudgetPage)

- [ ] **Step 1: Build AddIncome form**

Source dropdown (5 + Other with free text), amount, payment method bubbles, date, note. Save calls `useIncome.save()`.

- [ ] **Step 2: Create combined Add page with [Expense | Income] toggle**

Top toggle switches between AddExpense and AddIncome forms. Bulk import link at bottom of Expense form.

- [ ] **Step 3: Commit**

```bash
git add src/modules/expenses/
git commit -m "feat(budget): add income form and combined add page with toggle"
```

### Task 2c.6: Reconciliation View

**Files:**
- Create: `src/modules/expenses/components/ReconciliationView.tsx`

- [ ] **Step 1: Build reconciliation filter/group view**

Filter by payment method → show charges (expenses with that method) vs settlements (isSettlement=true paid via bank).
Calculate: Total charged, Total paid, Outstanding.

Works for CreditCard + UpiCreditCard specifically: sum expenses where paymentMethod is 5 or 6, subtract settlements.

- [ ] **Step 2: Wire into Budget landing as a filter mode**

Button or dropdown on BudgetSummary card to enter reconciliation view.

- [ ] **Step 3: Commit**

```bash
git add src/modules/expenses/components/ReconciliationView.tsx
git commit -m "feat(budget): add credit card reconciliation view"
```

### Task 2c.7: Budget Tests

**Files:**
- Create: `src/modules/expenses/__tests__/summary.test.ts`
- Modify: `src/modules/expenses/__tests__/validation.test.ts`

- [ ] **Step 1: Test smart totals (settlements excluded)**

```typescript
describe('BudgetSummary calculations', () => {
  it('excludes settlements from spent total', () => {
    const expenses = [
      { amount: 1000, isSettlement: false },
      { amount: 2000, isSettlement: true },
      { amount: 500, isSettlement: false },
    ];
    const spent = expenses.filter((e) => !e.isSettlement).reduce((sum, e) => sum + e.amount, 0);
    expect(spent).toBe(1500);
  });

  it('calculates CC outstanding correctly', () => {
    const ccCharges = [{ amount: 4500 }];
    const ccPayments = [{ amount: 2000 }];
    const totalCharged = ccCharges.reduce((s, e) => s + e.amount, 0);
    const totalPaid = ccPayments.reduce((s, e) => s + e.amount, 0);
    expect(totalCharged - totalPaid).toBe(2500);
  });
});
```

- [ ] **Step 2: Update validation tests for numeric enums**

- [ ] **Step 3: Run full test suite, commit**

```bash
git add src/modules/expenses/__tests__/
git commit -m "test(budget): add summary calculations and updated validation tests"
```

### Task 2c.8: Budget Firestore Rules & Negative Tests

- [ ] **Step 1: Verify budget rules**

Test: owner + budget module → can read/write `expenses/`, `income/`, `budget_config/`

- [ ] **Step 2: Negative tests**

- User without budget module → CANNOT access expenses/income
- Viewer → can READ but NOT WRITE
- isSettlement field accepted in writes

- [ ] **Step 3: Doc sweep and commit**

Update CLAUDE.md, CHANGELOG.md. Note that directory is still `src/modules/expenses/` but ModuleId is `Budget`.

```bash
git add CLAUDE.md CHANGELOG.md
git commit -m "docs: update for Phase 2c budget module"
```

---

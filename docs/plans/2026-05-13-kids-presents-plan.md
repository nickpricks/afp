# Implementation Plan: Kids Presents

## Phase 1: Foundation (COMPLETED)
1.  **Types & Constants**:
    *   Updated `src/modules/baby/types.ts` with `GiftStatus`, `FinanceStatus`, `GiftEntry`, `FinanceEntry`, and `ChildConfig.presents`.
    *   Updated `src/modules/baby/constants.ts` with labels and status arrays.
    *   Updated `src/constants/db.ts` with `Gifts` and `Finances` subcollection names.

## Phase 2: Baby Module UI (COMPLETED)
1.  **Logging Component**: Created `src/modules/baby/components/PresentsLog.tsx` supporting sub-tabs and dual logging.
2.  **Detail Wiring**: Updated `src/modules/baby/components/ChildDetail.tsx` to include the "Presents" tab and dashboard card.

## Phase 3: Budget Module Integration (IN PROGRESS)
1.  **Aggregation Logic (COMPLETED)**: Created `src/modules/expenses/hooks/useAllKidsFinances.ts` to reactive-merge financial logs.
2.  **Display Component (COMPLETED)**: Created `src/modules/expenses/components/KidsFinanceTab.tsx`.
3.  **Page Integration (PENDING)**:
    *   [ ] Modify `src/modules/expenses/pages/ExpenseListPage.tsx` to show the "Kids" tab if the Baby module is enabled.

# Tasks

### Task 1: Budget Module Page Wiring
- **File**: `src/modules/expenses/pages/ExpenseListPage.tsx`
- **Steps**:
    1. Import `KidsFinanceTab`.
    2. Read `profile.modules.baby` from `useAuth()`.
    3. Update `BudgetTab` type to include `'kids'`.
    4. Update the tab-strip JSX to conditionally render the "Kids" button.
    5. Render `<KidsFinanceTab />` when the active tab is `'kids'`.
- **Verification**: 
    - Check if "Kids" tab appears in Budget dashboard when Baby module is enabled.
    - Verify financial logs from children appear in the list.

### Task 2: Self-Verification Sweep
- Run `bun run typecheck`.
- Run `bun run lint:eslint`.
- Manual smoke test of logging and aggregation.

### Task 3: Documentation Update
- Update `CHANGELOG.md` with the new feature.
- Update `docs/ROADMAP.md` if applicable.

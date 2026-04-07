import type { BudgetView, ExpenseCategory, IncomeSource, PaymentMethod } from '@/shared/types';

// NOTE: Directory remains `expenses/` for backwards compat. Module is "Budget" in the UI.

/** Single expense record with soft-delete support */
export type Expense = {
  id: string;
  date: string;
  category: ExpenseCategory;
  subCat: string;
  amount: number;
  paymentMethod: PaymentMethod;
  isSettlement: boolean;
  note: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Single income record */
export type Income = {
  id: string;
  amount: number;
  source: IncomeSource;
  note: string;
  date: string;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
};

/** Budget module configuration */
export type BudgetConfig = {
  defaultView: BudgetView;
  configuredAt: string;
};

/** Definition of a spending category and its subcategories */
export type CategoryDefinition = {
  id: ExpenseCategory;
  label: string;
  subCategories: string[];
};

/** Label descriptor for payment methods and income sources */
export type LabelDefinition = {
  emoji: string;
  label: string;
  shortLabel: string;
};

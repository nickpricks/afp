import type { ExpenseCategory, IncomeSource, PaymentMethod, TimeRange } from '@/shared/types';

// NOTE: Directory remains `expenses/` for backwards compat. Module is "Budget" in the UI.

/** Discriminator tag for Expense.meta variants. */
export enum ExpenseMetaType {
  Fuel = 'fuel',
  Travel = 'travel',
  Maintenance = 'maintenance',
}

/** Fuel-fill metadata captured for Vehicle/Fuel expenses */
export type FuelMeta = {
  type: 'fuel';
  liters: number;
  pricePerLiter: number;
  odometer: number | null;
  tripOdo: number | null;
  displayedMileage: number | null;
  fullTank: boolean;
};

/** Trip metadata captured for Travel expenses */
export type TravelMeta = {
  type: 'travel';
  origin: string;
  destination: string;
  distance: number | null;
};

/** Maintenance metadata captured for Vehicle/Maintenance expenses */
export type MaintenanceMeta = {
  type: 'maintenance';
  odometer: number;
  nextService: number | null;
  serviceNotes: string;
};

/** Discriminated union of category-specific expense metadata */
export type ExpenseMeta = FuelMeta | TravelMeta | MaintenanceMeta;

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
  meta?: ExpenseMeta;
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
  defaultView: TimeRange;
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

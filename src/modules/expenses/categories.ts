import { ExpenseCategory, IncomeSource, PaymentMethod } from '@/shared/types';
import type { CategoryDefinition, LabelDefinition } from '@/modules/expenses/types';

/** All spending categories keyed by ExpenseCategory enum */
export const CATEGORIES: Partial<Record<ExpenseCategory, CategoryDefinition>> = {
  [ExpenseCategory.Housing]: {
    id: ExpenseCategory.Housing,
    label: '🏠 Housing',
    subCategories: ['Rent', 'Society', 'Maintenance'],
  },
  [ExpenseCategory.Food]: {
    id: ExpenseCategory.Food,
    label: '🍽️ Food',
    subCategories: ['Milk', 'Snacks', 'Groceries', 'Healthy', 'Orders', 'Beverages'],
  },
  [ExpenseCategory.Shopping]: {
    id: ExpenseCategory.Shopping,
    label: '🛒 Shopping',
    subCategories: ['Veggies', 'Fruits', 'Fashion', 'Ration', 'Electronics', 'Home Items'],
  },
  [ExpenseCategory.Travel]: {
    id: ExpenseCategory.Travel,
    label: '✈️ Travel',
    subCategories: ['Air', 'Train', 'Bus', 'Cab/Auto', 'Road Toll'],
  },
  [ExpenseCategory.Vehicle]: {
    id: ExpenseCategory.Vehicle,
    label: '🚗 Vehicle',
    subCategories: ['Fuel', 'Maintenance', 'Washing', 'Parking', 'Insurance'],
  },
  [ExpenseCategory.Bills]: {
    id: ExpenseCategory.Bills,
    label: '🧾 Bills',
    subCategories: ['Phone', 'Internet', 'Subscriptions', 'Electricity', 'Rent', 'Society', 'Gas', 'Water', 'Tax', 'Maintenance'],
  },
  [ExpenseCategory.Medical]: {
    id: ExpenseCategory.Medical,
    label: '🏥 Medical',
    subCategories: ['Doctor/Consultation', 'Medicines', 'Tests', 'Emergency'],
  },
  [ExpenseCategory.Care]: {
    id: ExpenseCategory.Care,
    label: '💆 Personal Care',
    subCategories: ['Grooming', 'Massage', 'Personal'],
  },
  [ExpenseCategory.Gifts]: {
    id: ExpenseCategory.Gifts,
    label: '🎁 Gifts',
    subCategories: ['Ceremonies', 'Charity', 'Donations', 'Family', 'Friends'],
  },
  [ExpenseCategory.Education]: {
    id: ExpenseCategory.Education,
    label: '📚 Education',
    subCategories: ['Courses', 'Books', 'Software/Tools'],
  },
  [ExpenseCategory.Household]: {
    id: ExpenseCategory.Household,
    label: '🏠 Household',
    subCategories: ['Cleaning', 'Repairs'],
  },
  [ExpenseCategory.Finance]: {
    id: ExpenseCategory.Finance,
    label: '💰 Finance',
    subCategories: ['Borrowed Given', 'Borrowed Taken', 'Loan EMI', 'Credit Card Payment', 'Investment'],
  },
  [ExpenseCategory.Entertainment]: {
    id: ExpenseCategory.Entertainment,
    label: '🎬 Entertainment',
    subCategories: ['Movies', 'Outings'],
  },
  [ExpenseCategory.Transfer]: {
    id: ExpenseCategory.Transfer,
    label: '🔄 Transfer',
    subCategories: ['Self Account', 'Wallet Transfer'],
  },
  [ExpenseCategory.Misc]: {
    id: ExpenseCategory.Misc,
    label: '📦 Misc',
    subCategories: ['Misc'],
  },
};

/** Returns all valid category IDs */
export function getAllCategoryIds(): ExpenseCategory[] {
  return Object.keys(CATEGORIES).map(Number) as ExpenseCategory[];
}

/** Returns subcategories for a given category, or empty array if unknown */
export function getSubCategories(categoryId: ExpenseCategory): string[] {
  return CATEGORIES[categoryId]?.subCategories ?? [];
}

/** Human-readable labels for each payment method */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, LabelDefinition> = {
  [PaymentMethod.Cash]: { emoji: '💵', label: 'Cash', shortLabel: 'Cash' },
  [PaymentMethod.BankAccountImps]: { emoji: '🏦', label: 'Bank — IMPS', shortLabel: 'IMPS' },
  [PaymentMethod.BankAccountRtgs]: { emoji: '🏦', label: 'Bank — RTGS', shortLabel: 'RTGS' },
  [PaymentMethod.BankAccountNeft]: { emoji: '🏦', label: 'Bank — NEFT', shortLabel: 'NEFT' },
  [PaymentMethod.UpiBankAccount]: { emoji: '📲', label: 'UPI', shortLabel: 'UPI' },
  [PaymentMethod.UpiCreditCard]: { emoji: '📲', label: 'UPI + Credit Card', shortLabel: 'UPI+CC' },
  [PaymentMethod.CreditCard]: { emoji: '💳', label: 'Credit Card', shortLabel: 'CC' },
};

/** Human-readable labels for each income source */
export const INCOME_SOURCE_LABELS: Record<IncomeSource, LabelDefinition> = {
  [IncomeSource.Salary]: { emoji: '💼', label: 'Salary', shortLabel: 'Salary' },
  [IncomeSource.Business]: { emoji: '🏢', label: 'Business', shortLabel: 'Biz' },
  [IncomeSource.Interest]: { emoji: '📈', label: 'Interest', shortLabel: 'Interest' },
  [IncomeSource.Refund]: { emoji: '↩️', label: 'Refund', shortLabel: 'Refund' },
  [IncomeSource.Other]: { emoji: '💰', label: 'Other', shortLabel: 'Other' },
};

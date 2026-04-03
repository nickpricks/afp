import type { CategoryDefinition } from '@/modules/expenses/types';

/** All spending categories with their subcategories */
export const CATEGORIES: Record<string, CategoryDefinition> = {
  food: {
    id: 'food',
    label: '🍽️ Food',
    subCategories: ['Milk', 'Snacks', 'Groceries', 'Healthy', 'Orders', 'Beverages'],
  },
  shopping: {
    id: 'shopping',
    label: '🛒 Shopping',
    subCategories: ['Veggies', 'Fruits', 'Fashion', 'Ration', 'Electronics', 'Home Items'],
  },
  travel: {
    id: 'travel',
    label: '✈️ Travel',
    subCategories: ['Air', 'Train', 'Bus', 'Cab/Auto', 'Road Toll'],
  },
  vehicle: {
    id: 'vehicle',
    label: '🚗 Vehicle',
    subCategories: ['Fuel', 'Maintenance', 'Washing', 'Parking', 'Insurance'],
  },
  bills: {
    id: 'bills',
    label: '🧾 Bills',
    subCategories: ['Phone', 'Internet', 'Subscriptions', 'Electricity', 'Rent', 'Society', 'Gas', 'Water', 'Tax', 'Maintenance'],
  },
  medical: {
    id: 'medical',
    label: '🏥 Medical',
    subCategories: ['Doctor/Consultation', 'Medicines', 'Tests', 'Emergency'],
  },
  care: {
    id: 'care',
    label: '💆 Personal Care',
    subCategories: ['Grooming', 'Massage', 'Personal'],
  },
  gifts: {
    id: 'gifts',
    label: '🎁 Gifts',
    subCategories: ['Ceremonies', 'Charity', 'Donations', 'Family', 'Friends'],
  },
  education: {
    id: 'education',
    label: '📚 Education',
    subCategories: ['Courses', 'Books', 'Software/Tools'],
  },
  household: {
    id: 'household',
    label: '🏠 Household',
    subCategories: ['Cleaning', 'Repairs'],
  },
  finance: {
    id: 'finance',
    label: '💰 Finance',
    subCategories: ['Borrowed Given', 'Borrowed Taken', 'Loan EMI', 'Credit Card Payment', 'Investment'],
  },
  entertainment: {
    id: 'entertainment',
    label: '🎬 Entertainment',
    subCategories: ['Movies', 'Outings'],
  },
  income: {
    id: 'income',
    label: '💵 Income',
    subCategories: ['Salary', 'Business', 'Interest', 'Refund', 'Other Income'],
  },
  transfer: {
    id: 'transfer',
    label: '🔄 Transfer',
    subCategories: ['Self Account', 'Wallet Transfer'],
  },
  misc: {
    id: 'misc',
    label: '📦 Misc',
    subCategories: ['Misc'],
  },
};

/** Returns all valid category IDs */
export function getAllCategoryIds(): string[] {
  return Object.keys(CATEGORIES);
}

/** Returns subcategories for a given category, or empty array if unknown */
export function getSubCategories(categoryId: string): string[] {
  return CATEGORIES[categoryId]?.subCategories ?? [];
}

/** Single expense record with soft-delete support */
export type Expense = {
  id: string;
  date: string;
  category: string;
  subCat: string;
  amount: number;
  note: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Definition of a spending category and its subcategories */
export type CategoryDefinition = {
  id: string;
  label: string;
  subCategories: string[];
};

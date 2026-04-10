import { describe, it, expect } from 'vitest';

import {
  CATEGORIES,
  getAllCategoryIds,
  getSubCategories,
  PAYMENT_METHOD_LABELS,
  INCOME_SOURCE_LABELS,
} from '@/modules/expenses/categories';
import { ExpenseCategory, IncomeSource, PaymentMethod } from '@/shared/types';

/** Extracts only numeric values from a numeric TypeScript enum */
const numericValues = <T extends Record<string, string | number>>(e: T): number[] =>
  Object.values(e).filter((v): v is number => typeof v === 'number');

describe('CATEGORIES', () => {
  it('has an entry for every ExpenseCategory enum value', () => {
    for (const cat of numericValues(ExpenseCategory)) {
      expect(CATEGORIES[cat as ExpenseCategory]).toBeDefined();
      expect(CATEGORIES[cat as ExpenseCategory]!.id).toBe(cat);
    }
  });

  it('every category has a non-empty label', () => {
    for (const cat of numericValues(ExpenseCategory)) {
      expect(CATEGORIES[cat as ExpenseCategory]!.label.length).toBeGreaterThan(0);
    }
  });

  it('every category has at least one subcategory', () => {
    for (const cat of numericValues(ExpenseCategory)) {
      expect(CATEGORIES[cat as ExpenseCategory]!.subCategories.length).toBeGreaterThan(0);
    }
  });
});

describe('getAllCategoryIds', () => {
  it('returns all ExpenseCategory values', () => {
    const ids = getAllCategoryIds();
    const enumValues = numericValues(ExpenseCategory);
    expect(ids).toHaveLength(enumValues.length);
    for (const val of enumValues) {
      expect(ids).toContain(val);
    }
  });
});

describe('getSubCategories', () => {
  it('returns subcategories for a known category', () => {
    const subs = getSubCategories(ExpenseCategory.Food);
    expect(subs.length).toBeGreaterThan(0);
    expect(subs).toContain('Milk');
  });

  it('returns empty array for unknown category', () => {
    const subs = getSubCategories('nope' as ExpenseCategory);
    expect(subs).toEqual([]);
  });
});

describe('PAYMENT_METHOD_LABELS', () => {
  it('has an entry for every PaymentMethod enum value', () => {
    for (const pm of numericValues(PaymentMethod)) {
      expect(PAYMENT_METHOD_LABELS[pm as PaymentMethod]).toBeDefined();
      expect(PAYMENT_METHOD_LABELS[pm as PaymentMethod].emoji.length).toBeGreaterThan(0);
      expect(PAYMENT_METHOD_LABELS[pm as PaymentMethod].label.length).toBeGreaterThan(0);
      expect(PAYMENT_METHOD_LABELS[pm as PaymentMethod].shortLabel.length).toBeGreaterThan(0);
    }
  });
});

describe('INCOME_SOURCE_LABELS', () => {
  it('has an entry for every IncomeSource enum value', () => {
    for (const src of numericValues(IncomeSource)) {
      expect(INCOME_SOURCE_LABELS[src as IncomeSource]).toBeDefined();
      expect(INCOME_SOURCE_LABELS[src as IncomeSource].emoji.length).toBeGreaterThan(0);
      expect(INCOME_SOURCE_LABELS[src as IncomeSource].label.length).toBeGreaterThan(0);
      expect(INCOME_SOURCE_LABELS[src as IncomeSource].shortLabel.length).toBeGreaterThan(0);
    }
  });
});

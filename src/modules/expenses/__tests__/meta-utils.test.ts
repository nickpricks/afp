import { describe, it, expect } from 'vitest';

import { metaKindFor, defaultMeta } from '@/modules/expenses/meta-utils';
import { ExpenseCategory } from '@/shared/types';
import { ExpenseMetaType } from '@/modules/expenses/types';

/** Validates metaKindFor maps category+subCat pairs to the correct meta kind */
describe('metaKindFor', () => {
  it('returns "fuel" for Vehicle/Fuel', () => {
    expect(metaKindFor(ExpenseCategory.Vehicle, 'Fuel')).toBe(ExpenseMetaType.Fuel);
  });
  it('returns "maintenance" for Vehicle/Maintenance', () => {
    expect(metaKindFor(ExpenseCategory.Vehicle, 'Maintenance')).toBe(ExpenseMetaType.Maintenance);
  });
  it('returns "travel" for any non-empty Travel subCat', () => {
    expect(metaKindFor(ExpenseCategory.Travel, 'Air')).toBe(ExpenseMetaType.Travel);
    expect(metaKindFor(ExpenseCategory.Travel, 'Cab/Auto')).toBe(ExpenseMetaType.Travel);
  });
  it('returns null for empty Travel subCat', () => {
    expect(metaKindFor(ExpenseCategory.Travel, '')).toBeNull();
  });
  it('returns null for non-vehicle, non-travel categories', () => {
    expect(metaKindFor(ExpenseCategory.Food, 'Groceries')).toBeNull();
  });
  it('returns null when category is null', () => {
    expect(metaKindFor(null, 'Fuel')).toBeNull();
  });
});

/** Validates defaultMeta returns correct zero-value meta objects for each kind */
describe('defaultMeta', () => {
  it('returns FuelMeta with zeros and nulls', () => {
    const m = defaultMeta(ExpenseMetaType.Fuel);
    expect(m).toEqual({
      type: ExpenseMetaType.Fuel,
      liters: 0,
      pricePerLiter: 0,
      odometer: null,
      tripOdo: null,
      displayedMileage: null,
      fullTank: false,
    });
  });
  it('returns TravelMeta with empty strings', () => {
    expect(defaultMeta(ExpenseMetaType.Travel)).toEqual({
      type: ExpenseMetaType.Travel,
      origin: '',
      destination: '',
      distance: null,
    });
  });
  it('returns MaintenanceMeta with zero odometer', () => {
    expect(defaultMeta(ExpenseMetaType.Maintenance)).toEqual({
      type: ExpenseMetaType.Maintenance,
      odometer: 0,
      nextService: null,
      serviceNotes: '',
    });
  });
  it('returns undefined for null kind', () => {
    expect(defaultMeta(null)).toBeUndefined();
  });
});

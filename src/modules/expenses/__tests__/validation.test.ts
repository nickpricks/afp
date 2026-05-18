import { describe, it, expect } from 'vitest';

import { validateExpense, validateIncome } from '@/modules/expenses/validation';
import { isOk, isErr, ExpenseCategory, IncomeSource } from '@/shared/types';
import type { FuelMeta, TravelMeta, MaintenanceMeta } from '@/modules/expenses/types';
import { ExpenseMetaType } from '@/modules/expenses/types';
import { ValidationMsg } from '@/constants/messages';

/** Extracts only numeric values from a numeric TypeScript enum */
const numericValues = <T extends Record<string, string | number>>(e: T): number[] =>
  Object.values(e).filter((v): v is number => typeof v === 'number');

/** Validates validateExpense accepts valid inputs and rejects bad date/category/amount */
describe('validateExpense', () => {
  it('accepts a valid expense with enum category', () => {
    const result = validateExpense({
      date: '2026-04-02',
      category: ExpenseCategory.Food,
      amount: 100,
    });
    expect(isOk(result)).toBe(true);
  });

  it('accepts all enum categories', () => {
    for (const cat of numericValues(ExpenseCategory)) {
      const result = validateExpense({
        date: '2026-04-02',
        category: cat as ExpenseCategory,
        amount: 50,
      });
      expect(isOk(result)).toBe(true);
    }
  });

  it('rejects a missing date', () => {
    const result = validateExpense({ date: '', category: ExpenseCategory.Food, amount: 100 });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe('Date is required');
  });

  it('rejects an invalid date format', () => {
    const result = validateExpense({
      date: '02-04-2026',
      category: ExpenseCategory.Food,
      amount: 100,
    });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe('Date must be in YYYY-MM-DD format');
  });

  it('rejects an unknown category', () => {
    const result = validateExpense({
      date: '2026-04-02',
      category: 'unknown' as ExpenseCategory,
      amount: 100,
    });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe('Unknown category');
  });

  it('rejects zero amount', () => {
    const result = validateExpense({
      date: '2026-04-02',
      category: ExpenseCategory.Food,
      amount: 0,
    });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe('Amount must be greater than zero');
  });

  it('rejects negative amount', () => {
    const result = validateExpense({
      date: '2026-04-02',
      category: ExpenseCategory.Food,
      amount: -50,
    });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe('Amount must be greater than zero');
  });
});

/** Validates validateIncome accepts valid inputs and rejects bad date/source/amount */
describe('validateIncome', () => {
  it('accepts a valid income entry', () => {
    const result = validateIncome({
      date: '2026-04-02',
      source: IncomeSource.Salary,
      amount: 50000,
    });
    expect(isOk(result)).toBe(true);
  });

  it('accepts all enum sources', () => {
    for (const src of numericValues(IncomeSource)) {
      const result = validateIncome({
        date: '2026-04-02',
        source: src as IncomeSource,
        amount: 100,
      });
      expect(isOk(result)).toBe(true);
    }
  });

  it('rejects a missing date', () => {
    const result = validateIncome({ date: '', source: IncomeSource.Salary, amount: 100 });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe('Date is required');
  });

  it('rejects an invalid date format', () => {
    const result = validateIncome({ date: '02-04-2026', source: IncomeSource.Salary, amount: 100 });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe('Date must be in YYYY-MM-DD format');
  });

  it('rejects an unknown income source', () => {
    const result = validateIncome({
      date: '2026-04-02',
      source: 'unknown' as IncomeSource,
      amount: 100,
    });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe('Unknown income source');
  });

  it('rejects zero amount', () => {
    const result = validateIncome({ date: '2026-04-02', source: IncomeSource.Salary, amount: 0 });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe('Amount must be greater than zero');
  });

  it('rejects negative amount', () => {
    const result = validateIncome({ date: '2026-04-02', source: IncomeSource.Salary, amount: -50 });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe('Amount must be greater than zero');
  });
});

/** Validates fuel meta validation rules: liters and pricePerLiter must be positive */
describe('validateExpense — fuel meta', () => {
  const baseInput = {
    date: '2026-05-04',
    category: ExpenseCategory.Vehicle,
    amount: 4000,
  };

  it('accepts a valid fuel meta', () => {
    const meta: FuelMeta = {
      type: ExpenseMetaType.Fuel,
      liters: 40,
      pricePerLiter: 100,
      odometer: 12000,
      tripOdo: 500,
      displayedMileage: 14.2,
      fullTank: true,
    };
    expect(isOk(validateExpense({ ...baseInput, meta }))).toBe(true);
  });

  it('rejects fuel meta with zero liters', () => {
    const meta: FuelMeta = {
      type: ExpenseMetaType.Fuel,
      liters: 0,
      pricePerLiter: 100,
      odometer: null,
      tripOdo: null,
      displayedMileage: null,
      fullTank: false,
    };
    const r = validateExpense({ ...baseInput, meta });
    expect(isOk(r)).toBe(false);
    if (!isOk(r)) expect(r.error).toBe(ValidationMsg.FuelLitersInvalid);
  });

  it('rejects fuel meta with zero pricePerLiter', () => {
    const meta: FuelMeta = {
      type: ExpenseMetaType.Fuel,
      liters: 40,
      pricePerLiter: 0,
      odometer: null,
      tripOdo: null,
      displayedMileage: null,
      fullTank: false,
    };
    const r = validateExpense({ ...baseInput, meta });
    expect(isOk(r)).toBe(false);
    if (!isOk(r)) expect(r.error).toBe(ValidationMsg.FuelPriceInvalid);
  });
});

/** Validates travel meta validation rules: origin and destination must be non-empty */
describe('validateExpense — travel meta', () => {
  const baseInput = {
    date: '2026-05-04',
    category: ExpenseCategory.Travel,
    amount: 250,
  };

  it('accepts a valid travel meta', () => {
    const meta: TravelMeta = {
      type: ExpenseMetaType.Travel,
      origin: 'BLR',
      destination: 'MAA',
      distance: 8,
    };
    expect(isOk(validateExpense({ ...baseInput, meta }))).toBe(true);
  });

  it('rejects travel meta with empty origin', () => {
    const meta: TravelMeta = {
      type: ExpenseMetaType.Travel,
      origin: '',
      destination: 'MAA',
      distance: null,
    };
    const r = validateExpense({ ...baseInput, meta });
    expect(isOk(r)).toBe(false);
    if (!isOk(r)) expect(r.error).toBe(ValidationMsg.TravelOriginRequired);
  });

  it('rejects travel meta with empty destination', () => {
    const meta: TravelMeta = {
      type: ExpenseMetaType.Travel,
      origin: 'BLR',
      destination: '',
      distance: null,
    };
    const r = validateExpense({ ...baseInput, meta });
    expect(isOk(r)).toBe(false);
    if (!isOk(r)) expect(r.error).toBe(ValidationMsg.TravelDestinationRequired);
  });
});

/** Validates maintenance meta validation rules: odometer must be positive */
describe('validateExpense — maintenance meta', () => {
  const baseInput = {
    date: '2026-05-04',
    category: ExpenseCategory.Vehicle,
    amount: 5000,
  };

  it('accepts a valid maintenance meta', () => {
    const meta: MaintenanceMeta = {
      type: ExpenseMetaType.Maintenance,
      odometer: 12500,
      nextService: 22500,
      serviceNotes: 'Engine oil + filter',
    };
    expect(isOk(validateExpense({ ...baseInput, meta }))).toBe(true);
  });

  it('rejects maintenance meta with zero odometer', () => {
    const meta: MaintenanceMeta = {
      type: ExpenseMetaType.Maintenance,
      odometer: 0,
      nextService: null,
      serviceNotes: '',
    };
    const r = validateExpense({ ...baseInput, meta });
    expect(isOk(r)).toBe(false);
    if (!isOk(r)) expect(r.error).toBe(ValidationMsg.OdometerInvalid);
  });
});

/** Validates that NaN and Infinity numeric fields are rejected by validateMeta */
describe('validateMeta — NaN/Infinity rejection', () => {
  const fuelBase = { date: '2026-05-04', category: ExpenseCategory.Vehicle, amount: 4000 };
  const maintBase = { date: '2026-05-04', category: ExpenseCategory.Vehicle, amount: 5000 };

  it('rejects NaN liters on fuel meta', () => {
    const meta: FuelMeta = {
      type: ExpenseMetaType.Fuel,
      liters: NaN,
      pricePerLiter: 100,
      odometer: null,
      tripOdo: null,
      displayedMileage: null,
      fullTank: false,
    };
    const r = validateExpense({ ...fuelBase, meta });
    expect(isOk(r)).toBe(false);
  });

  it('rejects Infinity pricePerLiter on fuel meta', () => {
    const meta: FuelMeta = {
      type: ExpenseMetaType.Fuel,
      liters: 40,
      pricePerLiter: Infinity,
      odometer: null,
      tripOdo: null,
      displayedMileage: null,
      fullTank: false,
    };
    const r = validateExpense({ ...fuelBase, meta });
    expect(isOk(r)).toBe(false);
  });

  it('rejects NaN odometer on maintenance meta', () => {
    const meta: MaintenanceMeta = {
      type: ExpenseMetaType.Maintenance,
      odometer: NaN,
      nextService: 50000,
      serviceNotes: '',
    };
    const r = validateExpense({ ...maintBase, meta });
    expect(isOk(r)).toBe(false);
  });
});

/** Validates backward-compatibility: expenses without meta are accepted */
describe('validateExpense — no meta', () => {
  it('accepts an expense with meta=undefined (existing behavior)', () => {
    expect(
      isOk(
        validateExpense({
          date: '2026-05-04',
          category: ExpenseCategory.Food,
          amount: 100,
        }),
      ),
    ).toBe(true);
  });
});

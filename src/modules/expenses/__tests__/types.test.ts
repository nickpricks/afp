import { describe, it, expect } from 'vitest';
import { ExpenseMetaType } from '../types';

/** Verifies ExpenseMetaType string enum values match storage conventions */
describe('ExpenseMetaType', () => {
  it('exposes Fuel, Travel, Maintenance string members', () => {
    expect(ExpenseMetaType.Fuel).toBe('fuel');
    expect(ExpenseMetaType.Travel).toBe('travel');
    expect(ExpenseMetaType.Maintenance).toBe('maintenance');
  });
});

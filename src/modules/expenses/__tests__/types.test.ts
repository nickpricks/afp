import { describe, it, expect } from 'vitest';
import { ExpenseMetaType } from '../types';

describe('ExpenseMetaType', () => {
  it('exposes Fuel, Travel, Maintenance string members', () => {
    expect(ExpenseMetaType.Fuel).toBe('fuel');
    expect(ExpenseMetaType.Travel).toBe('travel');
    expect(ExpenseMetaType.Maintenance).toBe('maintenance');
  });
});

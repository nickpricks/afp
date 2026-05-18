import { describe, it, expect } from 'vitest';
import { ExpenseMetaType } from '../types';

/** Guards against unintentional addition of meta types without updating switch exhaustiveness */
describe('meta-type exhaustiveness', () => {
  it('ExpenseMetaType has exactly 3 members today', () => {
    expect(Object.values(ExpenseMetaType).sort()).toEqual(['fuel', 'maintenance', 'travel']);
  });
});

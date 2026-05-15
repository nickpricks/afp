import { describe, it, expect } from 'vitest';
import { assertNever } from '../types';

describe('assertNever', () => {
  it('throws when called (runtime safety net for compile-time-only paths)', () => {
    expect(() => assertNever('unexpected' as never)).toThrow(/unexpected/i);
  });
});

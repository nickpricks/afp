import { describe, it, expect } from 'vitest';

import { computeBodyScore } from '@/modules/body/scoring';

describe('computeBodyScore', () => {
  it('scores 10 up + 5 down as 12.5', () => {
    expect(computeBodyScore(10, 5)).toBe(12.5);
  });

  it('scores 0 + 0 as 0', () => {
    expect(computeBodyScore(0, 0)).toBe(0);
  });

  it('scores 5 up + 0 down as 5', () => {
    expect(computeBodyScore(5, 0)).toBe(5);
  });

  it('scores 0 up + 10 down as 5', () => {
    expect(computeBodyScore(0, 10)).toBe(5);
  });
});

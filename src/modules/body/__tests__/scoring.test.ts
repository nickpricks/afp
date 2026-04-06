import { describe, it, expect } from 'vitest';

import { computeBodyScore, computeSteps } from '@/modules/body/scoring';

/** Helper to build a minimal record for scoring */
function rec(up: number, down: number, walkMeters = 0, runMeters = 0) {
  return { up, down, walkMeters, runMeters };
}

describe('computeBodyScore', () => {
  it('scores 10 up + 5 down as 12.5', () => {
    expect(computeBodyScore(rec(10, 5))).toBe(12.5);
  });

  it('scores 0 + 0 as 0', () => {
    expect(computeBodyScore(rec(0, 0))).toBe(0);
  });

  it('scores 5 up + 0 down as 5', () => {
    expect(computeBodyScore(rec(5, 0))).toBe(5);
  });

  it('scores 0 up + 10 down as 5', () => {
    expect(computeBodyScore(rec(0, 10))).toBe(5);
  });

  it('includes walk distance in score (500m = 2.5 points)', () => {
    expect(computeBodyScore(rec(0, 0, 500))).toBe(2.5);
  });

  it('includes run distance in score (300m = 3 points)', () => {
    expect(computeBodyScore(rec(0, 0, 0, 300))).toBe(3);
  });

  it('combines floors + walk + run', () => {
    // 2 up (2) + 1 down (0.5) + 200m walk (1) + 100m run (1) = 4.5
    expect(computeBodyScore(rec(2, 1, 200, 100))).toBe(4.5);
  });
});

describe('computeSteps', () => {
  it('approximates steps from distance and stride', () => {
    expect(computeSteps(750, 0.75)).toBe(1000);
  });

  it('returns 0 for zero distance', () => {
    expect(computeSteps(0, 0.75)).toBe(0);
  });

  it('returns 0 for zero stride', () => {
    expect(computeSteps(100, 0)).toBe(0);
  });

  it('rounds to nearest integer', () => {
    expect(computeSteps(100, 0.75)).toBe(133);
  });
});

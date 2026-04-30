import { describe, it, expect } from 'vitest';
import { bucketIntensity, INTENSITY_TIERS } from '../intensity';

describe('bucketIntensity', () => {
  it('maps 0 to 0', () => {
    expect(bucketIntensity(0)).toBe(0);
  });
  it('maps 1-37 to 25', () => {
    expect(bucketIntensity(1)).toBe(25);
    expect(bucketIntensity(15)).toBe(25);
    expect(bucketIntensity(37)).toBe(25);
  });
  it('maps 38-62 to 50', () => {
    expect(bucketIntensity(38)).toBe(50);
    expect(bucketIntensity(50)).toBe(50);
    expect(bucketIntensity(62)).toBe(50);
  });
  it('maps 63-87 to 75', () => {
    expect(bucketIntensity(63)).toBe(75);
    expect(bucketIntensity(75)).toBe(75);
    expect(bucketIntensity(87)).toBe(75);
  });
  it('maps 88-100 to 100', () => {
    expect(bucketIntensity(88)).toBe(100);
    expect(bucketIntensity(100)).toBe(100);
  });
  it('clamps values above 100 to 100', () => {
    expect(bucketIntensity(150)).toBe(100);
  });
  it('clamps negative values to 0', () => {
    expect(bucketIntensity(-10)).toBe(0);
  });
});

describe('INTENSITY_TIERS', () => {
  it('has 5 tiers in ascending value order', () => {
    expect(INTENSITY_TIERS).toHaveLength(5);
    expect(INTENSITY_TIERS.map((t) => t.value)).toEqual([0, 25, 50, 75, 100]);
  });
  it('every tier has a non-empty label', () => {
    INTENSITY_TIERS.forEach((tier) => {
      expect(tier.label.length).toBeGreaterThan(0);
    });
  });
});

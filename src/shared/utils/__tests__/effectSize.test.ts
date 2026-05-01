import { describe, it, expect } from 'vitest';
import { EFFECT_SIZE_TIERS, bucketEffectSize } from '../effectSize';

describe('EFFECT_SIZE_TIERS', () => {
  it('has exactly 3 tiers', () => {
    expect(EFFECT_SIZE_TIERS.length).toBe(3);
  });

  it('has the correct tier values (70, 100, 140)', () => {
    const values = EFFECT_SIZE_TIERS.map((t) => t.value);
    expect(values).toEqual([70, 100, 140]);
  });

  it('has the correct tier labels (Small, Medium, Large)', () => {
    const labels = EFFECT_SIZE_TIERS.map((t) => t.label);
    expect(labels).toEqual(['Small', 'Medium', 'Large']);
  });

  it('all tier labels are non-empty strings', () => {
    EFFECT_SIZE_TIERS.forEach((tier) => {
      expect(tier.label.length).toBeGreaterThan(0);
    });
  });
});

describe('bucketEffectSize', () => {
  it('returns 100 (Medium) for undefined', () => {
    expect(bucketEffectSize(undefined)).toBe(100);
  });

  it('returns 70 (Small) for values at or below 84', () => {
    expect(bucketEffectSize(70)).toBe(70);
    expect(bucketEffectSize(84)).toBe(70);
    expect(bucketEffectSize(0)).toBe(70);
    expect(bucketEffectSize(50)).toBe(70);
  });

  it('returns 140 (Large) for values at or above 121', () => {
    expect(bucketEffectSize(140)).toBe(140);
    expect(bucketEffectSize(121)).toBe(140);
    expect(bucketEffectSize(200)).toBe(140);
  });

  it('returns 100 (Medium) for values between 85 and 120 inclusive', () => {
    expect(bucketEffectSize(100)).toBe(100);
    expect(bucketEffectSize(85)).toBe(100);
    expect(bucketEffectSize(120)).toBe(100);
    expect(bucketEffectSize(110)).toBe(100);
  });
});

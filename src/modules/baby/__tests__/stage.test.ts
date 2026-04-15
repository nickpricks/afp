import { describe, it, expect } from 'vitest';

import { computeStage, monthsOldFromDob, STAGE_BOUNDARIES } from '@/modules/baby/stage';
import { ChildStage } from '@/modules/baby/types';

describe('monthsOldFromDob', () => {
  it('returns 0 for today', () => {
    const today = new Date().toISOString().split('T')[0]!;
    expect(monthsOldFromDob(today)).toBe(0);
  });

  it('returns 12 for one year ago', () => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    expect(monthsOldFromDob(oneYearAgo.toISOString().split('T')[0]!)).toBe(12);
  });

  it('returns 36 for three years ago', () => {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    expect(monthsOldFromDob(threeYearsAgo.toISOString().split('T')[0]!)).toBe(36);
  });
});

describe('computeStage', () => {
  function dobMonthsAgo(months: number): string {
    const d = new Date();
    d.setMonth(d.getMonth() - months);
    return d.toISOString().split('T')[0]!;
  }

  it('returns Infant for newborn', () => {
    expect(computeStage(dobMonthsAgo(0))).toBe(ChildStage.Infant);
  });

  it('returns Infant just under toddler boundary', () => {
    expect(computeStage(dobMonthsAgo(STAGE_BOUNDARIES.toddler - 1))).toBe(ChildStage.Infant);
  });

  it('returns Toddler at toddler boundary', () => {
    expect(computeStage(dobMonthsAgo(STAGE_BOUNDARIES.toddler))).toBe(ChildStage.Toddler);
  });

  it('returns Toddler just under kid boundary', () => {
    expect(computeStage(dobMonthsAgo(STAGE_BOUNDARIES.kid - 1))).toBe(ChildStage.Toddler);
  });

  it('returns Kid at kid boundary', () => {
    expect(computeStage(dobMonthsAgo(STAGE_BOUNDARIES.kid))).toBe(ChildStage.Kid);
  });

  it('returns Kid for older child', () => {
    expect(computeStage(dobMonthsAgo(60))).toBe(ChildStage.Kid);
  });
});

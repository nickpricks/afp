import { describe, it, expect, vi, afterEach } from 'vitest';

import { computeAge } from '@/modules/baby/utils';

describe('computeAge', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Newborn" for a baby born today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-06'));
    expect(computeAge('2026-04-06')).toBe('Newborn');
  });

  it('returns "Newborn" for a baby born yesterday', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-06'));
    expect(computeAge('2026-04-05')).toBe('Newborn');
  });

  it('returns "1 month" for a baby born one month ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-06'));
    expect(computeAge('2026-03-06')).toBe('1 month');
  });

  it('returns "3 months" for a baby born three months ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-06'));
    expect(computeAge('2026-01-06')).toBe('3 months');
  });

  it('returns "1 year" for a baby born one year ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-06'));
    expect(computeAge('2025-04-06')).toBe('1 year');
  });

  it('returns "2 years" for a baby born two years ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-06'));
    expect(computeAge('2024-04-06')).toBe('2 years');
  });

  it('returns "11 months" for a baby born 11 months ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-06'));
    expect(computeAge('2025-05-06')).toBe('11 months');
  });

  it('returns "Unknown" for an invalid date', () => {
    expect(computeAge('not-a-date')).toBe('Unknown');
  });
});

import { describe, it, expect } from 'vitest';

import { JournalGrain } from '../journal/constants';
import { computeRange, formatRangeLabel } from '../journal/range';

describe('computeRange', () => {
  it('Day grain returns single-day range', () => {
    const r = computeRange(JournalGrain.Day, '2026-04-13');
    expect(r.start).toBe('2026-04-13');
    expect(r.end).toBe('2026-04-13');
    expect(r.grain).toBe(JournalGrain.Day);
  });

  it('Week grain on Monday returns Mon–Sun of that week', () => {
    // 2026-04-13 is a Monday
    const r = computeRange(JournalGrain.Week, '2026-04-13');
    expect(r.start).toBe('2026-04-13');
    expect(r.end).toBe('2026-04-19');
  });

  it('Week grain mid-week resolves to containing Mon–Sun', () => {
    // 2026-04-15 is a Wednesday — should still resolve to Apr 13–19
    const r = computeRange(JournalGrain.Week, '2026-04-15');
    expect(r.start).toBe('2026-04-13');
    expect(r.end).toBe('2026-04-19');
  });

  it('Week grain on Sunday resolves to previous Mon–Sun', () => {
    // 2026-04-19 is a Sunday — week spans Apr 13–19
    const r = computeRange(JournalGrain.Week, '2026-04-19');
    expect(r.start).toBe('2026-04-13');
    expect(r.end).toBe('2026-04-19');
  });

  it('Month grain returns first-to-last day of month', () => {
    const r = computeRange(JournalGrain.Month, '2026-04-13');
    expect(r.start).toBe('2026-04-01');
    expect(r.end).toBe('2026-04-30');
  });

  it('Month grain handles February leap year', () => {
    const r = computeRange(JournalGrain.Month, '2024-02-15');
    expect(r.start).toBe('2024-02-01');
    expect(r.end).toBe('2024-02-29');
  });
});

describe('formatRangeLabel', () => {
  it('Day formats as "Mon D, YYYY"', () => {
    expect(
      formatRangeLabel({ start: '2026-04-13', end: '2026-04-13', grain: JournalGrain.Day, label: '' }),
    ).toBe('Apr 13, 2026');
  });

  it('Week formats as "Mon D–D, YYYY" with en-dash', () => {
    expect(
      formatRangeLabel({ start: '2026-04-13', end: '2026-04-19', grain: JournalGrain.Week, label: '' }),
    ).toBe('Apr 13–19, 2026');
  });

  it('Month formats as "Month YYYY"', () => {
    expect(
      formatRangeLabel({ start: '2026-04-01', end: '2026-04-30', grain: JournalGrain.Month, label: '' }),
    ).toBe('April 2026');
  });
});

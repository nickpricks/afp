import { describe, expect, it, vi, afterEach } from 'vitest';

import { relativeDateLabel } from '../relative-date';

describe('relativeDateLabel', () => {
  it('returns "Today" for the reference date', () => {
    expect(relativeDateLabel('2026-04-29', '2026-04-29')).toEqual({
      relative: 'Today',
      structural: 'Wed 29 Apr',
      week: null,
    });
  });

  it('returns "Yesterday" for the previous day', () => {
    expect(relativeDateLabel('2026-04-28', '2026-04-29')).toEqual({
      relative: 'Yesterday',
      structural: 'Tue 28 Apr',
      week: null,
    });
  });

  it('returns null relative for older dates and includes week number', () => {
    const result = relativeDateLabel('2026-04-26', '2026-04-29');
    expect(result.relative).toBeNull();
    expect(result.structural).toBe('Sun 26 Apr');
    expect(result.week).toMatch(/Wk \d{1,2}/);
  });

  it('handles year boundary correctly', () => {
    const result = relativeDateLabel('2025-12-31', '2026-01-01');
    expect(result.relative).toBe('Yesterday');
  });
});

describe('relativeDateLabel — TZ correctness', () => {
  afterEach(() => vi.useRealTimers());

  it('returns the same calendar date regardless of host timezone', () => {
    // Bug: 'YYYY-MM-DD' parsed as UTC midnight; getDay/getDate use local TZ.
    // West-of-UTC users see one day earlier (e.g. Apr 4 appears as Apr 3).
    // After the fix, parsing '2026-04-04' always yields Saturday Apr 4.
    vi.setSystemTime(new Date('2026-04-15T12:00:00Z'));
    const out = relativeDateLabel('2026-04-04', '2026-04-15');
    // structural must say "Sat 4 Apr", never "Fri 3 Apr"
    expect(JSON.stringify(out)).toMatch(/Sat 4 Apr/);
    expect(JSON.stringify(out)).not.toMatch(/Fri 3 Apr/);
  });
});

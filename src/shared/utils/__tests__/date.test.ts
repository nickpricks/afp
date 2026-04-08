import { describe, it, expect, vi } from 'vitest';

import { getGreeting, formatDayDate } from '@/shared/utils/date';

describe('getGreeting', () => {
  it('returns Good morning for hour 8', () => {
    vi.setSystemTime(new Date(2026, 3, 7, 8, 0));
    expect(getGreeting()).toBe('Good morning');
    vi.useRealTimers();
  });

  it('returns Good afternoon for hour 14', () => {
    vi.setSystemTime(new Date(2026, 3, 7, 14, 0));
    expect(getGreeting()).toBe('Good afternoon');
    vi.useRealTimers();
  });

  it('returns Good evening for hour 19', () => {
    vi.setSystemTime(new Date(2026, 3, 7, 19, 0));
    expect(getGreeting()).toBe('Good evening');
    vi.useRealTimers();
  });
});

describe('formatDayDate', () => {
  it('formats date as weekday, month day', () => {
    expect(formatDayDate('2026-04-07')).toMatch(/Tuesday/);
    expect(formatDayDate('2026-04-07')).toMatch(/April/);
  });
});

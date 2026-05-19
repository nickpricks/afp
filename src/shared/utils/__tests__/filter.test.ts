import { describe, expect, it, vi, afterEach } from 'vitest';

import { filterByDateRange } from '../filter';
import { TimeRange } from '@/shared/types';

describe('filterByDateRange', () => {
  const today = '2026-04-15';
  const items = [
    { id: 'a', date: '2026-04-15' }, // today
    { id: 'b', date: '2026-04-12' }, // 3 days ago (in week)
    { id: 'c', date: '2026-04-08' }, // 7 days ago (just outside week)
    { id: 'd', date: '2026-03-20' }, // 26 days ago (in month)
    { id: 'e', date: '2026-03-15' }, // 31 days ago (just outside month)
  ];

  it('returns only today when range is Today', () => {
    const result = filterByDateRange(items, TimeRange.Today, today, (i) => i.date);
    expect(result.map((i) => i.id)).toEqual(['a']);
  });

  it('returns last 7 days when range is Week', () => {
    const result = filterByDateRange(items, TimeRange.Week, today, (i) => i.date);
    expect(result.map((i) => i.id)).toEqual(['a', 'b']);
  });

  it('returns last 30 days when range is Month', () => {
    const result = filterByDateRange(items, TimeRange.Month, today, (i) => i.date);
    expect(result.map((i) => i.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('returns all items when range is All', () => {
    const result = filterByDateRange(items, TimeRange.All, today, (i) => i.date);
    expect(result).toHaveLength(5);
  });

  it('accepts a custom extractor for non-date-keyed items', () => {
    const isoItems = [
      { id: 'x', createdAt: '2026-04-15T10:00:00.000Z' },
      { id: 'y', createdAt: '2026-04-01T10:00:00.000Z' },
    ];
    const result = filterByDateRange(isoItems, TimeRange.Week, today, (i) =>
      i.createdAt.slice(0, 10),
    );
    expect(result.map((i) => i.id)).toEqual(['x']);
  });
});

describe('filterByDateRange — bad date input', () => {
  afterEach(() => vi.restoreAllMocks());

  it('drops items with invalid date strings and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const items = [
      { id: 'a', date: '2026-04-15' },
      { id: 'b', date: 'not-a-date' },
    ];
    const result = filterByDateRange(items, TimeRange.Week, '2026-04-15', (i) => i.date);
    expect(result.length).toBe(1);
    expect(result[0]!.id).toBe('a');
    expect(warn).toHaveBeenCalled();
  });
});

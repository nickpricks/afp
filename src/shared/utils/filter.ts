import { TimeRange } from '@/shared/types';
import { parseLocalDate } from '@/shared/utils/relative-date';

/**
 * Filters items by a time range relative to a reference date (today).
 * The extractor returns a YYYY-MM-DD date string for each item.
 * Range semantics are rolling: Week = last 7 days incl. today, Month = last 30 days.
 * Malformed today returns items unfiltered (with a console.warn).
 */
export const filterByDateRange = <T>(
  items: T[],
  range: TimeRange,
  today: string,
  getDate: (item: T) => string,
): T[] => {
  if (range === TimeRange.All) return items;

  const todayMs = parseLocalDate(today).getTime();
  if (!Number.isFinite(todayMs)) {
    console.warn('filterByDateRange: invalid today string', today);
    return items;
  }
  const daysMap = { [TimeRange.Today]: 0, [TimeRange.Week]: 6, [TimeRange.Month]: 29 };
  const days = daysMap[range];
  const cutoffMs = todayMs - days * 86_400_000;

  return items.filter((item) => {
    const itemMs = parseLocalDate(getDate(item)).getTime();
    if (!Number.isFinite(itemMs)) {
      console.warn('filterByDateRange: invalid date string', getDate(item));
      return false;
    }
    return itemMs >= cutoffMs && itemMs <= todayMs;
  });
};

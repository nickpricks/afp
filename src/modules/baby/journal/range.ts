import { JournalGrain } from './constants';
import type { JournalRange } from './types';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function strToDate(s: string): Date {
  const parts = s.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  return new Date(y, m - 1, d);
}

/** Returns Monday of the week containing the given date */
function startOfWeek(d: Date): Date {
  const result = new Date(d);
  const day = result.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  result.setDate(result.getDate() + diff);
  return result;
}

/** Returns last day of the month containing the given date */
function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const SHORT_MONTHS = MONTHS.map((m) => m.slice(0, 3));

/** Pure — human-readable label for a range */
export function formatRangeLabel(r: JournalRange): string {
  const startD = strToDate(r.start);
  const endD = strToDate(r.end);
  switch (r.grain) {
    case JournalGrain.Day:
      return `${SHORT_MONTHS[startD.getMonth()]} ${startD.getDate()}, ${startD.getFullYear()}`;
    case JournalGrain.Week:
      return `${SHORT_MONTHS[startD.getMonth()]} ${startD.getDate()}\u2013${endD.getDate()}, ${endD.getFullYear()}`;
    case JournalGrain.Month:
      return `${MONTHS[startD.getMonth()]} ${startD.getFullYear()}`;
  }
}

/** Pure — returns the range for a given grain anchored on a date */
export function computeRange(grain: JournalGrain, anchorDate: string): JournalRange {
  const anchor = strToDate(anchorDate);
  let start: Date;
  let end: Date;
  switch (grain) {
    case JournalGrain.Day:
      start = anchor;
      end = anchor;
      break;
    case JournalGrain.Week:
      start = startOfWeek(anchor);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      break;
    case JournalGrain.Month:
      start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      end = endOfMonth(anchor);
      break;
  }
  const range: JournalRange = {
    start: dateToStr(start),
    end: dateToStr(end),
    grain,
    label: '',
  };
  range.label = formatRangeLabel(range);
  return range;
}

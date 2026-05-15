/** Short weekday names, Sunday-indexed, matching `Date.getDay()`. */
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Short month names, January-indexed, matching `Date.getMonth()`. */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Decomposed date label with a relative tag, a structural display string, and an optional ISO week. */
export interface DateLabel {
  relative: 'Today' | 'Yesterday' | null;
  structural: string;
  week: string | null;
}

/** Parses 'YYYY-MM-DD' as local midday (avoids UTC-vs-local-TZ off-by-one). */
function parseLocalDate(s: string): Date {
  return new Date(s.length === 10 ? s + 'T12:00:00' : s);
}

/** Computes the ISO 8601 week number (1-53) for a given Date. */
const isoWeekNumber = (date: Date): number => {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = target.getTime() - firstThursday.getTime();
  return 1 + Math.round(diff / (7 * 86_400_000));
};

/** Formats a YYYY-MM-DD as a date label with relative + structural parts */
export const relativeDateLabel = (date: string, today: string): DateLabel => {
  const d = parseLocalDate(date);
  const t = parseLocalDate(today);
  const dayDiff = Math.round((t.getTime() - d.getTime()) / 86_400_000);

  const structural = `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;

  if (dayDiff === 0) return { relative: 'Today', structural, week: null };
  if (dayDiff === 1) return { relative: 'Yesterday', structural, week: null };

  return { relative: null, structural, week: `Wk ${isoWeekNumber(d)}` };
};

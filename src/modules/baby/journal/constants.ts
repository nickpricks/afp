/** Cumulative thresholds — when crossed within a journal period, surface as a counting moment */
export const COUNTING_THRESHOLDS = {
  diapers: [100, 250, 500, 1000, 2500, 5000],
  feeds: [100, 500, 1000, 2500, 5000],
  meals: [50, 100, 250, 500, 1000],
  sleepHours: [100, 250, 500, 1000, 2500],
  milestones: [10, 25, 50, 100],
} as const;

/** Time-scale of a journal view */
export enum JournalGrain {
  Day = 0,
  Week = 1,
  Month = 2,
}

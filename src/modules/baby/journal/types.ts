import { JournalGrain } from './constants';

/** Inclusive date range — both YYYY-MM-DD strings */
export type JournalRange = {
  start: string;
  end: string;
  grain: JournalGrain;
  /** Display label like "Apr 13, 2026", "Apr 13–19, 2026", "April 2026" */
  label: string;
};

/** Data type that can cross a counting threshold */
export type CountingDataType = 'diapers' | 'feeds' | 'meals' | 'sleepHours' | 'milestones';

/** A counting threshold crossed within a period */
export type CountingMoment = {
  dataType: CountingDataType;
  threshold: number;
};

/** Latest growth measurement snapshot for a period */
export type JournalGrowthLatest = {
  date: string;
  weight?: number;
  height?: number;
  headCircumference?: number;
};

/** Milestone rendered in a journal period */
export type JournalMilestone = {
  id: string;
  date: string;
  title: string;
  category: number;
};

/** Aggregated data for one journal period */
export type JournalSummary = {
  range: JournalRange;
  feedCount: number;
  mealCount: number;
  sleepEntries: number;
  sleepHours: number;
  diaperCount: number;
  pottyCount: number;
  growthLatest: JournalGrowthLatest | null;
  milestonesInRange: JournalMilestone[];
  needsAdded: number;
  needsAcquired: number;
  needsOutgrown: number;
  countingMoments: CountingMoment[];
};

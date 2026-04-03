import type { DIAPER_TYPES, FEED_TYPES, SLEEP_QUALITIES, SLEEP_TYPES } from './constants';

/** Feed tracking entry — bottle, breast, or solid food */
export type FeedEntry = {
  id: string;
  date: string;
  time: string;
  type: (typeof FEED_TYPES)[number];
  quantity: number;
  notes: string;
  duration: number;
};

/** Sleep tracking entry — nap or night sleep */
export type SleepEntry = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  type: (typeof SLEEP_TYPES)[number];
  quality: (typeof SLEEP_QUALITIES)[number] | '';
  notes: string;
};

/** Growth measurement entry — weight, height, head circumference */
export type GrowthEntry = {
  id: string;
  date: string;
  weight: number;
  height: number;
  headCircumference: number;
  notes: string;
};

/** Diaper change entry — wet, dirty, or mixed */
export type DiaperEntry = {
  id: string;
  date: string;
  time: string;
  type: (typeof DIAPER_TYPES)[number];
  notes: string;
};

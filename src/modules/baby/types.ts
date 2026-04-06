// ─── Baby Enums ─────────────────────────────────────────────────────────────

/** Feed type categories */
export enum FeedType {
  Bottle = 0,
  BreastLeft = 1,
  BreastRight = 2,
  BreastBoth = 3,
  SolidFood = 4,
}

/** Sleep type categories */
export enum SleepType {
  Nap = 0,
  Night = 1,
}

/** Sleep quality ratings */
export enum SleepQuality {
  Good = 0,
  Fair = 1,
  Poor = 2,
}

/** Diaper change type categories */
export enum DiaperType {
  Wet = 0,
  Dirty = 1,
  Mixed = 2,
}

// ─── Child Types ────────────────────────────────────────────────────────────

/** Per-child module toggles controlling which tracking tabs are visible */
export type ChildConfig = {
  feeding: boolean;
  sleep: boolean;
  growth: boolean;
  diapers: boolean;
};

/** A child profile in the children collection */
export type Child = {
  id?: string;
  name: string;
  dob: string;
  config: ChildConfig;
  createdAt: string;
  updatedAt: string;
};

// ─── Entry Types ────────────────────────────────────────────────────────────

/** Feed tracking entry — bottle, breast, or solid food */
export type FeedEntry = {
  id: string;
  date: string;
  time: string;
  type: FeedType;
  amount: number | null;
  timestamp: string;
  createdAt: string;
  notes: string;
};

/** Sleep tracking entry — nap or night sleep */
export type SleepEntry = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  type: SleepType;
  quality: SleepQuality | null;
  timestamp: string;
  createdAt: string;
  notes: string;
};

/** Growth measurement entry — weight, height, head circumference */
export type GrowthEntry = {
  id: string;
  date: string;
  weight: number | null;
  height: number | null;
  headCircumference: number | null;
  createdAt: string;
  notes: string;
};

/** Diaper change entry — wet, dirty, or mixed */
export type DiaperEntry = {
  id: string;
  date: string;
  time: string;
  type: DiaperType;
  timestamp: string;
  createdAt: string;
  notes: string;
};

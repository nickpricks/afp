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

/** Combined elimination tracking — diaper events (infant) or potty events (toddler+) */
export enum EliminationMode {
  Diaper = 0,
  Potty = 1,
}

/** Potty training event — captures both successes (on potty) and accidents (off potty) */
export enum PottyTrainingEvent {
  Pee = 0,
  Poop = 1,
  Both = 2,
  Accident = 3,
  Attempt = 4,
}

/** Meal type categories */
export enum MealType {
  Breakfast = 0,
  Lunch = 1,
  Dinner = 2,
  Snack = 3,
}

/** Portion eaten — qualitative scale (0=refused, 6=seconds) */
export enum MealPortion {
  None = 0,    // 0% — refused
  Bite = 1,    // ~10% — took a single bite/taste
  Little = 2,  // ~25% — took a little
  Some = 3,    // ~50% — about half
  Most = 4,    // ~75%
  All = 5,     // 100%
  Extra = 6,   // >100% — seconds
}

/** Need category */
export enum NeedCategory {
  Apparel = 0,
  Footwear = 1,
  School = 2,
  Toys = 3,
  Books = 4,
  Other = 5,
}

/** Need lifecycle status */
export enum NeedStatus {
  Wishlist = 0,
  Inventory = 1,
  Outgrown = 2,
}

/** Milestone category — developmental/life event grouping */
export enum MilestoneCategory {
  Motor = 0,
  Language = 1,
  Social = 2,
  Cognitive = 3,
  Hobby = 4,
  Other = 5,
}

/** Child age stage — derived from DoB, never persisted */
export enum ChildStage {
  Infant = 0,
  Toddler = 1,
  Kid = 2,
}

// ─── Child Types ────────────────────────────────────────────────────────────

/** Per-child module toggles controlling which tracking tabs are visible */
export type ChildConfig = {
  feeding: boolean;      // existing — Feed module
  sleep: boolean;        // existing
  growth: boolean;       // existing
  diapers: boolean;      // existing — Diaper mode of elimination subcollection
  meals?: boolean;       // NEW — Meals module (optional for back-compat with old docs)
  potty?: boolean;       // NEW — Potty mode of elimination subcollection
  milestones?: boolean;  // NEW — Milestones module (Plan 6)
  needs?: boolean;       // NEW — Needs module
};

/** A child profile in the children collection */
export type Child = {
  id?: string;
  name: string;
  dob: string;
  config: ChildConfig;
  createdAt: string;
  updatedAt: string;
  suggestionState?: {
    feeds?: SuggestionSnooze;
    diapers?: SuggestionSnooze;
    meals?: SuggestionSnooze;
    potty?: SuggestionSnooze;
  };
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

/** Combined elimination entry — discriminated by mode */
export type EliminationEntry = {
  id: string;
  date: string;
  time: string;
  mode: EliminationMode;
  diaperType?: DiaperType;
  pottyEvent?: PottyTrainingEvent;
  timestamp: string;
  createdAt: string;
  notes: string;
};

/** Meal/food entry */
export type MealEntry = {
  id: string;
  date: string;
  time: string;
  type: MealType;
  description: string;
  portion: MealPortion | null;
  timestamp: string;
  createdAt: string;
  notes: string;
};

/** Need entry — wishlist/inventory/outgrown */
export type NeedEntry = {
  id: string;
  date: string;
  title: string;
  category: NeedCategory;
  status: NeedStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

/** Milestone entry — developmental firsts, recurring achievements, custom events */
export type Milestone = {
  id: string;
  date: string;
  category: MilestoneCategory;
  title: string;
  description?: string;
  mediaUrl?: string;
  timestamp: string;
  createdAt: string;
  notes: string;
};

/** Snooze state for one suggestion feature */
export type SuggestionSnooze = {
  /** ISO date YYYY-MM-DD */
  snoozedUntil: string;
};

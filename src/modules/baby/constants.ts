import {
  FeedType,
  SleepType,
  SleepQuality,
  DiaperType,
  PottyTrainingEvent,
  MealType,
  MealPortion,
  NeedCategory,
  NeedStatus,
  MilestoneCategory,
} from '@/modules/baby/types';

/** Display labels for feed types, keyed by enum value */
export const FEED_TYPE_LABELS: Record<FeedType, string> = {
  [FeedType.Bottle]: 'Bottle',
  [FeedType.BreastLeft]: 'Breast (Left)',
  [FeedType.BreastRight]: 'Breast (Right)',
  [FeedType.BreastBoth]: 'Breast (Both)',
  [FeedType.SolidFood]: 'Solid Food',
};

/** All feed type enum values in display order */
export const ALL_FEED_TYPES: readonly FeedType[] = [
  FeedType.Bottle,
  FeedType.BreastLeft,
  FeedType.BreastRight,
  FeedType.BreastBoth,
  FeedType.SolidFood,
];

/** Display labels for sleep types, keyed by enum value */
export const SLEEP_TYPE_LABELS: Record<SleepType, string> = {
  [SleepType.Nap]: 'Nap',
  [SleepType.Night]: 'Night',
};

/** All sleep type enum values in display order */
export const ALL_SLEEP_TYPES: readonly SleepType[] = [SleepType.Nap, SleepType.Night];

/** Display labels for sleep quality ratings, keyed by enum value */
export const SLEEP_QUALITY_LABELS: Record<SleepQuality, string> = {
  [SleepQuality.Good]: 'Good',
  [SleepQuality.Fair]: 'Fair',
  [SleepQuality.Poor]: 'Poor',
};

/** All sleep quality enum values in display order */
export const ALL_SLEEP_QUALITIES: readonly SleepQuality[] = [
  SleepQuality.Good,
  SleepQuality.Fair,
  SleepQuality.Poor,
];

/** Display labels for diaper types, keyed by enum value */
export const DIAPER_TYPE_LABELS: Record<DiaperType, string> = {
  [DiaperType.Wet]: 'Wet',
  [DiaperType.Dirty]: 'Dirty',
  [DiaperType.Mixed]: 'Mixed',
};

/** All diaper type enum values in display order */
export const ALL_DIAPER_TYPES: readonly DiaperType[] = [
  DiaperType.Wet,
  DiaperType.Dirty,
  DiaperType.Mixed,
];

/** Display labels for potty training events, keyed by enum value */
export const POTTY_EVENT_LABELS: Record<PottyTrainingEvent, string> = {
  [PottyTrainingEvent.Pee]: 'Pee',
  [PottyTrainingEvent.Poop]: 'Poop',
  [PottyTrainingEvent.Both]: 'Both',
  [PottyTrainingEvent.Accident]: 'Accident',
  [PottyTrainingEvent.Attempt]: 'Attempt',
};

/** All potty training event enum values in display order */
export const ALL_POTTY_EVENTS: readonly PottyTrainingEvent[] = [
  PottyTrainingEvent.Pee,
  PottyTrainingEvent.Poop,
  PottyTrainingEvent.Both,
  PottyTrainingEvent.Accident,
  PottyTrainingEvent.Attempt,
];

/** Display labels for meal types, keyed by enum value */
export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  [MealType.Breakfast]: 'Breakfast',
  [MealType.Lunch]: 'Lunch',
  [MealType.Dinner]: 'Dinner',
  [MealType.Snack]: 'Snack',
};

/** All meal type enum values in display order */
export const ALL_MEAL_TYPES: readonly MealType[] = [
  MealType.Breakfast,
  MealType.Lunch,
  MealType.Dinner,
  MealType.Snack,
];

/** Display labels for meal portion sizes, keyed by enum value */
export const MEAL_PORTION_LABELS: Record<MealPortion, string> = {
  [MealPortion.None]: 'None — refused',
  [MealPortion.Bite]: 'Bite (~10%)',
  [MealPortion.Little]: 'Little (~25%)',
  [MealPortion.Some]: 'Some (~50%)',
  [MealPortion.Most]: 'Most (~75%)',
  [MealPortion.All]: 'All (100%)',
  [MealPortion.Extra]: 'Extra (seconds)',
};

/** All meal portion enum values in display order */
export const ALL_MEAL_PORTIONS: readonly MealPortion[] = [
  MealPortion.None,
  MealPortion.Bite,
  MealPortion.Little,
  MealPortion.Some,
  MealPortion.Most,
  MealPortion.All,
  MealPortion.Extra,
];

/** Display labels for need categories, keyed by enum value */
export const NEED_CATEGORY_LABELS: Record<NeedCategory, string> = {
  [NeedCategory.Apparel]: 'Apparel',
  [NeedCategory.Footwear]: 'Footwear',
  [NeedCategory.School]: 'School',
  [NeedCategory.Toys]: 'Toys',
  [NeedCategory.Books]: 'Books',
  [NeedCategory.Other]: 'Other',
};

/** All need category enum values in display order */
export const ALL_NEED_CATEGORIES: readonly NeedCategory[] = [
  NeedCategory.Apparel,
  NeedCategory.Footwear,
  NeedCategory.School,
  NeedCategory.Toys,
  NeedCategory.Books,
  NeedCategory.Other,
];

/** Display labels for need lifecycle status, keyed by enum value */
export const NEED_STATUS_LABELS: Record<NeedStatus, string> = {
  [NeedStatus.Wishlist]: 'Wishlist',
  [NeedStatus.Inventory]: 'Have',
  [NeedStatus.Outgrown]: 'Outgrown',
};

/** All need status enum values in display order (lifecycle order) */
export const ALL_NEED_STATUSES: readonly NeedStatus[] = [
  NeedStatus.Wishlist,
  NeedStatus.Inventory,
  NeedStatus.Outgrown,
];

/** Display labels for milestone categories, keyed by enum value */
export const MILESTONE_CATEGORY_LABELS: Record<MilestoneCategory, string> = {
  [MilestoneCategory.Motor]: 'Motor',
  [MilestoneCategory.Language]: 'Language',
  [MilestoneCategory.Social]: 'Social',
  [MilestoneCategory.Cognitive]: 'Cognitive',
  [MilestoneCategory.Hobby]: 'Hobby',
  [MilestoneCategory.Other]: 'Other',
};

/** All milestone category enum values in display order */
export const ALL_MILESTONE_CATEGORIES: readonly MilestoneCategory[] = [
  MilestoneCategory.Motor,
  MilestoneCategory.Language,
  MilestoneCategory.Social,
  MilestoneCategory.Cognitive,
  MilestoneCategory.Hobby,
  MilestoneCategory.Other,
];

/** Default child config with all tracking modules enabled */
export const DEFAULT_CHILD_CONFIG = {
  feeding: true,
  sleep: true,
  growth: true,
  diapers: true,
} as const;

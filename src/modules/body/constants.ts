import { ActivityType } from '@/shared/types';

/** Default physical constants for distance-to-step approximation */
export const BODY_DEFAULTS = {
  /** Height of one floor in meters */
  FLOOR_HEIGHT_M: 3,
  /** Average walking stride length in meters */
  WALK_STRIDE_M: 0.75,
  /** Average running stride length in meters */
  RUN_STRIDE_M: 1.0,
} as const;

/** Scoring weights per activity type */
export const SCORING_WEIGHTS = {
  /** Points per floor up */
  FLOOR_UP: 1,
  /** Points per floor down */
  FLOOR_DOWN: 0.5,
  /** Points per 100 meters walked */
  WALK_PER_100M: 0.5,
  /** Points per 100 meters run */
  RUN_PER_100M: 1,
} as const;

/** Display labels for activity types */
export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  [ActivityType.Walk]: 'Walk',
  [ActivityType.Run]: 'Run',
  [ActivityType.Cycle]: 'Cycle',
  [ActivityType.Yoga]: 'Yoga',
};

/** Floor height options for config */
export const FLOOR_HEIGHT_OPTIONS = [2.5, 3.0, 3.5] as const;

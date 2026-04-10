import type { ActivityType } from '@/shared/types';

/** Per-activity toggle configuration for the body module */
export type BodyConfig = {
  floors: boolean;
  walking: boolean;
  running: boolean;
  cycling: boolean;
  yoga: boolean;
  floorHeight: number;
  dailyGoal: number;
  configuredAt: string;
};

/** Default body config with floors and walking enabled */
export const DEFAULT_BODY_CONFIG: BodyConfig = {
  floors: true,
  walking: true,
  running: false,
  cycling: false,
  yoga: false,
  floorHeight: 3.0,
  dailyGoal: 50,
  configuredAt: '',
};

/** Daily body tracking record — floors aggregate + summary of activities */
export type BodyRecord = {
  dateStr: string;
  up: number;
  down: number;
  walkMeters: number;
  runMeters: number;
  total: number;
  updatedAt: string;
};

/** Individual activity entry stored in body_activities subcollection */
export type BodyActivity = {
  id?: string;
  type: ActivityType;
  distance: number | null;
  duration: number | null;
  date: string;
  timestamp: string;
  createdAt: string;
};

/** Activity types for body tracking */
export enum ActivityType {
  Walk = 'walk',
  Run = 'run',
}

/** All available activity types */
export const ALL_ACTIVITY_TYPES: readonly ActivityType[] = [ActivityType.Walk, ActivityType.Run];

/** Daily body tracking record — floors aggregate + summary of activities */
export type BodyRecord = {
  id: string;
  dateStr: string;
  floors: { up: number; down: number };
  walkMeters: number;
  runMeters: number;
  total: number;
};

/** Individual activity entry stored in body_activities subcollection */
export type ActivityEntry = {
  id: string;
  type: ActivityType;
  distanceMeters: number;
  dateStr: string;
  createdAt: string;
};

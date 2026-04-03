/** Daily body tracking record — extensible for future sub-trackers */
export type BodyRecord = {
  id: string;
  dateStr: string;
  floors: { up: number; down: number };
  steps: number | null;
  running: number | null;
  exercise: number | null;
  total: number;
};

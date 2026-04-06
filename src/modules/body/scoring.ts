import { SCORING_WEIGHTS } from '@/modules/body/constants';
import type { BodyRecord } from '@/modules/body/types';

/** Computes the composite body score from floors and activity distances */
export function computeBodyScore(record: Pick<BodyRecord, 'up' | 'down' | 'walkMeters' | 'runMeters'>): number {
  const floorScore =
    record.up * SCORING_WEIGHTS.FLOOR_UP +
    record.down * SCORING_WEIGHTS.FLOOR_DOWN;
  const walkScore = (record.walkMeters / 100) * SCORING_WEIGHTS.WALK_PER_100M;
  const runScore = (record.runMeters / 100) * SCORING_WEIGHTS.RUN_PER_100M;

  return Math.round((floorScore + walkScore + runScore) * 10) / 10;
}

/** Approximates step count from distance in meters using stride length */
export function computeSteps(distanceMeters: number, strideMeters: number): number {
  if (strideMeters <= 0) return 0;
  return Math.round(distanceMeters / strideMeters);
}

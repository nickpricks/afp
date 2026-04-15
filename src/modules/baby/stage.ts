import { ChildStage } from '@/modules/baby/types';

/** Stage label cutoffs in months — derived narrative only, not enforcement */
export const STAGE_BOUNDARIES = {
  toddler: 12,
  kid: 36,
} as const;

/** Per-feature suggestion thresholds in months (see spec § 2) */
export const SUGGEST_THRESHOLDS = {
  feeds: { suggestOff: 18 },
  diapers: { suggestOff: 30 },
  meals: { suggestOn: 9 },
  potty: { suggestOn: 24 },
} as const;

/** Days a snoozed suggestion stays hidden before re-surfacing */
export const SUGGESTION_SNOOZE_DAYS = 30;

/** Returns whole months between dob and today */
export function monthsOldFromDob(dob: string): number {
  const dobDate = new Date(dob);
  const today = new Date();
  let months = (today.getFullYear() - dobDate.getFullYear()) * 12;
  months += today.getMonth() - dobDate.getMonth();
  if (today.getDate() < dobDate.getDate()) months -= 1;
  return Math.max(0, months);
}

/** Returns derived stage from DoB. Pure function — never persisted. */
export function computeStage(dob: string): ChildStage {
  const months = monthsOldFromDob(dob);
  if (months < STAGE_BOUNDARIES.toddler) return ChildStage.Infant;
  if (months < STAGE_BOUNDARIES.kid) return ChildStage.Toddler;
  return ChildStage.Kid;
}

/** A single intensity tier — discrete value mapped to a user-facing label. */
export interface IntensityTier {
  value: number;
  label: string;
}

/**
 * The 5 intensity tiers backing `<IntensityTierPicker>` and `bucketIntensity()`.
 *
 * TODO(nick): Final wording is your call. Proposal: Off · Subtle · Standard · Lively · Maximum.
 * Could also be theme-flavored (Off · Whisper · Hum · Pulse · Roar) — see spec learning-mode slot.
 */
export const INTENSITY_TIERS: readonly IntensityTier[] = [
  { value: 0, label: 'Off' },
  { value: 25, label: 'Subtle' },
  { value: 50, label: 'Standard' },
  { value: 75, label: 'Lively' },
  { value: 100, label: 'Maximum' },
] as const;

/**
 * Maps any intensity value to the nearest tier.
 * `0 → 0`, `1-37 → 25`, `38-62 → 50`, `63-87 → 75`, `88+ → 100`.
 * Negative values clamp to `0`; values above `100` clamp to `100`.
 */
export const bucketIntensity = (value: number): number => {
  if (value <= 0) return 0;
  if (value >= 88) return 100;
  if (value >= 63) return 75;
  if (value >= 38) return 50;
  return 25;
};

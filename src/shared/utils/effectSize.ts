/** Particle size tier — discrete multiplier mapped to a user-facing label. */
export interface EffectSizeTier {
  value: number; // multiplier as percentage (e.g. 70 = 0.70x)
  label: string;
}

/**
 * The 3 size tiers for ambient particles. Multipliers compound with the viewport-aware
 * size base in AmbientEffects. Default is `Medium` (100, no multiplier change).
 */
export const EFFECT_SIZE_TIERS: readonly EffectSizeTier[] = [
  { value: 70, label: 'Small' },
  { value: 100, label: 'Medium' },
  { value: 140, label: 'Large' },
] as const;

/** Maps any size value to the nearest tier value. Defaults to 100 (Medium) if unrecognized. */
export const bucketEffectSize = (value: number | undefined): number => {
  if (value === undefined) return 100;
  if (value <= 84) return 70;
  if (value >= 121) return 140;
  return 100;
};

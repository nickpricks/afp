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

const [SMALL_TIER, MEDIUM_TIER, LARGE_TIER] = EFFECT_SIZE_TIERS.map((t) => t.value) as [
  number,
  number,
  number,
];

/** Default tier value used wherever an effectSize is missing (legacy profiles, fallbacks). */
export const EFFECT_SIZE_DEFAULT = MEDIUM_TIER;

// Bucket bounds derived from tier midpoints. floor/ceil asymmetry biases each boundary
// toward the narrower tier when tier values change — Medium keeps the wider band. For the
// current values these resolve to 85 and 120, preserving existing test contract:
//   value < 85  → Small (so 84 → Small, 85 → Medium)
//   value > 120 → Large (so 120 → Medium, 121 → Large)
const SMALL_MAX = Math.floor((SMALL_TIER + MEDIUM_TIER) / 2);
const LARGE_MIN = Math.ceil((MEDIUM_TIER + LARGE_TIER) / 2);

/** Maps any size value to the nearest tier value. Defaults to Medium if unrecognized. */
export const bucketEffectSize = (value: number | undefined): number => {
  if (value === undefined) return MEDIUM_TIER;
  if (value < SMALL_MAX) return SMALL_TIER;
  if (value > LARGE_MIN) return LARGE_TIER;
  return MEDIUM_TIER;
};

import { EFFECT_SIZE_TIERS, bucketEffectSize } from '@/shared/utils/effectSize';

interface SizeTierPickerProps {
  value: number;
  onChange: (value: number) => void;
}

/**
 * Three-button tier row for `effectSize`. Atomic clicks (no drag),
 * matches AFP's pill-row pattern (time-range, payment methods, intensity tier).
 * Legacy values bucket to the nearest tier for active-state display.
 */
export function SizeTierPicker({ value, onChange }: SizeTierPickerProps) {
  const activeValue = bucketEffectSize(value);
  return (
    <div className="flex gap-2" data-testid="size-tier-picker">
      {EFFECT_SIZE_TIERS.map((tier) => {
        const isActive = tier.value === activeValue;
        return (
          <button
            key={tier.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => {
              if (!isActive) onChange(tier.value);
            }}
            className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition ${
              isActive
                ? 'border-accent bg-accent text-fg-on-accent'
                : 'border-line text-fg-muted hover:border-accent/50'
            }`}
          >
            {tier.label}
          </button>
        );
      })}
    </div>
  );
}

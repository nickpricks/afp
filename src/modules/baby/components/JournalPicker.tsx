import { JournalGrain } from '../journal/constants';
import { computeRange } from '../journal/range';
import type { JournalRange } from '../journal/types';

type Props = {
  range: JournalRange;
  onChange: (next: JournalRange) => void;
};

const GRAIN_OPTIONS: { label: string; value: JournalGrain }[] = [
  { label: 'Day', value: JournalGrain.Day },
  { label: 'Week', value: JournalGrain.Week },
  { label: 'Month', value: JournalGrain.Month },
];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Grain selector (Day/Week/Month) + previous/next period stepper */
export function JournalPicker({ range, onChange }: Props) {
  function setGrain(grain: JournalGrain) {
    onChange(computeRange(grain, range.start));
  }

  function step(direction: -1 | 1) {
    const [y, m, d] = range.start.split('-').map(Number);
    const anchor = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
    if (range.grain === JournalGrain.Day) {
      anchor.setDate(anchor.getDate() + direction);
    } else if (range.grain === JournalGrain.Week) {
      anchor.setDate(anchor.getDate() + 7 * direction);
    } else {
      anchor.setMonth(anchor.getMonth() + direction);
    }
    const nextDate = `${anchor.getFullYear()}-${pad(anchor.getMonth() + 1)}-${pad(anchor.getDate())}`;
    onChange(computeRange(range.grain, nextDate));
  }

  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <div className="flex gap-1">
        {GRAIN_OPTIONS.map((g) => (
          <button
            key={g.label}
            type="button"
            onClick={() => setGrain(g.value)}
            className={`rounded px-3 py-1 text-sm ${
              range.grain === g.value
                ? 'bg-accent text-fg-on-accent'
                : 'border border-line text-fg-muted'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="previous period"
          className="text-fg-muted hover:text-fg"
        >
          &lsaquo;
        </button>
        <span className="text-fg">{range.label}</span>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="next period"
          className="text-fg-muted hover:text-fg"
        >
          &rsaquo;
        </button>
      </div>
    </div>
  );
}

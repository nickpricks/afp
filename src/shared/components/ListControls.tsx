import { ChangeEvent, FocusEvent, useState } from 'react';

import { TimeRange } from '@/shared/types';
import { CONFIG } from '@/constants/config';

/** Available time-range filter options for list controls. */
const TIME_RANGES: { id: TimeRange; label: string }[] = [
  { id: TimeRange.Today, label: 'Today' },
  { id: TimeRange.Week, label: 'Week' },
  { id: TimeRange.Month, label: 'Month' },
  { id: TimeRange.All, label: 'All' },
];


/** Props for ListControls. */
interface Props {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/** Universal list controls: time-range pills + page-size dropdown + page jumper */
export function ListControls(props: Props) {
  const {
    timeRange,
    onTimeRangeChange,
    pageSize,
    onPageSizeChange,
    page,
    totalPages,
    onPageChange,
  } = props;
  const [jumpValue, setJumpValue] = useState<string>('');

  const handleJumpBlur = (e: FocusEvent<HTMLInputElement>) => {
    const raw = parseInt(e.target.value, 10);
    if (Number.isNaN(raw)) {
      setJumpValue('');
      return;
    }
    const clamped = Math.max(1, Math.min(totalPages, raw));
    onPageChange(clamped);
    setJumpValue('');
  };

  return (
    <div className="mx-4 mb-3 space-y-2">
      <div className="flex gap-1 rounded-lg border border-line bg-surface-card p-1">
        {TIME_RANGES.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onTimeRangeChange(opt.id)}
            className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              timeRange === opt.id ? 'bg-accent text-fg-on-accent' : 'text-fg-muted hover:text-fg'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2 text-xs">
          <label className="text-fg-muted">
            <select
              value={pageSize}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                onPageSizeChange(parseInt(e.target.value, 10))
              }
              className="rounded border border-line bg-surface-card px-1 py-0.5 text-fg"
            >
              {CONFIG.LIST_PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>{' '}
            per page
          </label>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous page"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="rounded border border-line px-2 py-0.5 text-fg disabled:opacity-30"
            >
              ‹
            </button>
            <span className="px-1 text-fg">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              aria-label="Next page"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="rounded border border-line px-2 py-0.5 text-fg disabled:opacity-30"
            >
              ›
            </button>
            <input
              type="number"
              aria-label="Go to page"
              placeholder="Go to"
              value={jumpValue}
              onChange={(e) => setJumpValue(e.target.value)}
              onBlur={handleJumpBlur}
              min={1}
              max={totalPages}
              className="w-14 rounded border border-line bg-surface-card px-1 py-0.5 text-fg"
            />
          </div>
        </div>
      )}
    </div>
  );
}

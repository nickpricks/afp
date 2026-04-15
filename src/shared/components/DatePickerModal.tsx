import { useState } from 'react';

import { todayStr } from '@/shared/utils/date';

/** Modal for picking a date to add a missing day's entry */
export function DatePickerModal({
  onSelect,
  onClose,
  title,
  minDate,
  maxDate,
}: {
  onSelect: (date: string) => void;
  onClose: () => void;
  title?: string;
  minDate?: string;
  maxDate?: string;
}) {
  const [date, setDate] = useState('');

  const handleSubmit = () => {
    if (!date) return;
    onSelect(date);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-xs rounded-xl bg-surface-card border border-line p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-fg mb-3">{title ?? 'Add missing day'}</h3>

        <input
          type="date"
          value={date}
          min={minDate}
          max={maxDate ?? todayStr()}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
          autoFocus
        />

        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-line px-3 py-2 text-sm font-medium text-fg-muted hover:text-fg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!date}
            className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-fg-on-accent disabled:opacity-40 active:scale-95 transition-transform"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

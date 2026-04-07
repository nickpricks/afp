import { useState } from 'react';

import type { BodyActivity } from '@/modules/body/types';
import { isValidNumber } from '@/shared/utils/validation';

/** Formats meters into a readable distance string */
function formatDist(meters: number | null): string {
  if (meters === null) return '--';
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${meters} m`;
}

/** Displays logged activities sorted newest-first with inline edit */
export function ActivityLog({
  activities,
  onSave,
}: {
  activities: BodyActivity[];
  onSave: (id: string, data: { distance?: number }) => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDistance, setEditDistance] = useState('');
  const [showAll, setShowAll] = useState(false);

  const INITIAL_LIMIT = 7;
  const EXPANDED_LIMIT = 30;

  const sorted = [...activities].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const limit = showAll ? EXPANDED_LIMIT : INITIAL_LIMIT;
  const visible = sorted.slice(0, limit);
  const hasMore = sorted.length > limit;

  const startEdit = (activity: BodyActivity) => {
    setEditingId(activity.id ?? null);
    setEditDistance(activity.distance !== null ? String(activity.distance) : '');
  };

  const handleEditSave = async () => {
    if (!editingId) return;
    const distance = Number(editDistance);
    if (!isValidNumber(distance) || distance <= 0) return;
    await onSave(editingId, { distance });
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs font-medium text-fg-muted uppercase tracking-wide">Activities</h3>
      <ul className="flex flex-col gap-1">
        {
          visible.map((a) => (
            <li key={a.id ?? a.createdAt}>
              {
                editingId === a.id && (
                  <div className="flex items-center gap-2 rounded-lg bg-surface-card border border-line px-3 py-2">
                    <span className="text-xs text-fg-muted w-24">{a.date}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0.01"
                      step="0.01"
                      value={editDistance}
                      onChange={(e) => setEditDistance(e.target.value)}
                      placeholder="meters"
                      className="w-20 rounded border border-line bg-surface-card px-2 py-1 text-sm text-fg"
                    />
                    <button
                      type="button"
                      onClick={handleEditSave}
                      className="rounded bg-accent px-2 py-1 text-xs text-fg-on-accent"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-xs text-fg-muted"
                    >
                      Cancel
                    </button>
                  </div>
                )
              }
              {
                editingId !== a.id && (
                  <button
                    type="button"
                    onClick={() => startEdit(a)}
                    className="flex w-full items-center justify-between rounded-lg bg-surface-card border border-line px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-fg">{a.date}</span>
                    <span className="text-fg-muted">{formatDist(a.distance)}</span>
                  </button>
                )
              }
            </li>
          ))
        }
      </ul>
      {
        hasMore && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-xs text-accent font-medium py-1"
          >
            Show more ({sorted.length - limit} remaining)
          </button>
        )
      }
    </div>
  );
}

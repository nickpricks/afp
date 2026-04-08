import { useState } from 'react';

import type { BodyActivity } from '@/modules/body/types';

/** Formats meters into a readable distance string */
function formatDist(meters: number | null): string {
  if (meters === null) return '--';
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${meters} m`;
}

/** Displays logged activities sorted newest-first — tap a row to edit via parent form */
export function ActivityLog({
  activities,
  onEdit,
  editingId,
}: {
  activities: BodyActivity[];
  onEdit: (activity: BodyActivity) => void;
  editingId?: string | null;
}) {
  const [showAll, setShowAll] = useState(false);

  const INITIAL_LIMIT = 7;
  const EXPANDED_LIMIT = 30;

  const sorted = [...activities].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const limit = showAll ? EXPANDED_LIMIT : INITIAL_LIMIT;
  const visible = sorted.slice(0, limit);
  const hasMore = sorted.length > limit;

  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs font-medium text-fg-muted uppercase tracking-wide">Activities</h3>
      <ul className="flex flex-col gap-1">
        {
          visible.map((a) => {
            const isActive = editingId === a.id;
            return (
              <li key={a.id ?? a.createdAt}>
                <button
                  type="button"
                  onClick={() => onEdit(a)}
                  className={
                    `flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-[var(--accent-muted)] border-l-2 border-l-accent border border-line'
                        : 'bg-surface-card border border-line'
                    }`
                  }
                >
                  <span className={isActive ? 'text-accent font-medium' : 'font-medium text-fg'}>{a.date}</span>
                  <span className="text-fg-muted">{formatDist(a.distance)}</span>
                </button>
              </li>
            );
          })
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

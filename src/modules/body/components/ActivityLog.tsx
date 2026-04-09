import { useState } from 'react';
import { Plus } from 'lucide-react';

import type { BodyActivity } from '@/modules/body/types';
import { CONFIG } from '@/constants/config';

/** Formats meters into a readable distance string */
function formatDist(meters: number | null): string {
  if (meters === null) return '--';
  if (meters >= CONFIG.METERS_PER_KM) {
    return `${(meters / CONFIG.METERS_PER_KM).toFixed(1)} km`;
  }
  return `${meters} m`;
}

/** Displays logged activities sorted newest-first — tap a row to edit, (+) to duplicate */
export function ActivityLog({
  activities,
  onEdit,
  onDuplicate,
  editingId,
}: {
  activities: BodyActivity[];
  onEdit: (activity: BodyActivity) => void;
  onDuplicate?: (activity: BodyActivity) => void;
  editingId?: string | null;
}) {
  const [limit, setLimit] = useState(CONFIG.PAGE_SIZE);

  const sorted = [...activities].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
              <li key={a.id ?? a.createdAt} className="group relative">
                <button
                  type="button"
                  onClick={() => onEdit(a)}
                  className={
                    `flex w-full items-center justify-between rounded-lg px-3 pr-10 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-[var(--accent-muted)] border-l-2 border-l-accent border border-line'
                        : 'bg-surface-card border border-line'
                    }`
                  }
                >
                  <span className={isActive ? 'text-accent font-medium' : 'font-medium text-fg'}>{a.date}</span>
                  <span className="text-fg-muted">{formatDist(a.distance)}</span>
                </button>
                {
onDuplicate && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDuplicate(a); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6.5 w-6.5 items-center justify-center rounded-full bg-accent text-fg-on-accent opacity-0 scale-75 transition-all duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:opacity-100 group-hover:scale-100 active:scale-90 shadow-sm"
                    aria-label={`Add similar ${a.type}`}
                  >
                    <Plus size={13} strokeWidth={2.5} />
                  </button>
                )
}
              </li>
            );
          })
        }
      </ul>
      {
        hasMore && (
          <button
            type="button"
            onClick={() => setLimit((prev) => prev + CONFIG.PAGE_SIZE)}
            className="text-xs text-accent font-medium py-1"
          >
            Show more ({sorted.length - limit} remaining)
          </button>
        )
      }
      {
        !hasMore && sorted.length > CONFIG.PAGE_SIZE && (
          <p className="text-xs text-fg-muted text-center py-1">That's all the activities</p>
        )
      }
    </div>
  );
}

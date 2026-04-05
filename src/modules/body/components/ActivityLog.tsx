import type { ActivityEntry } from '@/modules/body/types';
import { ACTIVITY_LABELS } from '@/modules/body/constants';

/** Formats meters into a readable distance string */
function formatDist(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${meters} m`;
}

/** Displays today's logged activities in reverse chronological order */
export function ActivityLog({ activities }: { activities: ActivityEntry[] }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs font-medium text-fg-muted uppercase tracking-wide">Today's Activities</h3>
      <ul className="flex flex-col gap-1">
        {
          activities.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-lg bg-surface-card border border-line px-3 py-2 text-sm"
            >
              <span className="font-medium text-fg">{ACTIVITY_LABELS[a.type]}</span>
              <span className="text-fg-muted">{formatDist(a.distanceMeters)}</span>
            </li>
          ))
        }
      </ul>
    </div>
  );
}

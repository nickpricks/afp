import { ArrowUp, ArrowDown } from 'lucide-react';

import { useBodyData } from '@/modules/body/hooks/useBodyData';
import { AddActivity } from '@/modules/body/components/AddActivity';
import { ActivityLog } from '@/modules/body/components/ActivityLog';
import { BODY_DEFAULTS } from '@/modules/body/constants';
import { computeSteps } from '@/modules/body/scoring';

/** Formats meters as a readable distance string */
function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`;
  }
  return `${meters}m`;
}

/** Main body tracking UI with score display, floor tap buttons, and activity logging */
export function BodyTracker() {
  const { todayRecord, todayActivities, tap, logActivity } = useBodyData();

  const walkSteps = computeSteps(todayRecord.walkMeters, BODY_DEFAULTS.WALK_STRIDE_M);
  const runSteps = computeSteps(todayRecord.runMeters, BODY_DEFAULTS.RUN_STRIDE_M);

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <div className="text-center">
        <p className="text-5xl font-bold text-accent">{todayRecord.total}</p>
        <p className="mt-1 text-sm text-fg-muted">
          {todayRecord.floors.up} up &middot; {todayRecord.floors.down} down
          {todayRecord.walkMeters > 0 && ` \u00B7 ${formatDistance(todayRecord.walkMeters)} walked`}
          {todayRecord.runMeters > 0 && ` \u00B7 ${formatDistance(todayRecord.runMeters)} run`}
        </p>
        {
(walkSteps > 0 || runSteps > 0) && (
          <p className="text-xs text-fg-muted mt-0.5">
            ~{(walkSteps + runSteps).toLocaleString()} steps
          </p>
        )
}
      </div>

      <div className="flex justify-center gap-4">
        <button
          type="button"
          onClick={() => tap('up')}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-fg-on-accent active:scale-95 transition-transform"
        >
          <ArrowUp size={28} />
        </button>
        <button
          type="button"
          onClick={() => tap('down')}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-card text-fg border border-line active:scale-95 transition-transform"
        >
          <ArrowDown size={28} />
        </button>
      </div>

      <div className="border-t border-line pt-4">
        <AddActivity onLog={logActivity} />
      </div>

      {
todayActivities.length > 0 && (
        <ActivityLog activities={todayActivities} />
      )
}
    </div>
  );
}

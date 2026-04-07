import type { BodyActivity } from '@/modules/body/types';
import { AddActivity } from '@/modules/body/components/AddActivity';
import { ActivityLog } from '@/modules/body/components/ActivityLog';
import { ActivityType } from '@/shared/types';

/** Cycling activity tab with add form and log */
export function CyclingTab({
  activities,
  onLog,
  onSave,
}: {
  activities: BodyActivity[];
  onLog: (type: ActivityType, distanceMeters: number) => Promise<void>;
  onSave: (id: string, data: { distance?: number }) => Promise<void>;
}) {
  const cycleActivities = activities.filter((a) => a.type === ActivityType.Cycle);

  return (
    <div className="flex flex-col gap-6">
      <AddActivity onLog={onLog} defaultType={ActivityType.Cycle} />
      {
        cycleActivities.length > 0 && (
          <ActivityLog activities={cycleActivities} onSave={onSave} />
        )
      }
    </div>
  );
}

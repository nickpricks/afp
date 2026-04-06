import type { BodyActivity } from '@/modules/body/types';
import { AddActivity } from '@/modules/body/components/AddActivity';
import { ActivityLog } from '@/modules/body/components/ActivityLog';
import { ActivityType } from '@/shared/types';

/** Walking activity tab with add form and log */
export function WalkingTab({
  activities,
  onLog,
  onSave,
}: {
  activities: BodyActivity[];
  onLog: (type: ActivityType, distanceMeters: number) => Promise<void>;
  onSave: (id: string, data: { distance?: number }) => Promise<void>;
}) {
  const walkActivities = activities.filter((a) => a.type === ActivityType.Walk);

  return (
    <div className="flex flex-col gap-6">
      <AddActivity onLog={onLog} defaultType={ActivityType.Walk} />
      {
        walkActivities.length > 0 && (
          <ActivityLog activities={walkActivities} onSave={onSave} />
        )
      }
    </div>
  );
}

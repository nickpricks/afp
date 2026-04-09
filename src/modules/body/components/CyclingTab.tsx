import { useState } from 'react';

import type { BodyActivity } from '@/modules/body/types';
import { AddActivity } from '@/modules/body/components/AddActivity';
import { ActivityLog } from '@/modules/body/components/ActivityLog';
import { ActivityType } from '@/shared/types';

/** Cycling activity tab with add/edit form and log */
export function CyclingTab({
  activities,
  onLog,
  onSave,
}: {
  activities: BodyActivity[];
  onLog: (type: ActivityType, distanceMeters: number) => Promise<void>;
  onSave: (id: string, data: { distance?: number }) => Promise<void>;
}) {
  const [editEntry, setEditEntry] = useState<BodyActivity | null>(null);
  const cycleActivities = activities.filter((a) => a.type === ActivityType.Cycle);

  return (
    <div className="flex flex-col gap-6">
      <AddActivity
        onLog={onLog}
        onUpdate={onSave}
        defaultType={ActivityType.Cycle}
        editEntry={editEntry}
        onCancelEdit={() => setEditEntry(null)}
      />
      {
        cycleActivities.length > 0 && (
          <ActivityLog
            activities={cycleActivities}
            onEdit={setEditEntry}
            onDuplicate={(a) => a.distance !== null && onLog(ActivityType.Cycle, a.distance)}
            editingId={editEntry?.id}
          />
        )
      }
    </div>
  );
}

import { useState } from 'react';

import type { BodyActivity } from '@/modules/body/types';
import { AddActivity } from '@/modules/body/components/AddActivity';
import { ActivityLog } from '@/modules/body/components/ActivityLog';
import { ActivityType } from '@/shared/types';

/** Running activity tab with add/edit form and log */
export function RunningTab({
  activities,
  onLog,
  onSave,
}: {
  activities: BodyActivity[];
  onLog: (type: ActivityType, distanceMeters: number) => Promise<void>;
  onSave: (id: string, data: { distance?: number }) => Promise<void>;
}) {
  const [editEntry, setEditEntry] = useState<BodyActivity | null>(null);
  const runActivities = activities.filter((a) => a.type === ActivityType.Run);

  return (
    <div className="flex flex-col gap-6">
      <AddActivity
        onLog={onLog}
        onUpdate={onSave}
        defaultType={ActivityType.Run}
        editEntry={editEntry}
        onCancelEdit={() => setEditEntry(null)}
      />
      {
        runActivities.length > 0 && (
          <ActivityLog activities={runActivities} onEdit={setEditEntry} editingId={editEntry?.id} />
        )
      }
    </div>
  );
}

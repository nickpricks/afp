import { useState } from 'react';

import type { BodyActivity } from '@/modules/body/types';
import { AddActivity } from '@/modules/body/components/AddActivity';
import { ActivityLog } from '@/modules/body/components/ActivityLog';
import { ActivityType } from '@/shared/types';

/** Walking activity tab with add/edit form and log */
export function WalkingTab({
  activities,
  onLog,
  onSave,
}: {
  activities: BodyActivity[];
  onLog: (type: ActivityType, distanceMeters: number) => Promise<void>;
  onSave: (id: string, data: { distance?: number }) => Promise<void>;
}) {
  const [editEntry, setEditEntry] = useState<BodyActivity | null>(null);
  const walkActivities = activities.filter((a) => a.type === ActivityType.Walk);

  return (
    <div className="flex flex-col gap-6">
      <AddActivity
        onLog={onLog}
        onUpdate={onSave}
        defaultType={ActivityType.Walk}
        editEntry={editEntry}
        onCancelEdit={() => setEditEntry(null)}
      />
      {
        walkActivities.length > 0 && (
          <ActivityLog activities={walkActivities} onEdit={setEditEntry} editingId={editEntry?.id} />
        )
      }
    </div>
  );
}

import { useState } from 'react';

import type { BodyActivity } from '@/modules/body/types';
import { AddActivity } from '@/modules/body/components/AddActivity';
import { ActivityLog } from '@/modules/body/components/ActivityLog';
import { AddMissingDayButton } from '@/modules/body/components/AddMissingDayButton';
import { DatePickerModal } from '@/shared/components/DatePickerModal';
import { ActivityType } from '@/shared/types';

/** Walking activity tab with add/edit form and log */
export function WalkingTab({
  activities,
  onLog,
  onSave,
  onDelete,
}: {
  activities: BodyActivity[];
  onLog: (type: ActivityType, distanceMeters: number, date?: string) => Promise<void>;
  onSave: (id: string, data: { distance?: number }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}) {
  const [editEntry, setEditEntry] = useState<BodyActivity | null>(null);
  const [backfillDate, setBackfillDate] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const walkActivities = activities.filter((a) => a.type === ActivityType.Walk);

  return (
    <div className="flex flex-col gap-6">
      <AddActivity
        onLog={onLog}
        onUpdate={onSave}
        defaultType={ActivityType.Walk}
        editEntry={editEntry}
        onCancelEdit={() => setEditEntry(null)}
        backfillDate={backfillDate}
        onClearBackfill={() => setBackfillDate(null)}
      />
      <AddMissingDayButton onClick={() => setShowDatePicker(true)} />
      {walkActivities.length > 0 && (
        <ActivityLog
          activities={walkActivities}
          onEdit={setEditEntry}
          onDelete={onDelete}
          editingId={editEntry?.id}
        />
      )}
      <AddMissingDayButton onClick={() => setShowDatePicker(true)} />
      {showDatePicker && (
        <DatePickerModal
          title="Add walk for a past day"
          onSelect={(date) => {
            setBackfillDate(date);
            setShowDatePicker(false);
          }}
          onClose={() => setShowDatePicker(false)}
        />
      )}
    </div>
  );
}

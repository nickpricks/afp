import { useState, useEffect } from 'react';

import { ACTIVITY_LABELS } from '@/modules/body/constants';
import { ActivityType } from '@/shared/types';
import { isValidNumber } from '@/shared/utils/validation';
import type { BodyActivity } from '@/modules/body/types';

/** Available activity types for logging (yoga is coming soon) */
const LOGGABLE_TYPES: readonly ActivityType[] = [ActivityType.Walk, ActivityType.Run, ActivityType.Cycle];

/** Form for logging or updating a walk/run/cycle activity with distance input */
export function AddActivity({
  onLog,
  onUpdate,
  defaultType,
  editEntry,
  onCancelEdit,
}: {
  onLog: (type: ActivityType, distanceMeters: number) => Promise<void>;
  onUpdate?: (id: string, data: { distance?: number }) => Promise<void>;
  defaultType?: ActivityType;
  editEntry?: BodyActivity | null;
  onCancelEdit?: () => void;
}) {
  const [type, setType] = useState<ActivityType>(defaultType ?? ActivityType.Walk);
  const [distance, setDistance] = useState('');
  const [unit, setUnit] = useState<'m' | 'km'>('m');
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = editEntry != null;

  // Populate form when editEntry changes
  useEffect(() => {
    if (editEntry) {
      const dist = editEntry.distance ?? 0;
      if (dist >= 1000) {
        setDistance(String(dist / 1000));
        setUnit('km');
      } else {
        setDistance(String(dist));
        setUnit('m');
      }
    }
  }, [editEntry]);

  const parsed = Number(distance);
  const distanceMeters = unit === 'km' ? parsed * 1000 : parsed;
  const isDisabled = !distance || !isValidNumber(parsed) || isSaving;

  const handleSave = async () => {
    if (isDisabled) return;
    setIsSaving(true);
    try {
      if (isEditMode && onUpdate && editEntry?.id) {
        await onUpdate(editEntry.id, { distance: distanceMeters });
        onCancelEdit?.();
      } else {
        await onLog(type, distanceMeters);
      }
      setDistance('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDistance('');
    onCancelEdit?.();
  };

  return (
    <div className="flex flex-col gap-3">
      {
        !defaultType && !isEditMode && (
          <div className="flex gap-2">
            {
              LOGGABLE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={
                    `flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      t === type
                        ? 'bg-accent text-fg-on-accent'
                        : 'bg-surface-card text-fg border border-line'
                    }`
                  }
                >
                  {ACTIVITY_LABELS[t]}
                </button>
              ))
            }
          </div>
        )
      }

      {
        isEditMode && (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-fg-on-accent">
              Editing {editEntry!.date}
            </span>
            <button
              type="button"
              onClick={handleCancel}
              className="text-xs text-fg-muted hover:text-fg"
            >
              Cancel
            </button>
          </div>
        )
      }

      <div className="flex gap-2">
        <input
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          placeholder="Distance"
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
          className="flex-1 rounded-lg border border-line bg-surface-card px-3 py-2 text-fg"
        />
        <div className="flex rounded-lg border border-line overflow-hidden">
          <button
            type="button"
            onClick={() => setUnit('m')}
            className={
              `px-3 py-2 text-sm font-medium transition ${
                unit === 'm' ? 'bg-accent text-fg-on-accent' : 'bg-surface-card text-fg'
              }`
            }
          >
            m
          </button>
          <button
            type="button"
            onClick={() => setUnit('km')}
            className={
              `px-3 py-2 text-sm font-medium transition ${
                unit === 'km' ? 'bg-accent text-fg-on-accent' : 'bg-surface-card text-fg'
              }`
            }
          >
            km
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isDisabled}
        className="rounded-lg bg-accent px-4 py-2 text-fg-on-accent font-medium disabled:opacity-40 active:scale-95 transition-transform"
      >
        {isSaving ? 'Saving...' : isEditMode ? 'Update' : `Log ${ACTIVITY_LABELS[defaultType ?? type]}`}
      </button>
    </div>
  );
}

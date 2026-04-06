import { useState } from 'react';

import { ACTIVITY_LABELS } from '@/modules/body/constants';
import { ActivityType } from '@/shared/types';
import { isValidNumber } from '@/shared/utils/validation';

/** Available activity types for logging (cycle/yoga are coming soon) */
const LOGGABLE_TYPES: readonly ActivityType[] = [ActivityType.Walk, ActivityType.Run];

/** Form for logging a walk or run activity with distance input */
export function AddActivity({
  onLog,
  defaultType,
}: {
  onLog: (type: ActivityType, distanceMeters: number) => Promise<void>;
  defaultType?: ActivityType;
}) {
  const [type, setType] = useState<ActivityType>(defaultType ?? ActivityType.Walk);
  const [distance, setDistance] = useState('');
  const [unit, setUnit] = useState<'m' | 'km'>('m');
  const [isSaving, setIsSaving] = useState(false);

  const parsed = Number(distance);
  const distanceMeters = unit === 'km' ? parsed * 1000 : parsed;
  const isDisabled = !distance || !isValidNumber(parsed) || isSaving;

  const handleSave = async () => {
    if (isDisabled) return;
    setIsSaving(true);
    try {
      await onLog(type, distanceMeters);
      setDistance('');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {
        !defaultType && (
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

      <div className="flex gap-2">
        <input
          type="number"
          inputMode="decimal"
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
        {isSaving ? 'Saving...' : `Log ${ACTIVITY_LABELS[type]}`}
      </button>
    </div>
  );
}

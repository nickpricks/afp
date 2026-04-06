import { useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

import type { BodyRecord } from '@/modules/body/types';
import { BODY_DEFAULTS } from '@/modules/body/constants';
import { isValidNumber } from '@/shared/utils/validation';

/** Formats meters as a readable distance string */
function formatHeight(floors: number, floorHeight: number): string {
  const meters = floors * floorHeight;
  return `${meters.toFixed(1)}m`;
}

/** Floor counting tab with tap buttons and recent history */
export function FloorsTab({
  todayRecord,
  records,
  floorHeight,
  onTap,
  onSaveRecord,
}: {
  todayRecord: BodyRecord;
  records: Record<string, BodyRecord>;
  floorHeight: number;
  onTap: (type: 'up' | 'down') => Promise<void>;
  onSaveRecord: (dateKey: string, data: { up?: number; down?: number }) => Promise<void>;
}) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editUp, setEditUp] = useState('');
  const [editDown, setEditDown] = useState('');
  const height = floorHeight || BODY_DEFAULTS.FLOOR_HEIGHT_M;

  const [expanded, setExpanded] = useState(false);

  const sortedDays = Object.entries(records)
    .sort(([a], [b]) => b.localeCompare(a));
  const recentDays = sortedDays.slice(0, expanded ? 30 : 7);

  const startEdit = (dateKey: string, record: BodyRecord) => {
    setEditingKey(dateKey);
    setEditUp(String(record.up));
    setEditDown(String(record.down));
  };

  const handleEditSave = async () => {
    if (!editingKey) return;
    const up = Number(editUp);
    const down = Number(editDown);
    if (!isValidNumber(up) || !isValidNumber(down)) return;
    await onSaveRecord(editingKey, { up, down });
    setEditingKey(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Today's floors display */}
      <div className="text-center">
        <p className="text-4xl font-bold text-accent">{todayRecord.up + todayRecord.down}</p>
        <p className="text-sm text-fg-muted mt-1">
          {todayRecord.up} up ({formatHeight(todayRecord.up, height)}) / {todayRecord.down} down ({formatHeight(todayRecord.down, height)})
        </p>
      </div>

      {/* Tap buttons */}
      <div className="flex justify-center gap-4">
        <button
          type="button"
          onClick={() => onTap('up')}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-fg-on-accent active:scale-95 transition-transform"
        >
          <ArrowUp size={28} />
        </button>
        <button
          type="button"
          onClick={() => onTap('down')}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-card text-fg border border-line active:scale-95 transition-transform"
        >
          <ArrowDown size={28} />
        </button>
      </div>

      {/* Recent days */}
      {
        recentDays.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-medium text-fg-muted uppercase tracking-wide">Recent</h3>
            <ul className="flex flex-col gap-1">
              {
                recentDays.map(([dateKey, rec]) => (
                  <li key={dateKey}>
                    {
                      editingKey === dateKey && (
                        <div className="flex items-center gap-2 rounded-lg bg-surface-card border border-line px-3 py-2">
                          <span className="text-xs text-fg-muted w-20">{dateKey}</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            value={editUp}
                            onChange={(e) => setEditUp(e.target.value)}
                            placeholder="Up"
                            className="w-16 rounded border border-line bg-surface-card px-2 py-1 text-sm text-fg"
                          />
                          <input
                            type="number"
                            inputMode="numeric"
                            value={editDown}
                            onChange={(e) => setEditDown(e.target.value)}
                            placeholder="Down"
                            className="w-16 rounded border border-line bg-surface-card px-2 py-1 text-sm text-fg"
                          />
                          <button
                            type="button"
                            onClick={handleEditSave}
                            className="rounded bg-accent px-2 py-1 text-xs text-fg-on-accent"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingKey(null)}
                            className="text-xs text-fg-muted"
                          >
                            Cancel
                          </button>
                        </div>
                      )
                    }
                    {
                      editingKey !== dateKey && (
                        <button
                          type="button"
                          onClick={() => startEdit(dateKey, rec)}
                          className="flex w-full items-center justify-between rounded-lg bg-surface-card border border-line px-3 py-2 text-sm"
                        >
                          <span className="text-fg-muted">{dateKey}</span>
                          <span className="text-fg font-medium">
                            {rec.up} up / {rec.down} down = {rec.total}
                          </span>
                        </button>
                      )
                    }
                  </li>
                ))
              }
            </ul>
            {
              !expanded && sortedDays.length > 7 && (
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="text-xs text-accent hover:underline self-center mt-1"
                >
                  Show more
                </button>
              )
            }
            {
              expanded && (
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="text-xs text-accent hover:underline self-center mt-1"
                >
                  Show less
                </button>
              )
            }
          </div>
        )
      }
    </div>
  );
}

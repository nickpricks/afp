import { useState, useRef } from 'react';
import { ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';

import type { BodyRecord } from '@/modules/body/types';
import { BODY_DEFAULTS } from '@/modules/body/constants';
import { AddMissingDayButton } from '@/modules/body/components/AddMissingDayButton';
import { CONFIG } from '@/constants/config';
import { BodyMsg } from '@/constants/messages';
import { todayStr } from '@/shared/utils/date';
import { ToastType } from '@/shared/types';
import { useToast } from '@/shared/errors/useToast';
import { SwipeToDelete } from '@/shared/components/SwipeToDelete';
import { DatePickerModal } from '@/shared/components/DatePickerModal';
import { ListControls } from '@/shared/components/ListControls';
import { ListShowMoreFooter } from '@/shared/components/ListShowMoreFooter';
import { DateGroupHeader } from '@/shared/components/lists/DateGroupHeader';
import { FloorMagnitudeBar } from '@/shared/components/lists/FloorMagnitudeBar';
import { useListControls } from '@/shared/hooks/useListControls';
import { filterByDateRange } from '@/shared/utils/filter';
import { paginate, totalPages } from '@/shared/utils/paginate';
import { sortNewestFirst } from '@/shared/utils/sort';

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
  onDeleteRecord,
  onResetToday,
}: {
  todayRecord: BodyRecord;
  records: Record<string, BodyRecord>;
  floorHeight: number;
  onTap: (type: 'up' | 'down') => Promise<void>;
  onSaveRecord: (dateKey: string, data: { up?: number; down?: number }) => Promise<void>;
  onDeleteRecord?: (dateKey: string) => Promise<void>;
  onResetToday?: () => void;
}) {
  const { addToast } = useToast();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const height = floorHeight || BODY_DEFAULTS.FLOOR_HEIGHT_M;
  const ctrl = useListControls();
  const [pendingDeleteKey, setPendingDeleteKey] = useState<string | null>(null);
  const undoRef = useRef(false);

  const today = todayStr();
  const isEditing = editingKey !== null;

  // The record being displayed -- either the editing date or today
  const activeKey = editingKey ?? today;
  const activeRecord = editingKey
    ? (records[editingKey] ?? {
        dateStr: editingKey,
        up: 0,
        down: 0,
        walkMeters: 0,
        runMeters: 0,
        total: 0,
        updatedAt: '',
      })
    : todayRecord;

  /** Optimistic delete with undo window */
  const handleDelete = (dateKey: string) => {
    if (!onDeleteRecord) return;
    undoRef.current = false;
    setPendingDeleteKey(dateKey);

    // If we're editing this record, exit edit mode
    if (editingKey === dateKey) {
      setEditingKey(null);
    }

    addToast(BodyMsg.RecordDeleted, ToastType.Info, {
      durationMs: CONFIG.UNDO_DURATION_MS,
      action: {
        label: 'Undo',
        onClick: () => {
          undoRef.current = true;
          setPendingDeleteKey(null);
        },
      },
    });
    setTimeout(() => {
      if (!undoRef.current) {
        onDeleteRecord(dateKey);
      }
      setPendingDeleteKey(null);
    }, CONFIG.UNDO_DURATION_MS);
  };

  const sortedDays = sortNewestFirst(
    Object.entries(records).filter(([key]) => key !== pendingDeleteKey),
    ([key]) => key,
  );
  const filteredDays = filterByDateRange(sortedDays, ctrl.timeRange, today, ([key]) => key);
  const pagesCount = totalPages(filteredDays.length, ctrl.pageSize);
  const recentDays = ctrl.showAll ? filteredDays : paginate(filteredDays, ctrl.page, ctrl.pageSize);

  /** Tap handler -- redirects to editing date when in edit mode */
  const handleTap = async (type: 'up' | 'down') => {
    if (!isEditing) {
      await onTap(type);
      return;
    }
    // Edit mode: save incremented value for the editing date
    const current = records[editingKey!] ?? { up: 0, down: 0 };
    await onSaveRecord(editingKey!, {
      up: current.up + (type === 'up' ? 1 : 0),
      down: current.down + (type === 'down' ? 1 : 0),
    });
  };

  /** Tap a row to enter edit mode, or exit if tapping today */
  const handleRowTap = (dateKey: string) => {
    if (dateKey === today) {
      setEditingKey(null);
    } else {
      setEditingKey(dateKey);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header: shows editing date or today */}
      <div className="text-center">
        {isEditing && (
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-fg-on-accent">
              {editingKey}
            </span>
            <button
              type="button"
              onClick={() => setEditingKey(null)}
              className="flex items-center gap-1 rounded-full border border-line px-2 py-1 text-xs text-fg-muted hover:text-fg transition-colors"
            >
              <RotateCcw size={12} />
              Back to Today
            </button>
          </div>
        )}
        <p className="text-4xl font-bold text-accent">{activeRecord.up + activeRecord.down}</p>
        <p className="text-sm text-fg-muted mt-1">
          {activeRecord.up} up ({formatHeight(activeRecord.up, height)}) / {activeRecord.down} down
          ({formatHeight(activeRecord.down, height)})
        </p>
      </div>

      {/* Tap buttons -- always present, target changes based on edit mode */}
      <div className="flex justify-center gap-4">
        <button
          type="button"
          onClick={() => handleTap('up')}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-fg-on-accent active:scale-95 transition-transform"
        >
          <ArrowUp size={28} />
        </button>
        <button
          type="button"
          onClick={() => handleTap('down')}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-card text-fg border border-line active:scale-95 transition-transform"
        >
          <ArrowDown size={28} />
        </button>
      </div>

      {/* Reset today — only when viewing today and has data */}
      {onResetToday && !isEditing && todayRecord.total > 0 && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onResetToday}
            className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:border-error hover:text-error hover:bg-error/5"
          >
            <RotateCcw size={13} />
            Reset today
          </button>
        </div>
      )}

      {/* Add missing day button — above the list */}
      <AddMissingDayButton onClick={() => setShowDatePicker(true)} />

      {/* Recent days */}
      {sortedDays.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-fg-muted uppercase tracking-wide">Recent</h3>
          <ListControls
            timeRange={ctrl.timeRange}
            onTimeRangeChange={ctrl.setTimeRange}
            pageSize={ctrl.pageSize}
            onPageSizeChange={ctrl.setPageSize}
            page={ctrl.page}
            totalPages={ctrl.showAll ? 1 : pagesCount}
            onPageChange={ctrl.setPage}
          />
          <div className="bg-surface">
            {(() => {
              const goal = Math.max(20, ...recentDays.map(([, r]) => r.up + r.down));
              return recentDays.map(([dateKey, rec]) => {
                const isActive = dateKey === activeKey;
                const rowContent = (
                  <div
                    className={`grid w-full cursor-pointer grid-cols-[1fr_80px_auto_auto] items-center gap-3 border-l-2 border-t border-line px-4 py-3 transition-colors hover:bg-accent-muted ${
                      isActive ? 'bg-accent-muted border-l-accent' : 'border-l-transparent'
                    }`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleRowTap(dateKey)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRowTap(dateKey);
                    }}
                  >
                    <span className="text-sm text-fg">Floors</span>
                    <FloorMagnitudeBar up={rec.up} down={rec.down} goal={goal} />
                    <span className="whitespace-nowrap font-mono text-[13px] tabular-nums">
                      <span className="font-semibold text-accent">{rec.up} ↑</span>
                      <span className="ml-2 text-fg-muted">{rec.down} ↓</span>
                    </span>
                    {onDeleteRecord && (
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(dateKey);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.stopPropagation();
                            handleDelete(dateKey);
                          }
                        }}
                        className="font-mono text-sm text-fg-muted transition-all hover:scale-125 hover:font-bold hover:text-red-500"
                      >
                        ×
                      </span>
                    )}
                  </div>
                );

                return (
                  <div key={dateKey}>
                    <DateGroupHeader date={dateKey} today={today} />
                    {onDeleteRecord && (
                      <SwipeToDelete onDelete={() => handleDelete(dateKey)}>
                        {rowContent}
                      </SwipeToDelete>
                    )}
                    {!onDeleteRecord && rowContent}
                  </div>
                );
              });
            })()}
          </div>
          {!ctrl.showAll && (
            <ListShowMoreFooter
              totalCount={filteredDays.length}
              shownCount={recentDays.length}
              pageSize={ctrl.pageSize}
              onShowAll={() => ctrl.setShowAll(true)}
            />
          )}
        </div>
      )}
      {/* Add missing day button — below the list */}
      <AddMissingDayButton onClick={() => setShowDatePicker(true)} />

      {/* Date picker modal */}
      {showDatePicker && (
        <DatePickerModal
          title="Add floors for a past day"
          onSelect={(date) => {
            setEditingKey(date);
            setShowDatePicker(false);
          }}
          onClose={() => setShowDatePicker(false)}
        />
      )}
    </div>
  );
}

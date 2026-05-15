import { useState, useRef } from 'react';

import type { BodyActivity } from '@/modules/body/types';
import { CONFIG } from '@/constants/config';
import { BodyMsg } from '@/constants/messages';
import { formatDistanceOrDash } from '@/shared/utils/format';
import { sortNewestFirst } from '@/shared/utils/sort';
import { ToastType } from '@/shared/types';
import { useToast } from '@/shared/errors/useToast';
import { SwipeToDelete } from '@/shared/components/SwipeToDelete';
import { ListControls } from '@/shared/components/ListControls';
import { ListShowMoreFooter } from '@/shared/components/ListShowMoreFooter';
import { DateGroupHeader } from '@/shared/components/lists/DateGroupHeader';
import { RowTime } from '@/shared/components/lists/RowTime';
import { useListControls } from '@/shared/hooks/useListControls';
import { filterByDateRange } from '@/shared/utils/filter';
import { paginate, totalPages } from '@/shared/utils/paginate';
import { todayStr } from '@/shared/utils/date';

/** Displays logged activities sorted newest-first -- tap a row to edit, swipe or X to delete */
export function ActivityLog({
  activities,
  onEdit,
  onDelete,
  editingId,
}: {
  activities: BodyActivity[];
  onEdit: (activity: BodyActivity) => void;
  onDelete?: (id: string) => void;
  editingId?: string | null;
}) {
  const { addToast } = useToast();
  const ctrl = useListControls();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const undoRef = useRef(false);

  /** Optimistic delete with undo window */
  const handleDelete = (entry: BodyActivity) => {
    if (!onDelete || !entry.id) return;
    const entryId = entry.id;
    undoRef.current = false;
    setPendingDeleteId(entryId);
    addToast(BodyMsg.ActivityDeleted, ToastType.Info, {
      durationMs: CONFIG.UNDO_DURATION_MS,
      action: {
        label: 'Undo',
        onClick: () => {
          undoRef.current = true;
          setPendingDeleteId(null);
        },
      },
    });
    setTimeout(() => {
      if (!undoRef.current) {
        onDelete(entryId);
      }
      setPendingDeleteId(null);
    }, CONFIG.UNDO_DURATION_MS);
  };

  const sorted = sortNewestFirst(
    activities.filter((a) => a.id !== pendingDeleteId),
    (a) => a.date,
  );
  const today = todayStr();
  const filtered = filterByDateRange(sorted, ctrl.timeRange, today, (a) => a.date);
  const pagesCount = totalPages(filtered.length, ctrl.pageSize);
  const visible = ctrl.showAll ? filtered : paginate(filtered, ctrl.page, ctrl.pageSize);

  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs font-medium text-fg-muted uppercase tracking-wide">Activities</h3>
      <ListControls
        timeRange={ctrl.timeRange}
        onTimeRangeChange={ctrl.setTimeRange}
        pageSize={ctrl.pageSize}
        onPageSizeChange={ctrl.setPageSize}
        page={ctrl.page}
        totalPages={ctrl.showAll ? 1 : pagesCount}
        onPageChange={ctrl.setPage}
      />
      <ul className="flex flex-col bg-surface">
        {(() => {
          const groups: Record<string, BodyActivity[]> = {};
          visible.forEach((a) => {
            (groups[a.date] = groups[a.date] || []).push(a);
          });
          const dateKeys = Object.keys(groups).sort((x, y) => y.localeCompare(x));

          return dateKeys.map((dateKey) => (
            <li key={dateKey} className="group">
              <DateGroupHeader date={dateKey} today={today} />
              {groups[dateKey]!.map((a) => {
                const isActive = editingId === a.id;
                const rowContent = (
                  <div
                    data-testid="activity-row"
                    className={`grid w-full cursor-pointer grid-cols-[56px_1fr_auto_auto] items-center gap-3 border-l-2 border-t border-line px-4 py-3 transition-colors hover:bg-accent-muted ${
                      isActive ? 'bg-accent-muted border-l-accent' : 'border-l-transparent'
                    }`}
                    role="button"
                    tabIndex={0}
                    onClick={() => onEdit(a)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onEdit(a);
                    }}
                  >
                    <RowTime timestamp={a.timestamp} />
                    <span className="text-sm text-fg">{a.type}</span>
                    <span className="whitespace-nowrap text-right font-mono text-sm tabular-nums text-fg-muted">
                      {formatDistanceOrDash(a.distance)}
                    </span>
                    {onDelete && (
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(a);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.stopPropagation();
                            handleDelete(a);
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
                  <div key={a.id ?? a.createdAt}>
                    {onDelete ? (
                      <SwipeToDelete onDelete={() => handleDelete(a)}>{rowContent}</SwipeToDelete>
                    ) : (
                      rowContent
                    )}
                  </div>
                );
              })}
            </li>
          ));
        })()}
      </ul>
      {!ctrl.showAll && (
        <ListShowMoreFooter
          totalCount={filtered.length}
          shownCount={visible.length}
          pageSize={ctrl.pageSize}
          onShowAll={() => ctrl.setShowAll(true)}
        />
      )}
    </div>
  );
}

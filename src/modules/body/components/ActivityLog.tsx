import { useState, useRef } from 'react';

import type { BodyActivity } from '@/modules/body/types';
import { CONFIG } from '@/constants/config';
import { BodyMsg } from '@/constants/messages';
import { formatDistanceOrDash } from '@/shared/utils/format';
import { sortNewestFirst } from '@/shared/utils/sort';
import { ToastType } from '@/shared/types';
import { useToast } from '@/shared/errors/useToast';
import { SwipeToDelete } from '@/shared/components/SwipeToDelete';

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
  const [limit, setLimit] = useState(CONFIG.PAGE_SIZE);
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
  const visible = sorted.slice(0, limit);
  const hasMore = sorted.length > limit;

  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs font-medium text-fg-muted uppercase tracking-wide">Activities</h3>
      <ul className="flex flex-col gap-1">
        {
          visible.map((a) => {
            const isActive = editingId === a.id;
            const rowContent = (
              <div
                className={
                  `flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[var(--accent-muted)] border-l-2 border-l-accent border border-line'
                      : 'bg-surface-card border border-line'
                  }`
                }
                role="button"
                tabIndex={0}
                onClick={() => onEdit(a)}
                onKeyDown={(e) => { if (e.key === 'Enter') onEdit(a); }}
              >
                <span className={isActive ? 'text-accent font-medium' : 'font-medium text-fg'}>{a.date}</span>
                <span className="flex items-center gap-2">
                  <span className="text-fg-muted">{formatDistanceOrDash(a.distance)}</span>
                  {onDelete && (
                    <span role="button" tabIndex={0} aria-label="Delete" onClick={(e) => { e.stopPropagation(); handleDelete(a); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleDelete(a); } }} className="text-xs text-fg-muted hover:text-red-500 hover:scale-125 hover:font-bold transition-all">x</span>
                  )}
                </span>
              </div>
            );

            return (
              <li key={a.id ?? a.createdAt} className="group relative">
                {onDelete ? (
                  <SwipeToDelete onDelete={() => handleDelete(a)}>
                    {rowContent}
                  </SwipeToDelete>
                ) : rowContent}
              </li>
            );
          })
        }
      </ul>
      {
        hasMore && (
          <button
            type="button"
            onClick={() => setLimit((prev) => prev + CONFIG.PAGE_SIZE)}
            className="text-xs text-accent font-medium py-1"
          >
            Show more ({sorted.length - limit} remaining)
          </button>
        )
      }
      {
        !hasMore && sorted.length > CONFIG.PAGE_SIZE && (
          <p className="text-xs text-fg-muted text-center py-1">That's all the activities</p>
        )
      }
    </div>
  );
}

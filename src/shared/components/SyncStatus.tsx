import { SyncStatus } from '@/shared/types';
import { useSyncStatus } from '@/shared/hooks/useSyncStatus';

const STATUS_CONFIG: Record<SyncStatus, { color: string; label: string }> = {
  [SyncStatus.Synced]:  { color: 'bg-success',              label: 'Synced'      },
  [SyncStatus.Syncing]: { color: 'bg-warning animate-pulse', label: 'Syncing...' },
  [SyncStatus.Error]:   { color: 'bg-error',                label: 'Sync error'  },
  [SyncStatus.Offline]: { color: 'bg-fg-muted',             label: 'Offline'     },
};

/** Colored dot + label indicating current data sync state */
export function SyncStatusIndicator() {
  const { syncStatus } = useSyncStatus();
  const { color, label } = STATUS_CONFIG[syncStatus];

  return (
    <div className="flex items-center gap-1.5 text-xs text-fg-muted">
      <span className={`size-2 rounded-full ${color}`} />
      {label}
    </div>
  );
}

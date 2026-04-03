import type { SyncStatus } from '@/shared/types';
import { useAuth } from '@/shared/auth/useAuth';

/** Exposes the current sync status and its setter from auth context */
export function useSyncStatus(): {
  syncStatus: SyncStatus;
  setSyncStatus: (status: SyncStatus) => void;
} {
  const { syncStatus, setSyncStatus } = useAuth();
  return { syncStatus, setSyncStatus };
}

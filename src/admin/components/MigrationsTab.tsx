import { useState, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';

import { db } from '@/shared/auth/firebase-config';
import { DbCollection, DbSubcollection } from '@/constants/db';
import { migrateChildDiapersToElimination } from '@/modules/baby/migration/elimination';
import {
  runEliminationMigration,
  type MigrationProgress,
  type MigrationSummary,
} from '@/admin/runEliminationMigration';
import { useAllUsers } from '@/admin/hooks/useAllUsers';
import { useToast } from '@/shared/errors/useToast';
import { ToastType } from '@/shared/types';

/** Fetches child IDs for a single user from Firestore */
async function fetchChildIds(uid: string): Promise<string[]> {
  const childrenRef = collection(
    db,
    `${DbCollection.Users}/${uid}/${DbSubcollection.Children}`,
  );
  const snap = await getDocs(childrenRef);
  return snap.docs.map((d) => d.id);
}

/** Admin one-off migrations panel — currently exposes diaper→elimination backfill */
export function MigrationsTab() {
  const { users, loading: usersLoading } = useAllUsers();
  const { addToast } = useToast();

  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [summary, setSummary] = useState<MigrationSummary | null>(null);

  const handleRun = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setSummary(null);
    setProgress(null);

    const uids = users.map((u) => u.uid);
    const result = await runEliminationMigration(
      {
        listUserUids: async () => uids,
        listChildIds: fetchChildIds,
        migrateChild: migrateChildDiapersToElimination,
      },
      setProgress,
    );

    setSummary(result);
    setRunning(false);
    addToast(
      `Migrated ${result.entriesMigrated} entries across ${result.childrenScanned} children`,
      result.errors.length === 0 ? ToastType.Success : ToastType.Info,
    );
  }, [addToast, running, users]);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-line bg-surface-card p-4 space-y-3">
        <div>
          <h2 className="text-base font-semibold text-fg">Diaper → Elimination backfill</h2>
          <p className="text-sm text-fg-muted mt-1">
            One-time copy of every child&apos;s <code>diapers/*</code> entries into the new{' '}
            <code>elimination/*</code> subcollection. Old entries are not deleted.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRun}
          disabled={running || usersLoading}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-fg-on-accent disabled:opacity-50"
        >
          {running ? 'Running...' : 'Run migration'}
        </button>

        {
          progress && (
            <p className="text-xs text-fg-muted">
              {progress.current} / {progress.total} — {progress.currentLabel}
            </p>
          )
        }

        {
          summary && (
            <div className="rounded-md border border-line bg-surface px-3 py-2 text-sm">
              <p className="font-medium text-fg">Done</p>
              <ul className="mt-1 space-y-0.5 text-xs text-fg-muted">
                <li>Users scanned: {summary.usersScanned}</li>
                <li>Children scanned: {summary.childrenScanned}</li>
                <li>Entries migrated: {summary.entriesMigrated}</li>
                <li>Errors: {summary.errors.length}</li>
              </ul>
              {
                summary.errors.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-fg-muted">View errors</summary>
                    <ul className="mt-1 space-y-1 text-xs text-red-500">
                      {
                        summary.errors.map((e) => (
                          <li key={`${e.uid}-${e.childId}`}>
                            {e.uid.slice(0, 8)}/{e.childId.slice(0, 8)}: {e.error}
                          </li>
                        ))
                      }
                    </ul>
                  </details>
                )
              }
            </div>
          )
        }
      </section>
    </div>
  );
}

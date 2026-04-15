import type { Result } from '@/shared/types';

/** Callbacks the runner depends on — injected so the orchestration is testable without Firestore */
export type MigrationDeps = {
  listUserUids(): Promise<string[]>;
  listChildIds(uid: string): Promise<string[]>;
  migrateChild(uid: string, childId: string): Promise<Result<{ migrated: number }>>;
};

/** Per-child progress event emitted as the runner advances */
export type MigrationProgress = {
  current: number;
  total: number;
  currentLabel: string;
};

/** Final aggregate summary returned to the caller */
export type MigrationSummary = {
  usersScanned: number;
  childrenScanned: number;
  entriesMigrated: number;
  errors: { uid: string; childId: string; error: string }[];
};

/** Builds a short label for progress UI from a uid + childId */
function shortLabel(uid: string, childId: string): string {
  return `${uid.slice(0, 6)}/${childId.slice(0, 6)}`;
}

/** Runs the diaper→elimination migration across every user × every child, accumulating counts */
export async function runEliminationMigration(
  deps: MigrationDeps,
  onProgress?: (p: MigrationProgress) => void,
): Promise<MigrationSummary> {
  const uids = await deps.listUserUids();

  const childrenByUid = new Map<string, string[]>();
  let total = 0;
  for (const uid of uids) {
    const children = await deps.listChildIds(uid);
    childrenByUid.set(uid, children);
    total += children.length;
  }

  let current = 0;
  let entriesMigrated = 0;
  const errors: MigrationSummary['errors'] = [];

  for (const uid of uids) {
    const children = childrenByUid.get(uid) ?? [];
    for (const childId of children) {
      current += 1;
      onProgress?.({ current, total, currentLabel: shortLabel(uid, childId) });
      const res = await deps.migrateChild(uid, childId);
      if (res.ok) entriesMigrated += res.data.migrated;
      else errors.push({ uid, childId, error: res.error });
    }
  }

  return {
    usersScanned: uids.length,
    childrenScanned: total,
    entriesMigrated,
    errors,
  };
}

import { describe, it, expect, vi } from 'vitest';

import { runEliminationMigration } from '@/admin/runEliminationMigration';
import { ok, err } from '@/shared/types';

describe('runEliminationMigration', () => {
  it('returns zero counts when there are no users', async () => {
    const summary = await runEliminationMigration({
      listUserUids: async () => [],
      listChildIds: async () => [],
      migrateChild: async () => ok({ migrated: 0 }),
    });
    expect(summary).toEqual({
      usersScanned: 0,
      childrenScanned: 0,
      entriesMigrated: 0,
      errors: [],
    });
  });

  it('iterates every user × child and accumulates migrated counts', async () => {
    const migrateChild = vi
      .fn()
      .mockResolvedValueOnce(ok({ migrated: 5 }))
      .mockResolvedValueOnce(ok({ migrated: 3 }))
      .mockResolvedValueOnce(ok({ migrated: 0 }));

    const summary = await runEliminationMigration({
      listUserUids: async () => ['userA', 'userB'],
      listChildIds: async (uid) => (uid === 'userA' ? ['c1', 'c2'] : ['c3']),
      migrateChild,
    });

    expect(migrateChild).toHaveBeenCalledTimes(3);
    expect(migrateChild).toHaveBeenNthCalledWith(1, 'userA', 'c1');
    expect(migrateChild).toHaveBeenNthCalledWith(2, 'userA', 'c2');
    expect(migrateChild).toHaveBeenNthCalledWith(3, 'userB', 'c3');
    expect(summary.usersScanned).toBe(2);
    expect(summary.childrenScanned).toBe(3);
    expect(summary.entriesMigrated).toBe(8);
    expect(summary.errors).toEqual([]);
  });

  it('records errors per failing child but continues iterating', async () => {
    const summary = await runEliminationMigration({
      listUserUids: async () => ['u1'],
      listChildIds: async () => ['c1', 'c2', 'c3'],
      migrateChild: async (_uid, childId) => {
        if (childId === 'c2') return err('write failed');
        return ok({ migrated: 4 });
      },
    });
    expect(summary.usersScanned).toBe(1);
    expect(summary.childrenScanned).toBe(3);
    expect(summary.entriesMigrated).toBe(8); // c1 + c3 = 4 + 4
    expect(summary.errors).toEqual([{ uid: 'u1', childId: 'c2', error: 'write failed' }]);
  });

  it('reports progress for each child via the optional callback', async () => {
    const onProgress = vi.fn();
    await runEliminationMigration(
      {
        listUserUids: async () => ['userA'],
        listChildIds: async () => ['cA', 'cB'],
        migrateChild: async () => ok({ migrated: 0 }),
      },
      onProgress,
    );
    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenNthCalledWith(1, { current: 1, total: 2, currentLabel: expect.any(String) });
    expect(onProgress).toHaveBeenNthCalledWith(2, { current: 2, total: 2, currentLabel: expect.any(String) });
  });
});

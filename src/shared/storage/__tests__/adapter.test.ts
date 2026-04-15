import { describe, expect, it, vi } from 'vitest';

import type { StorageAdapter } from '@/shared/storage/adapter';
import type { Result } from '@/shared/types';
import { err, isErr, isOk, ok } from '@/shared/types';

/** Creates an in-memory StorageAdapter for testing */
function createMockAdapter(): StorageAdapter {
  const store = new Map<string, Map<string, Record<string, unknown>>>();

  /** Returns the inner map for a collection, creating it if absent */
  function getCollection(name: string): Map<string, Record<string, unknown>> {
    if (!store.has(name)) {
      store.set(name, new Map());
    }
    return store.get(name)!;
  }

  return {
    async getAll<T>(collection: string): Promise<Result<T[]>> {
      const col = getCollection(collection);
      const items = [...col.values()] as T[];
      return ok(items);
    },

    async getById<T>(collection: string, id: string): Promise<Result<T>> {
      const col = getCollection(collection);
      const item = col.get(id);
      if (!item) {
        return err(`Document ${id} not found in ${collection}`);
      }
      return ok(item as T);
    },

    async save(
      collection: string,
      data: Record<string, unknown> & { id?: string },
    ): Promise<Result<void>> {
      const col = getCollection(collection);
      const id = (data.id as string) ?? crypto.randomUUID();
      col.set(id, { ...data, id });
      return ok(undefined);
    },

    async remove(collection: string, id: string): Promise<Result<void>> {
      const col = getCollection(collection);
      col.delete(id);
      return ok(undefined);
    },

    onSnapshot<T>(_collection: string, _callback: (data: T[]) => void): () => void {
      return vi.fn();
    },
  };
}

describe('StorageAdapter (mock)', () => {
  it('round-trips data through save and getAll', async () => {
    const adapter = createMockAdapter();

    await adapter.save('tasks', { id: 'task-1', title: 'Buy milk' });
    await adapter.save('tasks', { id: 'task-2', title: 'Walk dog' });

    const result = await adapter.getAll<{ id: string; title: string }>('tasks');

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.data).toHaveLength(2);
    expect(result.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'task-1', title: 'Buy milk' }),
        expect.objectContaining({ id: 'task-2', title: 'Walk dog' }),
      ]),
    );
  });

  it('returns err for a missing document in getById', async () => {
    const adapter = createMockAdapter();

    const result = await adapter.getById('tasks', 'nonexistent');

    expect(isErr(result)).toBe(true);
    if (!isErr(result)) return;
    expect(result.error).toContain('nonexistent');
  });

  it('removes a document so it no longer appears in getAll', async () => {
    const adapter = createMockAdapter();

    await adapter.save('tasks', { id: 'task-1', title: 'Buy milk' });
    await adapter.remove('tasks', 'task-1');

    const result = await adapter.getAll<{ id: string; title: string }>('tasks');

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.data).toHaveLength(0);
  });

  it('returns an empty array for an empty collection', async () => {
    const adapter = createMockAdapter();

    const result = await adapter.getAll<unknown>('empty');

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.data).toEqual([]);
  });
});

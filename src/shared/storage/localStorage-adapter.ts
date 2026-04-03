import type { StorageAdapter } from '@/shared/storage/adapter';
import { err, ok } from '@/shared/types';
import type { Result } from '@/shared/types';

type Listener = (data: unknown[]) => void;

/** Namespaced localStorage key for a given base path and collection */
function storageKey(basePath: string, collectionName: string): string {
  return `afp:${basePath}:${collectionName}`;
}

/** Reads a JSON array from localStorage, returning [] on missing or corrupt data */
function readCollection<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch (e) {
    console.warn(`[AFP] Corrupt data in localStorage key "${key}":`, e);
    return [];
  }
}

/** Writes a JSON array to localStorage */
function writeCollection<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

/** Creates a localStorage-backed StorageAdapter for dev/offline mode */
export function createLocalStorageAdapter(basePath: string): StorageAdapter {
  const listeners = new Map<string, Set<Listener>>();

  /** Fires all registered callbacks for a collection with its current data */
  function notify(collectionName: string): void {
    const items = readCollection(storageKey(basePath, collectionName));
    listeners.get(collectionName)?.forEach((cb) => cb(items));
  }

  return {
    async getAll<T>(collectionName: string): Promise<Result<T[]>> {
      return ok(readCollection<T>(storageKey(basePath, collectionName)));
    },

    async getById<T>(collectionName: string, id: string): Promise<Result<T>> {
      const items = readCollection<T & { id: string }>(storageKey(basePath, collectionName));
      const found = items.find((item) => item.id === id);
      return found ? ok(found) : err(`Document ${id} not found in ${collectionName}`);
    },

    async save(
      collectionName: string,
      data: Record<string, unknown> & { id?: string },
    ): Promise<Result<void>> {
      const key = storageKey(basePath, collectionName);
      const id = data.id ?? crypto.randomUUID();
      const items = readCollection<Record<string, unknown>>(key);
      const idx = items.findIndex((item) => item['id'] === id);
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...data, id };
      } else {
        items.push({ ...data, id });
      }
      writeCollection(key, items);
      notify(collectionName);
      return ok(undefined);
    },

    async remove(collectionName: string, id: string): Promise<Result<void>> {
      const key = storageKey(basePath, collectionName);
      const items = readCollection<Record<string, unknown>>(key);
      writeCollection(key, items.filter((item) => item['id'] !== id));
      notify(collectionName);
      return ok(undefined);
    },

    onSnapshot<T>(collectionName: string, callback: (data: T[]) => void, _onError?: (error: Error) => void): () => void {
      if (!listeners.has(collectionName)) {
        listeners.set(collectionName, new Set());
      }
      const cb = callback as Listener;
      listeners.get(collectionName)!.add(cb);
      callback(readCollection<T>(storageKey(basePath, collectionName)));
      return () => {
        listeners.get(collectionName)?.delete(cb);
      };
    },
  };
}

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
} from 'firebase/firestore';

import { db } from '@/shared/auth/firebase-config';
import type { StorageAdapter } from '@/shared/storage/adapter';
import type { Result } from '@/shared/types';
import { err, ok } from '@/shared/types';

/** Creates a Firestore-backed StorageAdapter scoped to the given base path */
export function createFirebaseAdapter(basePath: string): StorageAdapter {
  /** Resolves a collection reference relative to the base path */
  function resolveCollection(name: string) {
    return collection(db, `${basePath}/${name}`);
  }

  /** Resolves a document reference within a collection */
  function resolveDoc(name: string, id: string) {
    return doc(db, `${basePath}/${name}`, id);
  }

  return {
    async getAll<T>(collectionName: string): Promise<Result<T[]>> {
      try {
        const q = query(resolveCollection(collectionName));
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as T,
        );
        return ok(items);
      } catch (e) {
        return err(`Failed to fetch ${collectionName}: ${e instanceof Error ? e.message : String(e)}`);
      }
    },

    async getById<T>(collectionName: string, id: string): Promise<Result<T>> {
      try {
        const snap = await getDoc(resolveDoc(collectionName, id));
        if (!snap.exists()) {
          return err(`Document ${id} not found in ${collectionName}`);
        }
        return ok({ id: snap.id, ...snap.data() } as T);
      } catch (e) {
        return err(`Failed to fetch ${collectionName}/${id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    },

    async save(
      collectionName: string,
      data: Record<string, unknown> & { id?: string },
    ): Promise<Result<void>> {
      try {
        const docId = data.id ?? crypto.randomUUID();
        const ref = resolveDoc(collectionName, docId);
        await setDoc(ref, { ...data, id: docId }, { merge: true });
        return ok(undefined);
      } catch (e) {
        return err(`Failed to save to ${collectionName}: ${e instanceof Error ? e.message : String(e)}`);
      }
    },

    async remove(collectionName: string, id: string): Promise<Result<void>> {
      try {
        await deleteDoc(resolveDoc(collectionName, id));
        return ok(undefined);
      } catch (e) {
        return err(`Failed to delete ${collectionName}/${id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    },

    onSnapshot<T>(
      collectionName: string,
      callback: (data: T[]) => void,
      onError?: (error: Error) => void,
    ): () => void {
      const q = query(resolveCollection(collectionName));
      return onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as T,
          );
          callback(items);
        },
        onError,
      );
    },
  };
}

import { isFirebaseConfigured } from '@/shared/auth/firebase-config';
import { createFirebaseAdapter } from '@/shared/storage/firebase-adapter';
import { createLocalStorageAdapter } from '@/shared/storage/localStorage-adapter';
import type { StorageAdapter } from '@/shared/storage/adapter';

/** Creates a StorageAdapter: Firebase-backed in production, localStorage-backed in dev */
export function createAdapter(basePath: string): StorageAdapter {
  return isFirebaseConfigured
    ? createFirebaseAdapter(basePath)
    : createLocalStorageAdapter(basePath);
}

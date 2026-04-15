import type { Result } from '@/shared/types';

/** Contract for collection-based data persistence */
export interface StorageAdapter {
  /** Retrieves all documents from a collection */
  getAll<T>(collection: string): Promise<Result<T[]>>;

  /** Retrieves a single document by its ID */
  getById<T>(collection: string, id: string): Promise<Result<T>>;

  /** Persists a document, merging with existing data if present */
  save(collection: string, data: Record<string, unknown> & { id?: string }): Promise<Result<void>>;

  /** Deletes a document by its ID */
  remove(collection: string, id: string): Promise<Result<void>>;

  /** Subscribes to real-time updates for a collection, returning an unsubscribe function */
  onSnapshot<T>(
    collection: string,
    callback: (data: T[]) => void,
    onError?: (error: Error) => void,
  ): () => void;
}

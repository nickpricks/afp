import { createAdapter } from '@/shared/storage/create-adapter';
import { childPath } from '@/constants/db';
import { isOk } from '@/shared/types';

/** Logs the same entry to multiple sibling children — fire-and-forget, errors logged to console */
export async function logToSiblings(
  uid: string,
  siblingIds: string[],
  subcollection: string,
  data: Record<string, unknown>,
): Promise<number> {
  let count = 0;
  for (const sibId of siblingIds) {
    const adapter = createAdapter(childPath(uid, sibId));
    const entry = { ...data, id: crypto.randomUUID() };
    const result = await adapter.save(subcollection, entry);
    if (isOk(result)) {
      count++;
    } else {
      console.error(`[AFP] Failed to log to sibling ${sibId}:`, result.error);
    }
  }
  return count;
}

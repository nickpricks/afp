import { createAdapter } from '@/shared/storage/create-adapter';
import { childPath } from '@/constants/db';
import { isOk } from '@/shared/types';

/** Tally of sibling fan-out writes: ok = successful, failed = errored (per-sibling) */
export type SiblingLogResult = { ok: number; failed: number };

/** Logs the same entry to multiple sibling children — returns ok/failed counts, errors logged to console */
export async function logToSiblings(
  uid: string,
  siblingIds: string[],
  subcollection: string,
  data: Record<string, unknown>,
): Promise<SiblingLogResult> {
  let ok = 0;
  let failed = 0;
  for (const sibId of siblingIds) {
    const adapter = createAdapter(childPath(uid, sibId));
    const entry = { ...data, id: crypto.randomUUID() };
    const result = await adapter.save(subcollection, entry);
    if (isOk(result)) {
      ok++;
    } else {
      console.error(`[AFP] Failed to log to sibling ${sibId}:`, result.error);
      failed++;
    }
  }
  return { ok, failed };
}

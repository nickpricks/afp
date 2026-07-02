import { useEffect, useState } from 'react';

import { createAdapter } from '@/shared/storage/create-adapter';
import { DbCollection, ROOT_PATH } from '@/constants/db';
import { familyMemberUids, isOk } from '@/shared/types';
import type { Family } from '@/shared/types';

/** Return shape of {@link useFamily} — the family doc, active member uids, and readiness */
export interface FamilyHandle {
  family: Family | null;
  memberUids: string[];
  ready: boolean;
}

/**
 * Reads the caller's family doc from `families/{familyId}`.
 * One-time fetch per familyId (membership changes are rare and admin-managed —
 * no realtime listener needed in v1; a null/absent familyId resolves immediately).
 */
export function useFamily(familyId: string | null | undefined): FamilyHandle {
  // Keyed by familyId so stale results are discarded by derivation (no sync setState in effect)
  const [loaded, setLoaded] = useState<{ id: string; family: Family | null } | null>(null);

  useEffect(() => {
    if (!familyId) return;
    let cancelled = false;
    const adapter = createAdapter(ROOT_PATH);
    void adapter.getById<Family>(DbCollection.Families, familyId).then((result) => {
      if (cancelled) return;
      setLoaded({ id: familyId, family: isOk(result) ? result.data : null });
    });
    return () => {
      cancelled = true;
    };
  }, [familyId]);

  const family = familyId && loaded?.id === familyId ? loaded.family : null;
  const ready = !familyId || loaded?.id === familyId;
  return { family, memberUids: family ? familyMemberUids(family) : [], ready };
}

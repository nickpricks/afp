import { useEffect, useState } from 'react';

import { createAdapter } from '@/shared/storage/create-adapter';
import { DbCollection, ROOT_PATH } from '@/constants/db';
import type { Family } from '@/shared/types';

/** Lists all family docs with a realtime listener — admin only (rules restrict the collection sweep) */
export function useFamilies(): { families: Family[]; ready: boolean } {
  const [families, setFamilies] = useState<Family[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const adapter = createAdapter(ROOT_PATH);
    return adapter.onSnapshot<Family>(
      DbCollection.Families,
      (data) => {
        setFamilies(data);
        setReady(true);
      },
      () => setReady(true),
    );
  }, []);

  return { families, ready };
}

import { useEffect, useState } from 'react';

import { createAdapter } from '@/shared/storage/create-adapter';
import type { UserProfile } from '@/shared/types';
import { DbCollection } from '@/constants/db';

/** User profile entry with uid */
export type UserEntry = UserProfile & { uid: string };

/** Lists all profiled users — admin only */
export function useAllUsers() {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adapter = createAdapter(DbCollection.Users);

    const unsubscribe = adapter.onSnapshot<Record<string, unknown>>(
      '',
      (items) => {
        const profiles: UserEntry[] = items
          .filter((item) => item['role'] != null)
          .map((item) => ({ ...item, uid: String(item['id'] ?? '') } as unknown as UserEntry));
        setUsers(profiles);
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { users, loading };
}

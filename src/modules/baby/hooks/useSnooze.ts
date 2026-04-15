import { useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';

import { db } from '@/shared/auth/firebase-config';
import { useAuth } from '@/shared/auth/useAuth';
import { SUGGESTION_SNOOZE_DAYS } from '@/modules/baby/stage';
import type { SuggestionFeature } from '@/modules/baby/suggestions';
import { ok, err, type Result } from '@/shared/types';
import { toErrorMessage } from '@/shared/utils/error';

/** Action hook to snooze a suggestion for SUGGESTION_SNOOZE_DAYS days */
export function useSnooze() {
  const { firebaseUser } = useAuth();

  const snooze = useCallback(
    async (childId: string, feature: SuggestionFeature): Promise<Result<void>> => {
      if (!firebaseUser) return err('Not authenticated');
      const future = new Date();
      future.setDate(future.getDate() + SUGGESTION_SNOOZE_DAYS);
      const snoozedUntil = future.toISOString().split('T')[0]!;
      try {
        const ref = doc(db, `users/${firebaseUser.uid}/children/${childId}`);
        await updateDoc(ref, {
          [`suggestionState.${feature}.snoozedUntil`]: snoozedUntil,
        });
        return ok(undefined);
      } catch (e) {
        return err(toErrorMessage(e));
      }
    },
    [firebaseUser],
  );

  return { snooze };
}

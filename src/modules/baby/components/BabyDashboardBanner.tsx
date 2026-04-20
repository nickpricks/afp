import { useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';

import { useAuth } from '@/shared/auth/useAuth';
import { useChildren } from '@/modules/baby/hooks/useChildren';
import { useAllSuggestions } from '@/modules/baby/hooks/useSuggestions';
import { SuggestionBanner } from '@/modules/baby/components/SuggestionBanner';
import { configFieldFor, SuggestionAction } from '@/modules/baby/suggestions';
import type { SuggestionFeature } from '@/modules/baby/suggestions';
import { db } from '@/shared/auth/firebase-config';

interface Props {
  targetUid?: string;
}

/** 
 * Wrapper for the SuggestionBanner on the Dashboard.
 * Handles its own data fetching for the target user.
 */
export function BabyDashboardBanner({ targetUid }: Props) {
  const { firebaseUser } = useAuth();
  const { children } = useChildren(targetUid);
  const allSuggestions = useAllSuggestions(children);

  /** Applies a suggestion by updating the target child's config flag */
  const applySuggestion = useCallback(
    async (childId: string, feature: SuggestionFeature, action: SuggestionAction) => {
      if (!firebaseUser) return;
      const recommendOn = action === SuggestionAction.Enable;
      const field = configFieldFor(feature);
      const uidForWrite = targetUid ?? firebaseUser.uid;
      const ref = doc(db, `users/${uidForWrite}/children/${childId}`);
      await updateDoc(ref, { [`config.${field}`]: recommendOn });
    },
    [firebaseUser, targetUid],
  );

  return (
    <SuggestionBanner suggestions={allSuggestions} onAct={applySuggestion} />
  );
}

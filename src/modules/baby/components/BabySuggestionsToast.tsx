import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { useChildren } from '@/modules/baby/hooks/useChildren';
import { useAllSuggestions } from '@/modules/baby/hooks/useSuggestions';
import { useToast } from '@/shared/errors/useToast';
import { AppPath } from '@/constants/routes';
import { ToastType } from '@/shared/types';

/** 
 * Hidden component that listens for baby suggestions and shows a global toast.
 * Should only be mounted if the Baby module is enabled.
 */
export function BabySuggestionsToast() {
  const navigate = useNavigate();
  const { children } = useChildren();
  const allSuggestions = useAllSuggestions(children);
  const { addToast } = useToast();
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (toastShownRef.current) return;
    if (allSuggestions.length === 0) return;
    toastShownRef.current = true;
    
    const first = allSuggestions[0]!;
    const message =
      allSuggestions.length === 1
        ? `1 suggestion for ${first.childName}`
        : `${allSuggestions.length} suggestions across your children`;
        
    addToast(message, ToastType.Info, {
      action: { label: 'View', onClick: () => navigate(AppPath.Home) },
      durationMs: 6000,
    });
  }, [allSuggestions, addToast, navigate]);

  return null;
}

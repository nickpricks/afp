import { useContext } from 'react';

import { ToastContext, type ToastContextValue } from '@/shared/errors/toast-context';
import { ProviderMsg } from '@/constants/messages';

/** Returns toast actions or throws if used outside ToastProvider */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error(ProviderMsg.ToastRequired);
  }
  return context;
}

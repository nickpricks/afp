import { useContext } from 'react';

import { AuthContext, type AuthContextValue } from '@/shared/auth/auth-context';
import { ProviderMsg } from '@/constants/messages';

/** Returns the current auth context or throws if used outside AuthProvider */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(ProviderMsg.AuthRequired);
  }
  return context;
}

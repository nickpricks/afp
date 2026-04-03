import { Navigate } from 'react-router-dom';

import { useAuth } from '@/shared/auth/useAuth';
import { ROUTES } from '@/constants/routes';

/** Renders children only if the current user is Headminick, otherwise redirects home */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const { isTheAdminNick } = useAuth();

  if (!isTheAdminNick) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <>{children}</>;
}

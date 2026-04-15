import { Navigate } from 'react-router-dom';

import { type ModuleId } from '@/shared/types';
import { useAuth } from '@/shared/auth/useAuth';
import { ROUTES } from '@/constants/routes';

/** Renders children only if the given module is enabled for the current user, otherwise redirects home */
export function ModuleGate({
  moduleId,
  children,
}: {
  moduleId: ModuleId;
  children: React.ReactNode;
}) {
  const { profile } = useAuth();

  if (!profile?.modules[moduleId]) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <>{children}</>;
}

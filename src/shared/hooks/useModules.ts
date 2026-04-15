import { useMemo } from 'react';

import type { ModuleId } from '@/shared/types';
import { ALL_MODULES } from '@/shared/types';
import { useAuth } from '@/shared/auth/useAuth';

/** Returns the list of module IDs enabled for the current user */
export function useModules(): ModuleId[] {
  const { profile } = useAuth();

  return useMemo(() => ALL_MODULES.filter((id) => profile?.modules[id]), [profile]);
}

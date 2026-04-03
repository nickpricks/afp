import type { ModuleConfig, UserProfile, UserRole } from '@/shared/types';
import { DEFAULT_MODULES } from '@/shared/types';
import { CONFIG } from '@/constants/config';

/** Creates a UserProfile with sensible defaults */
export function createDefaultProfile(
  name: string,
  role: UserRole,
  modules: ModuleConfig = DEFAULT_MODULES,
): UserProfile {
  return {
    name,
    role,
    modules,
    theme: CONFIG.DEFAULT_THEME,
    colorMode: 'system',
    createdAt: new Date().toISOString(),
  };
}

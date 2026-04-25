import type { ModuleConfig, UserProfile, UserRole } from '@/shared/types';
import { DEFAULT_MODULES } from '@/shared/types';
import { CONFIG } from '@/constants/config';

/** Creates a UserProfile with sensible defaults */
export function createDefaultProfile(
  name: string,
  role: UserRole,
  modules: ModuleConfig = DEFAULT_MODULES,
): UserProfile {
  const now = new Date().toISOString();
  return {
    role,
    name,
    email: null,
    username: null,
    viewerOf: null,
    theme: CONFIG.DEFAULT_THEME,
    colorMode: 'system',
    effectIntensity: 50,
    modules,
    createdAt: now,
    updatedAt: now,
  };
}

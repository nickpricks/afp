import { describe, it, expect } from 'vitest';

import { DEFAULT_BODY_CONFIG } from '@/modules/body/types';

describe('useBodyConfig defaults', () => {
  it('default config is not configured (empty configuredAt)', () => {
    expect(DEFAULT_BODY_CONFIG.configuredAt).toBe('');
  });

  it('default config enables floors and walking', () => {
    expect(DEFAULT_BODY_CONFIG.floors).toBe(true);
    expect(DEFAULT_BODY_CONFIG.walking).toBe(true);
  });

  it('default config disables running, cycling, yoga', () => {
    expect(DEFAULT_BODY_CONFIG.running).toBe(false);
    expect(DEFAULT_BODY_CONFIG.cycling).toBe(false);
    expect(DEFAULT_BODY_CONFIG.yoga).toBe(false);
  });

  it('default floor height is 3.0m', () => {
    expect(DEFAULT_BODY_CONFIG.floorHeight).toBe(3.0);
  });
});

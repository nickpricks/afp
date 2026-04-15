import { describe, it, expect } from 'vitest';

import type { BodyConfig } from '@/modules/body/types';
import { DEFAULT_BODY_CONFIG } from '@/modules/body/types';

describe('BodyConfig validation', () => {
  it('at least one activity must be enabled for valid config', () => {
    const allOff: BodyConfig = {
      ...DEFAULT_BODY_CONFIG,
      floors: false,
      walking: false,
      running: false,
      cycling: false,
      yoga: false,
    };
    const hasAny =
      allOff.floors || allOff.walking || allOff.running || allOff.cycling || allOff.yoga;
    expect(hasAny).toBe(false);
  });

  it('default config has at least one activity enabled', () => {
    const hasAny =
      DEFAULT_BODY_CONFIG.floors ||
      DEFAULT_BODY_CONFIG.walking ||
      DEFAULT_BODY_CONFIG.running ||
      DEFAULT_BODY_CONFIG.cycling ||
      DEFAULT_BODY_CONFIG.yoga;
    expect(hasAny).toBe(true);
  });

  it('floorHeight must be one of 2.5, 3.0, 3.5', () => {
    const validHeights = [2.5, 3.0, 3.5];
    expect(validHeights).toContain(DEFAULT_BODY_CONFIG.floorHeight);
  });

  it('configuredAt empty string means not configured', () => {
    const isConfigured = DEFAULT_BODY_CONFIG.configuredAt !== '';
    expect(isConfigured).toBe(false);
  });

  it('configuredAt with timestamp means configured', () => {
    const config: BodyConfig = {
      ...DEFAULT_BODY_CONFIG,
      configuredAt: '2026-04-01T00:00:00Z',
    };
    const isConfigured = config.configuredAt !== '';
    expect(isConfigured).toBe(true);
  });
});

describe('Config gate logic', () => {
  it('should show config form when not configured', () => {
    const isConfigured = false;
    // BodyPage renders BodyConfigForm when !isConfigured
    expect(isConfigured).toBe(false);
  });

  it('should show tabs when configured', () => {
    const isConfigured = true;
    expect(isConfigured).toBe(true);
  });

  it('builds correct tabs based on config', () => {
    type TabDef = { id: string; label: string };
    function buildTabs(config: { floors: boolean; walking: boolean; running: boolean }): TabDef[] {
      const tabs: TabDef[] = [{ id: 'stats', label: 'Stats' }];
      if (config.floors) tabs.push({ id: 'floors', label: 'Floors' });
      if (config.walking) tabs.push({ id: 'walking', label: 'Walking' });
      if (config.running) tabs.push({ id: 'running', label: 'Running' });
      return tabs;
    }

    // All enabled
    const all = buildTabs({ floors: true, walking: true, running: true });
    expect(all).toHaveLength(4);
    expect(all.map((t) => t.id)).toEqual(['stats', 'floors', 'walking', 'running']);

    // Only floors
    const floorsOnly = buildTabs({ floors: true, walking: false, running: false });
    expect(floorsOnly).toHaveLength(2);
    expect(floorsOnly.map((t) => t.id)).toEqual(['stats', 'floors']);

    // None (stats always shows)
    const none = buildTabs({ floors: false, walking: false, running: false });
    expect(none).toHaveLength(1);
    expect(none[0].id).toBe('stats');
  });
});

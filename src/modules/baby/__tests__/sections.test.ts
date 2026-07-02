import { describe, expect, it } from 'vitest';

import { computeChildSections, isArchivedSection, SectionGroup } from '@/modules/baby/sections';
import type { DataPresence } from '@/modules/baby/sections';
import type { ChildConfig } from '@/modules/baby/types';

const ALL_PRESENT: DataPresence = { feeds: true, sleep: true, elimination: true };

/** Full-featured config fixture (all modules on, nothing archived) */
const FULL: ChildConfig = {
  feeding: true,
  sleep: true,
  growth: true,
  diapers: true,
  potty: true,
  meals: true,
  needs: true,
  milestones: true,
  presents: true,
};

/** Extracts ids for a group */
const idsIn = (config: ChildConfig, presence: DataPresence, group: SectionGroup) =>
  computeChildSections(config, presence)
    .filter((s) => s.group === group)
    .map((s) => s.id);

/** Tests grouped nav derivation — gating, retirement, Needs→Presents merge */
describe('computeChildSections', () => {
  it('always includes Overview (dashboard + journal)', () => {
    const config: ChildConfig = { feeding: false, sleep: false, growth: false, diapers: false };
    expect(idsIn(config, ALL_PRESENT, SectionGroup.Overview)).toEqual(['dashboard', 'journal']);
    expect(idsIn(config, ALL_PRESENT, SectionGroup.Logs)).toEqual([]);
  });

  it('gates Logs by config and has no separate needs section (merged into presents)', () => {
    const ids = idsIn(FULL, ALL_PRESENT, SectionGroup.Logs);
    expect(ids).toEqual(['feeding', 'sleep', 'growth', 'diapers', 'meals', 'milestones', 'presents']);
    expect(ids).not.toContain('needs');
  });

  it('shows presents when only needs is enabled (merge visibility)', () => {
    const config: ChildConfig = {
      feeding: false,
      sleep: false,
      growth: false,
      diapers: false,
      needs: true,
    };
    expect(idsIn(config, ALL_PRESENT, SectionGroup.Logs)).toEqual(['presents']);
  });

  it('moves retired sections from Logs to Archived — retirement wins over config', () => {
    const config: ChildConfig = { ...FULL, archived: { feeds: true, sleep: true } };
    expect(idsIn(config, ALL_PRESENT, SectionGroup.Logs)).not.toContain('feeding');
    expect(idsIn(config, ALL_PRESENT, SectionGroup.Logs)).not.toContain('sleep');
    expect(idsIn(config, ALL_PRESENT, SectionGroup.Archived)).toEqual(['feeding', 'sleep']);
  });

  it('archived requires data presence', () => {
    const config: ChildConfig = { ...FULL, archived: { elimination: true } };
    const noData: DataPresence = { feeds: true, sleep: true, elimination: false };
    expect(idsIn(config, noData, SectionGroup.Archived)).toEqual([]);
  });

  it('absent archived map behaves exactly as before (nothing archived)', () => {
    const sections = computeChildSections(FULL, ALL_PRESENT);
    expect(sections.filter((s) => s.group === SectionGroup.Archived)).toEqual([]);
  });

  it('elimination label follows mode flags', () => {
    const pottyOnly: ChildConfig = { feeding: false, sleep: false, growth: false, diapers: false, potty: true };
    const section = computeChildSections(pottyOnly, ALL_PRESENT).find((s) => s.id === 'diapers');
    expect(section?.label).toBe('Potty');
  });
});

/** Tests the archived-section lookup helper */
describe('isArchivedSection', () => {
  it('detects archived vs active ids', () => {
    const config: ChildConfig = { ...FULL, archived: { feeds: true } };
    const sections = computeChildSections(config, ALL_PRESENT);
    expect(isArchivedSection(sections, 'feeding')).toBe(true);
    expect(isArchivedSection(sections, 'sleep')).toBe(false);
  });
});

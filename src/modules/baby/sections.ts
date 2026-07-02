import type { ChildConfig } from '@/modules/baby/types';

/** Nav group identifiers for the child drawer/sidebar */
export enum SectionGroup {
  Overview = 'overview',
  Logs = 'logs',
  Archived = 'archived',
}

/** Section identifiers — mirrors the ChildDetail TabId union (needs merged into presents) */
export type SectionId =
  | 'dashboard'
  | 'journal'
  | 'feeding'
  | 'sleep'
  | 'growth'
  | 'diapers'
  | 'meals'
  | 'milestones'
  | 'presents';

/** One nav entry in the grouped child navigation */
export type ChildSection = {
  id: SectionId;
  label: string;
  icon: string;
  group: SectionGroup;
};

/** Per-subcollection data presence — archived sections only render when data exists */
export type DataPresence = {
  feeds: boolean;
  sleep: boolean;
  elimination: boolean;
};

/** Resolves the elimination section label from the mode flags */
const eliminationLabel = (diapersOn: boolean, pottyOn: boolean): string => {
  return diapersOn && pottyOn ? 'Elimination' : pottyOn ? 'Potty' : 'Diapers';
};

/**
 * Computes the grouped nav model for a child (Family Umbrella Pillar 3):
 * Overview (Dashboard, Journal) always; Logs = config-gated active sections
 * (Needs merged into Presents — no separate section); Archived = retired
 * (config.archived.X) AND has data. A retired section leaves Logs even when
 * its config flag is still on — retirement wins.
 */
export const computeChildSections = (
  config: ChildConfig,
  presence: DataPresence,
): ChildSection[] => {
  const archived = config.archived ?? {};
  const diapersOn = config.diapers;
  const pottyOn = config.potty ?? false;
  const elimLabel = eliminationLabel(diapersOn, pottyOn);

  const sections: ChildSection[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠', group: SectionGroup.Overview },
    { id: 'journal', label: 'Journal', icon: '📖', group: SectionGroup.Overview },
  ];

  // Active logs — config-gated AND not retired
  if (config.feeding && !archived.feeds) {
    sections.push({ id: 'feeding', label: 'Feeding', icon: '🍼', group: SectionGroup.Logs });
  }
  if (config.sleep && !archived.sleep) {
    sections.push({ id: 'sleep', label: 'Sleep', icon: '😴', group: SectionGroup.Logs });
  }
  if (config.growth) {
    sections.push({ id: 'growth', label: 'Growth', icon: '📏', group: SectionGroup.Logs });
  }
  if ((diapersOn || pottyOn) && !archived.elimination) {
    sections.push({ id: 'diapers', label: elimLabel, icon: '🧷', group: SectionGroup.Logs });
  }
  if (config.meals) {
    sections.push({ id: 'meals', label: 'Meals', icon: '🍽', group: SectionGroup.Logs });
  }
  if (config.milestones) {
    sections.push({ id: 'milestones', label: 'Milestones', icon: '🌟', group: SectionGroup.Logs });
  }
  // Needs merged into Presents — Presents shows when either flag is on
  if ((config.presents ?? false) || (config.needs ?? false)) {
    sections.push({ id: 'presents', label: 'Presents', icon: '🎁', group: SectionGroup.Logs });
  }

  // Archived — retired AND has data (read-only render)
  if (archived.feeds && presence.feeds) {
    sections.push({ id: 'feeding', label: 'Feeding', icon: '🍼', group: SectionGroup.Archived });
  }
  if (archived.sleep && presence.sleep) {
    sections.push({ id: 'sleep', label: 'Sleep', icon: '😴', group: SectionGroup.Archived });
  }
  if (archived.elimination && presence.elimination) {
    sections.push({ id: 'diapers', label: elimLabel, icon: '🧷', group: SectionGroup.Archived });
  }

  return sections;
};

/** True when the given section id is in the Archived group of the section model */
export const isArchivedSection = (sections: ChildSection[], id: SectionId): boolean => {
  return sections.some((s) => s.id === id && s.group === SectionGroup.Archived);
};

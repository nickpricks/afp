import { monthsOldFromDob, SUGGEST_THRESHOLDS } from '@/modules/baby/stage';
import type { Child } from '@/modules/baby/types';

/** Which feature toggle a suggestion targets */
export type SuggestionFeature = 'feeds' | 'diapers' | 'meals' | 'potty';

/** Whether suggestion recommends enabling or disabling */
export enum SuggestionAction {
  Enable = 0,
  Disable = 1,
}

/** Active suggestion ready to render */
export type Suggestion = {
  childId: string;
  childName: string;
  feature: SuggestionFeature;
  action: SuggestionAction;
};

/** Returns the ChildConfig field name for a feature */
export function configFieldFor(feature: SuggestionFeature): keyof Child['config'] {
  if (feature === 'feeds') return 'feeding';
  return feature;
}

/** Returns today's date as YYYY-MM-DD */
function todayYmd(): string {
  return new Date().toISOString().split('T')[0]!;
}

/** Pure function — returns active suggestions for a child */
export function computeActiveSuggestions(child: Child): Suggestion[] {
  const months = monthsOldFromDob(child.dob);
  const config = child.config;
  const snoozeState = child.suggestionState ?? {};
  const today = todayYmd();
  const result: Suggestion[] = [];

  function isSnoozed(feature: SuggestionFeature): boolean {
    const snooze = snoozeState[feature];
    return snooze !== undefined && snooze.snoozedUntil > today;
  }

  function maybeAdd(feature: SuggestionFeature, action: SuggestionAction, currentlyOn: boolean) {
    const recommendOn = action === SuggestionAction.Enable;
    if (currentlyOn === recommendOn) return;
    if (isSnoozed(feature)) return;
    result.push({
      childId: child.id ?? '',
      childName: child.name,
      feature,
      action,
    });
  }

  if (months >= SUGGEST_THRESHOLDS.meals.suggestOn) {
    maybeAdd('meals', SuggestionAction.Enable, config.meals ?? false);
  }
  if (months >= SUGGEST_THRESHOLDS.potty.suggestOn) {
    maybeAdd('potty', SuggestionAction.Enable, config.potty ?? false);
  }
  if (months >= SUGGEST_THRESHOLDS.feeds.suggestOff) {
    maybeAdd('feeds', SuggestionAction.Disable, config.feeding);
  }
  if (months >= SUGGEST_THRESHOLDS.diapers.suggestOff) {
    maybeAdd('diapers', SuggestionAction.Disable, config.diapers);
  }

  return result;
}

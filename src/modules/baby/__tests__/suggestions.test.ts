import { describe, it, expect } from 'vitest';

import { computeActiveSuggestions, SuggestionAction } from '@/modules/baby/suggestions';
import type { Child } from '@/modules/baby/types';

function makeChild(
  monthsOld: number,
  configOverrides: Partial<Child['config']> = {},
  snooze?: Child['suggestionState'],
): Child {
  const dob = new Date();
  dob.setMonth(dob.getMonth() - monthsOld);
  return {
    id: 'c1',
    name: 'Test',
    dob: dob.toISOString().split('T')[0]!,
    config: {
      feeding: true,
      sleep: true,
      growth: true,
      diapers: true,
      meals: false,
      potty: false,
      milestones: false,
      needs: false,
      ...configOverrides,
    },
    createdAt: '',
    updatedAt: '',
    suggestionState: snooze,
  };
}

describe('computeActiveSuggestions', () => {
  it('returns no suggestions for newborn with default config', () => {
    expect(computeActiveSuggestions(makeChild(1))).toHaveLength(0);
  });

  it('suggests enabling meals at 9mo', () => {
    const sug = computeActiveSuggestions(makeChild(10));
    expect(sug.find((s) => s.feature === 'meals')?.action).toBe(SuggestionAction.Enable);
  });

  it('does not suggest meals if already enabled', () => {
    const sug = computeActiveSuggestions(makeChild(10, { meals: true }));
    expect(sug.find((s) => s.feature === 'meals')).toBeUndefined();
  });

  it('suggests disabling feeds after 18mo', () => {
    const sug = computeActiveSuggestions(makeChild(20));
    expect(sug.find((s) => s.feature === 'feeds')?.action).toBe(SuggestionAction.Disable);
  });

  it('suggests enabling potty at 24mo', () => {
    const sug = computeActiveSuggestions(makeChild(25));
    expect(sug.find((s) => s.feature === 'potty')?.action).toBe(SuggestionAction.Enable);
  });

  it('suggests disabling diapers after 30mo', () => {
    const sug = computeActiveSuggestions(makeChild(32));
    expect(sug.find((s) => s.feature === 'diapers')?.action).toBe(SuggestionAction.Disable);
  });

  it('hides snoozed suggestions', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const sug = computeActiveSuggestions(
      makeChild(20, {}, { feeds: { snoozedUntil: future.toISOString().split('T')[0]! } }),
    );
    expect(sug.find((s) => s.feature === 'feeds')).toBeUndefined();
  });

  it('shows expired-snooze suggestions', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    const sug = computeActiveSuggestions(
      makeChild(20, {}, { feeds: { snoozedUntil: past.toISOString().split('T')[0]! } }),
    );
    expect(sug.find((s) => s.feature === 'feeds')?.action).toBe(SuggestionAction.Disable);
  });
});

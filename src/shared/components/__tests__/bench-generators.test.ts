import { describe, it, expect, beforeEach } from 'vitest';
import { benchMeal, benchNeed, benchMilestone, BASE, ensureChild } from '../bench-generators';

beforeEach(() => {
  localStorage.clear();
});

describe('benchMeal', () => {
  it('creates a meal entry under children/{id}/meals', () => {
    const childId = ensureChild();
    const id = benchMeal();
    expect(id).toBeTruthy();
    const key = `afp:users/dev-user/children/${childId}:meals`;
    const stored = JSON.parse(localStorage.getItem(key) ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(id);
  });

  it('honors a custom date param', () => {
    ensureChild();
    const id = benchMeal('2026-04-15');
    const childId = ensureChild();
    const key = `afp:users/dev-user/children/${childId}:meals`;
    const stored = JSON.parse(localStorage.getItem(key) ?? '[]');
    const entry = stored.find((e: { id: string }) => e.id === id);
    expect(entry.date).toBe('2026-04-15');
  });
});

describe('benchNeed', () => {
  it('creates a need entry under children/{id}/needs', () => {
    const childId = ensureChild();
    const id = benchNeed();
    const key = `afp:users/dev-user/children/${childId}:needs`;
    const stored = JSON.parse(localStorage.getItem(key) ?? '[]');
    expect(stored.find((e: { id: string }) => e.id === id)).toBeDefined();
  });
});

describe('benchMilestone', () => {
  it('creates a milestone entry under children/{id}/milestones', () => {
    const childId = ensureChild();
    const id = benchMilestone();
    const key = `afp:users/dev-user/children/${childId}:milestones`;
    const stored = JSON.parse(localStorage.getItem(key) ?? '[]');
    expect(stored.find((e: { id: string }) => e.id === id)).toBeDefined();
  });
});

export { BASE };

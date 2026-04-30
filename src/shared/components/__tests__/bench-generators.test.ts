import { describe, it, expect, beforeEach } from 'vitest';
import { benchMeal, BASE, ensureChild } from '../bench-generators';

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

export { BASE };

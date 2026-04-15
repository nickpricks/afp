import { describe, it, expect } from 'vitest';

import { MILESTONE_TEMPLATES } from '@/modules/baby/milestone-templates';
import { MilestoneCategory } from '@/modules/baby/types';

describe('MILESTONE_TEMPLATES', () => {
  it('contains at least 8 templates', () => {
    expect(MILESTONE_TEMPLATES.length).toBeGreaterThanOrEqual(8);
  });

  it('every template has a non-empty title', () => {
    for (const t of MILESTONE_TEMPLATES) {
      expect(t.title.length).toBeGreaterThan(0);
    }
  });

  it('every template has a valid category enum value', () => {
    const validValues = Object.values(MilestoneCategory).filter((v) => typeof v === 'number');
    for (const t of MILESTONE_TEMPLATES) {
      expect(validValues).toContain(t.category);
    }
  });

  it('includes "First word" with Language category', () => {
    const t = MILESTONE_TEMPLATES.find((x) => x.title === 'First word');
    expect(t).toBeDefined();
    expect(t?.category).toBe(MilestoneCategory.Language);
  });

  it('includes "First steps" with Motor category', () => {
    const t = MILESTONE_TEMPLATES.find((x) => x.title === 'First steps');
    expect(t).toBeDefined();
    expect(t?.category).toBe(MilestoneCategory.Motor);
  });

  it('has unique titles', () => {
    const titles = MILESTONE_TEMPLATES.map((t) => t.title);
    const unique = new Set(titles);
    expect(unique.size).toBe(titles.length);
  });
});

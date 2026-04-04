import { describe, it, expect } from 'vitest';

import {
  validateFeedEntry,
  validateSleepEntry,
  validateGrowthEntry,
  validateDiaperEntry,
} from '@/modules/baby/validation';
import { isOk, isErr } from '@/shared/types';

describe('validateFeedEntry', () => {
  it('accepts valid feed entry', () => {
    expect(isOk(validateFeedEntry({ date: '2026-04-04', type: 'Bottle' }))).toBe(true);
  });

  it('rejects empty date', () => {
    expect(isErr(validateFeedEntry({ date: '', type: 'Bottle' }))).toBe(true);
  });

  it('rejects invalid date format', () => {
    expect(isErr(validateFeedEntry({ date: '04-04-2026', type: 'Bottle' }))).toBe(true);
  });

  it('rejects invalid feed type', () => {
    expect(isErr(validateFeedEntry({ date: '2026-04-04', type: 'Juice' }))).toBe(true);
  });
});

describe('validateSleepEntry', () => {
  it('accepts valid sleep entry', () => {
    expect(isOk(validateSleepEntry({ date: '2026-04-04', type: 'Nap', quality: 'Good' }))).toBe(true);
  });

  it('accepts empty quality', () => {
    expect(isOk(validateSleepEntry({ date: '2026-04-04', type: 'Night', quality: '' }))).toBe(true);
  });

  it('rejects invalid sleep type', () => {
    expect(isErr(validateSleepEntry({ date: '2026-04-04', type: 'Siesta', quality: '' }))).toBe(true);
  });

  it('rejects invalid quality', () => {
    expect(isErr(validateSleepEntry({ date: '2026-04-04', type: 'Nap', quality: 'Excellent' }))).toBe(true);
  });
});

describe('validateGrowthEntry', () => {
  it('accepts valid growth entry', () => {
    expect(isOk(validateGrowthEntry({ date: '2026-04-04', weight: 5.5 }))).toBe(true);
  });

  it('rejects zero weight', () => {
    expect(isErr(validateGrowthEntry({ date: '2026-04-04', weight: 0 }))).toBe(true);
  });

  it('rejects negative weight', () => {
    expect(isErr(validateGrowthEntry({ date: '2026-04-04', weight: -1 }))).toBe(true);
  });
});

describe('validateDiaperEntry', () => {
  it('accepts valid diaper entry', () => {
    expect(isOk(validateDiaperEntry({ date: '2026-04-04', type: 'Wet' }))).toBe(true);
  });

  it('accepts all diaper types', () => {
    expect(isOk(validateDiaperEntry({ date: '2026-04-04', type: 'Dirty' }))).toBe(true);
    expect(isOk(validateDiaperEntry({ date: '2026-04-04', type: 'Mixed' }))).toBe(true);
  });

  it('rejects invalid diaper type', () => {
    expect(isErr(validateDiaperEntry({ date: '2026-04-04', type: 'Clean' }))).toBe(true);
  });
});

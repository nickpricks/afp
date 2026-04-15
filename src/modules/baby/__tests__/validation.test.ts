import { describe, it, expect } from 'vitest';

import {
  validateFeedEntry,
  validateSleepEntry,
  validateGrowthEntry,
  validateDiaperEntry,
  validateChild,
} from '@/modules/baby/validation';
import { FeedType, SleepType, SleepQuality, DiaperType } from '@/modules/baby/types';
import { isOk, isErr } from '@/shared/types';

describe('validateFeedEntry', () => {
  it('accepts valid feed entry', () => {
    expect(isOk(validateFeedEntry({ date: '2026-04-04', type: FeedType.Bottle }))).toBe(true);
  });

  it('rejects empty date', () => {
    expect(isErr(validateFeedEntry({ date: '', type: FeedType.Bottle }))).toBe(true);
  });

  it('rejects invalid date format', () => {
    expect(isErr(validateFeedEntry({ date: '04-04-2026', type: FeedType.Bottle }))).toBe(true);
  });

  it('accepts all feed types', () => {
    expect(isOk(validateFeedEntry({ date: '2026-04-04', type: FeedType.BreastLeft }))).toBe(true);
    expect(isOk(validateFeedEntry({ date: '2026-04-04', type: FeedType.SolidFood }))).toBe(true);
  });
});

describe('validateSleepEntry', () => {
  it('accepts valid sleep entry', () => {
    expect(
      isOk(
        validateSleepEntry({ date: '2026-04-04', type: SleepType.Nap, quality: SleepQuality.Good }),
      ),
    ).toBe(true);
  });

  it('accepts null quality', () => {
    expect(
      isOk(validateSleepEntry({ date: '2026-04-04', type: SleepType.Night, quality: null })),
    ).toBe(true);
  });

  it('rejects invalid date', () => {
    expect(isErr(validateSleepEntry({ date: '', type: SleepType.Nap, quality: null }))).toBe(true);
  });
});

describe('validateGrowthEntry', () => {
  it('accepts valid growth entry', () => {
    expect(isOk(validateGrowthEntry({ date: '2026-04-04', weight: 5.5 }))).toBe(true);
  });

  it('accepts null weight', () => {
    expect(isOk(validateGrowthEntry({ date: '2026-04-04', weight: null }))).toBe(true);
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
    expect(isOk(validateDiaperEntry({ date: '2026-04-04', type: DiaperType.Wet }))).toBe(true);
  });

  it('accepts all diaper types', () => {
    expect(isOk(validateDiaperEntry({ date: '2026-04-04', type: DiaperType.Dirty }))).toBe(true);
    expect(isOk(validateDiaperEntry({ date: '2026-04-04', type: DiaperType.Mixed }))).toBe(true);
  });

  it('rejects invalid date', () => {
    expect(isErr(validateDiaperEntry({ date: '', type: DiaperType.Wet }))).toBe(true);
  });
});

describe('validateChild', () => {
  it('accepts valid child input', () => {
    expect(isOk(validateChild({ name: 'Baby', dob: '2026-01-15' }))).toBe(true);
  });

  it('rejects empty name', () => {
    expect(isErr(validateChild({ name: '', dob: '2026-01-15' }))).toBe(true);
  });

  it('rejects whitespace-only name', () => {
    expect(isErr(validateChild({ name: '   ', dob: '2026-01-15' }))).toBe(true);
  });

  it('rejects empty dob', () => {
    expect(isErr(validateChild({ name: 'Baby', dob: '' }))).toBe(true);
  });

  it('rejects invalid dob format', () => {
    expect(isErr(validateChild({ name: 'Baby', dob: '01-15-2026' }))).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';

import { FeedType, SleepType, SleepQuality, DiaperType } from '@/modules/baby/types';
import type {
  Child,
  ChildConfig,
  FeedEntry,
  SleepEntry,
  GrowthEntry,
  DiaperEntry,
} from '@/modules/baby/types';

describe('FeedType enum', () => {
  it('has all expected values', () => {
    expect(FeedType.Bottle).toBe(0);
    expect(FeedType.BreastLeft).toBe(1);
    expect(FeedType.BreastRight).toBe(2);
    expect(FeedType.BreastBoth).toBe(3);
    expect(FeedType.SolidFood).toBe(4);
  });

  it('supports reverse mapping', () => {
    expect(FeedType[0]).toBe('Bottle');
    expect(FeedType[4]).toBe('SolidFood');
  });
});

describe('SleepType enum', () => {
  it('has nap and night values', () => {
    expect(SleepType.Nap).toBe(0);
    expect(SleepType.Night).toBe(1);
  });
});

describe('SleepQuality enum', () => {
  it('has good, fair, and poor values', () => {
    expect(SleepQuality.Good).toBe(0);
    expect(SleepQuality.Fair).toBe(1);
    expect(SleepQuality.Poor).toBe(2);
  });
});

describe('DiaperType enum', () => {
  it('has wet, dirty, and mixed values', () => {
    expect(DiaperType.Wet).toBe(0);
    expect(DiaperType.Dirty).toBe(1);
    expect(DiaperType.Mixed).toBe(2);
  });
});

describe('Child type shape', () => {
  it('satisfies the Child type with all fields', () => {
    const config: ChildConfig = {
      feeding: true,
      sleep: true,
      growth: false,
      diapers: true,
    };
    const child: Child = {
      id: 'abc-123',
      name: 'Baby',
      dob: '2026-01-15',
      config,
      createdAt: '2026-01-15T00:00:00.000Z',
      updatedAt: '2026-01-15T00:00:00.000Z',
    };
    expect(child.name).toBe('Baby');
    expect(child.config.growth).toBe(false);
  });

  it('allows optional id', () => {
    const child: Child = {
      name: 'Baby',
      dob: '2026-01-15',
      config: { feeding: true, sleep: true, growth: true, diapers: true },
      createdAt: '2026-01-15T00:00:00.000Z',
      updatedAt: '2026-01-15T00:00:00.000Z',
    };
    expect(child.id).toBeUndefined();
  });
});

describe('Entry types use enums', () => {
  it('FeedEntry uses FeedType', () => {
    const entry: FeedEntry = {
      id: '1',
      date: '2026-04-06',
      time: '10:00',
      type: FeedType.Bottle,
      amount: 120,
      timestamp: '2026-04-06T10:00:00.000Z',
      createdAt: '2026-04-06T10:00:00.000Z',
      notes: '',
    };
    expect(entry.type).toBe(FeedType.Bottle);
    expect(entry.amount).toBe(120);
  });

  it('FeedEntry amount can be null', () => {
    const entry: FeedEntry = {
      id: '1',
      date: '2026-04-06',
      time: '10:00',
      type: FeedType.BreastLeft,
      amount: null,
      timestamp: '2026-04-06T10:00:00.000Z',
      createdAt: '2026-04-06T10:00:00.000Z',
      notes: '',
    };
    expect(entry.amount).toBeNull();
  });

  it('SleepEntry uses SleepType and SleepQuality', () => {
    const entry: SleepEntry = {
      id: '1',
      date: '2026-04-06',
      startTime: '20:00',
      endTime: '06:00',
      type: SleepType.Night,
      quality: SleepQuality.Good,
      timestamp: '2026-04-06T20:00:00.000Z',
      createdAt: '2026-04-06T20:00:00.000Z',
      notes: '',
    };
    expect(entry.type).toBe(SleepType.Night);
    expect(entry.quality).toBe(SleepQuality.Good);
  });

  it('SleepEntry quality can be null', () => {
    const entry: SleepEntry = {
      id: '1',
      date: '2026-04-06',
      startTime: '14:00',
      endTime: '15:30',
      type: SleepType.Nap,
      quality: null,
      timestamp: '2026-04-06T14:00:00.000Z',
      createdAt: '2026-04-06T14:00:00.000Z',
      notes: '',
    };
    expect(entry.quality).toBeNull();
  });

  it('GrowthEntry measurements can be null', () => {
    const entry: GrowthEntry = {
      id: '1',
      date: '2026-04-06',
      weight: null,
      height: 55,
      headCircumference: null,
      createdAt: '2026-04-06T00:00:00.000Z',
      notes: '',
    };
    expect(entry.weight).toBeNull();
    expect(entry.height).toBe(55);
  });

  it('DiaperEntry uses DiaperType', () => {
    const entry: DiaperEntry = {
      id: '1',
      date: '2026-04-06',
      time: '08:00',
      type: DiaperType.Mixed,
      timestamp: '2026-04-06T08:00:00.000Z',
      createdAt: '2026-04-06T08:00:00.000Z',
      notes: '',
    };
    expect(entry.type).toBe(DiaperType.Mixed);
  });
});

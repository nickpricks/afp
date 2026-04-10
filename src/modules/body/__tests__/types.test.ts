import { describe, it, expect } from 'vitest';

import { ActivityType } from '@/shared/types';
import type { BodyConfig, BodyRecord, BodyActivity } from '@/modules/body/types';
import { DEFAULT_BODY_CONFIG } from '@/modules/body/types';

describe('ActivityType (shared)', () => {
  it('has walk, run, cycle, yoga values', () => {
    expect(ActivityType.Walk).toBe('walk');
    expect(ActivityType.Run).toBe('run');
    expect(ActivityType.Cycle).toBe('cycle');
    expect(ActivityType.Yoga).toBe('yoga');
  });
});

describe('BodyConfig', () => {
  it('DEFAULT_BODY_CONFIG has expected defaults', () => {
    expect(DEFAULT_BODY_CONFIG.floors).toBe(true);
    expect(DEFAULT_BODY_CONFIG.walking).toBe(true);
    expect(DEFAULT_BODY_CONFIG.running).toBe(false);
    expect(DEFAULT_BODY_CONFIG.cycling).toBe(false);
    expect(DEFAULT_BODY_CONFIG.yoga).toBe(false);
    expect(DEFAULT_BODY_CONFIG.floorHeight).toBe(3.0);
    expect(DEFAULT_BODY_CONFIG.configuredAt).toBe('');
  });

  it('satisfies BodyConfig interface shape', () => {
    const config: BodyConfig = {
      floors: true,
      walking: true,
      running: true,
      cycling: false,
      yoga: false,
      floorHeight: 2.5,
      configuredAt: '2026-04-01T00:00:00Z',
    };
    expect(config.floorHeight).toBe(2.5);
  });
});

describe('BodyRecord', () => {
  it('has flattened floors (up/down at top level)', () => {
    const record: BodyRecord = {
      dateStr: '2026-04-01',
      up: 10,
      down: 5,
      walkMeters: 500,
      runMeters: 200,
      total: 15,
      updatedAt: '2026-04-01T12:00:00Z',
    };
    expect(record.up).toBe(10);
    expect(record.down).toBe(5);
    expect(record.updatedAt).toBeTruthy();
  });

  it('does not have an id field (Firestore uses dateKey)', () => {
    const record: BodyRecord = {
      dateStr: '2026-04-01',
      up: 0,
      down: 0,
      walkMeters: 0,
      runMeters: 0,
      total: 0,
      updatedAt: '',
    };
    expect('id' in record).toBe(false);
  });
});

describe('BodyActivity', () => {
  it('supports nullable distance and duration', () => {
    const activity: BodyActivity = {
      id: 'test-id',
      type: ActivityType.Walk,
      distance: null,
      duration: 30,
      date: '2026-04-01',
      timestamp: '2026-04-01T10:00:00Z',
      createdAt: '10:00',
    };
    expect(activity.distance).toBeNull();
    expect(activity.duration).toBe(30);
  });

  it('has optional id', () => {
    const activity: BodyActivity = {
      type: ActivityType.Yoga,
      distance: null,
      duration: 60,
      date: '2026-04-01',
      timestamp: '2026-04-01T10:00:00Z',
      createdAt: '10:00',
    };
    expect(activity.id).toBeUndefined();
  });
});

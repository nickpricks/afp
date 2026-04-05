import { describe, it, expect } from 'vitest';

import { ActivityType, ALL_ACTIVITY_TYPES } from '@/modules/body/types';

describe('ActivityType', () => {
  it('has walk and run values', () => {
    expect(ActivityType.Walk).toBe('walk');
    expect(ActivityType.Run).toBe('run');
  });

  it('ALL_ACTIVITY_TYPES includes all types', () => {
    expect(ALL_ACTIVITY_TYPES).toContain(ActivityType.Walk);
    expect(ALL_ACTIVITY_TYPES).toContain(ActivityType.Run);
    expect(ALL_ACTIVITY_TYPES).toHaveLength(2);
  });
});

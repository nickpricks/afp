import { describe, it, expect } from 'vitest';

import { BODY_DEFAULTS, SCORING_WEIGHTS, ACTIVITY_LABELS } from '@/modules/body/constants';
import { ActivityType } from '@/modules/body/types';

describe('BODY_DEFAULTS', () => {
  it('has positive floor height', () => {
    expect(BODY_DEFAULTS.FLOOR_HEIGHT_M).toBeGreaterThan(0);
  });

  it('walk stride is less than run stride', () => {
    expect(BODY_DEFAULTS.WALK_STRIDE_M).toBeLessThan(BODY_DEFAULTS.RUN_STRIDE_M);
  });
});

describe('SCORING_WEIGHTS', () => {
  it('floor up scores more than floor down', () => {
    expect(SCORING_WEIGHTS.FLOOR_UP).toBeGreaterThan(SCORING_WEIGHTS.FLOOR_DOWN);
  });

  it('running scores more per 100m than walking', () => {
    expect(SCORING_WEIGHTS.RUN_PER_100M).toBeGreaterThan(SCORING_WEIGHTS.WALK_PER_100M);
  });
});

describe('ACTIVITY_LABELS', () => {
  it('has labels for all activity types', () => {
    expect(ACTIVITY_LABELS[ActivityType.Walk]).toBe('Walk');
    expect(ACTIVITY_LABELS[ActivityType.Run]).toBe('Run');
  });
});

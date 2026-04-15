import { describe, it, expect } from 'vitest';

import { JournalGrain } from '../journal/constants';
import { computeCountingMoments, computeJournalSummary } from '../journal/aggregate';
import type { JournalRange } from '../journal/types';
import {
  EliminationMode,
  MealPortion,
  MealType,
  MilestoneCategory,
  NeedCategory,
  NeedStatus,
  FeedType,
  SleepQuality,
  SleepType,
  type EliminationEntry,
  type FeedEntry,
  type GrowthEntry,
  type MealEntry,
  type Milestone,
  type NeedEntry,
  type SleepEntry,
} from '../types';

// ─── Test fixtures ──────────────────────────────────────────────────────────

const weekRange: JournalRange = {
  start: '2026-04-13',
  end: '2026-04-19',
  grain: JournalGrain.Week,
  label: 'Apr 13–19, 2026',
};

function feed(date: string, id = `f-${date}`): FeedEntry {
  return {
    id,
    date,
    time: '09:00',
    type: FeedType.Breast,
    amount: null,
    timestamp: `${date}T09:00:00.000Z`,
    createdAt: `${date}T09:00:00.000Z`,
    notes: '',
  };
}

function sleep(date: string, start: string, end: string, id = `s-${date}`): SleepEntry {
  return {
    id,
    date,
    startTime: start,
    endTime: end,
    type: SleepType.Nap,
    quality: SleepQuality.Good,
    timestamp: `${date}T${start}:00.000Z`,
    createdAt: `${date}T${start}:00.000Z`,
    notes: '',
  };
}

function diaper(date: string, id = `e-d-${date}`): EliminationEntry {
  return {
    id,
    date,
    time: '10:00',
    mode: EliminationMode.Diaper,
    timestamp: `${date}T10:00:00.000Z`,
    createdAt: `${date}T10:00:00.000Z`,
    notes: '',
  };
}

function potty(date: string, id = `e-p-${date}`): EliminationEntry {
  return {
    id,
    date,
    time: '11:00',
    mode: EliminationMode.Potty,
    timestamp: `${date}T11:00:00.000Z`,
    createdAt: `${date}T11:00:00.000Z`,
    notes: '',
  };
}

function meal(date: string, id = `m-${date}`): MealEntry {
  return {
    id,
    date,
    time: '12:00',
    type: MealType.Lunch,
    portion: MealPortion.Some,
    description: 'test',
    timestamp: `${date}T12:00:00.000Z`,
    createdAt: `${date}T12:00:00.000Z`,
    notes: '',
  };
}

function milestone(
  date: string,
  title: string,
  category = MilestoneCategory.Language,
  id = `ms-${date}`,
): Milestone {
  return {
    id,
    date,
    category,
    title,
    timestamp: `${date}T00:00:00.000Z`,
    createdAt: `${date}T00:00:00.000Z`,
    notes: '',
  };
}

function need(date: string, status: NeedStatus, id = `n-${date}-${status}`): NeedEntry {
  return {
    id,
    date,
    title: 'Something',
    category: NeedCategory.Apparel,
    status,
    notes: '',
    createdAt: `${date}T00:00:00.000Z`,
    updatedAt: `${date}T00:00:00.000Z`,
  };
}

// ─── computeCountingMoments ─────────────────────────────────────────────────

describe('computeCountingMoments', () => {
  it('returns no moments when no thresholds crossed', () => {
    expect(
      computeCountingMoments({ totalBefore: 5, totalAfter: 7, dataType: 'diapers' }),
    ).toHaveLength(0);
  });

  it('detects single threshold crossed in period', () => {
    const moments = computeCountingMoments({
      totalBefore: 95,
      totalAfter: 102,
      dataType: 'diapers',
    });
    expect(moments).toHaveLength(1);
    expect(moments[0]!.threshold).toBe(100);
    expect(moments[0]!.dataType).toBe('diapers');
  });

  it('detects multiple thresholds crossed in same period', () => {
    const moments = computeCountingMoments({
      totalBefore: 90,
      totalAfter: 260,
      dataType: 'diapers',
    });
    expect(moments.map((m) => m.threshold)).toEqual([100, 250]);
  });

  it('does not double-count threshold equal to totalBefore', () => {
    // Already at 100 before the period — the period did not cross it
    expect(
      computeCountingMoments({ totalBefore: 100, totalAfter: 150, dataType: 'diapers' }),
    ).toHaveLength(0);
  });

  it('uses the right threshold list per dataType', () => {
    const moments = computeCountingMoments({ totalBefore: 0, totalAfter: 51, dataType: 'meals' });
    expect(moments).toHaveLength(1);
    expect(moments[0]!.threshold).toBe(50);
  });
});

// ─── computeJournalSummary ──────────────────────────────────────────────────

describe('computeJournalSummary', () => {
  it('returns zero counts for empty subcollections', () => {
    const s = computeJournalSummary({
      range: weekRange,
      feeds: [],
      sleep: [],
      growth: [],
      elimination: [],
      meals: [],
      milestones: [],
      needs: [],
    });
    expect(s.feedCount).toBe(0);
    expect(s.mealCount).toBe(0);
    expect(s.sleepEntries).toBe(0);
    expect(s.sleepHours).toBe(0);
    expect(s.diaperCount).toBe(0);
    expect(s.pottyCount).toBe(0);
    expect(s.growthLatest).toBeNull();
    expect(s.milestonesInRange).toHaveLength(0);
    expect(s.needsAdded + s.needsAcquired + s.needsOutgrown).toBe(0);
    expect(s.countingMoments).toHaveLength(0);
  });

  it('counts only entries whose date falls inside the range (inclusive)', () => {
    const s = computeJournalSummary({
      range: weekRange,
      feeds: [feed('2026-04-12'), feed('2026-04-13'), feed('2026-04-19'), feed('2026-04-20')],
      sleep: [],
      growth: [],
      elimination: [],
      meals: [],
      milestones: [],
      needs: [],
    });
    expect(s.feedCount).toBe(2); // 13 and 19 only
  });

  it('computes sleep hours from start/end times, handling overnight wraparound', () => {
    const s = computeJournalSummary({
      range: weekRange,
      feeds: [],
      sleep: [
        sleep('2026-04-13', '10:00', '12:30'), // 2.5h
        sleep('2026-04-14', '22:00', '06:00'), // 8h overnight
      ],
      growth: [],
      elimination: [],
      meals: [],
      milestones: [],
      needs: [],
    });
    expect(s.sleepEntries).toBe(2);
    expect(s.sleepHours).toBeCloseTo(10.5, 1);
  });

  it('splits elimination entries by mode', () => {
    const s = computeJournalSummary({
      range: weekRange,
      feeds: [],
      sleep: [],
      growth: [],
      elimination: [diaper('2026-04-13'), diaper('2026-04-14'), potty('2026-04-15')],
      meals: [],
      milestones: [],
      needs: [],
    });
    expect(s.diaperCount).toBe(2);
    expect(s.pottyCount).toBe(1);
  });

  it('picks the latest growth entry within the range', () => {
    const growth: GrowthEntry[] = [
      {
        id: 'g1',
        date: '2026-04-13',
        weight: 10,
        height: 75,
        headCircumference: 42,
        createdAt: '',
        notes: '',
      },
      {
        id: 'g2',
        date: '2026-04-16',
        weight: 11,
        height: 76,
        headCircumference: 43,
        createdAt: '',
        notes: '',
      },
      {
        id: 'g3',
        date: '2026-04-25',
        weight: 12,
        height: 77,
        headCircumference: 44,
        createdAt: '',
        notes: '',
      }, // outside range
    ];
    const s = computeJournalSummary({
      range: weekRange,
      feeds: [],
      sleep: [],
      growth,
      elimination: [],
      meals: [],
      milestones: [],
      needs: [],
    });
    expect(s.growthLatest).not.toBeNull();
    expect(s.growthLatest!.date).toBe('2026-04-16');
    expect(s.growthLatest!.weight).toBe(11);
  });

  it('reports counting moments for thresholds crossed this period', () => {
    // 98 diapers before the range (dates < 2026-04-13), 5 in range → crosses 100
    const before: EliminationEntry[] = Array.from({ length: 98 }, (_, i) =>
      diaper('2026-04-01', `pre-${i}`),
    );
    const within: EliminationEntry[] = Array.from({ length: 5 }, (_, i) =>
      diaper('2026-04-14', `in-${i}`),
    );
    const s = computeJournalSummary({
      range: weekRange,
      feeds: [],
      sleep: [],
      growth: [],
      elimination: [...before, ...within],
      meals: [],
      milestones: [],
      needs: [],
    });
    expect(s.diaperCount).toBe(5);
    expect(s.countingMoments).toContainEqual({ dataType: 'diapers', threshold: 100 });
  });

  it('buckets needs by current status within range', () => {
    const s = computeJournalSummary({
      range: weekRange,
      feeds: [],
      sleep: [],
      growth: [],
      elimination: [],
      meals: [],
      milestones: [],
      needs: [
        need('2026-04-13', NeedStatus.Wishlist),
        need('2026-04-14', NeedStatus.Inventory),
        need('2026-04-15', NeedStatus.Outgrown),
        need('2026-04-10', NeedStatus.Wishlist), // outside range — ignored
      ],
    });
    expect(s.needsAdded).toBe(1);
    expect(s.needsAcquired).toBe(1);
    expect(s.needsOutgrown).toBe(1);
  });

  it('counts meals within range', () => {
    const s = computeJournalSummary({
      range: weekRange,
      feeds: [],
      sleep: [],
      growth: [],
      elimination: [],
      meals: [meal('2026-04-12'), meal('2026-04-13'), meal('2026-04-15'), meal('2026-04-20')],
      milestones: [],
      needs: [],
    });
    expect(s.mealCount).toBe(2); // 13 and 15 only
  });

  it('projects milestonesInRange with only the 4 public fields', () => {
    const s = computeJournalSummary({
      range: weekRange,
      feeds: [],
      sleep: [],
      growth: [],
      elimination: [],
      meals: [],
      milestones: [milestone('2026-04-14', 'First word')],
      needs: [],
    });
    expect(s.milestonesInRange).toHaveLength(1);
    expect(s.milestonesInRange[0]).toMatchObject({
      date: '2026-04-14',
      title: 'First word',
      category: MilestoneCategory.Language,
    });
  });
});

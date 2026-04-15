import { COUNTING_THRESHOLDS } from './constants';
import type {
  CountingDataType,
  CountingMoment,
  JournalGrowthLatest,
  JournalMilestone,
  JournalRange,
  JournalSummary,
} from './types';
import {
  EliminationMode,
  NeedStatus,
  type EliminationEntry,
  type FeedEntry,
  type GrowthEntry,
  type MealEntry,
  type Milestone,
  type NeedEntry,
  type SleepEntry,
} from '../types';

/** Detect cumulative counting thresholds crossed between totalBefore and totalAfter */
export function computeCountingMoments(args: {
  totalBefore: number;
  totalAfter: number;
  dataType: CountingDataType;
}): CountingMoment[] {
  const { totalBefore, totalAfter, dataType } = args;
  const result: CountingMoment[] = [];
  for (const threshold of COUNTING_THRESHOLDS[dataType]) {
    if (totalBefore < threshold && threshold <= totalAfter) {
      result.push({ dataType, threshold });
    }
  }
  return result;
}

/** Inclusive range check on YYYY-MM-DD strings */
function inRange(entryDate: string, range: JournalRange): boolean {
  return entryDate >= range.start && entryDate <= range.end;
}

/** Minutes between HH:mm times, wrapping overnight (end < start ⇒ next day) */
function minutesBetween(start: string, end: string): number {
  const [sh = 0, sm = 0] = start.split(':').map(Number);
  const [eh = 0, em = 0] = end.split(':').map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return mins;
}

/** Aggregate all subcollection arrays into a JournalSummary for the range */
export function computeJournalSummary(args: {
  range: JournalRange;
  feeds: FeedEntry[];
  sleep: SleepEntry[];
  growth: GrowthEntry[];
  elimination: EliminationEntry[];
  meals: MealEntry[];
  milestones: Milestone[];
  needs: NeedEntry[];
}): JournalSummary {
  const { range, feeds, sleep, growth, elimination, meals, milestones, needs } = args;

  const feedsInRange = feeds.filter((f) => inRange(f.date, range));
  const mealsInRange = meals.filter((m) => inRange(m.date, range));
  const sleepInRange = sleep.filter((s) => inRange(s.date, range));
  const eliminationInRange = elimination.filter((e) => inRange(e.date, range));
  const milestonesInRange = milestones.filter((m) => inRange(m.date, range));
  const needsInRange = needs.filter((n) => inRange(n.date, range));

  const sleepHours = sleepInRange.reduce((acc, s) => {
    if (!s.startTime || !s.endTime) return acc;
    return acc + minutesBetween(s.startTime, s.endTime) / 60;
  }, 0);

  const diaperCount = eliminationInRange.filter((e) => e.mode === EliminationMode.Diaper).length;
  const pottyCount = eliminationInRange.filter((e) => e.mode === EliminationMode.Potty).length;

  const growthInRange = growth.filter((g) => inRange(g.date, range));
  const growthLatest: JournalGrowthLatest | null =
    growthInRange.length > 0
      ? (() => {
          const latest = growthInRange.reduce((acc, g) => (g.date > acc.date ? g : acc));
          return {
            date: latest.date,
            weight: latest.weight ?? undefined,
            height: latest.height ?? undefined,
            headCircumference: latest.headCircumference ?? undefined,
          };
        })()
      : null;

  // Counting moments — cumulative totals before vs after range
  const totalDiapersBefore = elimination.filter(
    (e) => e.mode === EliminationMode.Diaper && e.date < range.start,
  ).length;
  const totalFeedsBefore = feeds.filter((f) => f.date < range.start).length;
  const totalMealsBefore = meals.filter((m) => m.date < range.start).length;
  const totalMilestonesBefore = milestones.filter((m) => m.date < range.start).length;

  const countingMoments: CountingMoment[] = [
    ...computeCountingMoments({
      totalBefore: totalDiapersBefore,
      totalAfter: totalDiapersBefore + diaperCount,
      dataType: 'diapers',
    }),
    ...computeCountingMoments({
      totalBefore: totalFeedsBefore,
      totalAfter: totalFeedsBefore + feedsInRange.length,
      dataType: 'feeds',
    }),
    ...computeCountingMoments({
      totalBefore: totalMealsBefore,
      totalAfter: totalMealsBefore + mealsInRange.length,
      dataType: 'meals',
    }),
    ...computeCountingMoments({
      totalBefore: totalMilestonesBefore,
      totalAfter: totalMilestonesBefore + milestonesInRange.length,
      dataType: 'milestones',
    }),
  ];

  const journalMilestones: JournalMilestone[] = milestonesInRange.map((m) => ({
    id: m.id,
    date: m.date,
    title: m.title,
    category: m.category,
  }));

  return {
    range,
    feedCount: feedsInRange.length,
    mealCount: mealsInRange.length,
    sleepEntries: sleepInRange.length,
    sleepHours,
    diaperCount,
    pottyCount,
    growthLatest,
    milestonesInRange: journalMilestones,
    needsAdded: needsInRange.filter((n) => n.status === NeedStatus.Wishlist).length,
    needsAcquired: needsInRange.filter((n) => n.status === NeedStatus.Inventory).length,
    needsOutgrown: needsInRange.filter((n) => n.status === NeedStatus.Outgrown).length,
    countingMoments,
  };
}

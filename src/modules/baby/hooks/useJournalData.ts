import { useMemo } from 'react';

import { computeJournalSummary } from '../journal/aggregate';
import type { JournalRange, JournalSummary } from '../journal/types';
import type {
  EliminationEntry,
  FeedEntry,
  GrowthEntry,
  MealEntry,
  Milestone,
  NeedEntry,
  SleepEntry,
} from '../types';
import { useBabyCollection } from './useBabyCollection';

/** Returns aggregated journal data for one child + one range */
export function useJournalData(childId: string, range: JournalRange): JournalSummary | null {
  const { items: feeds } = useBabyCollection<FeedEntry>(childId || null, 'feeds', 'Feed');
  const { items: sleep } = useBabyCollection<SleepEntry>(childId || null, 'sleep', 'Sleep');
  const { items: growth } = useBabyCollection<GrowthEntry>(childId || null, 'growth', 'Growth');
  const { items: elimination } = useBabyCollection<EliminationEntry>(
    childId || null,
    'elimination',
    'Elimination',
  );
  const { items: meals } = useBabyCollection<MealEntry>(childId || null, 'meals', 'Meal');
  const { items: milestones } = useBabyCollection<Milestone>(
    childId || null,
    'milestones',
    'Milestone',
  );
  const { items: needs } = useBabyCollection<NeedEntry>(childId || null, 'needs', 'Need');

  return useMemo(() => {
    if (!childId) return null;
    return computeJournalSummary({
      range,
      feeds,
      sleep,
      growth,
      elimination,
      meals,
      milestones,
      needs,
    });
  }, [childId, range, feeds, sleep, growth, elimination, meals, milestones, needs]);
}

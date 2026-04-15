import { useState } from 'react';

import { todayStr } from '@/shared/utils/date';

import { useJournalData } from '../hooks/useJournalData';
import { JournalGrain } from '../journal/constants';
import { computeRange } from '../journal/range';
import type { JournalRange } from '../journal/types';
import { computeStage } from '../stage';
import { ChildStage, MilestoneCategory, type Child } from '../types';
import { JournalCard } from './JournalCard';
import { JournalPicker } from './JournalPicker';

type Props = { child: Child };

const STAGE_LABEL: Record<ChildStage, string> = {
  [ChildStage.Infant]: 'Infant',
  [ChildStage.Toddler]: 'Toddler',
  [ChildStage.Kid]: 'Kid',
};

/** Narrative Daily/Weekly/Monthly journal — aggregates all baby subcollections */
export function LifeJournalView({ child }: Props) {
  const [range, setRange] = useState<JournalRange>(() => computeRange(JournalGrain.Week, todayStr()));
  const summary = useJournalData(child.id ?? '', range);
  const stage = computeStage(child.dob);

  if (!summary) {
    return <p className="text-sm text-fg-muted">Loading journal…</p>;
  }

  return (
    <section className="flex flex-col gap-4 py-4">
      <div>
        <h2 className="text-base font-medium text-fg">Life Journal</h2>
        <p className="text-sm text-fg-muted">
          {child.name}, {STAGE_LABEL[stage]} — {range.label}
        </p>
      </div>

      <JournalPicker range={range} onChange={setRange} />

      <div className="space-y-3">
        {summary.countingMoments.length > 0 && (
          <JournalCard title="🎉 Counting moments">
            <ul className="list-disc pl-5 text-sm text-fg">
              {summary.countingMoments.map((m) => (
                <li key={`${m.dataType}-${m.threshold}`}>
                  Crossed {m.threshold} {m.dataType} this period
                </li>
              ))}
            </ul>
          </JournalCard>
        )}

        <JournalCard title="Feeds & Meals" empty={summary.feedCount + summary.mealCount === 0}>
          <p className="text-sm text-fg">
            {summary.feedCount} feed{summary.feedCount === 1 ? '' : 's'}, {summary.mealCount} meal
            {summary.mealCount === 1 ? '' : 's'}
          </p>
        </JournalCard>

        <JournalCard title="Sleep" empty={summary.sleepEntries === 0}>
          <p className="text-sm text-fg">
            {summary.sleepEntries} entries, ~{summary.sleepHours.toFixed(1)} hours total
          </p>
        </JournalCard>

        <JournalCard title="Growth" empty={summary.growthLatest === null}>
          {summary.growthLatest && (
            <p className="text-sm text-fg">
              Last measured {summary.growthLatest.date}
              {summary.growthLatest.weight !== undefined && ` — ${summary.growthLatest.weight}kg`}
              {summary.growthLatest.height !== undefined && `, ${summary.growthLatest.height}cm`}
              {summary.growthLatest.headCircumference !== undefined &&
                `, head ${summary.growthLatest.headCircumference}cm`}
            </p>
          )}
        </JournalCard>

        <JournalCard title="Elimination" empty={summary.diaperCount + summary.pottyCount === 0}>
          <p className="text-sm text-fg">
            {summary.diaperCount} diaper change{summary.diaperCount === 1 ? '' : 's'},{' '}
            {summary.pottyCount} potty event{summary.pottyCount === 1 ? '' : 's'}
          </p>
        </JournalCard>

        <JournalCard title="Milestones" empty={summary.milestonesInRange.length === 0}>
          <ul className="space-y-1 text-sm text-fg">
            {summary.milestonesInRange.map((m) => (
              <li key={m.id}>
                <strong>{m.title}</strong> — {MilestoneCategory[m.category]} ({m.date})
              </li>
            ))}
          </ul>
        </JournalCard>

        <JournalCard
          title="Needs activity"
          empty={summary.needsAdded + summary.needsAcquired + summary.needsOutgrown === 0}
        >
          <p className="text-sm text-fg">
            Added: {summary.needsAdded}. Acquired: {summary.needsAcquired}. Outgrown:{' '}
            {summary.needsOutgrown}.
          </p>
        </JournalCard>
      </div>
    </section>
  );
}

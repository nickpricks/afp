import { useMemo } from 'react';
import { ArrowUp, ArrowDown, Footprints, TrendingUp } from 'lucide-react';

import type { BodyRecord } from '@/modules/body/types';
import { todayStr } from '@/shared/utils/date';

/** Formats meters as a readable distance string */
function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${meters} m`;
}

/** Returns the past N day keys as YYYY-MM-DD strings */
function pastDays(count: number): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    );
  }
  return days;
}

/** Computes weekly stats from records */
function computeWeekStats(records: Record<string, BodyRecord>) {
  const week = pastDays(7);
  let totalScore = 0;
  let daysWithData = 0;
  let streak = 0;
  let streakBroken = false;

  for (const key of week) {
    const rec = records[key];
    if (rec && rec.total > 0) {
      totalScore += rec.total;
      daysWithData++;
      if (!streakBroken) {
        streak++;
      }
    } else if (!streakBroken) {
      // Today with no data doesn't break streak
      if (key !== todayStr()) {
        streakBroken = true;
      }
    }
  }

  return {
    totalScore: Math.round(totalScore * 10) / 10,
    average: daysWithData > 0 ? Math.round((totalScore / daysWithData) * 10) / 10 : 0,
    daysActive: daysWithData,
    streak,
  };
}

/** Dashboard showing today's summary and weekly stats */
export function BodyStats({
  todayRecord,
  records,
  config,
  onNavigate,
}: {
  todayRecord: BodyRecord;
  records: Record<string, BodyRecord>;
  config: { floors: boolean; walking: boolean; running: boolean };
  onNavigate: (tab: string) => void;
}) {
  const weekStats = useMemo(() => {
    return computeWeekStats(records);
  }, [records]);

  return (
    <div className="flex flex-col gap-6">
      {/* Today's Score */}
      <div className="text-center">
        <p className="text-5xl font-bold text-accent">{todayRecord.total}</p>
        <p className="mt-1 text-sm text-fg-muted">Today's Score</p>
      </div>

      {/* Today's Details */}
      <div className="grid grid-cols-2 gap-3">
        {
          config.floors && (
            <div className="rounded-lg bg-surface-card border border-line p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-fg-muted">
                <ArrowUp size={14} />
                <span className="text-xs">Floors Up</span>
              </div>
              <p className="text-2xl font-semibold text-fg mt-1">{todayRecord.up}</p>
            </div>
          )
        }
        {
          config.floors && (
            <div className="rounded-lg bg-surface-card border border-line p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-fg-muted">
                <ArrowDown size={14} />
                <span className="text-xs">Floors Down</span>
              </div>
              <p className="text-2xl font-semibold text-fg mt-1">{todayRecord.down}</p>
            </div>
          )
        }
        {
          (config.walking || todayRecord.walkMeters > 0) && (
            <div className="rounded-lg bg-surface-card border border-line p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-fg-muted">
                <Footprints size={14} />
                <span className="text-xs">Walked</span>
              </div>
              <p className="text-2xl font-semibold text-fg mt-1">{formatDistance(todayRecord.walkMeters)}</p>
            </div>
          )
        }
        {
          (config.running || todayRecord.runMeters > 0) && (
            <div className="rounded-lg bg-surface-card border border-line p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-fg-muted">
                <TrendingUp size={14} />
                <span className="text-xs">Run</span>
              </div>
              <p className="text-2xl font-semibold text-fg mt-1">{formatDistance(todayRecord.runMeters)}</p>
            </div>
          )
        }
      </div>

      {/* Weekly Stats */}
      <div className="rounded-lg bg-surface-card border border-line p-4">
        <h3 className="text-xs font-medium text-fg-muted uppercase tracking-wide mb-3">This Week</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-semibold text-fg">{weekStats.average}</p>
            <p className="text-xs text-fg-muted">Avg Score</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-fg">{weekStats.totalScore}</p>
            <p className="text-xs text-fg-muted">Total</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-fg">{weekStats.streak}d</p>
            <p className="text-xs text-fg-muted">Streak</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {
        (config.floors || config.walking || config.running) && (
          <div className="flex gap-3">
            {
              config.floors && (
                <button
                  type="button"
                  onClick={() => onNavigate('floors')}
                  className="flex-1 rounded-lg bg-accent px-4 py-3 text-fg-on-accent font-medium active:scale-95 transition-transform"
                >
                  + Log Floors
                </button>
              )
            }
            {
              config.walking && (
                <button
                  type="button"
                  onClick={() => onNavigate('walking')}
                  className="flex-1 rounded-lg bg-surface-card border border-line px-4 py-3 text-fg font-medium active:scale-95 transition-transform"
                >
                  + Walk
                </button>
              )
            }
            {
              config.running && (
                <button
                  type="button"
                  onClick={() => onNavigate('running')}
                  className="flex-1 rounded-lg bg-surface-card border border-line px-4 py-3 text-fg font-medium active:scale-95 transition-transform"
                >
                  + Run
                </button>
              )
            }
          </div>
        )
      }
    </div>
  );
}

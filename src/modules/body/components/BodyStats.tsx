import { useMemo } from 'react';
import { ArrowUp, ArrowDown, Footprints, TrendingUp, Bike, RotateCcw } from 'lucide-react';

import type { BodyConfig, BodyRecord } from '@/modules/body/types';
import { CONFIG } from '@/constants/config';
import { todayStr } from '@/shared/utils/date';
import { formatDistance } from '@/shared/utils/format';

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

/** Short day label from YYYY-MM-DD */
function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return labels[d.getDay()] ?? '';
}

/** Computes weekly stats from records */
function computeWeekStats(records: Record<string, BodyRecord>) {
  const week = pastDays(7);
  let totalScore = 0;
  let daysWithData = 0;
  let streak = 0;
  let streakBroken = false;
  let maxScore = 0;

  const dailyScores: { key: string; score: number }[] = [];

  for (const key of week) {
    const rec = records[key];
    const score = rec && rec.total > 0 ? rec.total : 0;
    dailyScores.push({ key, score });
    if (score > maxScore) maxScore = score;

    if (score > 0) {
      totalScore += score;
      daysWithData++;
      if (!streakBroken) {
        streak++;
      }
    } else if (!streakBroken) {
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
    dailyScores: dailyScores.reverse(),
    maxScore,
  };
}

/** Stat card definitions — maps config key to display props */
const STAT_CARDS: {
  key: keyof BodyConfig;
  tab: string;
  label: string;
  icon: typeof ArrowUp;
  getValue: (r: BodyRecord) => string;
  showWhen?: (r: BodyRecord) => boolean;
}[] = [
  { key: 'floors', tab: 'floors', label: 'Floors Up', icon: ArrowUp, getValue: (r) => String(r.up) },
  { key: 'floors', tab: 'floors', label: 'Floors Down', icon: ArrowDown, getValue: (r) => String(r.down) },
  { key: 'walking', tab: 'walking', label: 'Walked', icon: Footprints, getValue: (r) => formatDistance(r.walkMeters), showWhen: (r) => r.walkMeters > 0 },
  { key: 'running', tab: 'running', label: 'Run', icon: TrendingUp, getValue: (r) => formatDistance(r.runMeters), showWhen: (r) => r.runMeters > 0 },
  { key: 'cycling', tab: 'cycling', label: 'Cycled', icon: Bike, getValue: () => '—' },
];

/** SVG score ring component */
function ScoreRing({ score, goal }: { score: number; goal: number }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score / goal, 1);
  const offset = circumference - pct * circumference;
  const pctLabel = Math.round(pct * 100);

  return (
    <div className="relative mx-auto" style={{ width: 150, height: 150 }}>
      <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--line)" strokeWidth="12" />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
          style={{ filter: 'drop-shadow(0 0 8px var(--accent))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-fg tabular-nums">{score}</span>
        <span className="text-[10px] text-fg-muted uppercase tracking-widest mt-0.5">Score</span>
      </div>
      <p className="text-center text-[11px] text-accent mt-1.5 font-semibold">{pctLabel}% of daily goal</p>
    </div>
  );
}

/** Dashboard showing today's summary with score ring, day bars, and weekly stats */
export function BodyStats({
  todayRecord,
  records,
  config,
  onNavigate,
  onResetToday,
}: {
  todayRecord: BodyRecord;
  records: Record<string, BodyRecord>;
  config: BodyConfig;
  onNavigate: (tab: string) => void;
  onResetToday?: () => void;
}) {
  const weekStats = useMemo(() => {
    return computeWeekStats(records);
  }, [records]);

  const today = todayStr();

  return (
    <div className="flex flex-col gap-6">
      {/* Score Ring */}
      <ScoreRing score={todayRecord.total} goal={config.dailyGoal || CONFIG.DAILY_SCORE_GOAL} />

      {/* Today's Details — compact stat cards */}
      <div className="grid grid-cols-2 gap-2">
        {
STAT_CARDS
          .filter((c) => config[c.key] || c.showWhen?.(todayRecord))
          .map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.label}
                type="button"
                onClick={() => onNavigate(c.tab)}
                className="group rounded-xl bg-surface-card border border-line p-3 text-left transition-all hover:border-accent active:scale-[0.97]"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10 text-accent group-hover:bg-accent group-hover:text-fg-on-accent transition-colors">
                    <Icon size={13} />
                  </div>
                  <span className="text-[11px] font-medium text-fg-muted">{c.label}</span>
                </div>
                <p className="text-xl font-bold text-fg tabular-nums">{c.getValue(todayRecord)}</p>
              </button>
            );
          })
}
      </div>

      {/* Reset today */}
      {
onResetToday && todayRecord.total > 0 && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onResetToday}
            className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:border-error hover:text-error hover:bg-error/5"
          >
            <RotateCcw size={13} />
            Reset today
          </button>
        </div>
      )
}

      {/* Weekly Day Bars */}
      <div className="rounded-lg bg-surface-card border border-line p-4">
        <h3 className="text-xs font-medium text-fg-muted uppercase tracking-wide mb-3">This Week</h3>
        <div className="grid grid-cols-7 gap-1.5">
          {
weekStats.dailyScores.map(({ key, score }) => {
            const isToday = key === today;
            const barHeight = weekStats.maxScore > 0 ? Math.max((score / weekStats.maxScore) * 100, score > 0 ? 8 : 0) : 0;

            return (
              <div key={key} className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-semibold text-fg">{score > 0 ? Math.round(score * 10) / 10 : ''}</span>
                <div className="w-full h-16 rounded-lg bg-surface relative overflow-hidden">
                  <div
                    className={`absolute bottom-0 left-0 right-0 rounded-lg transition-all duration-500 ${
                      isToday ? 'bg-accent shadow-[0_-2px_8px_var(--accent)]' : 'bg-accent/60'
                    }`}
                    style={{ height: `${barHeight}%` }}
                  />
                </div>
                <span className={`text-[10px] font-semibold ${isToday ? 'text-accent' : 'text-fg-muted'}`}>
                  {dayLabel(key)}
                </span>
              </div>
            );
          })
}
        </div>

        {/* Week summary row */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-line text-center">
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

      {/* Quick Actions — compact pill row */}
      {
STAT_CARDS.some((c) => config[c.key]) && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {
[...new Map(STAT_CARDS.filter((c) => config[c.key]).map((c) => [c.tab, c])).values()].map((c) => {
            const Icon = c.icon;
            return (
            <button
              key={c.tab}
              type="button"
              onClick={() => onNavigate(c.tab)}
              className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent active:scale-95 transition-all hover:bg-accent hover:text-fg-on-accent"
            >
              <Icon size={13} />
              <span>{c.tab.charAt(0).toUpperCase() + c.tab.slice(1)}</span>
            </button>
            );
          })
}
        </div>
      )
}
    </div>
  );
}

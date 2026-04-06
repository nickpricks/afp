import { useState, useCallback } from 'react';

import { isFirebaseConfigured } from '@/shared/auth/firebase-config';
import { ActivityType } from '@/shared/types';
import type { BodyConfig, BodyRecord, BodyActivity } from '@/modules/body/types';
import type { Child, FeedEntry, SleepEntry, DiaperEntry } from '@/modules/baby/types';
import { FeedType, SleepType, SleepQuality, DiaperType } from '@/modules/baby/types';
import type { Expense } from '@/modules/expenses/types';
import { CATEGORIES } from '@/modules/expenses/categories';
import { todayStr } from '@/shared/utils/date';

// ─── localStorage helpers ────────────────────────────────────────────────────

const UID = 'dev-user';
const BASE = `afp:users/${UID}`;

/** Reads a collection array from localStorage */
const read = <T,>(key: string): T[] => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
};

/** Appends an item to a localStorage collection */
const push = <T extends { id?: string }>(key: string, item: T): void => {
  const items = read<T>(key);
  items.push({ ...item, id: item.id ?? crypto.randomUUID() });
  localStorage.setItem(key, JSON.stringify(items));
};

/** Reads a single doc (stored as array with one element) */
const readDoc = <T,>(key: string): T | null => {
  const items = read<T>(key);
  return items[0] ?? null;
};

/** Random int between min and max (inclusive) */
const rand = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/** Random element from array */
const pick = <T,>(arr: readonly T[]): T => arr[rand(0, arr.length - 1)] as T;

/** Random date string in last N days */
const recentDate = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - rand(0, days));
  return d.toISOString().split('T')[0] as string;
};

/** Random time string HH:MM */
const randTime = (): string =>
  `${String(rand(6, 22)).padStart(2, '0')}:${String(rand(0, 59)).padStart(2, '0')}`;

// ─── Generators ──────────────────────────────────────────────────────────────

/** Adds a random body floor record for today or recent day */
const benchFloors = (): string => {
  const dateStr = pick([todayStr(), recentDate(7)]);
  const up = rand(2, 20);
  const down = rand(1, up);
  const record: BodyRecord & { id: string } = {
    id: dateStr,
    dateStr,
    up,
    down,
    walkMeters: 0,
    runMeters: 0,
    total: up + down * 0.5,
    updatedAt: new Date().toISOString(),
  };
  // Upsert — replace if same dateStr exists
  const key = `${BASE}:body`;
  const items = read<BodyRecord & { id: string }>(key);
  const idx = items.findIndex((r) => r.id === dateStr);
  if (idx >= 0) {
    const existing = items[idx]!;
    existing.up += up;
    existing.down += down;
    existing.total = existing.up + existing.down * 0.5;
    existing.updatedAt = record.updatedAt;
    localStorage.setItem(key, JSON.stringify(items));
  } else {
    push(key, record);
  }
  return `+${up}↑ ${down}↓ on ${dateStr}`;
};

/** Adds a random walk activity */
const benchWalk = (): string => {
  const distance = rand(200, 3000);
  const activity: BodyActivity = {
    id: crypto.randomUUID(),
    type: ActivityType.Walk,
    distance,
    duration: rand(10, 60),
    date: pick([todayStr(), recentDate(7)]),
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  push(`${BASE}:body_activities`, activity);
  return `Walk ${distance}m on ${activity.date}`;
};

/** Adds a random run activity */
const benchRun = (): string => {
  const distance = rand(500, 5000);
  const activity: BodyActivity = {
    id: crypto.randomUUID(),
    type: ActivityType.Run,
    distance,
    duration: rand(15, 45),
    date: pick([todayStr(), recentDate(7)]),
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  push(`${BASE}:body_activities`, activity);
  return `Run ${distance}m on ${activity.date}`;
};

/** Adds a random expense */
const benchExpense = (): string => {
  const catIds = Object.keys(CATEGORIES);
  const catId = pick(catIds);
  const cat = CATEGORIES[catId]!;
  const subCat = pick(cat.subCategories);
  const amount = rand(20, 5000);
  const now = new Date().toISOString();
  const expense: Expense = {
    id: crypto.randomUUID(),
    date: pick([todayStr(), recentDate(14)]),
    category: catId,
    subCat,
    amount,
    note: '',
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  };
  push(`${BASE}:expenses`, expense);
  return `₹${amount} ${cat.label} → ${subCat}`;
};

/** Generates a gibberish baby name */
const randomBabyName = (): string => {
  const prefixes = ['XYZ', 'GenZ', 'BB', 'G', 'Smol', 'Lil', 'Q', 'ZZ', 'K9', 'NPC', 'Bot', 'Bub'];
  const suffix = rand(1, 999);
  return `${pick(prefixes)}${suffix}`;
};

/** Random DOB in the last 0–3 years */
const randomDob = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - rand(1, 1095));
  return d.toISOString().split('T')[0] as string;
};

/** Ensures a child exists, returns its ID */
const ensureChild = (): string => {
  const key = `${BASE}:children`;
  const children = read<Child & { id: string }>(key);
  if (children.length > 0) return children[0]!.id;
  const childId = crypto.randomUUID();
  const child: Child & { id: string } = {
    id: childId,
    name: randomBabyName(),
    dob: randomDob(),
    config: { feeding: true, sleep: true, growth: true, diapers: true },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  push(key, child);
  return childId;
};

/** Adds a random feed entry */
const benchFeed = (): string => {
  const childId = ensureChild();
  const type = pick([FeedType.Bottle, FeedType.BreastLeft, FeedType.BreastRight, FeedType.BreastBoth, FeedType.SolidFood]);
  const labels = ['Bottle', 'Breast L', 'Breast R', 'Breast Both', 'Solid'];
  const entry: FeedEntry = {
    id: crypto.randomUUID(),
    date: pick([todayStr(), recentDate(3)]),
    time: randTime(),
    type,
    amount: type === FeedType.Bottle ? rand(30, 200) : null,
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    notes: '',
  };
  push(`afp:users/${UID}/children/${childId}:feeds`, entry);
  return `${labels[type]} feed at ${entry.time}`;
};

/** Adds a random sleep entry */
const benchSleep = (): string => {
  const childId = ensureChild();
  const type = pick([SleepType.Nap, SleepType.Night]);
  const startHour = type === SleepType.Nap ? rand(10, 15) : rand(19, 22);
  const durHours = type === SleepType.Nap ? rand(1, 2) : rand(6, 10);
  const entry: SleepEntry = {
    id: crypto.randomUUID(),
    date: pick([todayStr(), recentDate(3)]),
    startTime: `${String(startHour).padStart(2, '0')}:${String(rand(0, 59)).padStart(2, '0')}`,
    endTime: `${String((startHour + durHours) % 24).padStart(2, '0')}:${String(rand(0, 59)).padStart(2, '0')}`,
    type,
    quality: pick([SleepQuality.Good, SleepQuality.Fair, SleepQuality.Poor]),
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    notes: '',
  };
  push(`afp:users/${UID}/children/${childId}:sleep`, entry);
  return `${type === SleepType.Nap ? 'Nap' : 'Night'} ${durHours}h`;
};

/** Adds a random diaper entry */
const benchDiaper = (): string => {
  const childId = ensureChild();
  const type = pick([DiaperType.Wet, DiaperType.Dirty, DiaperType.Mixed]);
  const labels = ['Wet', 'Dirty', 'Mixed'];
  const entry: DiaperEntry = {
    id: crypto.randomUUID(),
    date: pick([todayStr(), recentDate(3)]),
    time: randTime(),
    type,
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    notes: '',
  };
  push(`afp:users/${UID}/children/${childId}:diapers`, entry);
  return `${labels[type]} at ${entry.time}`;
};

// ─── Component ───────────────────────────────────────────────────────────────

/** Runs a generator N times, logs results to console.table */
const bulkRun = (gen: () => string, count: number, label: string): string => {
  const results: Array<{ '#': number; result: string }> = [];
  for (let i = 0; i < count; i++) {
    results.push({ '#': i + 1, result: gen() });
  }
  console.groupCollapsed(`[DevBench] ${label} ×${count}`);
  console.table(results);
  console.groupEnd();
  return `${count} added — see console`;
};

/** Button with flash feedback + bulk options */
function BenchButton({ label, onClick }: { label: string; onClick: () => string }) {
  const [flash, setFlash] = useState<string | null>(null);

  const fire = useCallback((count: number) => {
    const msg = count === 1 ? onClick() : bulkRun(onClick, count, label);
    setFlash(msg);
    setTimeout(() => setFlash(null), 2000);
  }, [onClick, label]);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => fire(1)}
          className="px-3 py-2 rounded-lg bg-accent text-fg-on-accent text-sm font-medium active:scale-95 transition-transform"
        >
          {label}
        </button>
        <button
          type="button"
          onClick={() => fire(100)}
          className="px-2 py-2 rounded-lg bg-accent/70 text-fg-on-accent text-xs font-mono active:scale-95 transition-transform"
        >
          ×100
        </button>
        <button
          type="button"
          onClick={() => fire(1000)}
          className="px-2 py-2 rounded-lg bg-accent/50 text-fg-on-accent text-xs font-mono active:scale-95 transition-transform"
        >
          ×1k
        </button>
      </div>
      {flash && <span className="text-xs text-fg-muted animate-pulse">{flash}</span>}
    </div>
  );
}

/** Dev-only bench panel — visible only when Firebase is not configured */
export function DevBench() {
  if (isFirebaseConfigured) return null;

  const bodyConfig = readDoc<BodyConfig>(`${BASE}:body_config`);
  const children = read<Child>(`${BASE}:children`);
  const hasChild = children.length > 0;

  const handleClear = () => {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('afp:'));
    keys.forEach((k) => localStorage.removeItem(k));
    window.location.reload();
  };

  return (
    <div className="rounded-xl bg-surface-card border-2 border-dashed border-accent/30 p-4 mx-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-accent uppercase tracking-wide">Dev Bench</h3>
        <button
          type="button"
          onClick={handleClear}
          className="px-2 py-1 rounded text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20"
        >
          Nuke localStorage
        </button>
      </div>

      {/* Body section */}
      {
bodyConfig && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-fg-muted mb-2">Body</p>
          <div className="flex flex-wrap gap-2">
            {bodyConfig.floors && <BenchButton label="+ Floors" onClick={benchFloors} />}
            {bodyConfig.walking && <BenchButton label="+ Walk" onClick={benchWalk} />}
            {bodyConfig.running && <BenchButton label="+ Run" onClick={benchRun} />}
          </div>
        </div>
      )
}
      {
!bodyConfig && (
        <p className="text-xs text-fg-muted mb-3">Body: configure first to unlock bench buttons</p>
      )
}

      {/* Budget section */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-fg-muted mb-2">Budget</p>
        <div className="flex flex-wrap gap-2">
          <BenchButton label="+ Expense" onClick={benchExpense} />
        </div>
      </div>

      {/* Baby section */}
      <div className="mb-1">
        <p className="text-xs font-semibold text-fg-muted mb-2">
          Baby{hasChild ? ` (${children[0]?.name})` : ''}
        </p>
        <div className="flex flex-wrap gap-2">
          <BenchButton label="+ Feed" onClick={benchFeed} />
          <BenchButton label="+ Sleep" onClick={benchSleep} />
          <BenchButton label="+ Diaper" onClick={benchDiaper} />
        </div>
        {
!hasChild && (
          <p className="text-xs text-fg-muted mt-1">First press auto-creates a random child</p>
        )
}
      </div>
    </div>
  );
}

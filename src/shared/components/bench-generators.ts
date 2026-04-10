import { ActivityType, PaymentMethod, IncomeSource } from '@/shared/types';
import type { BodyRecord, BodyActivity } from '@/modules/body/types';
import type { Child, FeedEntry, SleepEntry, DiaperEntry, GrowthEntry } from '@/modules/baby/types';
import { FeedType, SleepType, SleepQuality, DiaperType } from '@/modules/baby/types';
import type { Expense, Income } from '@/modules/expenses/types';
import { getAllCategoryIds, CATEGORIES } from '@/modules/expenses/categories';
import { todayStr } from '@/shared/utils/date';

// ─── Constants ──────────────────────────────────────────────────────────────

export const UID = 'dev-user';
export const BASE = `afp:users/${UID}`;
export const MAX_PER_DAY = 10;

// ─── localStorage helpers (with error handling) ─────────────────────────────

/** Reads a collection array from localStorage */
export const read = <T,>(key: string): T[] => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch (e) {
    console.warn(`[DevBench] Corrupt data at key "${key}", resetting:`, e);
    localStorage.removeItem(key);
    return [];
  }
};

/** Appends a single item to a localStorage collection */
export const push = <T extends { id?: string }>(key: string, item: T): void => {
  try {
    const items = read<T>(key);
    items.push({ ...item, id: item.id ?? crypto.randomUUID() });
    localStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    console.error(`[DevBench] Failed to write "${key}" — localStorage may be full:`, e);
  }
};

/** Appends multiple items in one read-write cycle (avoids O(n^2) for bulk) */
export const bulkPush = <T extends { id?: string }>(key: string, newItems: T[]): void => {
  try {
    const existing = read<T>(key);
    for (const item of newItems) {
      existing.push({ ...item, id: item.id ?? crypto.randomUUID() });
    }
    localStorage.setItem(key, JSON.stringify(existing));
  } catch (e) {
    console.error(`[DevBench] Bulk write failed for "${key}" — localStorage may be full:`, e);
  }
};

/** Reads a single doc (stored as array with one element) */
export const readDoc = <T,>(key: string): T | null => {
  const items = read<T>(key);
  return items[0] ?? null;
};

// ─── Random helpers ─────────────────────────────────────────────────────────

/** Random int between min and max (inclusive) */
export const rand = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/** Random element from array */
export const pick = <T,>(arr: readonly T[]): T => arr[rand(0, arr.length - 1)] as T;

/** Date string N days ago from today */
export const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0] as string;
};

/** Random time string HH:MM */
export const randTime = (): string =>
  `${String(rand(6, 22)).padStart(2, '0')}:${String(rand(0, 59)).padStart(2, '0')}`;

/**
 * Returns a date for a bulk item index, spreading max MAX_PER_DAY per day.
 * Index 0-9 → today, 10-19 → yesterday, etc.
 */
export const spreadDate = (index: number): string => {
  const dayOffset = Math.floor(index / MAX_PER_DAY);
  return daysAgo(dayOffset);
};

// ─── Generic activity generator (DRY for Walk/Run/Cycle) ────────────────────

/** Creates a random body activity of the given type */
export const benchActivity = (
  type: ActivityType,
  distRange: [number, number],
  durRange: [number, number],
  date?: string,
): { activity: BodyActivity; summary: string } => {
  const distance = rand(distRange[0], distRange[1]);
  const labels: Record<string, string> = {
    [ActivityType.Walk]: 'Walk',
    [ActivityType.Run]: 'Run',
    [ActivityType.Cycle]: 'Cycle',
  };
  const activity: BodyActivity = {
    id: crypto.randomUUID(),
    type,
    distance,
    duration: rand(durRange[0], durRange[1]),
    date: date ?? pick([todayStr(), daysAgo(rand(1, 7))]),
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  return { activity, summary: `${labels[type] ?? type} ${distance}m on ${activity.date}` };
};

// ─── Generators ─────────────────────────────────────────────────────────────

/** Adds a random body floor record for today or recent day */
export const benchFloors = (date?: string): string => {
  const dateStr = date ?? pick([todayStr(), daysAgo(rand(1, 7))]);
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
  const key = `${BASE}:body`;
  try {
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
  } catch (e) {
    console.error('[DevBench] benchFloors failed:', e);
  }
  return `+${up}↑ ${down}↓ on ${dateStr}`;
};

/** Adds a random walk activity */
export const benchWalk = (date?: string): string => {
  const { activity, summary } = benchActivity(ActivityType.Walk, [200, 3000], [10, 60], date);
  push(`${BASE}:body_activities`, activity);
  return summary;
};

/** Adds a random run activity */
export const benchRun = (date?: string): string => {
  const { activity, summary } = benchActivity(ActivityType.Run, [500, 5000], [15, 45], date);
  push(`${BASE}:body_activities`, activity);
  return summary;
};

/** Adds a random cycle activity */
export const benchCycle = (date?: string): string => {
  const { activity, summary } = benchActivity(ActivityType.Cycle, [1000, 15000], [20, 90], date);
  push(`${BASE}:body_activities`, activity);
  return summary;
};

/** Adds a random expense */
export const benchExpense = (date?: string): string => {
  const catIds = getAllCategoryIds();
  const catId = pick(catIds);
  const cat = CATEGORIES[catId]!;
  const subCat = pick(cat.subCategories);
  const amount = rand(20, 5000);
  const paymentMethods = Object.values(PaymentMethod).filter((v): v is PaymentMethod => typeof v === 'number');
  const now = new Date().toISOString();
  const expense: Expense = {
    id: crypto.randomUUID(),
    date: date ?? pick([todayStr(), daysAgo(rand(1, 14))]),
    category: catId,
    subCat,
    amount,
    paymentMethod: pick(paymentMethods),
    isSettlement: false,
    note: '',
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  };
  push(`${BASE}:expenses`, expense);
  return `₹${amount} ${cat.label} → ${subCat}`;
};

/** Adds a CC settlement expense */
export const benchSettlement = (date?: string): string => {
  const amount = rand(1000, 15000);
  const now = new Date().toISOString();
  const expense: Expense = {
    id: crypto.randomUUID(),
    date: date ?? pick([todayStr(), daysAgo(rand(1, 14))]),
    category: 11, // Finance
    subCat: 'Credit Card Payment',
    amount,
    paymentMethod: PaymentMethod.BankAccountImps,
    isSettlement: true,
    note: '',
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  };
  push(`${BASE}:expenses`, expense);
  return `Settlement ₹${amount}`;
};

/** Adds a random income entry */
export const benchIncome = (date?: string): string => {
  const sources = Object.values(IncomeSource).filter((v): v is IncomeSource => typeof v === 'number');
  const source = pick(sources);
  const labels: Record<number, string> = { 0: 'Salary', 1: 'Business', 2: 'Interest', 3: 'Refund', 4: 'Other' };
  const amount = rand(5000, 100000);
  const paymentMethods = Object.values(PaymentMethod).filter((v): v is PaymentMethod => typeof v === 'number');
  const now = new Date().toISOString();
  const entry: Income = {
    id: crypto.randomUUID(),
    date: date ?? pick([todayStr(), daysAgo(rand(1, 30))]),
    source,
    amount,
    paymentMethod: pick(paymentMethods),
    note: '',
    createdAt: now,
    updatedAt: now,
  };
  push(`${BASE}:income`, entry);
  return `₹${amount} ${labels[source] ?? 'Income'}`;
};

// ─── Baby generators ────────────────────────────────────────────────────────

/** Generates a gibberish baby name */
const randomBabyName = (): string => {
  const prefixes = ['XYZ', 'GenZ', 'BB', 'G', 'Smol', 'Lil', 'Q', 'ZZ', 'K9', 'NPC', 'Bot', 'Bub'];
  return `${pick(prefixes)}${rand(1, 999)}`;
};

/** Random DOB in the last 0-3 years */
const randomDob = (): string => daysAgo(rand(1, 1095));

/** Ensures a child exists, returns its ID */
export const ensureChild = (): string => {
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
export const benchFeed = (date?: string): string => {
  const childId = ensureChild();
  const type = pick([FeedType.Bottle, FeedType.BreastLeft, FeedType.BreastRight, FeedType.BreastBoth, FeedType.SolidFood]);
  const labels: Record<number, string> = { 0: 'Bottle', 1: 'Breast L', 2: 'Breast R', 3: 'Breast Both', 4: 'Solid' };
  const entry: FeedEntry = {
    id: crypto.randomUUID(),
    date: date ?? pick([todayStr(), daysAgo(rand(1, 3))]),
    time: randTime(),
    type,
    amount: type === FeedType.Bottle ? rand(30, 200) : null,
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    notes: '',
  };
  push(`afp:users/${UID}/children/${childId}:feeds`, entry);
  return `${labels[type] ?? 'Feed'} at ${entry.time}`;
};

/** Adds a random sleep entry */
export const benchSleep = (date?: string): string => {
  const childId = ensureChild();
  const type = pick([SleepType.Nap, SleepType.Night]);
  const startHour = type === SleepType.Nap ? rand(10, 15) : rand(19, 22);
  const durHours = type === SleepType.Nap ? rand(1, 2) : rand(6, 10);
  const entry: SleepEntry = {
    id: crypto.randomUUID(),
    date: date ?? pick([todayStr(), daysAgo(rand(1, 3))]),
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
export const benchDiaper = (date?: string): string => {
  const childId = ensureChild();
  const type = pick([DiaperType.Wet, DiaperType.Dirty, DiaperType.Mixed]);
  const labels: Record<number, string> = { 0: 'Wet', 1: 'Dirty', 2: 'Mixed' };
  const entry: DiaperEntry = {
    id: crypto.randomUUID(),
    date: date ?? pick([todayStr(), daysAgo(rand(1, 3))]),
    time: randTime(),
    type,
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    notes: '',
  };
  push(`afp:users/${UID}/children/${childId}:diapers`, entry);
  return `${labels[type] ?? 'Diaper'} at ${entry.time}`;
};

/** Adds a random growth measurement */
export const benchGrowth = (date?: string): string => {
  const childId = ensureChild();
  const weight = Math.round((rand(30, 120) / 10) * 100) / 100; // 3.0 - 12.0 kg
  const height = Math.round((rand(450, 900) / 10) * 10) / 10; // 45.0 - 90.0 cm
  const hc = Math.round((rand(330, 480) / 10) * 10) / 10; // 33.0 - 48.0 cm
  const entry: GrowthEntry = {
    id: crypto.randomUUID(),
    date: date ?? pick([todayStr(), daysAgo(rand(1, 30))]),
    weight,
    height,
    headCircumference: hc,
    createdAt: new Date().toISOString(),
    notes: '',
  };
  push(`afp:users/${UID}/children/${childId}:growth`, entry);
  return `${weight}kg / ${height}cm`;
};

// ─── Bulk runner with day-spread ────────────────────────────────────────────

/** Runs a generator N times with day-spread (max MAX_PER_DAY per day), logs to console */
export const bulkRun = (gen: (date?: string) => string, count: number, label: string): string => {
  const results: Array<{ '#': number; date: string; result: string }> = [];
  for (let i = 0; i < count; i++) {
    const date = spreadDate(i);
    results.push({ '#': i + 1, date, result: gen(date) });
  }
  console.groupCollapsed(`[DevBench] ${label} ×${count} (spread over ${Math.ceil(count / MAX_PER_DAY)} days)`);
  console.table(results);
  console.groupEnd();
  return `${count} added over ${Math.ceil(count / MAX_PER_DAY)} days — see console`;
};

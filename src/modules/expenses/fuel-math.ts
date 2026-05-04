import type {
  Expense,
  ExpenseMeta,
  FuelMeta,
  MaintenanceMeta,
} from '@/modules/expenses/types';

/** Returns the per-fill mileage (km/L) — only honest when fullTank is true and tripOdo+liters present */
export function computeMileage(meta: FuelMeta): number | null {
  if (!meta.fullTank) return null;
  if (meta.tripOdo == null || meta.tripOdo <= 0) return null;
  if (meta.liters <= 0) return null;
  return meta.tripOdo / meta.liters;
}

/** Returns the highest odometer reading across all fuel + maintenance entries, or null if none */
export function latestOdometer(expenses: Expense[]): number | null {
  let max: number | null = null;
  for (const e of expenses) {
    const odo = readOdometer(e.meta);
    if (odo != null && (max == null || odo > max)) {
      max = odo;
    }
  }
  return max;
}

/** Returns the most recent maintenance meta that has a non-null nextService */
export function dueMaintenance(expenses: Expense[]): MaintenanceMeta | null {
  const maint = expenses
    .filter((e): e is Expense & { meta: MaintenanceMeta } =>
      e.meta?.type === 'maintenance' && e.meta.nextService != null,
    )
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));
  return maint[0]?.meta ?? null;
}

/** Returns true when the latest odometer reading has reached the most recent nextService */
export function isServiceDue(expenses: Expense[]): boolean {
  const due = dueMaintenance(expenses);
  if (!due || due.nextService == null) return false;
  const latest = latestOdometer(expenses);
  if (latest == null) return false;
  return latest >= due.nextService;
}

/** Extracts the odometer reading from a meta object, if present */
function readOdometer(meta: ExpenseMeta | undefined): number | null {
  if (!meta) return null;
  if (meta.type === 'fuel') return meta.odometer;
  if (meta.type === 'maintenance') return meta.odometer;
  return null;
}

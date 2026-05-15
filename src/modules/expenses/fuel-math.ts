import type { Expense, ExpenseMeta, FuelMeta, MaintenanceMeta } from '@/modules/expenses/types';
import { ExpenseMetaType } from '@/modules/expenses/types';
import { assertNever } from '@/shared/utils/types';

/** Inputs for the two-of-three fuel input derivation. */
export interface FuelTripleInput {
  liters: number;
  pricePerLiter: number;
  amount: number;
  lastEdited: 'liters' | 'price' | 'amount';
}

/** Two-of-three derivation: given any two valid operands, fill the third. Never clobbers user input. */
export function deriveFuelTriple(
  input: FuelTripleInput,
): { liters: number; pricePerLiter: number; amount: number } {
  const { liters, pricePerLiter: price, amount, lastEdited } = input;
  const ok = (n: number) => Number.isFinite(n) && n > 0;
  const out = { liters, pricePerLiter: price, amount };

  if (lastEdited !== 'amount' && !ok(amount) && ok(liters) && ok(price)) {
    const derived = liters * price;
    if (Number.isFinite(derived)) out.amount = derived;
  } else if (lastEdited !== 'price' && !ok(price) && ok(liters) && ok(amount)) {
    const derived = amount / liters;
    if (Number.isFinite(derived) && derived > 0) out.pricePerLiter = derived;
  } else if (lastEdited !== 'liters' && !ok(liters) && ok(price) && ok(amount)) {
    const derived = amount / price;
    if (Number.isFinite(derived) && derived > 0) out.liters = derived;
  }
  return out;
}

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
    .filter(
      (e): e is Expense & { meta: MaintenanceMeta } =>
        e.meta?.type === ExpenseMetaType.Maintenance && e.meta.nextService != null,
    )
    .slice()
    .sort((a, b) => (b.meta.odometer ?? 0) - (a.meta.odometer ?? 0));
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
  switch (meta.type) {
    case ExpenseMetaType.Fuel:
      return meta.odometer;
    case ExpenseMetaType.Maintenance:
      return meta.odometer;
    case ExpenseMetaType.Travel:
      return null;
    default:
      return assertNever(meta);
  }
}

import type { ExpenseMeta, FuelMeta, TravelMeta, MaintenanceMeta } from './types';
import { ExpenseMetaType } from './types';
import { assertNever } from '@/shared/utils/types';
import { computeMileage } from './fuel-math';
import { CONFIG } from '@/constants/config';

/** Renders a one-line badge string for a fuel meta record. */
export function renderFuelBadge(meta: FuelMeta): string {
  const parts: string[] = [`⛽ ${meta.liters}L`];
  if (meta.pricePerLiter > 0) parts.push(`${CONFIG.CURRENCY_SYMBOL}${meta.pricePerLiter}/L`);
  if (meta.odometer != null) parts.push(`${meta.odometer.toLocaleString()}km`);
  const mileage = computeMileage(meta);
  if (mileage != null) parts.push(`${mileage.toFixed(1)} km/L`);
  return parts.join(' · ');
}

/** Renders a one-line badge string for a travel meta record. */
export function renderTravelBadge(meta: TravelMeta): string {
  const route = `🚕 ${meta.origin} → ${meta.destination}`;
  return meta.distance != null ? `${route} · ${meta.distance}km` : route;
}

/** Renders a one-line badge string for a maintenance meta record. */
export function renderMaintenanceBadge(meta: MaintenanceMeta): string {
  const parts = [`🔧 ${meta.odometer.toLocaleString()}km`];
  if (meta.nextService != null) parts.push(`next ${meta.nextService.toLocaleString()}`);
  return parts.join(' · ');
}

/** Dispatches to the per-type badge renderer. Returns null for undefined meta. */
export function renderBadge(meta: ExpenseMeta | undefined): string | null {
  if (!meta) return null;
  switch (meta.type) {
    case ExpenseMetaType.Fuel:
      return renderFuelBadge(meta);
    case ExpenseMetaType.Travel:
      return renderTravelBadge(meta);
    case ExpenseMetaType.Maintenance:
      return renderMaintenanceBadge(meta);
    default:
      return assertNever(meta);
  }
}

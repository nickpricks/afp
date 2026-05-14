import type { FinanceEntry } from '@/modules/baby/types';
import { FinanceStatus } from '@/modules/baby/types';

/** Sum of Received + Saved amounts (excludes Spent). "Wealth" = present-tense holdings. */
export const computeKidWealth = (entries: FinanceEntry[]): number =>
  entries
    .filter((e) => e.status === FinanceStatus.Received || e.status === FinanceStatus.Saved)
    .reduce((sum, e) => sum + e.amount, 0);

/** Filter a list of status-bearing entries by exact status match */
export const filterByStatus = <T extends { status: number }>(
  entries: T[],
  status: number,
): T[] => entries.filter((e) => e.status === status);

import type { Expense, Income } from '@/modules/expenses/types';
import { PaymentMethod, TimeRange } from '@/shared/types';
import { filterByDateRange } from '@/shared/utils/filter';

/** Computes total income from income entries */
export const computeTotalIncome = (income: Income[]): number => {
  return income.reduce((sum, i) => sum + i.amount, 0);
};

/** Computes total spent from expenses, excluding settlements */
export const computeTotalSpent = (expenses: Expense[]): number => {
  return expenses.filter((e) => !e.isSettlement).reduce((sum, e) => sum + e.amount, 0);
};

/** Computes outstanding credit card amount (CC + UPI CC expenses minus CC settlements) */
export const computeCCOutstanding = (expenses: Expense[]): number => {
  const ccSpent = expenses
    .filter(
      (e) =>
        !e.isSettlement &&
        (e.paymentMethod === PaymentMethod.CreditCard ||
          e.paymentMethod === PaymentMethod.UpiCreditCard),
    )
    .reduce((sum, e) => sum + e.amount, 0);

  const ccSettled = expenses.filter((e) => e.isSettlement).reduce((sum, e) => sum + e.amount, 0);

  return Math.max(0, ccSpent - ccSettled);
};

/** One family member's expenses, tagged for aggregation */
export type MemberExpenses = {
  uid: string;
  name: string;
  expenses: Expense[];
};

/** Per-member + family-wide spend totals for the Family ledger view */
export type FamilyTotals = {
  perMember: { uid: string; name: string; total: number }[];
  familyTotal: number;
};

/** Computes per-member and family-wide spend totals, honoring the active time range (settlements excluded) */
export const computeFamilyTotals = (
  members: MemberExpenses[],
  timeRange: TimeRange,
  today: string,
): FamilyTotals => {
  const perMember = members.map((m) => ({
    uid: m.uid,
    name: m.name,
    total: computeTotalSpent(filterByDateRange(m.expenses, timeRange, today, (e) => e.date)),
  }));
  return { perMember, familyTotal: perMember.reduce((sum, m) => sum + m.total, 0) };
};

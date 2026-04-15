import type { Expense, Income } from '@/modules/expenses/types';
import { BudgetView, PaymentMethod } from '@/shared/types';

/** Computes total income from income entries */
export const computeTotalIncome = (income: Income[]): number => {
  return income.reduce((sum, i) => sum + i.amount, 0);
};

/** Computes total spent from expenses, excluding settlements */
export const computeTotalSpent = (expenses: Expense[]): number => {
  return expenses.filter((e) => !e.isSettlement).reduce((sum, e) => sum + e.amount, 0);
};

/** Filters items with a `date` field by BudgetView range relative to a reference date */
export const filterByDateRange = <T extends { date: string }>(
  items: T[],
  view: BudgetView,
  today: string,
): T[] => {
  if (view === BudgetView.All) return items;

  const todayMs = new Date(today).getTime();
  const daysMap = { [BudgetView.Today]: 0, [BudgetView.Week]: 6, [BudgetView.Month]: 29 };
  const days = daysMap[view];
  const cutoffMs = todayMs - days * 86_400_000;

  return items.filter((item) => {
    const itemMs = new Date(item.date).getTime();
    return itemMs >= cutoffMs && itemMs <= todayMs;
  });
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

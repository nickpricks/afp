import type { Expense, Income } from '@/modules/expenses/types';
import { PaymentMethod } from '@/shared/types';

/** Computes total income from income entries */
export const computeTotalIncome = (income: Income[]): number => {
  return income.reduce((sum, i) => sum + i.amount, 0);
};

/** Computes total spent from expenses, excluding settlements */
export const computeTotalSpent = (expenses: Expense[]): number => {
  return expenses
    .filter((e) => !e.isSettlement)
    .reduce((sum, e) => sum + e.amount, 0);
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

  const ccSettled = expenses
    .filter((e) => e.isSettlement)
    .reduce((sum, e) => sum + e.amount, 0);

  return Math.max(0, ccSpent - ccSettled);
};

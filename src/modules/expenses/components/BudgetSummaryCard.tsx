import { DashboardCard } from '@/shared/components/DashboardCard';
import { useExpenses } from '@/modules/expenses/hooks/useExpenses';
import { useIncome } from '@/modules/expenses/hooks/useIncome';
import { computeTotalSpent, computeTotalIncome } from '@/modules/expenses/budget-math';
import { ROUTES } from '@/constants/routes';
import { CONFIG } from '@/constants/config';

interface Props {
  targetUid?: string;
}

/** 
 * Summary card for the Budget module on the Dashboard.
 * Handles its own data fetching via useExpenses and useIncome.
 */
export function BudgetSummaryCard({ targetUid }: Props) {
  const { expenses } = useExpenses(targetUid);
  const { income } = useIncome(targetUid);
  
  const totalSpent = computeTotalSpent(expenses);
  const totalIncome = computeTotalIncome(income);
  const remaining = totalIncome - totalSpent;

  return (
    <DashboardCard
      title="Budget"
      icon="💰"
      metric={`${CONFIG.CURRENCY_SYMBOL}${totalSpent.toLocaleString()}`}
      subtitle={`Remaining: ${CONFIG.CURRENCY_SYMBOL}${remaining.toLocaleString()}`}
      to={ROUTES.BUDGET}
    />
  );
}

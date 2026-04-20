import { DashboardCard } from '@/shared/components/DashboardCard';
import { useChildren } from '@/modules/baby/hooks/useChildren';
import { ROUTES } from '@/constants/routes';

interface Props {
  targetUid?: string;
}

/** 
 * Summary card for the Baby module on the Dashboard.
 * Handles its own data fetching via useChildren.
 */
export function BabySummaryCard({ targetUid }: Props) {
  const { children } = useChildren(targetUid);

  const childCount = children.length;
  const babyMetric =
    childCount === 0 ? 'No children' : `${childCount} ${childCount === 1 ? 'child' : 'children'}`;
  const babySubtitle =
    childCount > 0 ? children.map((c) => c.name).join(', ') : 'Add a child to get started';

  return (
    <DashboardCard
      title="Baby"
      icon="👶"
      metric={babyMetric}
      subtitle={babySubtitle}
      to={ROUTES.BABY}
    />
  );
}

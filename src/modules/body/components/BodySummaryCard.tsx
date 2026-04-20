import { DashboardCard } from '@/shared/components/DashboardCard';
import { useBodyData } from '@/modules/body/hooks/useBodyData';
import { useBodyConfig } from '@/modules/body/hooks/useBodyConfig';
import { ROUTES } from '@/constants/routes';

interface Props {
  targetUid?: string;
}

/** 
 * Summary card for the Body module on the Dashboard.
 * Handles its own data fetching via useBodyConfig and useBodyData.
 */
export function BodySummaryCard({ targetUid }: Props) {
  const { config: bodyConfig } = useBodyConfig(targetUid);
  const { todayRecord } = useBodyData(targetUid);

  return (
    <DashboardCard
      title="Body"
      icon="💪"
      metric={String(todayRecord?.total ?? 0)}
      subtitle={
        bodyConfig.floors
          ? `${todayRecord?.up ?? 0} up / ${todayRecord?.down ?? 0} down`
          : 'No floors configured'
      }
      to={ROUTES.BODY}
    />
  );
}

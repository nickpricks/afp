import { useLiveActivityContext } from '@/modules/body/context/LiveActivityContext';
import { ActivityType } from '@/shared/types';
import { Footprints, Zap } from 'lucide-react';

/**
 * Dashboard card to start a live activity session (Walk or Run).
 * Only visible if the Body module is enabled.
 */
export function ActivityTrackerCard() {
  const { prepare, sessionState } = useLiveActivityContext();

  if (sessionState !== 'idle') return null;

  return (
    <div className="rounded-xl border-2 border-dashed border-line bg-surface p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">🛰</span>
        <span className="text-xs font-bold text-fg-muted uppercase tracking-wider">
          Active Tracking POC
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => prepare(ActivityType.Walk)}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-line bg-surface-card p-4 hover:border-accent hover:bg-accent-muted transition-all group"
        >
          <div className="rounded-full bg-accent/10 p-2 group-hover:bg-accent/20 transition-colors">
            <Footprints className="text-accent" size={24} />
          </div>
          <span className="text-sm font-bold text-fg">Start Walk</span>
        </button>

        <button
          type="button"
          onClick={() => prepare(ActivityType.Run)}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-line bg-surface-card p-4 hover:border-orange-500 hover:bg-orange-50 transition-all group"
        >
          <div className="rounded-full bg-orange-100 p-2 group-hover:bg-orange-200 transition-colors">
            <Zap className="text-orange-600" size={24} />
          </div>
          <span className="text-sm font-bold text-fg">Start Run</span>
        </button>
      </div>
      <p className="text-[10px] text-fg-muted text-center italic">
        Experimental: Uses GPS + Accelerometer + Barometer
      </p>
    </div>
  );
}

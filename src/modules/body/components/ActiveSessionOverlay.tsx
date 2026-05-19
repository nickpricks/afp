import { useLiveActivityContext } from '@/modules/body/context/LiveActivityContext';
import { useBodyData } from '@/modules/body/hooks/useBodyData';
import { useToast } from '@/shared/errors/useToast';
import { BodyMsg } from '@/constants/messages';
import { ToastType } from '@/shared/types';
import { formatDistance } from '@/shared/utils/format';
import { todayStr } from '@/shared/utils/date';

/** Formats seconds into HH:MM:SS */
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

/**
 * Non-dismissible full-screen overlay for active tracking sessions.
 * Shows live metrics and provides a stop button that persists data.
 */
export function ActiveSessionOverlay() {
  const { sessionState, metrics, start, stop, cancel, refreshSensors } = useLiveActivityContext();
  const { logActivity, saveRecord, todayRecord } = useBodyData();
  const { addToast } = useToast();

  if (sessionState === 'idle') return null;

  const handleEnd = async () => {
    const final = stop();

    // 1. Log the distance activity
    if (final.distanceMeters > 0) {
      await logActivity(final.type, final.distanceMeters);
    }

    // 2. Log floors if any detected
    if (final.floorsUp > 0 || final.floorsDown > 0) {
      await saveRecord(todayStr(), {
        up: todayRecord.up + final.floorsUp,
        down: todayRecord.down + final.floorsDown,
      });
    }

    addToast(BodyMsg.ActivityAdded, ToastType.Success);
  };

  if (sessionState === 'ready') {
    return (
      <div className="fixed inset-0 z-[9999] bg-surface flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
        <div className="mb-12">
          <span className="inline-block rounded-full bg-accent/20 px-4 py-1 text-sm font-semibold text-accent uppercase tracking-widest mb-4">
            Ready to Start
          </span>
          <h2 className="text-4xl font-black text-fg tracking-tighter capitalize">
            {metrics.type} Session
          </h2>
          <p className="mt-4 text-sm text-fg-muted max-w-[250px] mx-auto">
            We will track distance, steps, and floors. GPS and Motion sensors will activate now.
          </p>
        </div>

        <button
          type="button"
          onClick={start}
          className="mb-6 h-28 w-28 flex items-center justify-center rounded-full bg-accent text-white text-2xl font-black shadow-xl shadow-accent/40 active:scale-95 transition-all"
        >
          START
        </button>

        <button
          type="button"
          onClick={cancel}
          className="mb-12 px-6 py-3 rounded-full border border-line bg-transparent text-sm font-semibold text-fg-muted hover:text-fg hover:border-fg-muted active:scale-95 transition-all"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={refreshSensors}
          className="mb-6 px-4 py-2 rounded-full border border-line bg-surface-card text-xs font-semibold text-fg-muted hover:text-fg hover:border-fg-muted active:scale-95 transition-all"
        >
          Force Refresh GPS / Sensors
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-surface flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      {' '}
      <div className="mb-8">
        <span className="inline-block rounded-full bg-accent/20 px-4 py-1 text-sm font-semibold text-accent uppercase tracking-widest mb-2">
          {metrics.type}ing session
        </span>
        <h2 className="text-6xl font-black text-fg tabular-nums tracking-tighter">
          {formatDuration(metrics.durationSeconds)}
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-8 w-full max-w-md mb-8">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-fg-muted uppercase">Distance</span>
          <span className="text-3xl font-bold text-fg">
            {formatDistance(metrics.distanceMeters)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-fg-muted uppercase">Steps</span>
          <span className="text-3xl font-bold text-fg">{metrics.steps.toLocaleString()}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-fg-muted uppercase">Floors Up</span>
          <span className="text-3xl font-bold text-fg text-emerald-500">{metrics.floorsUp}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-fg-muted uppercase">Floors Down</span>
          <span className="text-3xl font-bold text-fg text-amber-500">{metrics.floorsDown}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-4 p-3 rounded-xl bg-surface-card border border-line text-left">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-fg-muted uppercase tracking-wider">Lat</span>
          <span className="text-sm font-mono text-fg">{metrics.latitude?.toFixed(6) ?? '---'}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-fg-muted uppercase tracking-wider">Lng</span>
          <span className="text-sm font-mono text-fg">
            {metrics.longitude?.toFixed(6) ?? '---'}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={refreshSensors}
        className="mb-12 px-4 py-2 rounded-full border border-line bg-surface-card text-xs font-semibold text-fg-muted hover:text-fg hover:border-fg-muted active:scale-95 transition-all"
      >
        Force Refresh GPS / Sensors
      </button>
      <button
        type="button"
        onClick={handleEnd}
        className="h-20 w-full max-w-xs rounded-3xl bg-error text-white text-xl font-black shadow-lg shadow-error/30 active:scale-95 transition-all"
      >
        END SESSION
      </button>
      <p className="mt-8 text-xs text-fg-muted max-w-[200px]">
        Keep this page open. Your screen will stay on during the session.
      </p>
    </div>
  );
}

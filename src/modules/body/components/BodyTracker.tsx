import { ArrowUp, ArrowDown } from 'lucide-react';

import { useBodyData } from '@/modules/body/hooks/useBodyData';

/** Main body tracking UI with score display and floor tap buttons */
export function BodyTracker() {
  const { todayRecord, tap } = useBodyData();

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-8">
      <div className="text-center">
        <p className="text-5xl font-bold text-accent">{todayRecord.total}</p>
        <p className="mt-1 text-sm text-fg-muted">
          {todayRecord.floors.up} up &middot; {todayRecord.floors.down} down
        </p>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => tap('up')}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-fg-on-accent active:scale-95 transition-transform"
        >
          <ArrowUp size={28} />
        </button>
        <button
          type="button"
          onClick={() => tap('down')}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-card text-fg border border-line active:scale-95 transition-transform"
        >
          <ArrowDown size={28} />
        </button>
      </div>
    </div>
  );
}

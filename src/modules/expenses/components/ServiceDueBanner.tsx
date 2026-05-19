import { useMemo, useState } from 'react';

import type { Expense } from '@/modules/expenses/types';
import { dueMaintenance, latestOdometer } from '@/modules/expenses/fuel-math';

/** Yellow warning banner — shown when latest odometer has reached most recent nextService */
export function ServiceDueBanner({ expenses }: { expenses: Expense[] }) {
  // Session-only dismiss. Banner naturally clears when user logs a new maintenance
  // entry (isServiceDue then returns false on next render). Domain-event-tied per
  // Decision D1 — no new storage surface.
  const [hidden, setHidden] = useState(false);

  // Walk the array once per render; derive both values from the same pass.
  const { due, current } = useMemo(
    () => ({ due: dueMaintenance(expenses), current: latestOdometer(expenses) }),
    [expenses],
  );

  if (hidden || !due?.nextService || current == null || current < due.nextService) {
    return null;
  }

  return (
    <div className="mx-4 mb-3 flex items-start gap-3 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm">
      <span className="text-amber-600">⚠</span>
      <div className="flex-1">
        <p className="font-medium text-fg">Service due</p>
        <p className="text-xs text-fg-muted">
          Current ODO {current.toLocaleString()} km · due at {due.nextService.toLocaleString()} km
        </p>
      </div>
      <button
        type="button"
        onClick={() => setHidden(true)}
        className="text-fg-muted hover:text-fg"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

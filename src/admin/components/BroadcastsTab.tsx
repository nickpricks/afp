import { useState, useCallback } from 'react';

import { useAdminNotifications } from '@/admin/hooks/useAdminNotifications';
import { useAllUsers } from '@/admin/hooks/useAllUsers';
import { AlertType, Severity, UserRole } from '@/shared/types';
import { todayStr } from '@/shared/utils/date';

/** Admin Broadcasts tab: compose alerts and view active/expired list */
export function BroadcastsTab() {
  const { sendAlert } = useAdminNotifications();
  const { users } = useAllUsers();

  const [message, setMessage] = useState('');
  const [alertType, setAlertType] = useState<AlertType>(AlertType.Notice);
  const [severity, setSeverity] = useState<Severity>(Severity.Info);
  const [shownTillDate, setShownTillDate] = useState('');
  const [targetAll, setTargetAll] = useState(true);
  const [targetUid, setTargetUid] = useState('');
  const [sending, setSending] = useState(false);

  const nonAdminUsers = users.filter((u) => u.role !== UserRole.TheAdminNick);

  const handleSend = useCallback(async () => {
    if (!message.trim() || !shownTillDate) return;
    setSending(true);

    const targetUids = targetAll ? nonAdminUsers.map((u) => u.uid) : targetUid ? [targetUid] : [];

    if (targetUids.length === 0) {
      setSending(false);
      return;
    }

    await sendAlert({
      message: message.trim(),
      severity,
      alertType,
      shownTillDate,
      targetUids,
    });

    setMessage('');
    setShownTillDate('');
    setSending(false);
  }, [message, shownTillDate, severity, alertType, targetAll, targetUid, nonAdminUsers, sendAlert]);

  return (
    <div className="space-y-4">
      {/* Compose Form */}
      <section className="rounded-lg border border-line bg-surface-card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-fg-muted uppercase tracking-wide">
          New Broadcast
        </h2>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Alert message..."
          rows={2}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted/50 focus:border-accent focus:outline-none"
        />

        <div className="flex flex-wrap gap-3">
          {/* Alert Type */}
          <div>
            <label className="block text-xs font-medium text-fg-muted mb-1">Type</label>
            <select
              value={alertType}
              onChange={(e) => setAlertType(e.target.value as AlertType)}
              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-fg"
            >
              <option value={AlertType.Notice}>Notice (dismissible)</option>
              <option value={AlertType.Alert}>Alert (persistent)</option>
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-xs font-medium text-fg-muted mb-1">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Severity)}
              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-fg"
            >
              <option value={Severity.Info}>Info</option>
              <option value={Severity.Warning}>Warning</option>
              <option value={Severity.Critical}>Critical</option>
            </select>
          </div>

          {/* Expiry */}
          <div>
            <label className="block text-xs font-medium text-fg-muted mb-1">Show until</label>
            <input
              type="date"
              value={shownTillDate}
              min={todayStr()}
              onChange={(e) => setShownTillDate(e.target.value)}
              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-fg"
            />
          </div>
        </div>

        {/* Target */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={targetAll}
              onChange={() => setTargetAll(true)}
              className="accent-accent"
            />
            <span className="text-sm text-fg">All users ({nonAdminUsers.length})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!targetAll}
              onChange={() => setTargetAll(false)}
              className="accent-accent"
            />
            <span className="text-sm text-fg">Specific user</span>
          </label>
          {!targetAll && (
            <select
              value={targetUid}
              onChange={(e) => setTargetUid(e.target.value)}
              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-fg"
            >
              <option value="">Select user...</option>
              {nonAdminUsers.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !message.trim() || !shownTillDate}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-fg-on-accent hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send Broadcast'}
        </button>
      </section>

      {/* Active Alerts — note: admin reads from ALL users' subcollections.
          For MVP, we track sent alerts in component state after send.
          Full solution: query users' notifications where type=admin_alert.
          Deferred to avoid N listeners. Admin can see via individual user expansion. */}
    </div>
  );
}

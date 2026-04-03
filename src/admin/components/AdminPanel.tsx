import { InviteGenerator } from '@/admin/components/InviteGenerator';
import { useAdmin } from '@/admin/hooks/useAdmin';

/** Admin dashboard with invite management */
export function AdminPanel() {
  const { invites } = useAdmin();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-fg">Admin</h1>

      <InviteGenerator />

      <section className="rounded-xl bg-surface-card border border-line p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-fg mb-4">Invites</h2>

        {
invites.length === 0 && (
          <p className="text-sm text-fg-muted">No invites created yet.</p>
        )
}
        {
invites.length > 0 && (
          <ul className="divide-y divide-line">
            {
invites.map((invite) => {
              const statusClass = invite.linkedUid
                ? 'bg-success/10 text-success'
                : 'bg-warning/10 text-warning';
              const statusText = invite.linkedUid ? 'Redeemed' : 'Pending';

              return (
                <li key={invite.code} className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium text-fg">{invite.name}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}>
                    {statusText}
                  </span>
                </li>
              );
            })
}
          </ul>
        )
}
      </section>
    </div>
  );
}

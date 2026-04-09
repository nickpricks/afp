import { useCallback } from 'react';

import { InviteGenerator } from '@/admin/components/InviteGenerator';
import { useAdmin } from '@/admin/hooks/useAdmin';
import { useToast } from '@/shared/errors/useToast';
import { deleteInvite, createInvite } from '@/shared/auth/invite';
import { isOk } from '@/shared/types';
import { AdminMsg } from '@/constants/messages';
import { CONFIG } from '@/constants/config';
import type { InviteRecord } from '@/shared/auth/invite';

/** Invites management: create + list with copy/delete actions */
export function InvitesTab() {
  const { invites } = useAdmin();
  const { addToast } = useToast();

  /** Copies the invite link to clipboard */
  const handleCopy = useCallback(
    async (code: string) => {
      const link = `${window.location.origin}${import.meta.env.BASE_URL}invite/${code}`;
      try {
        await navigator.clipboard.writeText(link);
        addToast(AdminMsg.InviteLinkCopied, 'success');
      } catch {
        addToast(AdminMsg.InviteLinkCopyFailed, 'error');
      }
    },
    [addToast],
  );

  /** Deletes an invite with undo toast */
  const handleDelete = useCallback(
    async (invite: InviteRecord) => {
      const result = await deleteInvite(invite.code);
      if (isOk(result)) {
        addToast(AdminMsg.InviteDeleted, 'success', {
          action: {
            label: 'Undo',
            onClick: () => {
              createInvite(invite.code, invite.name, invite.modules, invite.createdBy);
            },
          },
          durationMs: CONFIG.UNDO_DURATION_MS,
        });
      } else {
        addToast(AdminMsg.InviteDeleteFailed, 'error');
      }
    },
    [addToast],
  );

  return (
    <div className="space-y-4">
      <InviteGenerator />

      {
invites.length === 0 && (
        <p className="text-sm text-fg-muted">No invites yet.</p>
      )
}
      {
invites.length > 0 && (
        <ul className="divide-y divide-line rounded-xl bg-surface-card border border-line">
          {
invites.map((inv) => (
            <li key={inv.code} className="flex items-center justify-between px-4 py-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-fg">{inv.name}</span>
                <span className="text-xs text-fg-muted">
                  {new Date(inv.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {
inv.linkedUid && (
                  <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                    Redeemed
                  </span>
                )
}
                {
!inv.linkedUid && (
                  <>
                    <span className="rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
                      Pending
                    </span>
                    <button
                      type="button"
                      aria-label="Copy invite link"
                      onClick={() => handleCopy(inv.code)}
                      className="rounded-lg p-1.5 text-fg-muted hover:bg-accent/10 hover:text-accent transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                        <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.44A1.5 1.5 0 008.378 6H4.5z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      aria-label="Delete invite"
                      onClick={() => handleDelete(inv)}
                      className="rounded-lg p-1.5 text-fg-muted hover:bg-error/10 hover:text-error transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </>
                )
}
              </div>
            </li>
          ))
}
        </ul>
      )
}
    </div>
  );
}

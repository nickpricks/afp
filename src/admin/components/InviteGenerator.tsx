import { useState } from 'react';

import { useAuth } from '@/shared/auth/useAuth';
import { useToast } from '@/shared/errors/useToast';
import { useAllUsers } from '@/admin/hooks/useAllUsers';
import { generateInviteCode, createInvite } from '@/shared/auth/invite';
import { ModuleId, UserRole, ToastType, isOk, ALL_MODULES, type ModuleConfig } from '@/shared/types';
import { InviteMsg, ValidationMsg } from '@/constants/messages';

/** Form for generating invite links with module selection */
export function InviteGenerator() {
  const { firebaseUser } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [modules, setModules] = useState<ModuleConfig>({
    [ModuleId.Body]: false,
    [ModuleId.Budget]: false,
    [ModuleId.Baby]: false,
  });
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [role, setRole] = useState<'user' | 'viewer'>('user');
  const [viewerOf, setViewerOf] = useState('');
  const { users } = useAllUsers();

  /** Toggles a module's enabled state in the local config */
  function toggleModule(id: ModuleId) {
    setModules((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  /** Generates a new invite code and persists it to Firestore */
  async function handleCreate() {
    if (!firebaseUser || !name.trim()) {
      addToast(ValidationMsg.InviteNameRequired, ToastType.Error);
      return;
    }

    setIsCreating(true);
    const code = generateInviteCode();
    const result = await createInvite(code, name.trim(), modules, firebaseUser.uid, {
      role: role === 'viewer' ? UserRole.Viewer : undefined,
      viewerOf: role === 'viewer' ? viewerOf || undefined : undefined,
    });

    if (isOk(result)) {
      const link = `${window.location.origin}${import.meta.env.BASE_URL}invite/${code}`;
      setInviteLink(link);
      setName('');
      setModules({ [ModuleId.Body]: false, [ModuleId.Budget]: false, [ModuleId.Baby]: false });
      setRole('user');
      setViewerOf('');
      addToast(InviteMsg.Created, ToastType.Success);
    } else {
      addToast(result.error, ToastType.Error);
    }

    setIsCreating(false);
  }

  return (
    <section className="rounded-xl bg-surface-card border border-line p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-fg mb-4">Create Invite</h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="invite-name" className="block text-sm font-medium text-fg-muted mb-1">
            Invitee Name
          </label>
          <input
            id="invite-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <span className="block text-sm font-medium text-fg-muted mb-2">Role</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setRole('user'); setViewerOf(''); }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                role === 'user' ? 'bg-accent text-fg-on-accent' : 'bg-surface-card text-fg border border-line'
              }`}
            >
              User
            </button>
            <button
              type="button"
              onClick={() => setRole('viewer')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                role === 'viewer' ? 'bg-accent text-fg-on-accent' : 'bg-surface-card text-fg border border-line'
              }`}
            >
              Viewer
            </button>
          </div>
        </div>

        {
role === 'viewer' && (
          <div>
            <label htmlFor="viewer-of" className="block text-sm font-medium text-fg-muted mb-1">
              View of
            </label>
            <select
              id="viewer-of"
              value={viewerOf}
              onChange={(e) => setViewerOf(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg"
            >
              <option value="">Select user...</option>
              {
users
                .filter((u) => u.role !== UserRole.Viewer)
                .map((u) => (
                  <option key={u.uid} value={u.uid}>{u.name}</option>
                ))
}
            </select>
          </div>
        )
}

        <fieldset>
          <legend className="text-sm font-medium text-fg-muted mb-2">Modules</legend>
          <div className="flex flex-wrap gap-4">
            {
ALL_MODULES.map((id) => (
              <label key={id} className="flex items-center gap-2 text-sm text-fg">
                <input
                  type="checkbox"
                  checked={modules[id]}
                  onChange={() => toggleModule(id)}
                  className="rounded border-line accent-accent"
                />
                <span className="capitalize">{id}</span>
              </label>
            ))
}
          </div>
        </fieldset>

        <button
          onClick={handleCreate}
          disabled={isCreating || !name.trim()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-fg-on-accent transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {isCreating && 'Creating...'}
          {!isCreating && 'Create Invite'}
        </button>
      </div>

      {
inviteLink && (
        <div className="mt-6">
          <p className="text-sm font-medium text-fg-muted mb-1">Invite Link</p>
          <div className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg break-all select-all">
            {inviteLink}
          </div>
        </div>
      )
}
    </section>
  );
}

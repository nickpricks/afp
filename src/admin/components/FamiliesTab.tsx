import { useState } from 'react';

import { useAllUsers } from '@/admin/hooks/useAllUsers';
import { useFamilies } from '@/admin/hooks/useFamilies';
import { useAdminActions } from '@/admin/hooks/useAdminActions';
import { familyMemberUids, UserRole } from '@/shared/types';
import type { Family } from '@/shared/types';

/** Admin Families tab — create a family from unlinked users, list families, unlink members */
export function FamiliesTab() {
  const { users } = useAllUsers();
  const { families, ready } = useFamilies();
  const { createFamily, unlinkFamilyMember } = useAdminActions();
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  /** Uids already linked to any family (active members only) */
  const linkedUids = new Set(families.flatMap((f) => familyMemberUids(f)));
  /** Candidates for a new family — non-viewer users not yet in a family */
  const candidates = users.filter((u) => u.role !== UserRole.Viewer && !linkedUids.has(u.uid));

  /** Resolves a display name for a member uid from the admin user sweep */
  const nameFor = (uid: string) => {
    return users.find((u) => u.uid === uid)?.name ?? uid;
  };

  /** Toggles a uid in the member pick list */
  const togglePick = (uid: string) => {
    setPicked((prev) => (prev.includes(uid) ? prev.filter((p) => p !== uid) : [...prev, uid]));
  };

  /** Creates the family and resets the form on success */
  const handleCreate = async () => {
    setSaving(true);
    const okCreated = await createFamily(name, picked);
    setSaving(false);
    if (okCreated) {
      setName('');
      setPicked([]);
    }
  };

  /** Unlinks a member from a family (admin action owns the toasts) */
  const handleUnlink = async (family: Family, uid: string) => {
    await unlinkFamilyMember(family, uid);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-line bg-surface-card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-fg">Create family</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Family name"
          className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
        />
        {candidates.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {candidates.map((u) => (
              <button
                key={u.uid}
                type="button"
                onClick={() => togglePick(u.uid)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  picked.includes(u.uid)
                    ? 'border-accent bg-accent text-fg-on-accent'
                    : 'border-line text-fg-muted hover:border-accent hover:text-accent'
                }`}
              >
                {u.name}
              </button>
            ))}
          </div>
        )}
        {candidates.length === 0 && (
          <p className="text-xs text-fg-muted">No unlinked users available</p>
        )}
        <button
          type="button"
          disabled={saving || !name.trim() || picked.length === 0}
          onClick={handleCreate}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-fg-on-accent disabled:opacity-50"
        >
          Create family
        </button>
      </div>

      <div className="space-y-2">
        {!ready && <p className="text-xs text-fg-muted">Loading families…</p>}
        {ready && families.length === 0 && (
          <p className="text-xs text-fg-muted">No families yet — create one above</p>
        )}
        {families.map((family) => (
          <div key={family.id} className="rounded-lg border border-line bg-surface-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-fg">{family.name}</h3>
              <span className="text-xs text-fg-muted">
                {familyMemberUids(family).length} members
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {familyMemberUids(family).map((uid) => (
                <span
                  key={uid}
                  className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs text-fg"
                >
                  {nameFor(uid)}
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Unlink ${nameFor(uid)}`}
                    onClick={() => void handleUnlink(family, uid)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleUnlink(family, uid);
                    }}
                    className="font-mono text-fg-muted transition-all hover:scale-125 hover:font-bold hover:text-red-500"
                  >
                    ×
                  </span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

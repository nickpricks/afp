import { beforeEach, describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

import { useFamily } from '../useFamily';
import { FamilyRole, familyMemberUids } from '@/shared/types';
import type { Family } from '@/shared/types';

/** Seeds a family doc into the dev-mode localStorage adapter's root collection */
function seedFamily(family: Family): void {
  localStorage.setItem('afp::families', JSON.stringify([family]));
}

/** Fixture family with an active owner + adult and one unlinked (null tombstone) member */
const FAMILY: Family = {
  id: 'fam-1',
  name: 'The Nicks',
  createdBy: 'admin-uid',
  createdAt: '2026-07-02T10:00:00Z',
  members: { 'uid-a': FamilyRole.Owner, 'uid-b': FamilyRole.Adult, 'uid-c': null },
};

/** Tests useFamily fetch + memberUids derivation against the localStorage adapter */
describe('useFamily', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('resolves immediately with no family when familyId is null', async () => {
    const { result } = renderHook(() => useFamily(null));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.family).toBeNull();
    expect(result.current.memberUids).toEqual([]);
  });

  it('fetches the family doc and derives active member uids (tombstones filtered)', async () => {
    seedFamily(FAMILY);
    const { result } = renderHook(() => useFamily('fam-1'));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.family?.name).toBe('The Nicks');
    expect(result.current.memberUids).toEqual(['uid-a', 'uid-b']);
  });

  it('returns null family for an unknown familyId', async () => {
    const { result } = renderHook(() => useFamily('missing'));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.family).toBeNull();
  });
});

/** Tests the pure familyMemberUids helper */
describe('familyMemberUids', () => {
  it('filters null tombstones', () => {
    expect(familyMemberUids(FAMILY)).toEqual(['uid-a', 'uid-b']);
  });

  it('returns [] for an all-tombstone family', () => {
    expect(familyMemberUids({ ...FAMILY, members: { x: null } })).toEqual([]);
  });
});

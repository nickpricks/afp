import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => ({ firebaseUser: { uid: 'user-1' } }),
}));

const mockChildren = vi.fn();
vi.mock('@/modules/baby/hooks/useChildren', () => ({
  useChildren: (...args: unknown[]) => mockChildren(...args),
}));

const onSnapshotCalls: Array<{ sub: string; cb: (data: unknown[]) => void; unsub: () => void }> =
  [];
vi.mock('@/shared/storage/create-adapter', () => ({
  createAdapter: () => ({
    onSnapshot: (sub: string, cb: (data: unknown[]) => void) => {
      const unsub = vi.fn();
      onSnapshotCalls.push({ sub, cb, unsub });
      return unsub;
    },
  }),
}));

import { useAllKidsFinances } from '@/modules/expenses/hooks/useAllKidsFinances';

describe('useAllKidsFinances', () => {
  beforeEach(() => {
    onSnapshotCalls.length = 0;
    mockChildren.mockReset();
  });

  it('returns loading=true initially and false only after all children report', async () => {
    mockChildren.mockReturnValue({
      children: [
        { id: 'c1', name: 'Alpha' },
        { id: 'c2', name: 'Beta' },
      ],
      loading: false,
    });

    const { result } = renderHook(() => useAllKidsFinances());

    expect(result.current.loading).toBe(true);

    onSnapshotCalls[0].cb([]);
    await waitFor(() => expect(result.current.entries.length).toBe(0));
    expect(result.current.loading).toBe(true);

    onSnapshotCalls[1].cb([]);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('flat-merges entries from multiple children with childName attached', async () => {
    mockChildren.mockReturnValue({
      children: [
        { id: 'c1', name: 'Alpha' },
        { id: 'c2', name: 'Beta' },
      ],
      loading: false,
    });

    const { result } = renderHook(() => useAllKidsFinances());

    onSnapshotCalls[0].cb([{ id: 'f1', amount: 100 }]);
    onSnapshotCalls[1].cb([{ id: 'f2', amount: 200 }]);

    await waitFor(() => expect(result.current.entries.length).toBe(2));
    expect(result.current.entries.find((e) => e.id === 'f1')?.childName).toBe('Alpha');
    expect(result.current.entries.find((e) => e.id === 'f2')?.childName).toBe('Beta');
  });

  it('sets loading=false immediately when there are no children', async () => {
    mockChildren.mockReturnValue({ children: [], loading: false });

    const { result } = renderHook(() => useAllKidsFinances());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries).toEqual([]);
  });

  it('passes targetUid through to useChildren when provided', () => {
    mockChildren.mockReturnValue({ children: [], loading: false });

    renderHook(() => useAllKidsFinances('other-user'));

    expect(mockChildren).toHaveBeenCalledWith('other-user');
  });

  it('unsubscribes all listeners on unmount', () => {
    mockChildren.mockReturnValue({
      children: [
        { id: 'c1', name: 'Alpha' },
        { id: 'c2', name: 'Beta' },
      ],
      loading: false,
    });

    const { unmount } = renderHook(() => useAllKidsFinances());

    expect(onSnapshotCalls.length).toBe(2);
    unmount();
    expect(onSnapshotCalls[0].unsub).toHaveBeenCalled();
    expect(onSnapshotCalls[1].unsub).toHaveBeenCalled();
  });
});

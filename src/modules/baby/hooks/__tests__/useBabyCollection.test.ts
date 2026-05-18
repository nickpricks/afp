import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useBabyCollection } from '@/modules/baby/hooks/useBabyCollection';
import { ok, err } from '@/shared/types';

const mockAddToast = vi.fn();
const mockSave = vi.fn();
const mockRemove = vi.fn();
const mockUnsubscribe = vi.fn();

vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => ({ firebaseUser: { uid: 'test-uid' } }),
}));

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

vi.mock('@/shared/storage/create-adapter', () => ({
  createAdapter: () => ({
    getAll: vi.fn(),
    getById: vi.fn(),
    save: mockSave,
    remove: mockRemove,
    onSnapshot: (_col: string, cb: (data: unknown[]) => void) => {
      cb([]);
      return mockUnsubscribe;
    },
  }),
}));

beforeEach(() => {
  mockAddToast.mockClear();
  mockSave.mockClear();
  mockRemove.mockClear();
  mockUnsubscribe.mockClear();
});

/** Validates useBabyCollection.log returns true on save success and false with error toast on failure */
describe('useBabyCollection — log()', () => {
  it('returns true when adapter.save succeeds', async () => {
    mockSave.mockResolvedValue(ok(undefined));
    const { result } = renderHook(() =>
      useBabyCollection('child-1', 'feeds', 'Feed'),
    );

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.log({ date: '2026-05-15', time: '08:00', type: 'bottle', amount: 120, timestamp: '', createdAt: '', notes: '' });
    });

    expect(returned).toBe(true);
    expect(mockAddToast).toHaveBeenCalledWith('Feed logged', 'success');
  });

  it('returns false and shows error toast when adapter.save fails', async () => {
    mockSave.mockResolvedValue(err('Network error'));
    const { result } = renderHook(() =>
      useBabyCollection('child-1', 'feeds', 'Feed'),
    );

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.log({ date: '2026-05-15', time: '08:00', type: 'bottle', amount: 120, timestamp: '', createdAt: '', notes: '' });
    });

    expect(returned).toBe(false);
    expect(mockAddToast).toHaveBeenCalledWith('Network error', 'error');
  });
});

/** Validates useBabyCollection.update returns true on save success and false with error toast on failure */
describe('useBabyCollection — update()', () => {
  it('returns true when adapter.save succeeds', async () => {
    mockSave.mockResolvedValue(ok(undefined));
    const { result } = renderHook(() =>
      useBabyCollection('child-1', 'feeds', 'Feed'),
    );

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.update({ id: 'feed-1', date: '2026-05-15', time: '08:00', type: 'bottle', amount: 100, timestamp: '', createdAt: '', notes: '' } as Record<string, unknown> & { id: string });
    });

    expect(returned).toBe(true);
    expect(mockAddToast).toHaveBeenCalledWith('Feed updated', 'success');
  });

  it('returns false and shows error toast when adapter.save fails', async () => {
    mockSave.mockResolvedValue(err('Save failed'));
    const { result } = renderHook(() =>
      useBabyCollection('child-1', 'feeds', 'Feed'),
    );

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.update({ id: 'feed-1', date: '2026-05-15', time: '08:00', type: 'bottle', amount: 100, timestamp: '', createdAt: '', notes: '' } as Record<string, unknown> & { id: string });
    });

    expect(returned).toBe(false);
    expect(mockAddToast).toHaveBeenCalledWith('Save failed', 'error');
  });
});

/** Validates useBabyCollection.remove returns true on success and false with error toast on failure */
describe('useBabyCollection — remove()', () => {
  it('returns true when adapter.remove succeeds', async () => {
    mockRemove.mockResolvedValue(ok(undefined));
    const { result } = renderHook(() =>
      useBabyCollection('child-1', 'feeds', 'Feed'),
    );

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.remove('feed-1');
    });

    expect(returned).toBe(true);
    expect(mockAddToast).toHaveBeenCalledWith('Feed deleted', 'success');
  });

  it('returns false and shows error toast when adapter.remove fails', async () => {
    mockRemove.mockResolvedValue(err('Delete failed'));
    const { result } = renderHook(() =>
      useBabyCollection('child-1', 'feeds', 'Feed'),
    );

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.remove('feed-1');
    });

    expect(returned).toBe(false);
    expect(mockAddToast).toHaveBeenCalledWith('Delete failed', 'error');
  });
});

/** Validates useBabyCollection log/update/remove all return false when childId is null */
describe('useBabyCollection — guard conditions', () => {
  it('log() returns false when childId is null', async () => {
    const { result } = renderHook(() =>
      useBabyCollection(null, 'feeds', 'Feed'),
    );

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.log({ date: '2026-05-15', notes: '' });
    });

    expect(returned).toBe(false);
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('update() returns false when childId is null', async () => {
    const { result } = renderHook(() =>
      useBabyCollection(null, 'feeds', 'Feed'),
    );

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.update({ id: 'feed-1', date: '2026-05-15', notes: '' } as Record<string, unknown> & { id: string });
    });

    expect(returned).toBe(false);
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('remove() returns false when childId is null', async () => {
    const { result } = renderHook(() =>
      useBabyCollection(null, 'feeds', 'Feed'),
    );

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.remove('feed-1');
    });

    expect(returned).toBe(false);
    expect(mockRemove).not.toHaveBeenCalled();
  });
});

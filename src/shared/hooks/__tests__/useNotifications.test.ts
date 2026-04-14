import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { NotificationType, AlertType, Severity } from '@/shared/types';
import type { Notification } from '@/shared/types';

vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => ({ firebaseUser: { uid: 'test-user' } }),
}));

const mockSave = vi.fn().mockResolvedValue({ ok: true, data: undefined });
let snapshotCallback: ((data: Notification[]) => void) | null = null;

vi.mock('@/shared/storage/create-adapter', () => ({
  createAdapter: () => ({
    onSnapshot: (_col: string, cb: (data: Notification[]) => void) => {
      snapshotCallback = cb;
      return () => {
        snapshotCallback = null;
      };
    },
    save: (...args: unknown[]) => mockSave(...args),
  }),
}));

vi.mock('@/shared/utils/date', () => ({
  todayStr: () => '2026-04-14',
}));

const makeAlert = (overrides: Partial<Notification> = {}): Notification => ({
  id: 'alert-1',
  type: NotificationType.AdminAlert,
  message: 'Test alert',
  severity: Severity.Info,
  alertType: AlertType.Notice,
  shownTillDate: '2026-04-20',
  createdAt: '2026-04-14T10:00:00Z',
  read: false,
  dismissed: false,
  ...overrides,
});

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    snapshotCallback = null;
  });

  it('returns empty state initially', () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.notifications).toEqual([]);
    expect(result.current.ready).toBe(false);
    expect(result.current.unreadCount).toBe(0);
  });

  it('populates notifications from snapshot', () => {
    const { result } = renderHook(() => useNotifications());
    act(() => snapshotCallback?.([makeAlert()]));
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.ready).toBe(true);
  });

  it('filters activeAlerts — excludes dismissed', () => {
    const { result } = renderHook(() => useNotifications());
    act(() =>
      snapshotCallback?.([
        makeAlert({ id: 'a1', dismissed: false }),
        makeAlert({ id: 'a2', dismissed: true }),
      ]),
    );
    expect(result.current.activeAlerts).toHaveLength(1);
    expect(result.current.activeAlerts[0].id).toBe('a1');
  });

  it('filters activeAlerts — excludes expired', () => {
    const { result } = renderHook(() => useNotifications());
    act(() => snapshotCallback?.([makeAlert({ id: 'a1', shownTillDate: '2026-04-10' })]));
    expect(result.current.activeAlerts).toHaveLength(0);
  });

  it('computes unreadCount', () => {
    const { result } = renderHook(() => useNotifications());
    act(() =>
      snapshotCallback?.([
        makeAlert({ id: 'a1', read: false }),
        makeAlert({ id: 'a2', read: true }),
        makeAlert({ id: 'a3', read: false }),
      ]),
    );
    expect(result.current.unreadCount).toBe(2);
  });

  it('dismiss sets read + dismissed on the notification', async () => {
    const { result } = renderHook(() => useNotifications());
    act(() => snapshotCallback?.([makeAlert({ id: 'a1' })]));
    await act(async () => result.current.dismiss('a1'));
    expect(mockSave).toHaveBeenCalledWith(
      'notifications',
      expect.objectContaining({ id: 'a1', read: true, dismissed: true }),
    );
  });

  it('markRead sets read without dismissed', async () => {
    const { result } = renderHook(() => useNotifications());
    act(() => snapshotCallback?.([makeAlert({ id: 'a1' })]));
    await act(async () => result.current.markRead('a1'));
    expect(mockSave).toHaveBeenCalledWith(
      'notifications',
      expect.objectContaining({ id: 'a1', read: true, dismissed: false }),
    );
  });
});

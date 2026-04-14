import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdminNotifications } from '@/admin/hooks/useAdminNotifications';
import { NotificationType, Severity, AlertType, ModuleId } from '@/shared/types';
import type { Notification } from '@/shared/types';

const mockAddToast = vi.fn();
const mockSave = vi.fn().mockResolvedValue({ ok: true, data: undefined });
const mockRemove = vi.fn().mockResolvedValue({ ok: true, data: undefined });
const mockUpdateUserModules = vi.fn().mockResolvedValue({ ok: true, data: undefined });
const mockMarkRead = vi.fn();

const moduleRequest: Notification = {
  id: 'req-1',
  type: NotificationType.ModuleRequest,
  moduleId: ModuleId.Budget,
  requestedBy: 'user-1',
  requestedByName: 'Priya',
  createdAt: '2026-04-14T10:00:00Z',
  read: false,
  dismissed: false,
};

vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => ({ firebaseUser: { uid: 'admin-uid' } }),
}));

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

vi.mock('@/shared/hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: [moduleRequest],
    unreadCount: 1,
    ready: true,
    markRead: mockMarkRead,
  }),
}));

vi.mock('@/admin/hooks/useAllUsers', () => ({
  useAllUsers: () => ({
    users: [{
      uid: 'user-1',
      name: 'Priya',
      role: 'user',
      modules: { body: true, budget: false, baby: false },
      requestedModules: ['budget'],
    }],
    loading: false,
  }),
}));

vi.mock('@/admin/hooks/useAdminActions', () => ({
  useAdminActions: () => ({
    updateUserModules: mockUpdateUserModules,
    updateUserRole: vi.fn(),
  }),
}));

vi.mock('@/shared/storage/create-adapter', () => ({
  createAdapter: () => ({
    save: (...args: unknown[]) => mockSave(...args),
    remove: (...args: unknown[]) => mockRemove(...args),
  }),
}));

vi.mock('@/shared/utils/date', () => ({
  nowTime: () => '2026-04-14T10:00:00Z',
}));

describe('useAdminNotifications', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns unread module requests', () => {
    const { result } = renderHook(() => useAdminNotifications());
    expect(result.current.moduleRequests).toHaveLength(1);
    expect(result.current.moduleRequests[0].moduleId).toBe(ModuleId.Budget);
  });

  it('sendAlert writes notification to each target user', async () => {
    const { result } = renderHook(() => useAdminNotifications());
    await act(async () =>
      result.current.sendAlert({
        message: 'Maintenance tonight',
        severity: Severity.Info,
        alertType: AlertType.Notice,
        shownTillDate: '2026-04-15',
        targetUids: ['user-1'],
      }),
    );
    expect(mockSave).toHaveBeenCalledWith(
      'notifications',
      expect.objectContaining({
        type: NotificationType.AdminAlert,
        message: 'Maintenance tonight',
      }),
    );
  });

  it('approveModuleRequest enables module, clears request, marks read', async () => {
    const { result } = renderHook(() => useAdminNotifications());
    await act(async () =>
      result.current.approveModuleRequest(moduleRequest),
    );

    expect(mockUpdateUserModules).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ budget: true }),
    );

    expect(mockSave).toHaveBeenCalledWith(
      'profile',
      expect.objectContaining({
        id: 'main',
        requestedModules: [],
      }),
    );

    expect(mockMarkRead).toHaveBeenCalledWith('req-1');
  });

  it('deleteAlert removes notification from target user', async () => {
    const { result } = renderHook(() => useAdminNotifications());
    await act(async () =>
      result.current.deleteAlert('user-1', 'alert-1'),
    );
    expect(mockRemove).toHaveBeenCalledWith('notifications', 'alert-1');
  });
});

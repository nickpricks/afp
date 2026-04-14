import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModuleRequest } from '@/shared/hooks/useModuleRequest';
import { ModuleId, NotificationType, ToastType } from '@/shared/types';

const mockAddToast = vi.fn();
const mockSave = vi.fn().mockResolvedValue({ ok: true, data: undefined });

vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => ({
    firebaseUser: { uid: 'user-1' },
    profile: {
      name: 'Priya',
      modules: { body: true, budget: false, baby: false },
      requestedModules: [],
    },
  }),
}));

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

vi.mock('@/shared/storage/create-adapter', () => ({
  createAdapter: () => ({ save: (...args: unknown[]) => mockSave(...args) }),
}));

vi.mock('@/shared/utils/date', () => ({
  nowTime: () => '2026-04-14T10:00:00Z',
}));

describe('useModuleRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes notification to admin subcollection and updates own profile', async () => {
    const { result } = renderHook(() => useModuleRequest('admin-uid'));
    await act(async () => result.current.requestModule(ModuleId.Budget));

    expect(mockSave).toHaveBeenCalledWith(
      'notifications',
      expect.objectContaining({
        type: NotificationType.ModuleRequest,
        moduleId: ModuleId.Budget,
        requestedBy: 'user-1',
        requestedByName: 'Priya',
      }),
    );

    expect(mockSave).toHaveBeenCalledWith(
      'profile',
      expect.objectContaining({
        id: 'main',
        requestedModules: [ModuleId.Budget],
      }),
    );

    expect(mockAddToast).toHaveBeenCalledWith('Module requested', ToastType.Success);
  });

  it('does not request an already-enabled module', async () => {
    const { result } = renderHook(() => useModuleRequest('admin-uid'));
    await act(async () => result.current.requestModule(ModuleId.Body));
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('does nothing without admin UID', async () => {
    const { result } = renderHook(() => useModuleRequest(null));
    await act(async () => result.current.requestModule(ModuleId.Budget));
    expect(mockSave).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => ({
    firebaseUser: { uid: 'admin-user' },
    setSyncStatus: vi.fn(),
  }),
}));

vi.mock('@/shared/storage/create-adapter', () => ({
  createAdapter: () => ({
    getAll: vi.fn().mockResolvedValue({ ok: true, value: [] }),
    onSnapshot: (_col: string, cb: (data: unknown[]) => void) => {
      cb([]);
      return vi.fn();
    },
  }),
}));

describe('useAllUsers', () => {
  it('exports a function', async () => {
    const { useAllUsers } = await import('@/admin/hooks/useAllUsers');
    expect(typeof useAllUsers).toBe('function');
  });
});

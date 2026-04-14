import { describe, it, expect, vi } from 'vitest';

vi.mock('@/shared/auth/firebase-config', () => ({
  isFirebaseConfigured: false,
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collectionGroup: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
  query: vi.fn(),
}));

describe('useAllUsers', () => {
  it('exports a function', async () => {
    const { useAllUsers } = await import('@/admin/hooks/useAllUsers');
    expect(typeof useAllUsers).toBe('function');
  });
});

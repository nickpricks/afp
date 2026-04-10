import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { computeAge } from '@/modules/baby/utils';
import { ChildDetail } from '@/modules/baby/components/ChildDetail';
import type { Child } from '@/modules/baby/types';

const mockChild: Child = {
  id: 'child-1',
  name: 'Test Baby',
  dob: '2025-10-06',
  config: { feeding: true, sleep: true, growth: false, diapers: true },
  createdAt: '2025-10-06T00:00:00.000Z',
  updatedAt: '2025-10-06T00:00:00.000Z',
};

// Mock hooks that depend on Firebase/Auth
vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => ({
    firebaseUser: { uid: 'test-user' },
    setSyncStatus: vi.fn(),
  }),
}));

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('@/shared/storage/create-adapter', () => ({
  createAdapter: () => ({
    getAll: vi.fn(),
    getById: vi.fn(),
    save: vi.fn(),
    remove: vi.fn(),
    onSnapshot: () => vi.fn(),
  }),
}));

vi.mock('@/modules/baby/hooks/useChildren', () => ({
  useChildren: () => ({
    children: [mockChild],
    loading: false,
    addChild: vi.fn(),
    updateChild: vi.fn(),
  }),
}));

/** Renders ChildDetail inside a router at /baby/child-1 */
function renderChildDetail() {
  return render(
    <MemoryRouter initialEntries={['/baby/child-1']}>
      <Routes>
        <Route path="/baby/:childId" element={<ChildDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ChildDetail', () => {
  it('renders child name and age', () => {
    renderChildDetail();
    expect(screen.getByText('Test Baby')).toBeInTheDocument();
    expect(screen.getByText(`${computeAge(mockChild.dob)} old`)).toBeInTheDocument();
  });

  it('renders only configured tabs', () => {
    renderChildDetail();
    expect(screen.getAllByText('Feeding').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Sleep').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Diapers').length).toBeGreaterThanOrEqual(1);
    // Growth is disabled — should not appear
    expect(screen.queryByText('Growth')).toBeNull();
  });

  it('renders Back button', () => {
    renderChildDetail();
    expect(screen.getByText(/Back/)).toBeInTheDocument();
  });
});

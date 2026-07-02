import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { FamiliesTab } from '@/admin/components/FamiliesTab';
import { FamilyRole, UserRole } from '@/shared/types';

const createFamily = vi.fn().mockResolvedValue(true);
const unlinkFamilyMember = vi.fn().mockResolvedValue(true);

vi.mock('@/admin/hooks/useAllUsers', () => ({
  useAllUsers: () => ({
    users: [
      { uid: 'uid-a', name: 'Alice', role: 'user' },
      { uid: 'uid-b', name: 'Bob', role: 'user' },
      { uid: 'uid-v', name: 'Vera', role: 'viewer' },
    ],
    loading: false,
  }),
}));

vi.mock('@/admin/hooks/useFamilies', () => ({
  useFamilies: () => ({
    families: [
      {
        id: 'fam-1',
        name: 'The Nicks',
        createdBy: 'admin',
        createdAt: '2026-07-02T10:00:00Z',
        members: { 'uid-a': 'owner' },
      },
    ],
    ready: true,
  }),
}));

vi.mock('@/admin/hooks/useAdminActions', () => ({
  useAdminActions: () => ({ createFamily, unlinkFamilyMember }),
}));

/** Tests FamiliesTab create form gating, candidate filtering, and member chips */
describe('FamiliesTab', () => {
  it('lists existing families with member chips', () => {
    render(<FamiliesTab />);
    expect(screen.getByText('The Nicks')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('excludes viewers and already-linked users from candidates', () => {
    render(<FamiliesTab />);
    // Alice is linked (fam-1), Vera is a viewer — only Bob remains a candidate pill
    expect(screen.getByRole('button', { name: 'Bob' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Vera' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Alice' })).not.toBeInTheDocument();
  });

  it('disables Create until name and at least one member are set', () => {
    render(<FamiliesTab />);
    const create = screen.getByRole('button', { name: 'Create family' });
    expect(create).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('Family name'), {
      target: { value: 'New Fam' },
    });
    expect(create).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Bob' }));
    expect(create).toBeEnabled();
  });

  it('calls createFamily with name and picked uids', () => {
    render(<FamiliesTab />);
    fireEvent.change(screen.getByPlaceholderText('Family name'), {
      target: { value: 'New Fam' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Bob' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create family' }));
    expect(createFamily).toHaveBeenCalledWith('New Fam', ['uid-b']);
  });

  it('unlink chip × calls unlinkFamilyMember', () => {
    render(<FamiliesTab />);
    fireEvent.click(screen.getByRole('button', { name: 'Unlink Alice' }));
    expect(unlinkFamilyMember).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'fam-1' }),
      'uid-a',
    );
  });
});

/** Sanity: enum values referenced by the tab exist */
describe('family enums', () => {
  it('FamilyRole + UserRole string values', () => {
    expect(FamilyRole.Owner).toBe('owner');
    expect(UserRole.Viewer).toBe('viewer');
  });
});

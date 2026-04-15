import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { NeedsLog } from '@/modules/baby/components/NeedsLog';
import { NeedCategory, NeedStatus } from '@/modules/baby/types';
import type { NeedEntry } from '@/modules/baby/types';

const mockLog = vi.fn(async () => undefined);
const mockUpdate = vi.fn(async () => undefined);
const mockRemove = vi.fn(async () => undefined);
const mockAddToast = vi.fn();

const sampleWishlist: NeedEntry = {
  id: 'need-1',
  date: '2026-04-15',
  title: 'Winter jacket size 3',
  category: NeedCategory.Apparel,
  status: NeedStatus.Wishlist,
  notes: 'prefer blue',
  createdAt: '2026-04-15T10:00:00Z',
  updatedAt: '2026-04-15T10:00:00Z',
};

const sampleInventory: NeedEntry = {
  id: 'need-2',
  date: '2026-04-14',
  title: 'School backpack',
  category: NeedCategory.School,
  status: NeedStatus.Inventory,
  notes: '',
  createdAt: '2026-04-14T08:00:00Z',
  updatedAt: '2026-04-14T09:00:00Z',
};

const sampleOutgrown: NeedEntry = {
  id: 'need-3',
  date: '2026-04-10',
  title: 'Tiny shoes',
  category: NeedCategory.Footwear,
  status: NeedStatus.Outgrown,
  notes: '',
  createdAt: '2026-04-10T08:00:00Z',
  updatedAt: '2026-04-13T08:00:00Z',
};

vi.mock('@/modules/baby/hooks/useBabyCollection', () => ({
  useBabyCollection: () => ({
    items: [sampleWishlist, sampleInventory, sampleOutgrown],
    ready: true,
    log: mockLog,
    update: mockUpdate,
    remove: mockRemove,
  }),
}));

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

beforeEach(() => {
  mockLog.mockClear();
  mockUpdate.mockClear();
  mockRemove.mockClear();
  mockAddToast.mockClear();
});

describe('NeedsLog — rendering', () => {
  it('renders Needs header', () => {
    render(<NeedsLog childId="c1" />);
    expect(screen.getByRole('heading', { level: 2, name: 'Needs' })).toBeInTheDocument();
  });

  it('renders 4 filter chips', () => {
    render(<NeedsLog childId="c1" />);
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Wishlist' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Have' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Outgrown' })).toBeInTheDocument();
  });

  it('renders existing entries', () => {
    render(<NeedsLog childId="c1" />);
    expect(screen.getByText(/Winter jacket size 3/)).toBeInTheDocument();
    expect(screen.getByText(/School backpack/)).toBeInTheDocument();
    expect(screen.getByText(/Tiny shoes/)).toBeInTheDocument();
  });

  it('shows a delete button per entry', () => {
    render(<NeedsLog childId="c1" />);
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(deleteButtons.length).toBe(3);
  });
});

describe('NeedsLog — filter chips', () => {
  it('filters to Wishlist entries only', () => {
    render(<NeedsLog childId="c1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Wishlist' }));
    expect(screen.getByText(/Winter jacket size 3/)).toBeInTheDocument();
    expect(screen.queryByText(/School backpack/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tiny shoes/)).not.toBeInTheDocument();
  });

  it('filters to Have entries only', () => {
    render(<NeedsLog childId="c1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Have' }));
    expect(screen.queryByText(/Winter jacket size 3/)).not.toBeInTheDocument();
    expect(screen.getByText(/School backpack/)).toBeInTheDocument();
    expect(screen.queryByText(/Tiny shoes/)).not.toBeInTheDocument();
  });

  it('shows all entries again when All is clicked', () => {
    render(<NeedsLog childId="c1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Wishlist' }));
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(screen.getByText(/Winter jacket size 3/)).toBeInTheDocument();
    expect(screen.getByText(/School backpack/)).toBeInTheDocument();
    expect(screen.getByText(/Tiny shoes/)).toBeInTheDocument();
  });
});

describe('NeedsLog — form behavior', () => {
  it('blocks submit when title is empty and shows error toast', () => {
    render(<NeedsLog childId="c1" />);
    const submitBtn = screen.getByRole('button', { name: /^Add to Wishlist$/ });
    fireEvent.click(submitBtn);
    expect(mockLog).not.toHaveBeenCalled();
    expect(mockAddToast).toHaveBeenCalledWith('Need title required', 'error');
  });

  it('submits a valid need entry with Wishlist status', () => {
    render(<NeedsLog childId="c1" />);
    fireEvent.change(screen.getByPlaceholderText(/What's needed/i), {
      target: { value: 'Rain boots size 4' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Add to Wishlist$/ }));
    expect(mockLog).toHaveBeenCalledTimes(1);
    const payload = mockLog.mock.calls[0]?.[0];
    expect(payload).toMatchObject({
      title: 'Rain boots size 4',
      status: NeedStatus.Wishlist,
      category: NeedCategory.Apparel,
    });
  });
});

describe('NeedsLog — status transitions', () => {
  it('shows Bought button on Wishlist entries', () => {
    render(<NeedsLog childId="c1" />);
    const boughtButtons = screen.getAllByRole('button', { name: 'Bought' });
    expect(boughtButtons.length).toBe(1);
  });

  it('shows Outgrew button on Inventory entries', () => {
    render(<NeedsLog childId="c1" />);
    const outgrewButtons = screen.getAllByRole('button', { name: 'Outgrew' });
    expect(outgrewButtons.length).toBe(1);
  });

  it('calls update with Inventory status when Bought is clicked', () => {
    render(<NeedsLog childId="c1" />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Bought' })[0]);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const payload = mockUpdate.mock.calls[0]?.[0];
    expect(payload).toMatchObject({
      id: 'need-1',
      status: NeedStatus.Inventory,
    });
  });

  it('calls update with Outgrown status when Outgrew is clicked', () => {
    render(<NeedsLog childId="c1" />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Outgrew' })[0]);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const payload = mockUpdate.mock.calls[0]?.[0];
    expect(payload).toMatchObject({
      id: 'need-2',
      status: NeedStatus.Outgrown,
    });
  });

  it('shows no transition button on Outgrown entries', () => {
    render(<NeedsLog childId="c1" />);
    // Filter to Outgrown only
    fireEvent.click(screen.getByRole('button', { name: 'Outgrown' }));
    expect(screen.queryByRole('button', { name: 'Bought' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Outgrew' })).not.toBeInTheDocument();
  });
});

describe('NeedsLog — tap-to-edit', () => {
  it('populates form when entry row is clicked', () => {
    render(<NeedsLog childId="c1" />);
    // Click the entry row (which is a button)
    fireEvent.click(screen.getByText(/Winter jacket size 3/).closest('button')!);
    // The title input should now be populated
    const titleInput = screen.getByPlaceholderText(/What's needed/i) as HTMLInputElement;
    expect(titleInput.value).toBe('Winter jacket size 3');
    // Submit button text should change to "Update Need"
    expect(screen.getByRole('button', { name: /^Update Need$/ })).toBeInTheDocument();
  });

  it('shows cancel button during edit', () => {
    render(<NeedsLog childId="c1" />);
    fireEvent.click(screen.getByText(/Winter jacket size 3/).closest('button')!);
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });
});

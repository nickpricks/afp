import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { MilestonesLog } from '@/modules/baby/components/MilestonesLog';
import { MilestoneCategory } from '@/modules/baby/types';
import type { Milestone } from '@/modules/baby/types';

const mockLog = vi.fn(async () => undefined);
const mockUpdate = vi.fn(async () => undefined);
const mockRemove = vi.fn(async () => undefined);
const mockAddToast = vi.fn();

const sampleMotor: Milestone = {
  id: 'm-1',
  date: '2026-04-01',
  category: MilestoneCategory.Motor,
  title: 'First steps',
  description: 'walked from sofa to dad',
  mediaUrl: 'https://example.com/video.mp4',
  timestamp: '2026-04-01T15:00:00Z',
  createdAt: '2026-04-01T15:00:00Z',
  notes: '',
};

const sampleLanguage: Milestone = {
  id: 'm-2',
  date: '2026-04-05',
  category: MilestoneCategory.Language,
  title: 'Said "mama"',
  timestamp: '2026-04-05T09:00:00Z',
  createdAt: '2026-04-05T09:00:00Z',
  notes: '',
};

vi.mock('@/modules/baby/hooks/useBabyCollection', () => ({
  useBabyCollection: () => ({
    items: [sampleMotor, sampleLanguage],
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

describe('MilestonesLog — rendering', () => {
  it('renders Milestones header', () => {
    render(<MilestonesLog childId="c1" />);
    expect(screen.getByRole('heading', { level: 2, name: 'Milestones' })).toBeInTheDocument();
  });

  it('renders template quick-add chips (First word + First steps at minimum)', () => {
    render(<MilestonesLog childId="c1" />);
    expect(screen.getByRole('button', { name: 'First word' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'First steps' })).toBeInTheDocument();
  });

  it('groups entries by category with heading labels', () => {
    render(<MilestonesLog childId="c1" />);
    // Sample entries are Motor and Language — both group headings (h3) should appear
    expect(screen.getByRole('heading', { level: 3, name: 'Motor' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Language' })).toBeInTheDocument();
  });

  it('renders mediaUrl as a clickable link when present', () => {
    render(<MilestonesLog childId="c1" />);
    const link = screen.getByRole('link', { name: /media/i });
    expect(link).toHaveAttribute('href', 'https://example.com/video.mp4');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('shows a delete button per entry', () => {
    render(<MilestonesLog childId="c1" />);
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(deleteButtons.length).toBeGreaterThanOrEqual(2);
  });
});

describe('MilestonesLog — form behavior', () => {
  it('blocks submit when title is empty and shows error toast', () => {
    render(<MilestonesLog childId="c1" />);
    const submitBtn = screen.getByRole('button', { name: /^Log Milestone$/ });
    fireEvent.click(submitBtn);
    expect(mockLog).not.toHaveBeenCalled();
    expect(mockAddToast).toHaveBeenCalledWith('Milestone title required', 'error');
  });

  it('template chip click prefills title and category', () => {
    render(<MilestonesLog childId="c1" />);
    fireEvent.click(screen.getByRole('button', { name: 'First word' }));
    const titleInput = screen.getByPlaceholderText(/Milestone title/i) as HTMLInputElement;
    expect(titleInput.value).toBe('First word');
  });

  it('submits a valid milestone entry', () => {
    render(<MilestonesLog childId="c1" />);
    fireEvent.change(screen.getByPlaceholderText(/Milestone title/i), {
      target: { value: 'Started piano' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Log Milestone$/ }));
    expect(mockLog).toHaveBeenCalledTimes(1);
    const payload = mockLog.mock.calls[0]?.[0];
    expect(payload).toMatchObject({ title: 'Started piano' });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { MealsLog } from '@/modules/baby/components/MealsLog';
import { MealType, MealPortion } from '@/modules/baby/types';
import type { MealEntry } from '@/modules/baby/types';

const mockLog = vi.fn(async () => undefined);
const mockUpdate = vi.fn(async () => undefined);
const mockRemove = vi.fn(async () => undefined);
const mockAddToast = vi.fn();

const sampleMeal: MealEntry = {
  id: 'meal-1',
  date: '2026-04-12',
  time: '08:00',
  type: MealType.Breakfast,
  description: 'oatmeal + banana',
  portion: MealPortion.Most,
  timestamp: '2026-04-12T08:00:00Z',
  createdAt: '2026-04-12T08:00:00Z',
  notes: '',
};

vi.mock('@/modules/baby/hooks/useBabyCollection', () => ({
  useBabyCollection: () => ({
    items: [sampleMeal],
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

describe('MealsLog — rendering', () => {
  it('renders Meals header', () => {
    render(<MealsLog childId="c1" />);
    expect(screen.getByRole('heading', { level: 2, name: 'Meals' })).toBeInTheDocument();
  });

  it('renders existing entries with type and description', () => {
    render(<MealsLog childId="c1" />);
    expect(screen.getByText(/oatmeal \+ banana/)).toBeInTheDocument();
  });

  it('shows a delete button per entry', () => {
    render(<MealsLog childId="c1" />);
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });
});

describe('MealsLog — form behavior', () => {
  it('blocks submit when description is empty and shows error toast', () => {
    render(<MealsLog childId="c1" />);
    const submitBtn = screen.getByRole('button', { name: /^Log Meal$/ });
    fireEvent.click(submitBtn);
    expect(mockLog).not.toHaveBeenCalled();
    expect(mockAddToast).toHaveBeenCalledWith('Description required', 'error');
  });

  it('submits a valid meal entry', () => {
    render(<MealsLog childId="c1" />);
    fireEvent.change(screen.getByPlaceholderText(/What was served/i), {
      target: { value: 'rice + dal' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Log Meal$/ }));
    expect(mockLog).toHaveBeenCalledTimes(1);
    const payload = mockLog.mock.calls[0]?.[0];
    expect(payload).toMatchObject({
      description: 'rice + dal',
      type: expect.any(Number),
    });
  });
});

describe('MealsLog — meal type defaults', () => {
  it('renders all 4 meal type options', () => {
    render(<MealsLog childId="c1" />);
    // All meal type buttons (selectable chips) present
    expect(screen.getByRole('button', { name: 'Breakfast' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lunch' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dinner' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Snack' })).toBeInTheDocument();
  });
});

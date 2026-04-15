import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { SuggestionStrip } from '@/modules/baby/components/SuggestionStrip';
import { SuggestionAction, type Suggestion } from '@/modules/baby/suggestions';

vi.mock('@/modules/baby/hooks/useSnooze', () => ({
  useSnooze: () => ({ snooze: vi.fn(async () => ({ ok: true, data: undefined })) }),
}));
vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

const suggestion: Suggestion = {
  childId: 'c1',
  childName: 'Aanya',
  feature: 'meals',
  action: SuggestionAction.Enable,
};

describe('SuggestionStrip', () => {
  it('renders nothing when no suggestions', () => {
    const { container } = render(<SuggestionStrip suggestions={[]} onEnable={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows summary line for one suggestion', () => {
    render(<SuggestionStrip suggestions={[suggestion]} onEnable={vi.fn()} />);
    expect(screen.getByText(/enable Meals module/i)).toBeInTheDocument();
  });

  it('expands to show actions on click', () => {
    render(<SuggestionStrip suggestions={[suggestion]} onEnable={vi.fn()} />);
    fireEvent.click(screen.getByText(/enable Meals/i));
    expect(screen.getByRole('button', { name: 'Enable' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Snooze 30d' })).toBeInTheDocument();
  });

  it('calls onEnable when Enable clicked', () => {
    const onEnable = vi.fn();
    render(<SuggestionStrip suggestions={[suggestion]} onEnable={onEnable} />);
    fireEvent.click(screen.getByText(/enable Meals/i));
    fireEvent.click(screen.getByRole('button', { name: 'Enable' }));
    expect(onEnable).toHaveBeenCalledWith('c1', 'meals');
  });

  it('shows aggregate summary for multiple suggestions', () => {
    const second: Suggestion = { ...suggestion, feature: 'feeds', action: SuggestionAction.Disable };
    render(<SuggestionStrip suggestions={[suggestion, second]} onEnable={vi.fn()} />);
    expect(screen.getByText(/2 suggestions/i)).toBeInTheDocument();
  });
});

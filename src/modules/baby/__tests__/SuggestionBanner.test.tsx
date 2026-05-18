import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { SuggestionBanner } from '@/modules/baby/components/SuggestionBanner';
import { SuggestionAction, type Suggestion } from '@/modules/baby/suggestions';

vi.mock('@/modules/baby/hooks/useSnooze', () => ({
  useSnooze: () => ({ snooze: vi.fn(async () => ({ ok: true, data: undefined })) }),
}));
vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

/** Enable-meals suggestion fixture for SuggestionBanner render tests */
const suggestion1: Suggestion = {
  childId: 'c1',
  childName: 'Aanya',
  feature: 'meals',
  action: SuggestionAction.Enable,
};
/** Disable-feeds suggestion fixture for multi-suggestion count tests */
const suggestion2: Suggestion = {
  childId: 'c2',
  childName: 'Vikas',
  feature: 'feeds',
  action: SuggestionAction.Disable,
};

/** Validates SuggestionBanner renders count, child names, and fires onAct on Enable click */
describe('SuggestionBanner', () => {
  it('renders nothing when no suggestions', () => {
    const { container } = render(<SuggestionBanner suggestions={[]} onAct={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows count and entries', () => {
    render(<SuggestionBanner suggestions={[suggestion1, suggestion2]} onAct={vi.fn()} />);
    expect(screen.getByText(/Suggestions \(2\)/)).toBeInTheDocument();
    expect(screen.getByText('Aanya')).toBeInTheDocument();
    expect(screen.getByText('Vikas')).toBeInTheDocument();
  });

  it('calls onAct when Enable clicked', () => {
    const onAct = vi.fn();
    render(<SuggestionBanner suggestions={[suggestion1]} onAct={onAct} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enable' }));
    expect(onAct).toHaveBeenCalledWith('c1', 'meals', SuggestionAction.Enable);
  });
});

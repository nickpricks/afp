import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { DashboardCard } from '@/shared/components/DashboardCard';

function renderCard(props = {}) {
  const defaults = {
    title: 'Body',
    icon: '💪',
    metric: '42.5',
    subtitle: '3 up / 1 down',
    to: '/body',
  };
  return render(
    <MemoryRouter>
      <DashboardCard {...defaults} {...props} />
    </MemoryRouter>,
  );
}

describe('DashboardCard', () => {
  it('renders title, metric, and subtitle', () => {
    renderCard();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('42.5')).toBeInTheDocument();
    expect(screen.getByText('3 up / 1 down')).toBeInTheDocument();
  });

  it('renders icon', () => {
    renderCard();
    expect(screen.getByText('💪')).toBeInTheDocument();
  });

  it('links to the module route', () => {
    renderCard();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/body');
  });

  it('has shadow-sm and accent border styling', () => {
    renderCard();
    const link = screen.getByRole('link');
    expect(link.className).toContain('shadow-sm');
    expect(link.className).toContain('border-l-accent');
  });
});

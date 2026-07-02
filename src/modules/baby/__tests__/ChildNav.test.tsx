import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { ChildNav } from '@/modules/baby/components/ChildNav';
import { SectionGroup } from '@/modules/baby/sections';
import type { ChildSection } from '@/modules/baby/sections';

const SECTIONS: ChildSection[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠', group: SectionGroup.Overview },
  { id: 'journal', label: 'Journal', icon: '📖', group: SectionGroup.Overview },
  { id: 'meals', label: 'Meals', icon: '🍽', group: SectionGroup.Logs },
  { id: 'presents', label: 'Presents', icon: '🎁', group: SectionGroup.Logs },
  { id: 'feeding', label: 'Feeding', icon: '🍼', group: SectionGroup.Archived },
];

/** Tests grouped rendering, selection callback, and Archived collapse behavior */
describe('ChildNav', () => {
  const noop = vi.fn();

  it('renders group headers and section items (drawer + sidebar both mount)', () => {
    render(<ChildNav sections={SECTIONS} activeId="dashboard" onSelect={noop} />);
    expect(screen.getAllByText('Overview').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Logs').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /Meals/ }).length).toBeGreaterThan(0);
  });

  it('fires onSelect with the section id', () => {
    const onSelect = vi.fn();
    render(<ChildNav sections={SECTIONS} activeId="dashboard" onSelect={onSelect} />);
    fireEvent.click(screen.getAllByRole('button', { name: /Presents/ })[0]!);
    expect(onSelect).toHaveBeenCalledWith('presents');
  });

  it('collapses the Archived group by default and expands on header click', () => {
    render(<ChildNav sections={SECTIONS} activeId="dashboard" onSelect={noop} />);
    expect(screen.queryByRole('button', { name: /Feeding/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /Archived/ })[0]!);
    expect(screen.getAllByRole('button', { name: /Feeding/ }).length).toBeGreaterThan(0);
  });

  it('omits the Archived group entirely when it has no sections', () => {
    render(
      <ChildNav
        sections={SECTIONS.filter((s) => s.group !== SectionGroup.Archived)}
        activeId="dashboard"
        onSelect={noop}
      />,
    );
    expect(screen.queryByText('Archived')).not.toBeInTheDocument();
  });
});

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { ListShowMoreFooter } from '../ListShowMoreFooter';

describe('ListShowMoreFooter', () => {
  it('renders nothing when total <= shown', () => {
    const { container } = render(
      <ListShowMoreFooter totalCount={10} shownCount={10} pageSize={25} onShowAll={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders "Show all" label when remaining > pageSize', () => {
    render(
      <ListShowMoreFooter totalCount={87} shownCount={25} pageSize={25} onShowAll={() => {}} />,
    );
    expect(screen.getByRole('button')).toHaveTextContent('Show all 87 records');
  });

  it('renders "Load N remaining" label when remaining <= pageSize', () => {
    render(
      <ListShowMoreFooter totalCount={37} shownCount={25} pageSize={25} onShowAll={() => {}} />,
    );
    expect(screen.getByRole('button')).toHaveTextContent('Load 12 remaining');
  });

  it('calls onShowAll when clicked', () => {
    const onShowAll = vi.fn();
    render(
      <ListShowMoreFooter totalCount={87} shownCount={25} pageSize={25} onShowAll={onShowAll} />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onShowAll).toHaveBeenCalledOnce();
  });
});

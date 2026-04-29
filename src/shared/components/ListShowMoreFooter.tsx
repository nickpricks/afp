interface Props {
  totalCount: number;
  shownCount: number;
  pageSize: number;
  onShowAll: () => void;
}

/** Bottom escape-hatch button: contextual "Show all N" or "Load N remaining" */
export function ListShowMoreFooter({ totalCount, shownCount, pageSize, onShowAll }: Props) {
  const remaining = totalCount - shownCount;
  if (remaining <= 0) return null;

  const label =
    remaining > pageSize ? `Show all ${totalCount} records` : `Load ${remaining} remaining`;

  return (
    <div className="mx-4 mt-3 flex justify-center">
      <button
        type="button"
        onClick={onShowAll}
        className="rounded-lg border border-line bg-surface-card px-4 py-2 text-sm text-fg-muted transition-colors hover:bg-accent-muted hover:text-fg"
      >
        {label}
      </button>
    </div>
  );
}

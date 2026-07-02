/** Centered "+ Add missing day" pill button — opens the backfill date picker. Rendered above and below Body lists. */
export function AddMissingDayButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex justify-center">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:border-accent hover:text-accent"
      >
        + Add missing day
      </button>
    </div>
  );
}

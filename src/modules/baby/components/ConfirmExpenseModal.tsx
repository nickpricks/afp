import { useEffect, useRef } from 'react';

type Props = {
  open: boolean;
  amount: number;
  description: string;
  date: string;
  onConfirm: () => void;
  onSkip: () => void;
  onCancel: () => void;
};

/** Inline confirm modal for the Spent→Expense bridge */
export function ConfirmExpenseModal({
  open,
  amount,
  description,
  date,
  onConfirm,
  onSkip,
  onCancel,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="rounded-lg p-0 bg-surface-card border border-line backdrop:bg-black/50"
      onClose={onCancel}
    >
      <div className="p-6 flex flex-col gap-4 min-w-[280px]">
        <h3 className="text-lg font-semibold text-fg">Also log as an expense?</h3>
        <div className="rounded-md bg-surface p-3 text-sm">
          <p className="text-fg">
            <span className="text-fg-muted">Description:</span> {description}
          </p>
          <p className="text-fg">
            <span className="text-fg-muted">Amount:</span> ₹{amount.toLocaleString()}
          </p>
          <p className="text-fg">
            <span className="text-fg-muted">Date:</span> {date}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full py-2 rounded-md bg-accent text-fg-on-accent font-medium"
          >
            Yes, log it
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="w-full py-2 rounded-md bg-surface border border-line text-fg"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2 rounded-md text-fg-muted text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  );
}

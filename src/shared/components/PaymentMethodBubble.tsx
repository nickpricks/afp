import { PaymentMethod } from '@/shared/types';
import { PAYMENT_METHOD_LABELS } from '@/modules/expenses/categories';

interface Props {
  method: PaymentMethod;
  isActive: boolean;
  onClick: (method: PaymentMethod) => void;
}

/**
 * Reusable bubble button for selecting a payment method.
 * Displays emoji and short label with active/inactive states.
 */
export function PaymentMethodBubble({ method, isActive, onClick }: Props) {
  const label = PAYMENT_METHOD_LABELS[method];

  return (
    <button
      type="button"
      onClick={() => onClick(method)}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        isActive
          ? 'border-accent bg-accent text-fg-on-accent'
          : 'border-line bg-surface-card text-fg-muted hover:border-accent/50'
      }`}
    >
      {label.emoji} {label.shortLabel}
    </button>
  );
}

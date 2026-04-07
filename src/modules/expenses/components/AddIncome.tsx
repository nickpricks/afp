import { useState } from 'react';

import { INCOME_SOURCE_LABELS, PAYMENT_METHOD_LABELS } from '@/modules/expenses/categories';
import { IncomeSource, PaymentMethod } from '@/shared/types';
import { CONFIG } from '@/constants/config';
import { todayStr } from '@/shared/utils/date';
import { isValidNumber } from '@/shared/utils/validation';

/** Quick-access payment methods for income */
const QUICK_PAYMENT_METHODS: PaymentMethod[] = [
  PaymentMethod.UpiBankAccount,
  PaymentMethod.BankAccountImps,
  PaymentMethod.Cash,
];

/** Remaining payment methods shown when expanded */
const EXTRA_PAYMENT_METHODS: PaymentMethod[] = [
  PaymentMethod.UpiCreditCard,
  PaymentMethod.CreditCard,
  PaymentMethod.BankAccountRtgs,
  PaymentMethod.BankAccountNeft,
];

/** All income source enum values (filter out reverse-mapped strings from numeric enum) */
const ALL_INCOME_SOURCES = Object.values(IncomeSource).filter((v) => typeof v === 'number') as IncomeSource[];

/** Form for adding a new income entry with source, amount, payment method, and note */
export function AddIncome({
  onSubmit,
}: {
  onSubmit: (input: {
    date: string;
    source: IncomeSource;
    amount: number;
    paymentMethod: PaymentMethod;
    note: string;
  }) => Promise<boolean>;
}) {
  const [date, setDate] = useState(todayStr);
  const [source, setSource] = useState<IncomeSource>(IncomeSource.Salary);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.UpiBankAccount);
  const [showAllMethods, setShowAllMethods] = useState(false);
  const [note, setNote] = useState('');

  const parsedAmount = Number(amount);
  const isDisabled = !amount || !isValidNumber(parsedAmount);

  /** Handles form submission, clears fields on success */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const success = await onSubmit({
      date,
      source,
      amount: parsedAmount,
      paymentMethod,
      note,
    });

    if (success) {
      setAmount('');
      setNote('');
    }
  }

  /** Renders a payment method bubble button */
  function renderMethodBubble(method: PaymentMethod) {
    const label = PAYMENT_METHOD_LABELS[method];
    const isActive = paymentMethod === method;
    return (
      <button
        key={method}
        type="button"
        onClick={() => setPaymentMethod(method)}
        className={
`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
          isActive
            ? 'border-accent bg-accent text-fg-on-accent'
            : 'border-line bg-surface-card text-fg-muted hover:border-accent/50'
        }`
}
      >
        {label.emoji} {label.shortLabel}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-4">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded-lg border border-line bg-surface-card px-3 py-2 text-fg"
      />

      <select
        value={source}
        onChange={(e) => setSource(Number(e.target.value) as IncomeSource)}
        className="rounded-lg border border-line bg-surface-card px-3 py-2 text-fg"
      >
        {
ALL_INCOME_SOURCES.map((s) => {
          const label = INCOME_SOURCE_LABELS[s];
          return (
            <option key={s} value={s}>
              {label.emoji} {label.label}
            </option>
          );
        })
}
      </select>

      <div className="flex items-center gap-2">
        <span className="text-fg-muted text-sm font-medium">{CONFIG.CURRENCY_SYMBOL}</span>
        <input
          type="number"
          inputMode="decimal"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 rounded-lg border border-line bg-surface-card px-3 py-2 text-fg"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-fg-muted">Payment Method</span>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PAYMENT_METHODS.map(renderMethodBubble)}
          {
showAllMethods && EXTRA_PAYMENT_METHODS.map(renderMethodBubble)
}
          {
!showAllMethods && (
            <button
              type="button"
              onClick={() => setShowAllMethods(true)}
              className="rounded-full border border-dashed border-line px-3 py-1 text-xs text-fg-muted hover:border-accent/50"
            >
              More...
            </button>
          )
}
        </div>
      </div>

      <input
        type="text"
        placeholder="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="rounded-lg border border-line bg-surface-card px-3 py-2 text-fg"
      />

      <button
        type="submit"
        disabled={isDisabled}
        className="rounded-lg bg-accent px-4 py-2 text-fg-on-accent font-medium disabled:opacity-40"
      >
        Add Income
      </button>
    </form>
  );
}

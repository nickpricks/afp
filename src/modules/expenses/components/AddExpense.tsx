import { useState } from 'react';

import { CATEGORIES, getAllCategoryIds, getSubCategories, PAYMENT_METHOD_LABELS } from '@/modules/expenses/categories';
import { PaymentMethod, ExpenseCategory } from '@/shared/types';
import { CONFIG } from '@/constants/config';
import { todayStr } from '@/shared/utils/date';
import { isValidNumber } from '@/shared/utils/validation';

/** Quick-access payment methods shown by default */
const QUICK_PAYMENT_METHODS: PaymentMethod[] = [
  PaymentMethod.UpiBankAccount,
  PaymentMethod.UpiCreditCard,
  PaymentMethod.CreditCard,
];

/** Quick-tap amount presets */
const AMOUNT_PRESETS = [10, 20, 50, 100, 200];

/** All remaining payment methods shown when expanded */
const EXTRA_PAYMENT_METHODS: PaymentMethod[] = [
  PaymentMethod.Cash,
  PaymentMethod.BankAccountImps,
  PaymentMethod.BankAccountRtgs,
  PaymentMethod.BankAccountNeft,
];

/** Form for adding a new expense with category, subcategory, amount, payment method, and note */
export function AddExpense({
  onSubmit,
}: {
  onSubmit: (input: {
    date: string;
    category: ExpenseCategory;
    subCat: string;
    amount: number;
    paymentMethod: PaymentMethod | null;
    isSettlement: boolean;
    note: string;
  }) => Promise<boolean>;
}) {
  const [date, setDate] = useState(todayStr);
  const [category, setCategory] = useState<ExpenseCategory>(getAllCategoryIds()[0]!);
  const [subCat, setSubCat] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(PaymentMethod.UpiBankAccount);
  const [showAllMethods, setShowAllMethods] = useState(false);
  const [note, setNote] = useState('');

  const subCategories = getSubCategories(category);
  const parsedAmount = Number(amount);
  const isDisabled = !amount || !isValidNumber(parsedAmount);
  const isSettlement = category === ExpenseCategory.Finance && subCat === 'Credit Card Payment';

  /** Handles form submission, clears fields on success */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const success = await onSubmit({
      date,
      category,
      subCat,
      amount: parsedAmount,
      paymentMethod,
      isSettlement,
      note,
    });

    if (success) {
      setAmount('');
      setNote('');
      setSubCat('');
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
        onClick={() => setPaymentMethod(paymentMethod === method ? null : method)}
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
        value={category}
        onChange={
(e) => {
          setCategory(Number(e.target.value) as ExpenseCategory);
          setSubCat('');
        }
}
        className="rounded-lg border border-line bg-surface-card px-3 py-2 text-fg"
      >
        {
getAllCategoryIds().map((id) => (
          <option key={id} value={id}>
            {CATEGORIES[id]!.label}
          </option>
        ))
}
      </select>

      {
subCategories.length > 0 && (
        <select
          value={subCat}
          onChange={(e) => setSubCat(e.target.value)}
          className="rounded-lg border border-line bg-surface-card px-3 py-2 text-fg"
        >
          <option value="">-- Sub-category --</option>
          {
subCategories.map((sc) => (
            <option key={sc} value={sc}>
              {sc}
            </option>
          ))
}
        </select>
      )
}

      <div className="flex items-center gap-2">
        <span className="text-fg-muted text-sm font-medium">{CONFIG.CURRENCY_SYMBOL}</span>
        <input
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 rounded-lg border border-line bg-surface-card px-3 py-2 text-fg"
        />
      </div>

      <div className="flex gap-1.5">
        {
          AMOUNT_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(String(preset))}
              className="flex-1 rounded-lg border border-line bg-surface-card px-2 py-1 text-xs font-medium text-fg-muted hover:border-accent/50 transition-colors"
            >
              {preset}
            </button>
          ))
        }
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
        {isSettlement ? 'Add Settlement' : 'Add Expense'}
      </button>
    </form>
  );
}

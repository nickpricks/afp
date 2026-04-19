import { useState } from 'react';

import { CATEGORIES, getAllCategoryIds, getSubCategories } from '@/modules/expenses/categories';
import { PaymentMethod, ExpenseCategory } from '@/shared/types';
import { CONFIG } from '@/constants/config';
import { todayStr } from '@/shared/utils/date';
import { isValidNumber } from '@/shared/utils/validation';
import { PaymentMethodBubble } from '@/shared/components/PaymentMethodBubble';
import { useToast } from '@/shared/errors/useToast';
import { ToastType } from '@/shared/types';
import { BudgetMsg } from '@/constants/messages';

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
  const [category, setCategory] = useState<ExpenseCategory | null>(null);
  const [subCat, setSubCat] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    PaymentMethod.UpiBankAccount,
  );
  const [showAllMethods, setShowAllMethods] = useState(false);
  const [note, setNote] = useState('');

  const { addToast } = useToast();
  const [showAllCategories, setShowAllCategories] = useState(false);

  const allCategoryIds = getAllCategoryIds();
  const subCategories = category !== null ? getSubCategories(category) : [];
  const parsedAmount = Number(amount);
  const isDisabled = !amount || !isValidNumber(parsedAmount) || category === null;
  const isSettlement = category === ExpenseCategory.Finance && subCat === 'Credit Card Payment';

  /** Handles form submission, clears fields on success */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (category === null) {
      addToast(BudgetMsg.CategoryRequired, ToastType.Error);
      return;
    }

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

  /** Adds a preset value to the current amount */
  function handleAddPreset(value: number) {
    const current = Number(amount) || 0;
    setAmount(String(current + value));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-4">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded-lg border border-line bg-surface-card px-3 py-2 text-fg"
      />

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-fg-muted">Category</span>
          <button
            type="button"
            onClick={() => setShowAllCategories(!showAllCategories)}
            className="text-[10px] text-accent font-medium hover:underline"
          >
            {showAllCategories ? 'Show Less' : 'View All'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {allCategoryIds.map((id, index) => {
            const isActive = category === id;
            const def = CATEGORIES[id]!;
            if (!showAllCategories && !isActive && index >= CONFIG.BUDGET_VISIBLE_CATEGORIES)
              return null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setCategory(id);
                  setSubCat('');
                }}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'border-accent bg-accent text-fg-on-accent shadow-sm'
                    : 'border-line bg-surface-card text-fg-muted hover:border-accent/30'
                }`}
              >
                <span>{def.label.split(' ')[0]}</span>
                {isActive && <span>{def.label.split(' ').slice(1).join(' ')}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {subCategories.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-fg-muted">Sub-category</span>
          <div className="flex flex-wrap gap-1.5">
            {subCategories.map((sc) => {
              const isActive = subCat === sc;
              return (
                <button
                  key={sc}
                  type="button"
                  onClick={() => setSubCat(isActive ? '' : sc)}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] transition-colors ${
                    isActive
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-line bg-surface-card text-fg-muted hover:border-accent/30'
                  }`}
                >
                  {sc}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-fg-muted text-sm font-medium">{CONFIG.CURRENCY_SYMBOL}</span>
        <div className="relative flex-1">
          <input
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-line bg-surface-card px-3 py-2 text-fg pr-8"
          />
          {amount && (
            <button
              type="button"
              onClick={() => setAmount('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1.5">
        {AMOUNT_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => handleAddPreset(preset)}
            className="flex-1 rounded-lg border border-line bg-surface-card px-2 py-1 text-xs font-medium text-fg-muted hover:border-accent/50 transition-colors active:scale-95"
          >
            +{preset}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-fg-muted">Payment Method</span>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PAYMENT_METHODS.map((m) => (
            <PaymentMethodBubble
              key={m}
              method={m}
              isActive={paymentMethod === m}
              onClick={(method) => setPaymentMethod(paymentMethod === method ? null : method)}
            />
          ))}
          {showAllMethods &&
            EXTRA_PAYMENT_METHODS.map((m) => (
              <PaymentMethodBubble
                key={m}
                method={m}
                isActive={paymentMethod === m}
                onClick={(method) => setPaymentMethod(paymentMethod === method ? null : method)}
              />
            ))}
          {!showAllMethods && (
            <button
              type="button"
              onClick={() => setShowAllMethods(true)}
              className="rounded-full border border-dashed border-line px-3 py-1 text-xs text-fg-muted hover:border-accent/50"
            >
              More...
            </button>
          )}
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

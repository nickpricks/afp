import { useState } from 'react';

import { CATEGORIES, getAllCategoryIds, getSubCategories } from '@/modules/expenses/categories';
import { CONFIG } from '@/constants/config';
import { todayStr } from '@/shared/utils/date';
import { isValidNumber } from '@/shared/utils/validation';

/** Form for adding a new expense with category, subcategory, amount, and note */
export function AddExpense({
  onSubmit,
}: {
  onSubmit: (input: {
    date: string;
    category: string;
    subCat: string;
    amount: number;
    note: string;
  }) => Promise<boolean>;
}) {
  const [date, setDate] = useState(todayStr);
  const [category, setCategory] = useState(getAllCategoryIds()[0]!);
  const [subCat, setSubCat] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const subCategories = getSubCategories(category);
  const parsedAmount = Number(amount);
  const isDisabled = !amount || !isValidNumber(parsedAmount);

  /** Handles form submission, clears fields on success */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const success = await onSubmit({
      date,
      category,
      subCat,
      amount: parsedAmount,
      note,
    });

    if (success) {
      setAmount('');
      setNote('');
      setSubCat('');
    }
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
          setCategory(e.target.value);
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
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 rounded-lg border border-line bg-surface-card px-3 py-2 text-fg"
        />
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
        Add Expense
      </button>
    </form>
  );
}

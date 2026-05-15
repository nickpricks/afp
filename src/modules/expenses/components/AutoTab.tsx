import { useState } from 'react';

import type { Expense, ExpenseMeta } from '@/modules/expenses/types';
import { ExpenseMetaType } from '@/modules/expenses/types';
import { ExpenseCategory, PaymentMethod, ToastType } from '@/shared/types';
import { PaymentMethodBubble } from '@/shared/components/PaymentMethodBubble';
import { todayStr } from '@/shared/utils/date';
import { sortNewestFirst } from '@/shared/utils/sort';
import { CONFIG } from '@/constants/config';
import { MetaSubForm } from '@/modules/expenses/components/MetaSubForm';
import { defaultMeta, subCatFor } from '@/modules/expenses/meta-utils';
import { ServiceDueBanner } from '@/modules/expenses/components/ServiceDueBanner';
import { DateGroupHeader } from '@/shared/components/lists/DateGroupHeader';
import { useToast } from '@/shared/errors/useToast';
import { ValidationMsg } from '@/constants/messages';
import { useExpenseForm } from '@/modules/expenses/hooks/useExpenseForm';
import { AutoTabRow } from '@/modules/expenses/components/AutoTabRow';

type FormKind = ExpenseMetaType;

/** Payment methods most relevant for vehicle/travel entries */
const AUTO_PAYMENT_METHODS: PaymentMethod[] = [
  PaymentMethod.UpiBankAccount,
  PaymentMethod.Cash,
  PaymentMethod.UpiCreditCard,
  PaymentMethod.CreditCard,
];

/** Auto tab — vehicle/travel filtered list, quick-add buttons, inline form, service-due banner */
export function AutoTab({
  expenses,
  onAdd,
  onUpdate,
  onDelete,
}: {
  expenses: Expense[];
  onAdd: (input: {
    date: string;
    category: ExpenseCategory;
    subCat: string;
    amount: number;
    paymentMethod: PaymentMethod;
    note: string;
    meta: ExpenseMeta;
  }) => Promise<boolean>;
  onUpdate: (e: Expense) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKind, setFormKind] = useState<FormKind | null>(null);
  const { date, setDate, amount, setAmount, note, setNote, meta, setMeta, paymentMethod, setPaymentMethod, reset, populate } =
    useExpenseForm();
  const { addToast } = useToast();

  const filtered = expenses.filter(
    (e) => e.category === ExpenseCategory.Vehicle || e.category === ExpenseCategory.Travel,
  );
  const sorted = sortNewestFirst(filtered, (e) => e.date);

  function startQuickAdd(kind: FormKind) {
    reset();
    setEditingId(null);
    setFormKind(kind);
    setDate(todayStr());
    setMeta(defaultMeta(kind));
  }

  function startEdit(e: Expense) {
    if (!e.meta) return;
    setEditingId(e.id);
    setFormKind(e.meta.type);
    populate(e);
  }

  function cancelForm() {
    setEditingId(null);
    setFormKind(null);
    reset();
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!meta || !formKind) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      addToast(ValidationMsg.AmountPositive, ToastType.Error);
      return;
    }

    const { category, subCat } = subCatFor(formKind);

    if (editingId) {
      const original = expenses.find((e) => e.id === editingId);
      if (!original) return;
      const ok = await onUpdate({
        ...original,
        date,
        category,
        subCat,
        amount: amt,
        note,
        meta,
      });
      if (ok) cancelForm();
    } else {
      const ok = await onAdd({
        date,
        category,
        subCat,
        amount: amt,
        paymentMethod: paymentMethod ?? PaymentMethod.UpiBankAccount,
        note,
        meta: meta!,
      });
      if (ok) cancelForm();
    }
  }

  // Auto tab deviates from the universal-list pattern: small vehicle history
  // doesn't need time-range/page chrome. Revisit if users cross ~500 entries.
  const today = todayStr();
  const groups: Record<string, Expense[]> = {};
  sorted.forEach((e) => {
    (groups[e.date] = groups[e.date] || []).push(e);
  });
  const dateKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex flex-col">
      <ServiceDueBanner expenses={expenses} />

      <div className="mx-4 mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => startQuickAdd(ExpenseMetaType.Fuel)}
          className="flex-1 rounded-lg border border-line bg-surface-card px-3 py-2 text-sm font-medium text-fg hover:border-accent/40"
        >
          ⛽ Add Fuel
        </button>
        <button
          type="button"
          onClick={() => startQuickAdd(ExpenseMetaType.Travel)}
          className="flex-1 rounded-lg border border-line bg-surface-card px-3 py-2 text-sm font-medium text-fg hover:border-accent/40"
        >
          🚕 Add Trip
        </button>
        <button
          type="button"
          onClick={() => startQuickAdd(ExpenseMetaType.Maintenance)}
          className="flex-1 rounded-lg border border-line bg-surface-card px-3 py-2 text-sm font-medium text-fg hover:border-accent/40"
        >
          🔧 Service
        </button>
      </div>

      {meta && formKind && (
        <form onSubmit={handleSubmit} className="mx-4 mb-3 flex flex-col gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-line bg-surface-card px-3 py-2 text-fg"
          />
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
          <MetaSubForm
            meta={meta}
            amount={amount}
            onChangeMeta={setMeta}
            onChangeAmount={setAmount}
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-fg-muted">Payment Method</span>
            <div className="flex flex-wrap gap-1.5">
              {AUTO_PAYMENT_METHODS.map((m) => (
                <PaymentMethodBubble
                  key={m}
                  method={m}
                  isActive={paymentMethod === m}
                  onClick={(method) =>
                    setPaymentMethod(paymentMethod === method ? PaymentMethod.UpiBankAccount : method)
                  }
                />
              ))}
            </div>
          </div>
          <input
            type="text"
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="rounded-lg border border-line bg-surface-card px-3 py-2 text-fg"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-accent px-4 py-2 text-fg-on-accent font-medium"
            >
              {editingId ? 'Update' : 'Save'}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="rounded-lg border border-line px-4 py-2 text-fg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {sorted.length === 0 && (
        <p className="px-4 py-8 text-center text-fg-muted">No vehicle or trip entries yet</p>
      )}

      <div className="bg-surface">
        {dateKeys.map((dk) => (
          <div key={dk}>
            <DateGroupHeader date={dk} today={today} />
            {groups[dk]!.map((e) => (
              <AutoTabRow
                key={e.id}
                expense={e}
                isActive={e.id === editingId}
                onTap={() => startEdit(e)}
                onDelete={() => onDelete(e.id)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

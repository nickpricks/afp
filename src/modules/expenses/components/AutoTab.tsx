import { useState } from 'react';

import type {
  Expense,
  ExpenseMeta,
  FuelMeta,
  TravelMeta,
  MaintenanceMeta,
} from '@/modules/expenses/types';
import { ExpenseCategory, ToastType } from '@/shared/types';
import { todayStr } from '@/shared/utils/date';
import { sortNewestFirst } from '@/shared/utils/sort';
import { CONFIG } from '@/constants/config';
import { CATEGORIES, PAYMENT_METHOD_LABELS } from '@/modules/expenses/categories';
import { MetaSubForm } from '@/modules/expenses/components/MetaSubForm';
import { defaultMeta } from '@/modules/expenses/meta-utils';
import { ServiceDueBanner } from '@/modules/expenses/components/ServiceDueBanner';
import { computeMileage } from '@/modules/expenses/fuel-math';
import { DateGroupHeader } from '@/shared/components/lists/DateGroupHeader';
import { useToast } from '@/shared/errors/useToast';
import { BudgetMsg } from '@/constants/messages';

type FormKind = 'fuel' | 'travel' | 'maintenance';

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
    note: string;
    meta: ExpenseMeta;
  }) => Promise<boolean>;
  onUpdate: (e: Expense) => Promise<boolean>;
  onDelete: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKind, setFormKind] = useState<FormKind | null>(null);
  const [date, setDate] = useState(todayStr());
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [meta, setMeta] = useState<ExpenseMeta | null>(null);
  const { addToast } = useToast();

  const filtered = expenses.filter(
    (e) => e.category === ExpenseCategory.Vehicle || e.category === ExpenseCategory.Travel,
  );
  const sorted = sortNewestFirst(filtered, (e) => e.date);

  function startQuickAdd(kind: FormKind) {
    setEditingId(null);
    setFormKind(kind);
    setDate(todayStr());
    setAmount('');
    setNote('');
    setMeta(defaultMeta(kind)!);
  }

  function startEdit(e: Expense) {
    if (!e.meta) return;
    setEditingId(e.id);
    setFormKind(e.meta.type);
    setDate(e.date);
    setAmount(String(e.amount));
    setNote(e.note);
    setMeta(e.meta);
  }

  function cancelForm() {
    setEditingId(null);
    setFormKind(null);
    setMeta(null);
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!meta || !formKind) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      addToast(BudgetMsg.CategoryRequired, ToastType.Error);
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
        note,
        meta,
      });
      if (ok) cancelForm();
    }
  }

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
          onClick={() => startQuickAdd('fuel')}
          className="flex-1 rounded-lg border border-line bg-surface-card px-3 py-2 text-sm font-medium text-fg hover:border-accent/40"
        >
          ⛽ Add Fuel
        </button>
        <button
          type="button"
          onClick={() => startQuickAdd('travel')}
          className="flex-1 rounded-lg border border-line bg-surface-card px-3 py-2 text-sm font-medium text-fg hover:border-accent/40"
        >
          🚕 Add Trip
        </button>
        <button
          type="button"
          onClick={() => startQuickAdd('maintenance')}
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
              <Row
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

function Row({
  expense,
  isActive,
  onTap,
  onDelete,
}: {
  expense: Expense;
  isActive: boolean;
  onTap: () => void;
  onDelete: () => void;
}) {
  const pmLabel = PAYMENT_METHOD_LABELS[expense.paymentMethod];
  const catLabel = CATEGORIES[expense.category]?.label ?? '';
  const badge = renderBadge(expense.meta);

  return (
    <div
      className={`flex items-center justify-between border-t border-line px-4 py-3 transition-colors ${
        isActive ? 'bg-[var(--accent-muted)] border-l-2 border-l-accent' : 'hover:bg-accent-muted'
      }`}
      onClick={onTap}
    >
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-base font-semibold tabular-nums text-accent">
            {CONFIG.CURRENCY_SYMBOL}
            {expense.amount}
          </span>
          {pmLabel && (
            <span className="rounded bg-surface-card px-1.5 py-0.5 text-[10px] text-fg-muted">
              {pmLabel.shortLabel}
            </span>
          )}
        </div>
        <span className="text-xs text-fg-muted">
          {catLabel} {expense.subCat && `> ${expense.subCat}`}
        </span>
        {badge && <span className="text-[11px] text-fg-muted">{badge}</span>}
        {!expense.meta && (
          <span className="rounded bg-fg-muted/10 px-1.5 py-0.5 text-[10px] text-fg-muted">
            incomplete
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="text-fg-muted hover:text-red-500 hover:scale-125 hover:font-bold transition-all"
      >
        ×
      </button>
    </div>
  );
}

function renderBadge(meta: ExpenseMeta | undefined): string | null {
  if (!meta) return null;
  if (meta.type === 'fuel') return renderFuelBadge(meta);
  if (meta.type === 'travel') return renderTravelBadge(meta);
  return renderMaintenanceBadge(meta);
}

function renderFuelBadge(meta: FuelMeta): string {
  const parts: string[] = [`⛽ ${meta.liters}L`];
  if (meta.pricePerLiter > 0) parts.push(`${CONFIG.CURRENCY_SYMBOL}${meta.pricePerLiter}/L`);
  if (meta.odometer != null) parts.push(`${meta.odometer.toLocaleString()}km`);
  const mileage = computeMileage(meta);
  if (mileage != null) parts.push(`${mileage.toFixed(1)} km/L`);
  return parts.join(' · ');
}

function renderTravelBadge(meta: TravelMeta): string {
  const route = `🚕 ${meta.origin} → ${meta.destination}`;
  return meta.distance != null ? `${route} · ${meta.distance}km` : route;
}

function renderMaintenanceBadge(meta: MaintenanceMeta): string {
  const parts = [`🔧 ${meta.odometer.toLocaleString()}km`];
  if (meta.nextService != null) parts.push(`next ${meta.nextService.toLocaleString()}`);
  return parts.join(' · ');
}

function subCatFor(kind: FormKind): { category: ExpenseCategory; subCat: string } {
  if (kind === 'fuel') return { category: ExpenseCategory.Vehicle, subCat: 'Fuel' };
  if (kind === 'travel') return { category: ExpenseCategory.Travel, subCat: 'Cab/Auto' };
  return { category: ExpenseCategory.Vehicle, subCat: 'Maintenance' };
}

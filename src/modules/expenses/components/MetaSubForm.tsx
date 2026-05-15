import type { ExpenseMeta, FuelMeta, TravelMeta, MaintenanceMeta } from '@/modules/expenses/types';
import { ExpenseMetaType } from '@/modules/expenses/types';
import { assertNever } from '@/shared/utils/types';
import { deriveFuelTriple } from '@/modules/expenses/fuel-math';

/** Coerce a string input to a finite number; non-numeric or empty becomes 0. */
const toFiniteNumber = (s: string): number => {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

/** Conditional meta sub-form — renders Fuel / Travel / Maintenance fields based on meta.type */
export function MetaSubForm({
  meta,
  amount,
  onChangeMeta,
  onChangeAmount,
}: {
  meta: ExpenseMeta;
  amount: string;
  onChangeMeta: (m: ExpenseMeta) => void;
  onChangeAmount: (a: string) => void;
}) {
  switch (meta.type) {
    case ExpenseMetaType.Fuel:
      return (
        <FuelFields
          meta={meta}
          amount={amount}
          onChange={onChangeMeta}
          onChangeAmount={onChangeAmount}
        />
      );
    case ExpenseMetaType.Travel:
      return <TravelFields meta={meta} onChange={onChangeMeta} />;
    case ExpenseMetaType.Maintenance:
      return <MaintenanceFields meta={meta} onChange={onChangeMeta} />;
    default:
      return assertNever(meta);
  }
}

function FuelFields({
  meta,
  amount,
  onChange,
  onChangeAmount,
}: {
  meta: FuelMeta;
  amount: string;
  onChange: (m: FuelMeta) => void;
  onChangeAmount: (a: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface-card p-3">
      <span className="text-xs font-medium text-fg-muted">⛽ Fuel details</span>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
          Liters
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={meta.liters || ''}
            onChange={(e) => onChange({ ...meta, liters: toFiniteNumber(e.target.value) })}
            onBlur={(e) => {
              const litersNext = toFiniteNumber(e.target.value);
              const amtIn = toFiniteNumber(amount);
              const derived = deriveFuelTriple({
                liters: litersNext,
                pricePerLiter: meta.pricePerLiter,
                amount: amtIn,
                lastEdited: 'liters',
              });
              onChange({ ...meta, liters: derived.liters, pricePerLiter: derived.pricePerLiter });
              // Only update amount when deriveFuelTriple actually filled it in
              if (derived.amount !== amtIn && derived.amount !== 0) {
                onChangeAmount(String(derived.amount));
              }
            }}
            className="rounded-md border border-line bg-surface px-2 py-1 text-fg"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
          ₹/Liter
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={meta.pricePerLiter || ''}
            onChange={(e) => onChange({ ...meta, pricePerLiter: toFiniteNumber(e.target.value) })}
            onBlur={(e) => {
              const priceNext = toFiniteNumber(e.target.value);
              const amtIn = toFiniteNumber(amount);
              const derived = deriveFuelTriple({
                liters: meta.liters,
                pricePerLiter: priceNext,
                amount: amtIn,
                lastEdited: 'price',
              });
              onChange({ ...meta, liters: derived.liters, pricePerLiter: derived.pricePerLiter });
              // Only update amount when deriveFuelTriple actually filled it in
              if (derived.amount !== amtIn && derived.amount !== 0) {
                onChangeAmount(String(derived.amount));
              }
            }}
            className="rounded-md border border-line bg-surface px-2 py-1 text-fg"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-xs text-fg-muted">
        <input
          type="checkbox"
          checked={meta.fullTank}
          onChange={(e) => onChange({ ...meta, fullTank: e.target.checked })}
        />
        Full tank
      </label>

      <details className="text-xs">
        <summary className="cursor-pointer text-fg-muted">Vehicle data (optional)</summary>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
            Total ODO (km)
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={meta.odometer ?? ''}
              onChange={(e) =>
                onChange({
                  ...meta,
                  odometer: e.target.value === '' ? null : Number(e.target.value),
                })
              }
              className="rounded-md border border-line bg-surface px-2 py-1 text-fg"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
            Trip ODO (km)
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={meta.tripOdo ?? ''}
              onChange={(e) =>
                onChange({
                  ...meta,
                  tripOdo: e.target.value === '' ? null : Number(e.target.value),
                })
              }
              className="rounded-md border border-line bg-surface px-2 py-1 text-fg"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
            Dash km/L
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              value={meta.displayedMileage ?? ''}
              onChange={(e) =>
                onChange({
                  ...meta,
                  displayedMileage: e.target.value === '' ? null : Number(e.target.value),
                })
              }
              className="rounded-md border border-line bg-surface px-2 py-1 text-fg"
            />
          </label>
        </div>
      </details>
    </div>
  );
}

function TravelFields({ meta, onChange }: { meta: TravelMeta; onChange: (m: TravelMeta) => void }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface-card p-3">
      <span className="text-xs font-medium text-fg-muted">🚕 Trip details</span>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
          From
          <input
            type="text"
            value={meta.origin}
            onChange={(e) => onChange({ ...meta, origin: e.target.value })}
            placeholder="BLR"
            className="rounded-md border border-line bg-surface px-2 py-1 text-fg"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
          To
          <input
            type="text"
            value={meta.destination}
            onChange={(e) => onChange({ ...meta, destination: e.target.value })}
            placeholder="MAA"
            className="rounded-md border border-line bg-surface px-2 py-1 text-fg"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
        Distance (km, optional)
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="1"
          value={meta.distance ?? ''}
          onChange={(e) =>
            onChange({ ...meta, distance: e.target.value === '' ? null : Number(e.target.value) })
          }
          className="rounded-md border border-line bg-surface px-2 py-1 text-fg"
        />
      </label>
    </div>
  );
}

function MaintenanceFields({
  meta,
  onChange,
}: {
  meta: MaintenanceMeta;
  onChange: (m: MaintenanceMeta) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface-card p-3">
      <span className="text-xs font-medium text-fg-muted">🔧 Service details</span>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
          Current ODO (km)
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            value={meta.odometer || ''}
            onChange={(e) => onChange({ ...meta, odometer: toFiniteNumber(e.target.value) })}
            className="rounded-md border border-line bg-surface px-2 py-1 text-fg"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
          Next service @ (km)
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            placeholder="32500"
            value={meta.nextService ?? ''}
            onChange={(e) =>
              onChange({
                ...meta,
                nextService: e.target.value === '' ? null : Number(e.target.value),
              })
            }
            className="rounded-md border border-line bg-surface px-2 py-1 text-fg"
          />
        </label>
      </div>
      <span className="text-[10px] text-fg-muted">
        Setting next service ODO clears the service-due banner.
      </span>
      <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
        Service notes
        <textarea
          value={meta.serviceNotes}
          onChange={(e) => onChange({ ...meta, serviceNotes: e.target.value })}
          rows={2}
          className="rounded-md border border-line bg-surface px-2 py-1 text-fg"
        />
      </label>
    </div>
  );
}

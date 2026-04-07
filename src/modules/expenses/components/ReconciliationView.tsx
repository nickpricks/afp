import type { Expense } from '@/modules/expenses/types';
import { PAYMENT_METHOD_LABELS } from '@/modules/expenses/categories';
import { PaymentMethod } from '@/shared/types';
import { CONFIG } from '@/constants/config';

/** Displays credit card charges vs settlements with outstanding balance */
export function ReconciliationView({ expenses }: { expenses: Expense[] }) {
  const ccCharges = expenses.filter(
    (e) =>
      !e.isSettlement &&
      (e.paymentMethod === PaymentMethod.CreditCard ||
        e.paymentMethod === PaymentMethod.UpiCreditCard),
  );

  const settlements = expenses.filter((e) => e.isSettlement);

  const totalCharged = ccCharges.reduce((sum, e) => sum + e.amount, 0);
  const totalSettled = settlements.reduce((sum, e) => sum + e.amount, 0);
  const outstanding = Math.max(0, totalCharged - totalSettled);

  if (ccCharges.length === 0 && settlements.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-fg-muted">No CC activity</p>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-line bg-surface-card px-3 py-2">
          <p className="text-xs text-fg-muted">Charged</p>
          <p className="text-lg font-semibold text-fg">
            {CONFIG.CURRENCY_SYMBOL}{totalCharged.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface-card px-3 py-2">
          <p className="text-xs text-fg-muted">Settled</p>
          <p className="text-lg font-semibold text-fg">
            {CONFIG.CURRENCY_SYMBOL}{totalSettled.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface-card px-3 py-2">
          <p className="text-xs text-fg-muted">Outstanding</p>
          <p className={`text-lg font-semibold ${outstanding > 0 ? 'text-warning' : 'text-fg'}`}>
            {CONFIG.CURRENCY_SYMBOL}{outstanding.toLocaleString()}
          </p>
        </div>
      </div>

      {/* CC Charges list */}
      {
        ccCharges.length > 0 && (
          <div className="flex flex-col gap-1">
            <h3 className="text-xs font-medium text-fg-muted uppercase tracking-wide">CC Charges</h3>
            <ul className="flex flex-col gap-1">
              {
                ccCharges.map((e) => {
                  const pm = PAYMENT_METHOD_LABELS[e.paymentMethod];
                  return (
                    <li key={e.id} className="flex justify-between rounded-lg border border-line bg-surface-card px-3 py-2 text-sm">
                      <span className="text-fg">{e.date} {pm?.shortLabel}</span>
                      <span className="font-medium text-fg">{CONFIG.CURRENCY_SYMBOL}{e.amount.toLocaleString()}</span>
                    </li>
                  );
                })
              }
            </ul>
          </div>
        )
      }

      {/* Settlements list */}
      {
        settlements.length > 0 && (
          <div className="flex flex-col gap-1">
            <h3 className="text-xs font-medium text-fg-muted uppercase tracking-wide">Settlements</h3>
            <ul className="flex flex-col gap-1">
              {
                settlements.map((e) => (
                  <li key={e.id} className="flex justify-between rounded-lg border border-line bg-surface-card px-3 py-2 text-sm">
                    <span className="text-fg">{e.date}</span>
                    <span className="font-medium text-accent">{CONFIG.CURRENCY_SYMBOL}{e.amount.toLocaleString()}</span>
                  </li>
                ))
              }
            </ul>
          </div>
        )
      }
    </div>
  );
}

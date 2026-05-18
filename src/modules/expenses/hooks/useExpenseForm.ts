import { useState, useCallback } from 'react';

import type { Expense, ExpenseMeta } from '@/modules/expenses/types';
import { PaymentMethod } from '@/shared/types';
import { todayStr } from '@/shared/utils/date';

/** Optional initial values for an expense form. */
export interface UseExpenseFormProps {
  initialDate?: string;
  initialAmount?: string;
  initialNote?: string;
  initialMeta?: ExpenseMeta;
  /** Default: PaymentMethod.UpiBankAccount. Pass null to start with no method selected. */
  initialPaymentMethod?: PaymentMethod | null;
}

/** Single source of truth for an expense form's local state. Shared by AddExpense + AutoTab. */
export function useExpenseForm(props: UseExpenseFormProps = {}) {
  const initDate = props.initialDate ?? todayStr();
  // When key is absent → default UPI. Explicit `undefined` also → UPI. Explicit `null` → none selected.
  const initPM: PaymentMethod | null =
    props.initialPaymentMethod !== undefined
      ? props.initialPaymentMethod
      : PaymentMethod.UpiBankAccount;

  const [date, setDate] = useState(initDate);
  const [amount, setAmount] = useState(props.initialAmount ?? '');
  const [note, setNote] = useState(props.initialNote ?? '');
  const [meta, setMeta] = useState<ExpenseMeta | undefined>(props.initialMeta);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(initPM);

  /** Reset all form fields back to their initial values */
  const reset = useCallback(() => {
    setDate(initDate);
    setAmount('');
    setNote('');
    setMeta(props.initialMeta);
    setPaymentMethod(initPM);
  }, [initDate, initPM, props.initialMeta]);

  /** Populate form fields from an existing expense for tap-to-edit */
  const populate = useCallback((e: Expense) => {
    setDate(e.date);
    setAmount(String(e.amount));
    setNote(e.note ?? '');
    setMeta(e.meta);
    setPaymentMethod(e.paymentMethod ?? PaymentMethod.UpiBankAccount);
  }, []);

  return {
    date,
    setDate,
    amount,
    setAmount,
    note,
    setNote,
    meta,
    setMeta,
    paymentMethod,
    setPaymentMethod,
    reset,
    populate,
  };
}

import { CATEGORIES } from '@/modules/expenses/categories';
import type { Result } from '@/shared/types';
import { err, ok, ExpenseCategory, IncomeSource } from '@/shared/types';
import type { ExpenseMeta } from '@/modules/expenses/types';
import { DATE_RE } from '@/shared/utils/regex';
import { ValidationMsg } from '@/constants/messages';

/** Validates expense input fields and optional meta, returning a Result */
export function validateExpense(input: {
  date: string;
  category: ExpenseCategory;
  amount: number;
  meta?: ExpenseMeta;
}): Result<void> {
  if (!input.date) {
    return err(ValidationMsg.DateRequired);
  }

  if (!DATE_RE.test(input.date)) {
    return err(ValidationMsg.DateFormat);
  }

  if (!CATEGORIES[input.category]) {
    return err(ValidationMsg.UnknownCategory);
  }

  if (input.amount <= 0) {
    return err(ValidationMsg.AmountPositive);
  }

  if (input.meta) {
    const metaResult = validateMeta(input.meta);
    if (!metaResult.ok) return metaResult;
  }

  return ok(undefined);
}

/** Validates the discriminated meta union */
function validateMeta(meta: ExpenseMeta): Result<void> {
  switch (meta.type) {
    case 'fuel':
      if (meta.liters <= 0) return err(ValidationMsg.FuelLitersPositive);
      if (meta.pricePerLiter <= 0) return err(ValidationMsg.FuelPricePerLiterPositive);
      return ok(undefined);
    case 'travel':
      if (!meta.origin.trim()) return err(ValidationMsg.TravelOriginRequired);
      if (!meta.destination.trim()) return err(ValidationMsg.TravelDestinationRequired);
      return ok(undefined);
    case 'maintenance':
      if (meta.odometer <= 0) return err(ValidationMsg.MaintenanceOdometerPositive);
      return ok(undefined);
    default:
      return err(ValidationMsg.UnknownMetaType);
  }
}

/** Validates income input fields and returns a Result indicating success or the first error */
export function validateIncome(input: {
  date: string;
  source: IncomeSource;
  amount: number;
}): Result<void> {
  if (!input.date) {
    return err(ValidationMsg.DateRequired);
  }

  if (!DATE_RE.test(input.date)) {
    return err(ValidationMsg.DateFormat);
  }

  const validSources = Object.values(IncomeSource).filter(
    (v): v is number => typeof v === 'number',
  );
  if (!validSources.includes(input.source)) {
    return err(ValidationMsg.UnknownIncomeSource);
  }

  if (input.amount <= 0) {
    return err(ValidationMsg.AmountPositive);
  }

  return ok(undefined);
}

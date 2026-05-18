import { CATEGORIES } from '@/modules/expenses/categories';
import type { Result } from '@/shared/types';
import { err, ok, ExpenseCategory, IncomeSource } from '@/shared/types';
import type { ExpenseMeta } from '@/modules/expenses/types';
import { ExpenseMetaType } from '@/modules/expenses/types';
import { DATE_RE } from '@/shared/utils/regex';
import { ValidationMsg } from '@/constants/messages';
import { isValidNumber } from '@/shared/utils/validation';
import { assertNever } from '@/shared/utils/types';

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
    case ExpenseMetaType.Fuel:
      if (!isValidNumber(meta.liters)) return err(ValidationMsg.FuelLitersInvalid);
      if (!isValidNumber(meta.pricePerLiter)) return err(ValidationMsg.FuelPriceInvalid);
      if (meta.odometer != null && !isValidNumber(meta.odometer))
        return err(ValidationMsg.OdometerInvalid);
      if (meta.tripOdo != null && !isValidNumber(meta.tripOdo))
        return err(ValidationMsg.TripOdoInvalid);
      return ok(undefined);
    case ExpenseMetaType.Travel:
      if (!meta.origin.trim()) return err(ValidationMsg.TravelOriginRequired);
      if (!meta.destination.trim()) return err(ValidationMsg.TravelDestinationRequired);
      if (meta.distance != null && !isValidNumber(meta.distance))
        return err(ValidationMsg.TravelDistanceInvalid);
      return ok(undefined);
    case ExpenseMetaType.Maintenance:
      if (!isValidNumber(meta.odometer)) return err(ValidationMsg.OdometerInvalid);
      if (meta.nextService != null && !isValidNumber(meta.nextService))
        return err(ValidationMsg.NextServiceInvalid);
      return ok(undefined);
    default:
      return assertNever(meta);
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

  const validSources = Object.values(IncomeSource);
  if (!validSources.includes(input.source)) {
    return err(ValidationMsg.UnknownIncomeSource);
  }

  if (input.amount <= 0) {
    return err(ValidationMsg.AmountPositive);
  }

  return ok(undefined);
}

import { CATEGORIES } from '@/modules/expenses/categories';
import type { Result } from '@/shared/types';
import { err, ok, ExpenseCategory, IncomeSource } from '@/shared/types';
import { DATE_RE } from '@/shared/utils/regex';
import { ValidationMsg } from '@/constants/messages';

/** Validates expense input fields and returns a Result indicating success or the first error */
export function validateExpense(input: {
  date: string;
  category: ExpenseCategory;
  amount: number;
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

  return ok(undefined);
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

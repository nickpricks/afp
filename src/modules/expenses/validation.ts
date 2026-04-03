import { CATEGORIES } from '@/modules/expenses/categories';
import type { Result } from '@/shared/types';
import { err, ok } from '@/shared/types';
import { DATE_RE } from '@/shared/utils/regex';
import { ValidationMsg } from '@/constants/messages';

/** Validates expense input fields and returns a Result indicating success or the first error */
export function validateExpense(input: {
  date: string;
  category: string;
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

import { FEED_TYPES, SLEEP_TYPES, SLEEP_QUALITIES, DIAPER_TYPES } from '@/modules/baby/constants';
import type { Result } from '@/shared/types';
import { err, ok } from '@/shared/types';
import { DATE_RE } from '@/shared/utils/regex';

/** Validates feed entry input */
export function validateFeedEntry(input: {
  date: string;
  type: string;
}): Result<void> {
  if (!input.date || !DATE_RE.test(input.date)) {
    return err('Valid date is required');
  }
  if (!(FEED_TYPES as readonly string[]).includes(input.type)) {
    return err('Invalid feed type');
  }
  return ok(undefined);
}

/** Validates sleep entry input */
export function validateSleepEntry(input: {
  date: string;
  type: string;
  quality: string;
}): Result<void> {
  if (!input.date || !DATE_RE.test(input.date)) {
    return err('Valid date is required');
  }
  if (!(SLEEP_TYPES as readonly string[]).includes(input.type)) {
    return err('Invalid sleep type');
  }
  if (input.quality && !(SLEEP_QUALITIES as readonly string[]).includes(input.quality)) {
    return err('Invalid sleep quality');
  }
  return ok(undefined);
}

/** Validates growth entry input */
export function validateGrowthEntry(input: {
  date: string;
  weight: number;
}): Result<void> {
  if (!input.date || !DATE_RE.test(input.date)) {
    return err('Valid date is required');
  }
  if (input.weight <= 0) {
    return err('Weight must be positive');
  }
  return ok(undefined);
}

/** Validates diaper entry input */
export function validateDiaperEntry(input: {
  date: string;
  type: string;
}): Result<void> {
  if (!input.date || !DATE_RE.test(input.date)) {
    return err('Valid date is required');
  }
  if (!(DIAPER_TYPES as readonly string[]).includes(input.type)) {
    return err('Invalid diaper type');
  }
  return ok(undefined);
}

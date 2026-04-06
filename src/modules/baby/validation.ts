import { FeedType, SleepType, SleepQuality, DiaperType } from '@/modules/baby/types';
import type { Result } from '@/shared/types';
import { err, ok } from '@/shared/types';
import { DATE_RE } from '@/shared/utils/regex';

/** Validates feed entry input */
export function validateFeedEntry(input: {
  date: string;
  type: FeedType;
}): Result<void> {
  if (!input.date || !DATE_RE.test(input.date)) {
    return err('Valid date is required');
  }
  if (!(input.type in FeedType)) {
    return err('Invalid feed type');
  }
  return ok(undefined);
}

/** Validates sleep entry input */
export function validateSleepEntry(input: {
  date: string;
  type: SleepType;
  quality: SleepQuality | null;
}): Result<void> {
  if (!input.date || !DATE_RE.test(input.date)) {
    return err('Valid date is required');
  }
  if (!(input.type in SleepType)) {
    return err('Invalid sleep type');
  }
  if (input.quality !== null && !(input.quality in SleepQuality)) {
    return err('Invalid sleep quality');
  }
  return ok(undefined);
}

/** Validates growth entry input */
export function validateGrowthEntry(input: {
  date: string;
  weight: number | null;
}): Result<void> {
  if (!input.date || !DATE_RE.test(input.date)) {
    return err('Valid date is required');
  }
  if (input.weight !== null && input.weight <= 0) {
    return err('Weight must be positive');
  }
  return ok(undefined);
}

/** Validates diaper entry input */
export function validateDiaperEntry(input: {
  date: string;
  type: DiaperType;
}): Result<void> {
  if (!input.date || !DATE_RE.test(input.date)) {
    return err('Valid date is required');
  }
  if (!(input.type in DiaperType)) {
    return err('Invalid diaper type');
  }
  return ok(undefined);
}

/** Validates child input for add/update operations */
export function validateChild(input: {
  name: string;
  dob: string;
}): Result<void> {
  if (!input.name || input.name.trim().length === 0) {
    return err('Name is required');
  }
  if (!input.dob || !DATE_RE.test(input.dob)) {
    return err('Valid date of birth is required');
  }
  return ok(undefined);
}

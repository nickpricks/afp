import { CONFIG } from '@/constants/config';

/** Matches a YYYY-MM-DD date string */
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Matches a valid invite code (lowercase alphanumeric, configured length) */
export const INVITE_CODE_RE = new RegExp(`^[a-z0-9]{${CONFIG.INVITE_CODE_LENGTH}}$`);

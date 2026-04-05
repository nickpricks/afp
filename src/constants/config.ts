import { ThemeId } from '@/themes/themes';

/** App-wide configuration constants */
export const CONFIG = {
  APP_NAME: 'It Started On April Fools Day',
  SHORT_NAME: 'AFP',
  VERSION: import.meta.env.VITE_APP_VERSION ?? '0.1.0',
  DEFAULT_THEME: ThemeId.FamilyBlue,
  CURRENCY_SYMBOL: '\u20B9',
  METERS_PER_FLOOR: 3,
  INVITE_CODE_LENGTH: 12,
  INVITE_CODE_CHARSET: 'abcdefghijklmnopqrstuvwxyz0123456789',
  DEV_INVITES_KEY: 'afp:dev:invites',
} as const;

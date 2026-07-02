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
  /** Meters per kilometer — used for m↔km unit conversion */
  METERS_PER_KM: 1000,
  /** Undo delete toast duration in ms */
  UNDO_DURATION_MS: 10000 as number,
  /** Default daily score goal for the progress ring */
  DAILY_SCORE_GOAL: 50 as number,
  /** Number of categories visible in the budget form when collapsed */
  BUDGET_VISIBLE_CATEGORIES: 7 as number,
  /** Mobile breakpoint in px. Matches Tailwind's `sm:` breakpoint. Used by viewport-aware
   * hooks (`useViewportSizeMultiplier`) and any future feature that conditions on small screens. */
  MOBILE_BREAKPOINT_PX: 640 as number,
  /** Timing constants for transient UI feedback. Hoisted from inline `setTimeout` literals so
   * a duration tweak is one-line; named so a reviewer can tell at a glance which surface owns it. */
  TIMINGS: {
    /** Minimum hold time on the loading screen so the splash isn't a flash on fast networks */
    MIN_LOADING_DELAY_MS: 1000 as number,
    /** "Copied!" feedback duration for clipboard buttons (DevBench, ConsoleViewer) */
    COPY_FEEDBACK_MS: 2000 as number,
    /** DevBench bulk-action flash duration (the green "Generated!" pill) */
    FLASH_DURATION_MS: 2000 as number,
    /** DevBench theme tour interval — auto-advances through themes for visual review */
    THEME_TOUR_INTERVAL_MS: 3000 as number,
    /** Post-redeem redirect delay so the user sees the success toast before navigation */
    INVITE_REDIRECT_MS: 2000 as number,
  },
  /** Available page-size options for the universal list controls */
  LIST_PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100, 500] as const,
  /** Default page size for all lists (useListControls) — must be one of LIST_PAGE_SIZE_OPTIONS */
  LIST_DEFAULT_PAGE_SIZE: 5 as number,
} as const;

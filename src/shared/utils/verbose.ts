const STORAGE_KEY = 'afp-verbose-logs';

/** Check if verbose logging is enabled */
export const isVerbose = (): boolean =>
  localStorage.getItem(STORAGE_KEY) === 'true';

/** Toggle verbose logging */
export const setVerbose = (on: boolean): void =>
  localStorage.setItem(STORAGE_KEY, String(on));

/** Log only when verbose mode is enabled */
export const vlog = (prefix: string, ...args: unknown[]): void => {
  if (isVerbose()) console.info(prefix, ...args);
};

/** Warn only when verbose mode is enabled */
export const vwarn = (prefix: string, ...args: unknown[]): void => {
  if (isVerbose()) console.warn(prefix, ...args);
};

/** Always log errors (but add prefix for consistency) */
export const verr = (prefix: string, ...args: unknown[]): void => {
  console.error(prefix, ...args);
};

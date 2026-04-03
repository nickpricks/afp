/** Extracts a message string from an unknown error value */
export const toErrorMessage = (e: unknown): string => {
  return e instanceof Error ? e.message : String(e);
};

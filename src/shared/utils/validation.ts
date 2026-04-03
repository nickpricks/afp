/** Returns true if the value is a finite number greater than zero */
export const isValidNumber = (value: number): boolean => {
  return Number.isFinite(value) && value > 0;
};

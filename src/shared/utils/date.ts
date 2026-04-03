/** Returns today's local date as YYYY-MM-DD */
export const todayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Returns the current time as HH:MM */
export const nowTime = (): string => {
  return new Date().toTimeString().slice(0, 5);
};

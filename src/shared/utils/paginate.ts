/** Returns the slice of items for the given 1-indexed page and pageSize */
export const paginate = <T>(items: T[], page: number, pageSize: number): T[] => {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
};

/** Returns the total number of pages, minimum 1 (for empty lists) */
export const totalPages = (totalItems: number, pageSize: number): number => {
  if (totalItems === 0) return 1;
  return Math.ceil(totalItems / pageSize);
};

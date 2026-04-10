/** Sorts by a string field, newest first (lexicographic descending) */
export function sortNewestFirst<T>(items: T[], getKey: (item: T) => string): T[] {
  return [...items].sort((a, b) => getKey(b).localeCompare(getKey(a)));
}

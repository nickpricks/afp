import { describe, expect, it } from 'vitest';

import { paginate, totalPages } from '../paginate';

describe('paginate', () => {
  const items = Array.from({ length: 87 }, (_, i) => ({ id: i }));

  it('returns first pageSize items on page 1', () => {
    const result = paginate(items, 1, 25);
    expect(result).toHaveLength(25);
    expect(result[0]!.id).toBe(0);
    expect(result[24]!.id).toBe(24);
  });

  it('returns next pageSize items on page 2', () => {
    const result = paginate(items, 2, 25);
    expect(result).toHaveLength(25);
    expect(result[0]!.id).toBe(25);
  });

  it('returns partial last page', () => {
    const result = paginate(items, 4, 25);
    expect(result).toHaveLength(12);
    expect(result[0]!.id).toBe(75);
  });

  it('returns empty when page exceeds total', () => {
    expect(paginate(items, 10, 25)).toEqual([]);
  });

  it('returns all items when pageSize >= total', () => {
    expect(paginate(items, 1, 100)).toHaveLength(87);
  });
});

describe('totalPages', () => {
  it('rounds up partial pages', () => {
    expect(totalPages(87, 25)).toBe(4);
  });

  it('handles exact multiples', () => {
    expect(totalPages(50, 25)).toBe(2);
  });

  it('returns 1 for empty list (no zero pages)', () => {
    expect(totalPages(0, 25)).toBe(1);
  });
});

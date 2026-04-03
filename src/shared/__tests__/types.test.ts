import { describe, expect, it } from 'vitest';

import { err, isErr, isOk, ok } from '@/shared/types';

describe('Result helpers', () => {
  describe('ok()', () => {
    it('creates a success result with the given data', () => {
      const result = ok(42);

      expect(result).toEqual({ ok: true, data: 42 });
    });

    it('works with undefined for void results', () => {
      const result = ok(undefined);

      expect(result).toEqual({ ok: true, data: undefined });
    });
  });

  describe('err()', () => {
    it('creates a failure result with the given error message', () => {
      const result = err('something went wrong');

      expect(result).toEqual({ ok: false, error: 'something went wrong' });
    });
  });

  describe('isOk()', () => {
    it('returns true for success results', () => {
      expect(isOk(ok('hello'))).toBe(true);
    });

    it('returns false for failure results', () => {
      expect(isOk(err('fail'))).toBe(false);
    });
  });

  describe('isErr()', () => {
    it('returns true for failure results', () => {
      expect(isErr(err('fail'))).toBe(true);
    });

    it('returns false for success results', () => {
      expect(isErr(ok('hello'))).toBe(false);
    });
  });
});

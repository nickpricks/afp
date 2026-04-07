import { describe, expect, it } from 'vitest';

import { isValidUsername } from '@/shared/auth/username';

describe('isValidUsername', () => {
  it('accepts a valid alphanumeric username', () => {
    expect(isValidUsername('nick123')).toBe(true);
  });

  it('accepts underscores', () => {
    expect(isValidUsername('the_admin_nick')).toBe(true);
  });

  it('accepts a 3-character username (minimum)', () => {
    expect(isValidUsername('abc')).toBe(true);
  });

  it('accepts a 20-character username (maximum)', () => {
    expect(isValidUsername('a'.repeat(20))).toBe(true);
  });

  it('rejects a username shorter than 3 characters', () => {
    expect(isValidUsername('ab')).toBe(false);
  });

  it('rejects a username longer than 20 characters', () => {
    expect(isValidUsername('a'.repeat(21))).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidUsername('')).toBe(false);
  });

  it('rejects a username with spaces', () => {
    expect(isValidUsername('has space')).toBe(false);
  });

  it('rejects a username with special characters', () => {
    expect(isValidUsername('user@name')).toBe(false);
  });

  it('rejects a username with hyphens', () => {
    expect(isValidUsername('user-name')).toBe(false);
  });

  it('accepts mixed case', () => {
    expect(isValidUsername('NickName')).toBe(true);
  });
});

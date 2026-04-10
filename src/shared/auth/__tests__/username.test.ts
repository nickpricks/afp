import { describe, expect, it, beforeEach } from 'vitest';

import { isValidUsername, isUsernameAvailable, claimUsername, releaseUsername } from '@/shared/auth/username';
import { isOk, isErr } from '@/shared/types';

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

describe('username claim/release (dev mode — localStorage)', () => {
  beforeEach(() => {
    // Clear any leftover username keys
    Object.keys(localStorage)
      .filter((k) => k.startsWith('afp:usernames:'))
      .forEach((k) => localStorage.removeItem(k));
  });

  it('unclaimed username is available', async () => {
    expect(await isUsernameAvailable('fresh_name')).toBe(true);
  });

  it('claiming a username makes it unavailable', async () => {
    const result = await claimUsername('nick123', 'uid-a');
    expect(isOk(result)).toBe(true);
    expect(await isUsernameAvailable('nick123')).toBe(false);
  });

  it('same user can re-claim their own username', async () => {
    await claimUsername('nick123', 'uid-a');
    const result = await claimUsername('nick123', 'uid-a');
    expect(isOk(result)).toBe(true);
  });

  it('different user cannot claim a taken username', async () => {
    await claimUsername('nick123', 'uid-a');
    const result = await claimUsername('nick123', 'uid-b');
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error).toContain('already taken');
    }
  });

  it('username lookup is case-insensitive', async () => {
    await claimUsername('NickName', 'uid-a');
    expect(await isUsernameAvailable('nickname')).toBe(false);
    expect(await isUsernameAvailable('NICKNAME')).toBe(false);
  });

  it('releasing a username makes it available again', async () => {
    await claimUsername('nick123', 'uid-a');
    const result = await releaseUsername('nick123', 'uid-a');
    expect(isOk(result)).toBe(true);
    expect(await isUsernameAvailable('nick123')).toBe(true);
  });

  it('releasing someone else\'s username does nothing', async () => {
    await claimUsername('nick123', 'uid-a');
    await releaseUsername('nick123', 'uid-b');
    // Still taken by uid-a
    expect(await isUsernameAvailable('nick123')).toBe(false);
  });
});

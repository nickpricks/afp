import { describe, expect, it } from 'vitest';

import { generateInviteCode, isValidInviteCode } from '@/shared/auth/invite';

describe('generateInviteCode', () => {
  it('returns a 12-character lowercase alphanumeric string', () => {
    const code = generateInviteCode();
    expect(code).toMatch(/^[a-z0-9]{12}$/);
  });

  it('generates unique codes across 100 invocations', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateInviteCode()));
    expect(codes.size).toBe(100);
  });
});

describe('isValidInviteCode', () => {
  it('accepts a valid 12-char lowercase alphanumeric code', () => {
    expect(isValidInviteCode('abc123def456')).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(isValidInviteCode('')).toBe(false);
  });

  it('rejects a code that is too short', () => {
    expect(isValidInviteCode('abc123')).toBe(false);
  });

  it('rejects a code that is too long', () => {
    expect(isValidInviteCode('abc123def4567')).toBe(false);
  });

  it('rejects a code with uppercase letters', () => {
    expect(isValidInviteCode('ABC123def456')).toBe(false);
  });

  it('rejects a code with special characters', () => {
    expect(isValidInviteCode('abc-123!ef45')).toBe(false);
  });
});

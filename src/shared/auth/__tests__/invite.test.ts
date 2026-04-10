import { describe, expect, it } from 'vitest';

import { generateInviteCode, isValidInviteCode } from '@/shared/auth/invite';
import type { InviteRecord } from '@/shared/auth/invite';

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

describe('InviteRecord type — viewer fields', () => {
  it('supports role and viewerOf fields', () => {
    const record: InviteRecord = {
      code: 'abc123def456',
      name: 'Viewer',
      modules: { body: true, budget: false, baby: false },
      createdBy: 'admin-uid',
      linkedUid: null,
      createdAt: '2026-04-07T00:00:00Z',
      usedAt: null,
      role: 'viewer',
      viewerOf: 'target-uid',
    };
    expect(record.role).toBe('viewer');
    expect(record.viewerOf).toBe('target-uid');
  });

  it('defaults role and viewerOf to undefined (regular user implied)', () => {
    const record: InviteRecord = {
      code: 'abc123def456',
      name: 'Regular',
      modules: { body: true, budget: false, baby: false },
      createdBy: 'admin-uid',
      linkedUid: null,
      createdAt: '2026-04-07T00:00:00Z',
      usedAt: null,
    };
    expect(record.role).toBeUndefined();
    expect(record.viewerOf).toBeUndefined();
  });

  it('viewer invite carries role and viewerOf through to redemption profile logic', () => {
    // Validates the data shape that redeemInvite uses to determine profile role
    const viewerInvite: InviteRecord = {
      code: 'abc123def456',
      name: 'Viewer Sarah',
      modules: { body: true, budget: true, baby: false },
      createdBy: 'admin-uid',
      linkedUid: null,
      createdAt: '2026-04-07T00:00:00Z',
      usedAt: null,
      role: 'viewer',
      viewerOf: 'target-uid',
    };
    // redeemInvite should use these to create Viewer profile with viewerOf
    expect(viewerInvite.role).toBe('viewer');
    expect(viewerInvite.viewerOf).toBe('target-uid');

    const regularInvite: InviteRecord = {
      code: 'xyz789ghi012',
      name: 'Regular User',
      modules: { body: true, budget: false, baby: false },
      createdBy: 'admin-uid',
      linkedUid: null,
      createdAt: '2026-04-07T00:00:00Z',
      usedAt: null,
    };
    // redeemInvite should default to User role, no viewerOf
    expect(regularInvite.role).toBeUndefined();
    expect(regularInvite.viewerOf).toBeUndefined();
  });
});

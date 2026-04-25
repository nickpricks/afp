import { describe, it, expect, vi } from 'vitest';

import { computeGreeting, formatDayDate } from '@/shared/utils/date';
import { createDefaultProfile } from '@/shared/utils/profile';
import { isValidNumber } from '@/shared/utils/validation';
import { toErrorMessage } from '@/shared/utils/error';
import { UserRole } from '@/shared/types';

describe('computeGreeting', () => {
  it('returns Good morning for hour 8', () => {
    vi.setSystemTime(new Date(2026, 3, 7, 8, 0));
    expect(computeGreeting()).toBe('Good morning');
    vi.useRealTimers();
  });

  it('returns Good afternoon for hour 14', () => {
    vi.setSystemTime(new Date(2026, 3, 7, 14, 0));
    expect(computeGreeting()).toBe('Good afternoon');
    vi.useRealTimers();
  });

  it('returns Good evening for hour 19', () => {
    vi.setSystemTime(new Date(2026, 3, 7, 19, 0));
    expect(computeGreeting()).toBe('Good evening');
    vi.useRealTimers();
  });
});

describe('formatDayDate', () => {
  it('formats date as weekday, month day', () => {
    expect(formatDayDate('2026-04-07')).toMatch(/Tuesday/);
    expect(formatDayDate('2026-04-07')).toMatch(/April/);
  });
});

describe('createDefaultProfile', () => {
  it('creates a profile with name and role', () => {
    const profile = createDefaultProfile('Alice', UserRole.User);
    expect(profile.name).toBe('Alice');
    expect(profile.role).toBe(UserRole.User);
  });

  it('defaults modules to all disabled', () => {
    const profile = createDefaultProfile('Bob', UserRole.User);
    expect(profile.modules.body).toBe(false);
    expect(profile.modules.budget).toBe(false);
    expect(profile.modules.baby).toBe(false);
  });

  it('sets null for optional fields', () => {
    const profile = createDefaultProfile('Eve', UserRole.Viewer);
    expect(profile.email).toBeNull();
    expect(profile.username).toBeNull();
    expect(profile.viewerOf).toBeNull();
  });

  it('sets colorMode to system', () => {
    const profile = createDefaultProfile('Nick', UserRole.TheAdminNick);
    expect(profile.colorMode).toBe('system');
  });
});

describe('isValidNumber', () => {
  it('returns true for positive numbers', () => {
    expect(isValidNumber(1)).toBe(true);
    expect(isValidNumber(0.01)).toBe(true);
    expect(isValidNumber(99999)).toBe(true);
  });

  it('returns false for zero', () => {
    expect(isValidNumber(0)).toBe(false);
  });

  it('returns false for negative numbers', () => {
    expect(isValidNumber(-1)).toBe(false);
  });

  it('returns false for NaN and Infinity', () => {
    expect(isValidNumber(NaN)).toBe(false);
    expect(isValidNumber(Infinity)).toBe(false);
  });
});

describe('toErrorMessage', () => {
  it('extracts message from Error', () => {
    expect(toErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('converts non-Error to string', () => {
    expect(toErrorMessage('oops')).toBe('oops');
    expect(toErrorMessage(42)).toBe('42');
    expect(toErrorMessage(null)).toBe('null');
  });
});

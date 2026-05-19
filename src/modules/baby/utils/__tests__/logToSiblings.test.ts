import { describe, it, expect, vi, beforeEach } from 'vitest';

import { logToSiblings } from '@/modules/baby/utils/logToSiblings';
import { ok, err } from '@/shared/types';

const saveMock = vi.fn();
vi.mock('@/shared/storage/create-adapter', () => ({
  createAdapter: () => ({
    save: saveMock,
    getAll: vi.fn(),
    getById: vi.fn(),
    remove: vi.fn(),
    onSnapshot: vi.fn(),
  }),
}));

/** Verifies fan-out write results — all-ok and partial-failure paths */
describe('logToSiblings', () => {
  beforeEach(() => {
    saveMock.mockReset();
  });

  it('returns ok=N failed=0 when every sibling save succeeds', async () => {
    saveMock.mockResolvedValue(ok(undefined));
    const result = await logToSiblings('uid-1', ['sib-a', 'sib-b', 'sib-c'], 'feeds', {
      date: '2026-05-18',
    });
    expect(result).toEqual({ ok: 3, failed: 0 });
    expect(saveMock).toHaveBeenCalledTimes(3);
  });

  it('returns mixed counts when some siblings fail', async () => {
    saveMock
      .mockResolvedValueOnce(ok(undefined))
      .mockResolvedValueOnce(err('permission denied'))
      .mockResolvedValueOnce(ok(undefined));
    // Silence the expected console.error from the failure branch
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await logToSiblings('uid-1', ['sib-a', 'sib-b', 'sib-c'], 'feeds', {
      date: '2026-05-18',
    });
    expect(result).toEqual({ ok: 2, failed: 1 });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('returns ok=0 failed=0 for an empty sibling list', async () => {
    const result = await logToSiblings('uid-1', [], 'feeds', { date: '2026-05-18' });
    expect(result).toEqual({ ok: 0, failed: 0 });
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('generates a unique id for each sibling entry', async () => {
    saveMock.mockResolvedValue(ok(undefined));
    await logToSiblings('uid-1', ['sib-a', 'sib-b'], 'feeds', { date: '2026-05-18' });
    const idA = saveMock.mock.calls[0]![1].id;
    const idB = saveMock.mock.calls[1]![1].id;
    expect(idA).toBeTypeOf('string');
    expect(idB).toBeTypeOf('string');
    expect(idA).not.toEqual(idB);
  });
});

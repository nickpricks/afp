import { describe, it, expect, vi, beforeEach } from 'vitest';

import { logToSiblings } from '@/modules/baby/utils/logToSiblings';
import { ok, err } from '@/shared/types';

const mockSave = vi.fn();

vi.mock('@/shared/storage/create-adapter', () => ({
  createAdapter: () => ({
    getAll: vi.fn(),
    getById: vi.fn(),
    save: mockSave,
    remove: vi.fn(),
    onSnapshot: () => vi.fn(),
  }),
}));

beforeEach(() => {
  mockSave.mockClear();
});

/** Validates logToSiblings returns accurate ok/failed counts across full, partial, and zero-sibling cases */
describe('logToSiblings — partial failure', () => {
  it('returns { ok, failed } counts when all saves succeed', async () => {
    mockSave.mockResolvedValue(ok(undefined));
    const result = await logToSiblings('uid-1', ['sib-1', 'sib-2', 'sib-3'], 'feeds', {
      date: '2026-05-15',
      time: '08:00',
    });
    expect(result).toEqual({ ok: 3, failed: 0 });
  });

  it('returns { ok, failed } counts when all saves fail', async () => {
    mockSave.mockResolvedValue(err('Network error'));
    const result = await logToSiblings('uid-1', ['sib-1', 'sib-2'], 'feeds', {
      date: '2026-05-15',
    });
    expect(result).toEqual({ ok: 0, failed: 2 });
  });

  it('returns { ok: 1, failed: 2 } on partial failure (3 siblings, 2 fail)', async () => {
    mockSave
      .mockResolvedValueOnce(ok(undefined))
      .mockResolvedValueOnce(err('Timeout'))
      .mockResolvedValueOnce(err('Permission denied'));
    const result = await logToSiblings(
      'uid-1',
      ['sib-1', 'sib-2', 'sib-3'],
      'feeds',
      { date: '2026-05-15' },
    );
    expect(result).toEqual({ ok: 1, failed: 2 });
  });

  it('returns { ok: 0, failed: 0 } when there are no siblings', async () => {
    const result = await logToSiblings('uid-1', [], 'feeds', { date: '2026-05-15' });
    expect(result).toEqual({ ok: 0, failed: 0 });
    expect(mockSave).not.toHaveBeenCalled();
  });
});

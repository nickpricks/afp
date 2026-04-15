import { describe, it, expect } from 'vitest';

import { transformDiaperToElimination } from '../migration/elimination';
import { DiaperType, EliminationMode, type DiaperEntry } from '../types';

describe('transformDiaperToElimination', () => {
  it('converts a DiaperEntry to an EliminationEntry with mode=Diaper', () => {
    const diaper: DiaperEntry = {
      id: 'd1',
      date: '2026-04-01',
      time: '10:30',
      type: DiaperType.Wet,
      timestamp: '2026-04-01T10:30:00Z',
      createdAt: '2026-04-01T10:30:00Z',
      notes: 'morning change',
    };

    const result = transformDiaperToElimination(diaper);

    expect(result.mode).toBe(EliminationMode.Diaper);
    expect(result.diaperType).toBe(DiaperType.Wet);
    expect(result.pottyEvent).toBeUndefined();
    expect(result.id).toBe('d1');
    expect(result.notes).toBe('morning change');
  });

  it('preserves timestamps and datetime fields exactly', () => {
    const diaper: DiaperEntry = {
      id: 'd2',
      date: '2026-04-02',
      time: '14:00',
      type: DiaperType.Mixed,
      timestamp: '2026-04-02T14:00:00Z',
      createdAt: '2026-04-02T14:00:01Z',
      notes: '',
    };

    const result = transformDiaperToElimination(diaper);

    expect(result.timestamp).toBe('2026-04-02T14:00:00Z');
    expect(result.createdAt).toBe('2026-04-02T14:00:01Z');
    expect(result.date).toBe('2026-04-02');
    expect(result.time).toBe('14:00');
  });

  it('maps every DiaperType variant to the same diaperType', () => {
    const variants: DiaperType[] = [DiaperType.Wet, DiaperType.Dirty, DiaperType.Mixed];

    for (const variant of variants) {
      const diaper: DiaperEntry = {
        id: `d-${variant}`,
        date: '2026-04-03',
        time: '09:00',
        type: variant,
        timestamp: '2026-04-03T09:00:00Z',
        createdAt: '2026-04-03T09:00:00Z',
        notes: '',
      };
      const result = transformDiaperToElimination(diaper);
      expect(result.diaperType).toBe(variant);
      expect(result.mode).toBe(EliminationMode.Diaper);
    }
  });
});

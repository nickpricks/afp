import type { ExpenseMeta } from '@/modules/expenses/types';
import type { ExpenseCategory } from '@/shared/types';
import { ExpenseCategory as Cat } from '@/shared/types';

type MetaKind = 'fuel' | 'travel' | 'maintenance' | null;

/** Returns the meta kind appropriate for a (category, subCat) pair, or null if none applies */
export function metaKindFor(category: ExpenseCategory | null, subCat: string): MetaKind {
  if (category === Cat.Vehicle && subCat === 'Fuel') return 'fuel';
  if (category === Cat.Vehicle && subCat === 'Maintenance') return 'maintenance';
  if (category === Cat.Travel && subCat) return 'travel';
  return null;
}

/** Returns a default meta object for the given kind */
export function defaultMeta(kind: MetaKind): ExpenseMeta | undefined {
  if (kind === 'fuel') {
    return {
      type: 'fuel',
      liters: 0,
      pricePerLiter: 0,
      odometer: null,
      tripOdo: null,
      displayedMileage: null,
      fullTank: false,
    };
  }
  if (kind === 'travel') {
    return { type: 'travel', origin: '', destination: '', distance: null };
  }
  if (kind === 'maintenance') {
    return { type: 'maintenance', odometer: 0, nextService: null, serviceNotes: '' };
  }
  return undefined;
}

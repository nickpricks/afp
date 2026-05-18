import type { ExpenseMeta } from '@/modules/expenses/types';
import { ExpenseMetaType } from '@/modules/expenses/types';
import type { ExpenseCategory } from '@/shared/types';
import { ExpenseCategory as Cat } from '@/shared/types';
import { VEHICLE_SUBCAT, TRAVEL_SUBCAT } from '@/modules/expenses/categories';

/** Nullable meta type discriminant — null means no meta applicable */
type MetaKind = ExpenseMetaType | null;

/** Returns the meta kind appropriate for a (category, subCat) pair, or null if none applies */
export function metaKindFor(category: ExpenseCategory | null, subCat: string): MetaKind {
  if (category === Cat.Vehicle && subCat === VEHICLE_SUBCAT.Fuel) return ExpenseMetaType.Fuel;
  if (category === Cat.Vehicle && subCat === VEHICLE_SUBCAT.Maintenance) return ExpenseMetaType.Maintenance;
  if (category === Cat.Travel && subCat) return ExpenseMetaType.Travel;
  return null;
}

/** Returns the category and subcategory for a given meta kind (inverse of metaKindFor) */
export function subCatFor(kind: ExpenseMetaType): { category: ExpenseCategory; subCat: string } {
  if (kind === ExpenseMetaType.Fuel) return { category: Cat.Vehicle, subCat: VEHICLE_SUBCAT.Fuel };
  if (kind === ExpenseMetaType.Travel) return { category: Cat.Travel, subCat: TRAVEL_SUBCAT.CabAuto };
  return { category: Cat.Vehicle, subCat: VEHICLE_SUBCAT.Maintenance };
}

/** Returns a default meta object for the given kind */
export function defaultMeta(kind: MetaKind): ExpenseMeta | undefined {
  if (kind === ExpenseMetaType.Fuel) {
    return {
      type: ExpenseMetaType.Fuel,
      liters: 0,
      pricePerLiter: 0,
      odometer: null,
      tripOdo: null,
      displayedMileage: null,
      fullTank: false,
    };
  }
  if (kind === ExpenseMetaType.Travel) {
    return { type: ExpenseMetaType.Travel, origin: '', destination: '', distance: null };
  }
  if (kind === ExpenseMetaType.Maintenance) {
    return { type: ExpenseMetaType.Maintenance, odometer: 0, nextService: null, serviceNotes: '' };
  }
  return undefined;
}

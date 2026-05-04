# Fuel, Travel & Maintenance (Auto Tab) Design

**Date:** 2026-05-04
**Status:** Approved
**Branch:** `feat/who-planned-it` (or successor)
**Supersedes:** `FUEL_EXPENSE_METADATA.md` (2026-05-02 draft)

## Overview

Specialized tracking for vehicle fuel, trips, and maintenance inside the Budget module. Adds a discriminated `meta` union to the `Expense` type for Vehicle/Travel categories, a filtered "Auto" tab with quick-add buttons, and a derived service-due banner. No new top-level collection — everything piggybacks on the existing `expenses` subcollection.

## Goals

1. Capture fuel-economy data (liters, prices, odometers, dashboard mileage) at fill time, with low friction.
2. Capture origin/destination/distance for trip expenses (Travel category).
3. Capture maintenance odometer + next-service ODO for service-due tracking.
4. Keep the model **non-disruptive**: existing expenses without `meta` continue to work.
5. Honor existing UX conventions — tap-to-populate edit, save-and-stay, universal list ledger.

## Non-Goals (v1)

- No standalone fuel/vehicle module — all data lives under Budget.
- No multi-vehicle support. Single vehicle assumed; multi-vehicle is a Phase-2 candidate.
- No charts, mileage trends, or rolling averages in v1 (Phase-2 candidate).
- No notifications hook — service-due is a banner only, not a self-ping.
- No structured operator/airline/cab-aggregator tracking (`mode` field intentionally dropped).

## Data Model

### Expense extension

```typescript
type Expense = {
  // ...existing fields (id, date, category, subCat, amount, paymentMethod, ...)
  meta?: ExpenseMeta;
};

type ExpenseMeta = FuelMeta | TravelMeta | MaintenanceMeta;

type FuelMeta = {
  type: 'fuel';
  liters: number;                  // required
  pricePerLiter: number;           // required (auto-derivable from amount/liters)
  odometer: number | null;         // optional — total/actual ODO at fill
  tripOdo: number | null;          // optional — distance since last fill
  displayedMileage: number | null; // optional — dashboard's km/L reading at fill
  fullTank: boolean;               // defaults false
};

type TravelMeta = {
  type: 'travel';
  origin: string;          // required
  destination: string;     // required
  distance: number | null; // optional — km
};

type MaintenanceMeta = {
  type: 'maintenance';
  odometer: number;                // required
  nextService: number | null;      // optional — ODO at which next service is due
  serviceNotes: string;            // optional, defaults ''
};
```

### When `meta` is set

- `category=Vehicle, subCat=Fuel` → `meta.type='fuel'`
- `category=Vehicle, subCat=Maintenance` → `meta.type='maintenance'`
- `category=Travel, subCat ∈ {Air,Train,Bus,Cab/Auto,Road Toll}` → `meta.type='travel'`
- All other (category, subCat) pairs: `meta` is `undefined`. No schema change visible to them.

### Backwards compatibility

- Existing Vehicle/Travel expenses pre-migration have `meta = undefined`.
- They continue to render in expense lists. In the Auto tab they show as rows with an `incomplete` pill — tapping them populates the form, where the user can fill the meta sub-form to upgrade in place.
- No data migration script. Read-side coalescing only.

## Validation

Loose-but-anchored. The required fields are the ones that anchor data to the timeline or feed core math; everything else is enrichment.

| Meta type   | Required                                  | Optional                                              |
| ----------- | ----------------------------------------- | ----------------------------------------------------- |
| fuel        | `liters`, `pricePerLiter`                 | `odometer`, `tripOdo`, `displayedMileage`, `fullTank` |
| travel      | `origin`, `destination`                   | `distance`                                            |
| maintenance | `odometer`                                | `nextService`, `serviceNotes`                         |

### Two-of-three input math (fuel)

Fuel form lets the user enter any two of `{ liters, pricePerLiter, amount }`; the third auto-fills:
- enter `liters + pricePerLiter` → `amount = liters × pricePerLiter`
- enter `liters + amount` → `pricePerLiter = amount / liters`
- enter `pricePerLiter + amount` → `liters = amount / pricePerLiter`

If all three are present, the last-edited field wins on save (no consistency error toast — silent reconciliation, since pump-receipt rounding makes strict equality unrealistic).

## Entry Flows (two-way)

### Path 1 — main expense form
1. User opens main `AddExpense` form.
2. Picks `category=Vehicle` and `subCat=Fuel` (or Maintenance, or any Travel subCat).
3. Form **conditionally renders the meta sub-section inline** below the standard fields.
4. User fills required + optional fields; saves.
5. Toast confirms; form clears; user stays on `AddExpense` page (no redirect — matches AFP "save-and-stay" convention).

### Path 2 — Auto tab quick-add
1. User opens Budget → Auto tab.
2. Three quick-action buttons at the top: **⛽ Add Fuel**, **🚕 Add Trip**, **🔧 Service**.
3. Tapping a button pre-fills `category`, `subCat`, and `meta.type` and reveals the same form (inline on the Auto tab).
4. User fills + saves; entry appears in the list below; user stays on the Auto tab.

Both paths produce the exact same `Expense` shape via the same `useExpenses().log()` call.

## UI

### Auto tab placement

Budget module gains a third tab alongside the existing Expenses + Income tabs:

```
[ Expenses ]  [ Income ]  [ Auto ]
```

`AppPath` enum gains a Budget-Auto route (or sub-route under `/budget`); `useListControls()` powers the Auto-tab list independently from the main Expenses tab.

### Auto-tab layout (top → bottom)

1. **Service-due banner** (conditional). Shown when `latestVehicleOdometer >= mostRecentMaintenanceWithNextService.nextService`. Yellow warning style. Text: *"Service due — last logged at X km, due at Y km"*. Dismissible: tapping the `×` hides the banner for the current page-view only (in-memory state). It returns on next navigation to the Auto tab. Banner clears permanently when a new maintenance entry is logged with a future-pointing `nextService`, because the derivation reads from the *most recent* maintenance entry — see "Service completion" below.
2. **Quick-add row** — three buttons: ⛽ Add Fuel · 🚕 Add Trip · 🔧 Service.
3. **Inline form** — appears when a quick-add is tapped, or when a list row is tapped (tap-to-populate). Same form for Add and Edit; button text flips.
4. **List controls strip** — shared `<ListControls>` (time-range pills + page-size dropdown).
5. **List** — universal Daily Ledger pattern: `<DateGroupHeader>` sticky day-of-week dividers, `RowTime` time-prefix, hairline rows, swipe-to-delete + inline `×` + 10s undo toast per AFP convention.
6. **Show-more footer** — shared `<ListShowMoreFooter>`.

### Row badges

Each row shows a meta-derived inline badge alongside the standard amount/payment chips:

| Type        | Badge example                               |
| ----------- | ------------------------------------------- |
| fuel        | `⛽ 40L · ₹98/L · 12,300km`                 |
| travel      | `🚕 BLR → MAA · 8km` (omits km if missing)  |
| maintenance | `🔧 12,300km · next 22,000`                 |
| incomplete  | gray `incomplete` pill (no `meta` set yet)  |

### Form sub-section (Path 1 inline + Path 2 Auto-tab)

Conditionally rendered based on `(category, subCat)`. One sub-form per meta type.

- **Fuel:** liters, pricePerLiter, amount (any two), full-tank checkbox, optional collapsible "Vehicle data" panel containing odometer / tripOdo / displayedMileage.
- **Travel:** origin, destination, optional distance.
- **Maintenance:** odometer, optional nextService, optional serviceNotes textarea.

## Computed Values (no storage)

Lives in a new `src/modules/expenses/fuel-math.ts` module, mirroring the existing `budget-math.ts` pattern.

```typescript
/** Mileage per fill — only honest when fullTank=true (full-to-full). */
function computeMileage(meta: FuelMeta): number | null {
  if (!meta.fullTank) return null;
  if (!meta.tripOdo || !meta.liters) return null;
  return meta.tripOdo / meta.liters;
}

/** Latest vehicle odometer across fuel + maintenance entries. */
function latestOdometer(expenses: Expense[]): number | null { /* ... */ }

/** Most recent maintenance entry with a non-null nextService. */
function dueMaintenance(expenses: Expense[]): MaintenanceMeta | null { /* ... */ }
```

The Auto-tab service-due banner reads from `latestOdometer()` and `dueMaintenance()`; both are pure derivations over the expense list — no extra storage, no listeners.

### Service completion (no separate UI)

There is no dedicated "Mark service done" button. Workflow:

1. User services the car at, say, 22,500 km (banner says due at 22,000).
2. User opens Auto tab → 🔧 Service quick-add.
3. Logs a new Maintenance entry: `odometer=22,500`, `nextService=32,500` (or whatever the next interval is).
4. `mostRecentMaintenanceWithNextService` now points to this new entry; current odo (22,500) < 32,500; banner clears automatically.

The Maintenance form should gently hint at `nextService` (placeholder text *e.g. "32500"*, helper text *"clears the service-due banner once set"*), but does not require it. If the user forgets, the banner persists and points at the older entry — which is the correct behavior because they haven't actually committed to a next interval.

## Phase-2 Candidates (out of scope for v1)

- Rolling 5-fill average mileage + lifetime average, surfaced as Auto-tab summary stat cards.
- Mileage divergence panel (computed mileage vs `displayedMileage`).
- Multi-vehicle (vehicle picker on each fuel/maintenance entry).
- Notification on service-due via existing `useNotifications` infra.
- Operator/airline tracking for Travel (the dropped `mode` field, structured this time as a constrained list per subCat).
- Chart view: monthly fuel cost, distance/month, cost-per-km.

## Constraints & Conventions Honored

- **Tap-to-populate** edit, not inline-row edit (per `afp/CLAUDE.md` convention covering all 11 list surfaces).
- **Save-and-stay** entry, not redirect-after-save (per Body/Baby/current Budget pattern).
- **Universal list infrastructure** — `useListControls`, `<ListControls>`, `<DateGroupHeader>`, `<ListShowMoreFooter>`, `<RowTime>`, `sortNewestFirst()`, `filterByDateRange<T>()`, `paginate()`. No custom list code.
- **Toast strings** in `BudgetMsg` enum (additions: `FuelLogged`, `TripLogged`, `ServiceLogged`, etc.). No raw strings.
- **Result types** for any new async helpers.
- **Soft delete + 10s undo** via `useToast({ action })`.
- **Distance formatting** via `formatDistance()` (already shared in `utils/format.ts`).

## Open Questions / Risks

- **Numeric inputs on mobile.** Three linked numeric fields (liters/pricePerLiter/amount) need careful focus management to avoid keyboard thrash. Mitigation: implement as plain inputs with `inputMode="decimal"`; lock auto-derive to onBlur, not onChange.
- **Service-due banner false positives.** If user logs the service-completion expense but forgets to set `nextService` on the new maintenance entry, the banner keeps reading from the older entry and stays on. Mitigation: form helper text on the `nextService` field (*"clears the service-due banner once set"*). Acceptable v1 trade-off — simpler than a parallel "service done" workflow.
- **Auto-tab vs Income tab parity.** Budget grows from 2 tabs to 3. The tab-strip styling already accommodates this (Baby's `ChildDetail` has up to 9 tabs); no UI-system changes required.

## Files Touched (preview, finalized in implementation plan)

**New:**
- `src/modules/expenses/fuel-math.ts`
- `src/modules/expenses/components/AutoTab.tsx`
- `src/modules/expenses/components/MetaSubForm.tsx` (renders Fuel / Travel / Maintenance sub-form by meta type)
- `src/modules/expenses/components/ServiceDueBanner.tsx`
- `src/modules/expenses/__tests__/fuel-math.test.ts`

**Modified:**
- `src/modules/expenses/types.ts` — add `meta` field + meta union
- `src/modules/expenses/components/AddExpense.tsx` — wire in `MetaSubForm`
- `src/modules/expenses/pages/ExpenseListPage.tsx` (or wrapper) — add Auto tab
- `src/constants/messages.ts` — `BudgetMsg` additions
- `src/constants/routes.ts` — Auto sub-route under `/budget`
- `src/shared/types.ts` — only if `ExpenseCategory`/sub-cat enums need touch (they shouldn't)
- `firestore.rules` — confirm existing expense rules cover the `meta` field (no schema enforcement on the rules side; meta is opaque).

**Untouched (explicitly):**
- All other modules (Body, Baby, Admin).
- `useBabyCollection`, `useListControls` — reused as-is.

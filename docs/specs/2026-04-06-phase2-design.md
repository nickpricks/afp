# AFP Phase 2 — Design Specification

**Date:** 2026-04-06
**Status:** Draft
**Author:** Nick + Claude
**Prereq:** Phase 1 complete (v0.1.0 shipped)

---

## Overview

Phase 2 is a module-by-module redesign of AFP. Each sub-phase ships independently. The pattern established in 2a (first-time config → stats dashboard → tabbed single-page) is reused across modules.

| Phase | Module | Key Changes |
|---|---|---|
| **2a** | Body | First-time config, tabbed page, stats dashboard, edit/backfill |
| **2b** | Baby | Multi-child, configurable sub-modules, baby dashboard |
| **2c** | Budget (was Expenses) | Rename, add Income, list-default, payment methods, reconciliation |
| **2d** | Profile | Link/unlink providers, email, username, all configurations |
| **2e** | Admin + Viewer | Read-only invite tier, combined viewer dashboard |
| **2f** | Themes & Effects | 3 new themes from BabyTracker, ambient effects from Floor-Tracker |

**Build order:** 2a → 2b → 2c → 2d → 2e → 2f (each shippable independently)

---

## Cross-Cutting Concerns

### Super Admin (TheAdminNick)

TheAdminNick is a Firestore-level bypass. If `uid === headminickUid`, all rules pass — no module checks, no role checks. Nick can read/write anything. If everything breaks, Nick can fix it by editing Firestore directly.

This is enforced consistently across ALL collections including new ones added in Phase 2.

### First-Time Config Pattern

Shared across Body and Baby modules:

1. User enables module (via invite) → first visit shows config screen
2. Simple checklist — pick what to track
3. Save → config stored in dedicated `{module}_config/main` doc
4. Config changeable later from Profile section (Phase 2d)
5. After config → default landing is stats dashboard

### Data Reset

Phase 2 starts with a clean Firestore database. No migration from Phase 1 data — no one has saved real data yet.

### Enum Strategy

- **String enums** for low-volume config/roles/CSS/runtime (readable in Firestore console)
- **Number enums** for high-volume transaction/log data (JSDoc documented, reference in this spec)
- **PascalCase** for TypeScript enum member names

---

## Enums Reference

### String Enums

```typescript
enum UserRole {
  TheAdminNick = 'theAdminNick',
  User = 'user',
  Viewer = 'viewer',
}

enum ModuleId {
  Body = 'body',
  Budget = 'budget',
  Baby = 'baby',
}

enum ActivityType {
  Walk = 'walk',
  Run = 'run',
  Cycle = 'cycle',
  Yoga = 'yoga',
}

enum BudgetView {
  Today = 'today',
  Week = 'week',
  Month = 'month',
  All = 'all',
}

enum ThemeId {
  FamilyBlue = 'family-blue',
  SummitInstrument = 'summit-instrument',
  NightCityElevator = 'night-city-elevator',
  DeepMariana = 'deep-mariana',
  NightCityApartment = 'night-city-apartment',
  IndustrialFurnace = 'industrial-furnace',
  CorporateGlass = 'corporate-glass',
  Lullaby = 'lullaby',
  NurseryOs = 'nursery-os',
  MidnightFeed = 'midnight-feed',
}

enum ColorMode {
  Light = 'light',
  Dark = 'dark',
  System = 'system',
}

enum SyncStatus {
  Synced = 'synced',
  Syncing = 'syncing',
  Error = 'error',
  Offline = 'offline',
}
```

### Number Enums

```typescript
/** @description Payment method for transactions. Stored as number in Firestore. */
enum PaymentMethod {
  /** 💵 Physical cash */
  Cash = 0,
  /** 🏦 Bank transfer — IMPS (instant) */
  BankAccountImps = 1,
  /** 🏦 Bank transfer — RTGS (high value) */
  BankAccountRtgs = 2,
  /** 🏦 Bank transfer — NEFT (batch) */
  BankAccountNeft = 3,
  /** 📲 UPI from bank account */
  UpiBankAccount = 4,
  /** 📲 UPI from credit card (RuPay CC on UPI) */
  UpiCreditCard = 5,
  /** 💳 Credit card (swipe/online) */
  CreditCard = 6,
}

/** @description Expense category. Stored as number in Firestore. */
enum ExpenseCategory {
  /** 🏠 Housing */
  Housing = 0,
  /** 🍔 Food */
  Food = 1,
  /** 🛒 Shopping */
  Shopping = 2,
  /** ✈️ Travel */
  Travel = 3,
  /** 🚗 Vehicle */
  Vehicle = 4,
  /** 📱 Bills */
  Bills = 5,
  /** 🏥 Medical */
  Medical = 6,
  /** 💆 Care */
  Care = 7,
  /** 🎁 Gifts */
  Gifts = 8,
  /** 📚 Education */
  Education = 9,
  /** 🏡 Household */
  Household = 10,
  /** 💰 Finance */
  Finance = 11,
  /** 🎬 Entertainment */
  Entertainment = 12,
  /** 🔄 Transfer */
  Transfer = 13,
  /** 📦 Misc */
  Misc = 14,
}

/** @description Income source. Stored as number in Firestore. */
enum IncomeSource {
  /** 💼 Salary */
  Salary = 0,
  /** 🏢 Business */
  Business = 1,
  /** 🏦 Interest */
  Interest = 2,
  /** 🔙 Refund */
  Refund = 3,
  /** 📦 Other */
  Other = 4,
}

/** @description Feed type for baby module. Stored as number in Firestore. */
enum FeedType {
  /** 🤱 Breast — left */
  BreastLeft = 0,
  /** 🤱 Breast — right */
  BreastRight = 1,
  /** 🤱 Breast — both */
  BreastBoth = 2,
  /** 🍼 Bottle */
  Bottle = 3,
  /** 🥣 Solid food */
  Solid = 4,
}

/** @description Sleep type. Stored as number in Firestore. */
enum SleepType {
  /** 😴 Daytime nap */
  Nap = 0,
  /** 🌙 Night sleep */
  Night = 1,
}

/** @description Sleep quality. Stored as number in Firestore. */
enum SleepQuality {
  /** 😊 Good */
  Good = 0,
  /** 😐 Fair */
  Fair = 1,
  /** 😟 Poor */
  Poor = 2,
}

/** @description Diaper type. Stored as number in Firestore. */
enum DiaperType {
  /** 💧 Wet */
  Wet = 0,
  /** 💩 Dirty */
  Dirty = 1,
  /** 💧💩 Mixed */
  Mixed = 2,
}
```

---

## Firestore Data Structure

### Complete Schema

```
app/
  config                              → { headminickUid: string }

invites/{code}                        → { code, name, role, viewerOf, modules,
                                           createdBy, linkedUid, createdAt, usedAt }

users/{uid}/
  profile/main                        → { role, name, email, username, viewerOf,
                                           theme, colorMode, modules, createdAt, updatedAt }

  body_config/main                    → { floors, walking, running, cycling, yoga,
                                           floorHeight, configuredAt }
  body/{dateKey}                      → { dateStr, up, down, walkMeters, runMeters,
                                           total, updatedAt }
  body_activities/{id}                → { type, distance, duration, date,
                                           timestamp, createdAt }

  budget_config/main                  → { defaultView, configuredAt }
  expenses/{id}                       → { amount, category, subCat, note, date,
                                           paymentMethod, isSettlement, isDeleted,
                                           createdAt, updatedAt }
  income/{id}                         → { amount, source, note, date,
                                           paymentMethod, createdAt, updatedAt }

  children/{childId}                  → { name, dob, config, createdAt, updatedAt }
  children/{childId}/feeds/{id}       → { type, amount, notes, date, time,
                                           timestamp, createdAt }
  children/{childId}/sleep/{id}       → { type, quality, startTime, endTime, date,
                                           notes, timestamp, createdAt }
  children/{childId}/growth/{id}      → { weight, height, headCircumference, date,
                                           notes, createdAt }
  children/{childId}/diapers/{id}     → { type, notes, date, time,
                                           timestamp, createdAt }

usernames/{username}                  → { uid, createdAt }
```

### Example Data (Firestore JSON)

```json
{
  "app/config": {
    "headminickUid": "abc123def456"
  },

  "invites/r7k2m9x4p1nq": {
    "code": "r7k2m9x4p1nq",
    "name": "Ayesha",
    "role": "user",
    "viewerOf": null,
    "modules": { "body": true, "budget": true, "baby": true },
    "createdBy": "abc123def456",
    "linkedUid": "xyz789ghi012",
    "createdAt": "2026-04-06T10:00:00.000Z",
    "usedAt": "2026-04-06T10:05:32.000Z"
  },

  "invites/t3j8w2q5v9lp": {
    "code": "t3j8w2q5v9lp",
    "name": "Ammi",
    "role": "viewer",
    "viewerOf": "abc123def456",
    "modules": { "body": false, "budget": true, "baby": true },
    "createdBy": "abc123def456",
    "linkedUid": null,
    "createdAt": "2026-04-06T11:00:00.000Z",
    "usedAt": null
  },

  "users/abc123def456/profile/main": {
    "role": "theAdminNick",
    "name": "Nick",
    "email": "nick@example.com",
    "username": "nickpricks",
    "viewerOf": null,
    "theme": "family-blue",
    "colorMode": "dark",
    "modules": { "body": true, "budget": true, "baby": true },
    "createdAt": "2026-04-01T00:00:00.000Z",
    "updatedAt": "2026-04-06T09:00:00.000Z"
  },

  "users/abc123def456/body_config/main": {
    "floors": true,
    "walking": true,
    "running": false,
    "cycling": false,
    "yoga": false,
    "floorHeight": 3.0,
    "configuredAt": "2026-04-06T10:15:00.000Z"
  },

  "users/abc123def456/body/2026-04-06": {
    "dateStr": "2026-04-06",
    "up": 12,
    "down": 8,
    "walkMeters": 2150,
    "runMeters": 0,
    "total": 26.75,
    "updatedAt": "2026-04-06T18:30:00.000Z"
  },

  "users/abc123def456/body_activities/a1b2c3d4-e5f6-7890-abcd-ef1234567890": {
    "type": "walk",
    "distance": 2150,
    "duration": null,
    "date": "2026-04-06",
    "timestamp": "2026-04-06T07:30:00.000Z",
    "createdAt": "2026-04-06T07:35:00.000Z"
  },

  "users/abc123def456/budget_config/main": {
    "defaultView": "month",
    "configuredAt": "2026-04-06T10:20:00.000Z"
  },

  "users/abc123def456/expenses/b2c3d4e5-f6a7-8901-bcde-f12345678901": {
    "amount": 450,
    "category": 1,
    "subCat": "Groceries",
    "note": "Weekly sabzi from market",
    "date": "2026-04-06",
    "paymentMethod": 4,
    "isSettlement": false,
    "isDeleted": false,
    "createdAt": "2026-04-06T11:00:00.000Z",
    "updatedAt": "2026-04-06T11:00:00.000Z"
  },

  "users/abc123def456/expenses/settlement-example": {
    "amount": 2000,
    "category": 11,
    "subCat": "Credit Card Payment",
    "note": "HDFC CC April partial",
    "date": "2026-04-10",
    "paymentMethod": 1,
    "isSettlement": true,
    "isDeleted": false,
    "createdAt": "2026-04-10T09:00:00.000Z",
    "updatedAt": "2026-04-10T09:00:00.000Z"
  },

  "users/abc123def456/income/c3d4e5f6-a7b8-9012-cdef-123456789012": {
    "amount": 150000,
    "source": 0,
    "note": "April salary",
    "date": "2026-04-01",
    "paymentMethod": 1,
    "createdAt": "2026-04-01T09:00:00.000Z",
    "updatedAt": "2026-04-01T09:00:00.000Z"
  },

  "users/abc123def456/children/d4e5f6a7-b8c9-0123-defa-234567890123": {
    "name": "Aisha",
    "dob": "2025-08-15",
    "config": { "feeding": true, "sleep": true, "growth": true, "diapers": true },
    "createdAt": "2026-04-06T10:30:00.000Z",
    "updatedAt": "2026-04-06T10:30:00.000Z"
  },

  "users/abc123def456/children/d4e5f6a7-b8c9-0123-defa-234567890123/feeds/e5f6a7b8-c9d0-1234-efab-345678901234": {
    "type": 3,
    "amount": 120,
    "notes": "Morning feed, took full bottle",
    "date": "2026-04-06",
    "time": "06:30",
    "timestamp": "2026-04-06T06:30:00.000Z",
    "createdAt": "2026-04-06T06:35:00.000Z"
  },

  "users/abc123def456/children/d4e5f6a7-b8c9-0123-defa-234567890123/sleep/f6a7b8c9-d0e1-2345-fabc-456789012345": {
    "type": 1,
    "quality": 0,
    "startTime": "20:30",
    "endTime": "06:00",
    "date": "2026-04-05",
    "notes": "Slept through the night",
    "timestamp": "2026-04-05T20:30:00.000Z",
    "createdAt": "2026-04-06T06:15:00.000Z"
  },

  "users/abc123def456/children/d4e5f6a7-b8c9-0123-defa-234567890123/growth/a7b8c9d0-e1f2-3456-abcd-567890123456": {
    "weight": 7.8,
    "height": 68.5,
    "headCircumference": 43.2,
    "date": "2026-04-01",
    "notes": "6-month checkup",
    "createdAt": "2026-04-01T14:00:00.000Z"
  },

  "users/abc123def456/children/d4e5f6a7-b8c9-0123-defa-234567890123/diapers/b8c9d0e1-f2a3-4567-bcde-678901234567": {
    "type": 0,
    "notes": "",
    "date": "2026-04-06",
    "time": "07:15",
    "timestamp": "2026-04-06T07:15:00.000Z",
    "createdAt": "2026-04-06T07:16:00.000Z"
  },

  "users/xyz789ghi012/profile/main": {
    "role": "viewer",
    "name": "Ammi",
    "email": null,
    "username": null,
    "viewerOf": "abc123def456",
    "theme": "family-blue",
    "colorMode": "light",
    "modules": { "body": false, "budget": true, "baby": true },
    "createdAt": "2026-04-06T10:05:32.000Z",
    "updatedAt": "2026-04-06T10:05:32.000Z"
  },

  "usernames/nickpricks": {
    "uid": "abc123def456",
    "createdAt": "2026-04-06T09:00:00.000Z"
  }
}
```

### Firestore Path Depths

All paths valid (even segments = docs):

| Path | Depth |
|---|---|
| `app/config` | 2 |
| `invites/{code}` | 2 |
| `users/{uid}/profile/main` | 4 |
| `users/{uid}/body_config/main` | 4 |
| `users/{uid}/body/{dateKey}` | 4 |
| `users/{uid}/body_activities/{id}` | 4 |
| `users/{uid}/budget_config/main` | 4 |
| `users/{uid}/expenses/{id}` | 4 |
| `users/{uid}/income/{id}` | 4 |
| `users/{uid}/children/{childId}` | 4 |
| `users/{uid}/children/{childId}/feeds/{id}` | 6 |
| `users/{uid}/children/{childId}/sleep/{id}` | 6 |
| `users/{uid}/children/{childId}/growth/{id}` | 6 |
| `users/{uid}/children/{childId}/diapers/{id}` | 6 |
| `usernames/{username}` | 2 |

**Note on nested subcollections (depth 6):** Baby data under `children/{childId}/*` cannot be queried across children in one Firestore query. Each child's data is isolated. This is intentional — you'd never mix two children's feeds. Cross-child views query each subcollection and merge client-side.

---

## Phase 2a: Body Module Redesign

### Current Problems

Body today is a single `BodyTracker` component that mashes floor counting, activity logging, and scoring together. No configuration, no dashboard, no edit/backfill, no separation of concerns.

### First-Time Config Flow

1. User enables Body module (via invite) → first visit shows config screen
2. Checklist: "What do you want to track?"
   - `[x] Floors` — daily up/down counting
   - `[x] Walking` — distance + steps
   - `[ ] Running` — distance + steps
   - `[ ] Cycling` — distance (disabled for MVP — "coming soon")
   - `[ ] Yoga` — duration (disabled for MVP — "coming soon")
3. Floor height preset: 2.5m (residential) / 3.0m (standard) / 3.5m (commercial)
4. Save → `body_config/main` doc created → redirect to stats dashboard

### After Config — Tabbed Single Page

Only configured activities show as tabs. Stats is always first (default landing).

```
Body
──────────────────────────
[Stats] [Floors] [Walking]

Stats tab (default):
┌─ Today ────────────────┐
│ Floors: 12  Walk: 2.1km│
│ Score: 14.5            │
├─ This Week ────────────┤
│ Avg: 10/day  Total: 71 │
│ Streak: 5 days         │
├─ Quick Actions ────────┤
│ [+ Log Floors] [+ Walk]│
└────────────────────────┘
```

### Per-Activity Tabs

**Floors tab:**
- Today's counter (up/down tap buttons)
- Recent days list (last 7–14 days)
- Tap any day → edit form (pre-filled or blank for missed days)

**Walking tab:**
- Log today's walk (distance input, auto-compute steps)
- Recent walks list (tap to edit)
- Mini-stats at top (weekly total, streak)

**Running tab:** Same pattern as Walking.

### Edit/Backfill

- Recent entries list shows last 7–14 days
- Tap any day → edit form (pre-filled with existing data, or blank for missed days)
- Date picker for going further back

### Scoring

- Keep `computeBodyScore()` formula — it works
- Show score breakdown on Stats tab (floors vs walks vs runs)
- Floor height configurable (2.5m / 3.0m / 3.5m)

### Not in 2a

- Challenges/milestones (future — ported from Floor-Tracker later)
- Cycling, yoga (config checkboxes present but disabled)
- Charts/graphs (Stats tab is text-based)

---

## Phase 2b: Baby Module Redesign

### Current Problems

Baby has four flat log components (FeedLog, SleepLog, GrowthLog, DiaperLog) under one module. Single implicit baby, no configuration, no dashboard, no child identity.

### "Add Baby" Onboarding

1. User enables Baby module → first visit: "Add your first child"
2. Form: **Name**, **Date of birth**, **What to track?**
   - `[x] Feeding` (breast/bottle/solid)
   - `[x] Sleep` (nap/night)
   - `[ ] Growth` (weight/height/head)
   - `[x] Diapers`
3. Save → child doc created → lands on that child's dashboard
4. Can add more children anytime (button on Baby landing)

### Baby Landing — All Children View

```
Baby
──────────────────────────
┌─ Aisha (8 months) ─────┐
│ Last feed: 2h ago       │
│ Last sleep: napping now │
│ Diapers today: 4        │
│                  [View →]│
└─────────────────────────┘
┌─ Zain (3 years) ────────┐
│ Last meal: 1h ago       │
│ Sleep: 9h last night    │
│                  [View →]│
└─────────────────────────┘
         [+ Add Child]
```

### Per-Child Detail — Tabbed

```
← Aisha
[Dashboard] [Feeding] [Sleep] [Diapers]

Dashboard:
┌─ Today ────────────────┐
│ Feeds: 5  Sleep: 12h   │
│ Diapers: 4  Weight: -  │
├─ Quick Actions ────────┤
│ [+ Feed] [+ Diaper]    │
└────────────────────────┘
```

Only configured sub-modules show as tabs. Each tab: today's log + recent entries (tap to edit/backfill).

### Age Awareness

- Date of birth drives age display ("8 months", "3 years")
- Future: could suggest tracking changes as child ages — NOT in MVP

### Multi-Child Data Model

Each child is a separate doc at `children/{childId}` with subcollections underneath. Children are isolated — no cross-child queries. Each child has their own config (feeding, sleep, growth, diapers).

### Not in 2b

- Age-based suggestions
- Growth charts / percentile curves
- Sharing a child with another user (viewer role covers read-only)
- Photo attachments

---

## Phase 2c: Expenses → Budget Module

### Module Rename

`ModuleId.Expenses` → `ModuleId.Budget`. Covers both expense tracking and income tracking.

### Landing Page — List View (Default)

```
Budget
──────────────────────────
┌─ April 2026 ───────────┐
│ Income:    ₹1,50,000   │
│ Spent:       ₹32,450   │
│ Remaining: ₹1,17,550   │
└─────────────────────────┘

[Expenses ▼] [Income]

6 Apr ─────────────────────
  🥬 Groceries    ₹450  📲
  🚕 Cab/Auto     ₹180  📲

5 Apr ─────────────────────
  📱 Phone bill   ₹1,000  💳
  🍕 Orders       ₹350  📲
                 ──────────
           This month: ₹32,450

              [+ Add]
```

### Summary Card

- Income vs Spent vs Remaining for current period
- **Smart totals:** entries with `isSettlement: true` excluded from "Spent"
- Settlement entries (CC payments, transfers) tracked separately for reconciliation

### Payment Methods

Default: **UPI Bank Account** (most common for Indian users).

Quick bubbles on Add form:
```
Payment: [📲 UPI] [📲 UPI+CC] [💳 CC]  [···]
                                          ↓ expanded
          [💵 Cash] [🏦 IMPS] [🏦 RTGS] [🏦 NEFT]
```

See PaymentMethod enum for full list (7 values, numeric).

### Reconciliation View

Filter by payment method → see charges vs settlements:

```
April 2026 — Credit Card 💳
──────────────────────────
Purchases (spent via CC):
  📱 Phone bill      ₹1,000
  🛒 Amazon order    ₹3,500
                    ────────
  Total charged:     ₹4,500

Payments (settled CC):
  💳 CC Payment      ₹2,000
                    ────────
  Total paid:        ₹2,000

  ⚠️ Outstanding:    ₹2,500
```

Not a separate page — a filter/group lens on existing data. Filter by CreditCard (6) + UpiCreditCard (5) for charges, filter settlements for payments.

### Add Page

```
← Add

[Expense] [Income]

── Expense form ──
Category:  🍔 🛒 🚗 ✈️ ...    (emoji bubbles, 15 categories)
Sub-cat:   [Groceries ▼]
Amount:    [10] [20] [50] [100] [200] [···]
           ₹ [________]
Payment:   [📲 UPI] [📲 UPI+CC] [💳 CC] [···]
Date:      [2026-04-06]
Note:      [________]
                    [Save]

[📎 Bulk Import (JSON)]     ← link, opens inline/modal
```

### Income Form

```
── Income form ──
Source:    [Salary ▼]    (5 categories + Other with free text)
Amount:    ₹ [________]
Payment:   [📲 UPI] [📲 UPI+CC] [💳 CC] [···]
Date:      [2026-04-01]
Note:      [________]
                    [Save]
```

### Ported from Finularity

- 15 expense categories with emoji bubbles + subcategories
- Amount presets (10, 20, 50, 100, 200 + extended)
- 30-second undo toast with dismiss button on delete
- Category/subcategory deselect (re-tap toggle)
- Full-text search by note or category
- Date grouping (newest first) with daily totals
- Bulk import with validation + deduplication
- Filters: Today, This Week, Month (default), All

### Not in 2c

- Auto-recurring income
- Budget goals/limits per category
- Charts/graphs
- Export to CSV/PDF
- Multi-currency

---

## Phase 2d: Profile Section

### Profile Page

Accessible from tab bar or header avatar tap.

```
Profile
──────────────────────────
┌─ Account ──────────────┐
│ 📷 [Google photo]      │
│ Nick                   │
│ nick@gmail.com         │
│ @nickpricks            │
│                        │
│ [Edit Name]            │
│ [Set Username]         │
│ [Change Email]         │
└────────────────────────┘

┌─ Sign-In ──────────────┐
│ ✅ Google   nick@g...  │
│    [Unlink]            │
└────────────────────────┘

┌─ Preferences ──────────┐
│ Theme:     [Family Blue ▼] │
│ Mode:      [Dark ▼]       │
└────────────────────────┘

┌─ Module Config ────────┐
│ Body:    [Floors, Walk] │
│          [Edit →]       │
│ Budget:  [Month view]   │
│          [Edit →]       │
│ Baby:    [2 children]   │
│          [Edit →]       │
└────────────────────────┘

┌─ About ────────────────┐
│ AFP v0.2.0             │
│ [Debug Page]           │
└────────────────────────┘
```

### Key Points

- Everything configurable from one place — onboarding choices changeable here
- Link/unlink auth providers (Google now, structured for future)
- Username — optional, unique (claim/release via `usernames/` collection)
- Theme & color mode selection
- Module config shortcuts — "Edit" opens that module's config screen
- Viewer role sees this page with limited options (no module config, read-only)

### Data

No new collections. Everything in `profile/main` + `usernames/{username}`.

---

## Phase 2e: Admin + Viewer Role + Universal Dashboard

### Fresh Database — Admin Claim Flow

1. Nick opens app for the first time — no `app/config` exists
2. "Claim this app as admin" screen — sets `headminickUid` to current user's UID
3. If admin UID needs to change later — migration script or manual Firestore edit replaces `headminickUid`
4. Google sign-in is an optional bonus — admin works with anonymous auth too (the UID is what matters)

### Universal Dashboard (All Roles)

Everyone gets the same dashboard component — it shows different data based on role:

| Role | Dashboard shows |
|---|---|
| **User** | Own data across all enabled modules |
| **Viewer** | Target user's data (scoped by `viewerOf` + module access) |
| **Admin** | User selector → view any user's dashboard |

**User/Viewer dashboard:**
```
Dashboard
──────────────────────────
┌─ Body ─────────────────┐
│ Today: 12 floors       │
│ This week: 67 floors   │
└────────────────────────┘

┌─ Budget ───────────────┐
│ April spent: ₹32,450   │
│ Income: ₹1,50,000      │
└────────────────────────┘

┌─ Baby ─────────────────┐
│ Aisha — Last feed: 2h  │
│ Zain — Last meal: 1h   │
└────────────────────────┘
```

**Admin dashboard — user selector:**
```
Dashboard (Admin)
──────────────────────────
[View as: Nick (you) ▼]
  Nick (you)
  Ayesha (user)
  Bhai (viewer)
──────────────────────────
┌─ Body ─────────────────┐
│ Today: 12 floors       │
│ ...                    │
└────────────────────────┘
(shows selected user's data)
```

Admin selects a user → sees exactly what that user would see. Selecting "Nick (you)" shows admin's own data.

### Viewer Role — Scoped Access

Admin creates invite with `role: "viewer"` + `viewerOf: uid`. The viewer can only see the target user's data, restricted to enabled modules.

**Use cases:**

| Viewer | `viewerOf` | Modules | Why |
|---|---|---|---|
| Grandparent | Nick's UID | Baby only | Track grandchild's growth |
| Spouse | Nick's UID | Budget only | Audit expenses |
| Physician | Nick's UID | Baby only | Medical checkups |
| Family member | Nick's UID | All | General family dashboard |

**Invite schema:** `viewerOf` field specifies whose data. Copied to viewer's profile on redemption.

**Firestore rules:**
```
allow read: if isOwner(userId)
  || (isViewer() && getProfile(request.auth.uid).viewerOf == userId)
  || isHeadminick()
allow write: if isOwner(userId) || isHeadminick()
```

Viewers can:
- Read target user's data across allowed modules
- Change their own theme/colorMode in profile

Viewers cannot:
- Write any module data
- Access admin pages
- Edit module configurations

### Admin Pages

Admin has three dedicated pages (in addition to normal module pages which work like any user):

**Invites page:**
```
Invites (Admin)
──────────────────────────
Create Invite:
  Name:    [________]
  Role:    [User ▼] / [Viewer ▼]
  View of: [Nick ▼]              ← only for viewer role
  Modules: [x] Body [x] Budget [x] Baby

Active Invites:
  ✅ Ayesha (user) — redeemed 6 Apr     [Revoke]
  🔗 Ammi (viewer) — pending            [Delete] [Re-send]
  ✅ Bhai (viewer) — redeemed 5 Apr     [Revoke]
```

**Users page:**
```
Users (Admin)
──────────────────────────
┌─ Invited Users ────────┐
│ Nick (admin)    active  │  [View Dashboard]
│ Ayesha (user)   active  │  [View Dashboard] [Edit Role] [Toggle Modules]
│ Bhai (viewer)   active  │  [View Dashboard] [Edit Role] [Toggle Modules]
├─ Anonymous Users ───────┤
│ anon-7f3a2b...  2h ago  │
│ anon-e91c4d...  1d ago  │
│ anon-3b8f1a...  3d ago  │
├─────────────────────────┤
│ [🗑️ Purge Anonymous]    │  ← deletes all Firebase Auth users with no profile
└─────────────────────────┘
```

Admin can:
- View any user's dashboard (same as selector on admin dashboard)
- Change a user's role (user ↔ viewer)
- Toggle modules on/off per user
- Purge anonymous users (Firebase Auth users with no Firestore profile)

**Debug page:** Existing — app state, Firebase config, sync status.

**Note:** Anonymous user listing requires Firebase Admin SDK access (Cloud Function or Bun script). For MVP, show invited/profiled users from Firestore. "All Firebase Auth users" + purge button is a future enhancement that needs a Cloud Function.

---

## Phase 2f: Themes & Effects

### 3 New Themes from BabyTracker

| Theme | Style | Modes |
|---|---|---|
| Lullaby | Warm cream/blue, nursery aesthetic | Light + Dark |
| Nursery OS | Cyberpunk cyan, dark-only | Dark only |
| Midnight Feed | Orange/brown, cozy | Dark only |

### Ambient Effects from Floor-Tracker

| Theme | Effect |
|---|---|
| Deep: Mariana | Rising bubbles (bioluminescent green) |
| Industrial Furnace | Rising embers (orange sparks) |
| Night City: Apartment | Scanline sweep (CRT horizontal line) |
| Night City: Elevator | Elevator seam line (vertical cyan glow) |

### Total Theme Count: 10

| # | Theme | Modes | Source |
|---|---|---|---|
| 1 | Family Blue (default) | Light + Dark | AFP original |
| 2 | Summit Instrument | Light + Dark | Floor-Tracker |
| 3 | Corporate Glass | Light + Dark | Floor-Tracker |
| 4 | Night City: Elevator | Dark | Floor-Tracker |
| 5 | Night City: Apartment | Dark | Floor-Tracker |
| 6 | Deep: Mariana | Dark | Floor-Tracker |
| 7 | Industrial Furnace | Dark | Floor-Tracker |
| 8 | Lullaby | Light + Dark | BabyTracker (NEW) |
| 9 | Nursery OS | Dark | BabyTracker (NEW) |
| 10 | Midnight Feed | Dark | BabyTracker (NEW) |

### Implementation

Same CSS custom properties system. New theme CSS files + entries in `THEME_DEFINITIONS`. Ambient effects via `.fx-ambient` pseudo-elements (established pattern in Floor-Tracker CSS).

---

## Explicitly Out of Scope

| Item | Why |
|---|---|
| Go API gateway | Separate brainstorming session — not even in v1 roadmap |
| Push notifications | Needs separate discussion (PWA vs native) |
| Challenge/milestone system | Future enhancement, not Phase 2 MVP |
| Growth charts / percentile curves | Future — baby module |
| Charts/visualizations | Future — all modules use text-based stats for now |
| Multi-currency | Not needed for personal use (₹ only) |
| Export to CSV/PDF | Future |
| Auto-recurring income | Manual entry only |

---

## Four Independent Repos — Confirmed Independent

| Repo | Decision | Reason |
|---|---|---|
| **ft** (FeatherTrailMD) | Stay independent | Go CLI for markdown notes — zero overlap |
| **passforge** | Stay independent | Go CLI for passwords — zero overlap |
| **common-array-utils** | Stay independent | npm utility lib — possible future AFP dependency |
| **sting-utils** | Stay independent | npm utility lib — possible future AFP dependency |

See `docs/plans/2026-04-06-npm-utils-coverage-plan.md` (in workspace root) for analysis of potential AFP integration as dependencies.

---

## Related Documents

- [Auth Journey](../../../../docs/auth-journey.md) — Anonymous → Google auth architecture and lessons learned
- [Phase 1 Design Spec](2026-04-01-aprilfoolsjoke-design.md) — Original AFP design
- [Phase 1 Plan](../plans/2026-04-01-aprilfoolsjoke-phase1.md) — Phase 1 implementation
- [NPM Utils Plan](../../../docs/plans/2026-04-06-npm-utils-coverage-plan.md) — Utility package coverage analysis

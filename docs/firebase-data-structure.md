# Firebase Data Structure

Last updated: 2026-04-15

This document maps every Firestore collection, subcollection, and document in the AFP database. No PII — all examples use placeholder values.

---

## Tree View

```
firestore/
|
|-- app/
|   |-- config                          # Singleton — admin bootstrap
|
|-- invites/
|   |-- {code}                          # One doc per invite code
|
|-- usernames/
|   |-- {username}                      # Global username uniqueness
|
|-- users/
    |-- {uid}/
        |-- profile/
        |   |-- main                    # User profile (one per user)
        |
        |-- notifications/
        |   |-- {notifId}               # Per-user notification inbox
        |
        |-- body_config/
        |   |-- main                    # Body module settings
        |
        |-- body/
        |   |-- {dateKey}               # Daily floor aggregate (YYYY-MM-DD)
        |
        |-- body_activities/
        |   |-- {activityId}            # Walk/run/cycle/yoga entries
        |
        |-- budget_config/
        |   |-- main                    # Budget module settings
        |
        |-- expenses/
        |   |-- {expenseId}             # Individual expense records
        |
        |-- income/
        |   |-- {incomeId}              # Individual income records
        |
        |-- children/
            |-- {childId}               # Child profile doc
            |   |-- feeds/
            |   |   |-- {feedId}        # Feed entries (bottle, breast, solid)
            |   |-- sleep/
            |   |   |-- {sleepId}       # Sleep entries (nap, night)
            |   |-- growth/
            |   |   |-- {growthId}      # Growth measurements
            |   |-- diapers/
                    |-- {diaperId}      # Diaper change entries
```

---

## Root Collections

### `app/config`

Singleton document created on first admin claim. Prevents double-claim via `runTransaction`.

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `headminickUid` | string | `"abc123def456"` | UID of the admin user |

**Rules:** Any authenticated user can read. Create allowed only when doc doesn't exist. Update/delete admin only.

---

### `invites/{code}`

One document per invite code. Codes are random alphanumeric strings.

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `code` | string | `"a1b2c3d4"` | The invite code (matches doc ID) |
| `name` | string | `"Family Member"` | Display name for the invitee |
| `modules` | map | `{ body: true, budget: false, baby: true }` | Modules enabled on redemption |
| `createdBy` | string | `"abc123def456"` | Admin UID who created the invite |
| `linkedUid` | string \| null | `null` | UID of user who redeemed (null = unclaimed) |
| `createdAt` | string | `"2026-04-10T12:00:00Z"` | ISO 8601 creation time |
| `usedAt` | string \| null | `null` | ISO 8601 redemption time |
| `role` | string \| null | `"user"` | `"user"` or `"viewer"` (null defaults to user) |
| `viewerOf` | string \| null | `null` | Target UID when role is viewer |

**Rules:** Admin creates/deletes. Any user can redeem an unclaimed invite (update `linkedUid` + `usedAt` only, all other fields immutable). Redemption uses `runTransaction` to prevent double-claim.

---

### `usernames/{username}`

Global uniqueness registry for usernames.

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `uid` | string | `"abc123def456"` | UID that owns this username |

**Rules:** Any authenticated user can read. Create if `uid == auth.uid`. Delete if `uid == auth.uid`.

---

## User Subcollections (`users/{uid}/...`)

Everything below lives under a user's UID. The `{uid}` is the Firebase Auth UID.

### `profile/main`

One document per user. Created on invite redemption or admin claim.

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `role` | string | `"user"` | `"theAdminNick"`, `"user"`, or `"viewer"` |
| `name` | string | `"Family Member"` | Display name |
| `email` | string \| null | `null` | Google email (if linked) |
| `username` | string \| null | `null` | Chosen username |
| `viewerOf` | string \| null | `null` | Target UID (viewer role only) |
| `theme` | string | `"family-blue"` | Active theme ID |
| `colorMode` | string | `"system"` | `"light"`, `"dark"`, or `"system"` |
| `effectCount` | number | `5` | Ambient effect particle count (0-10) |
| `effectSize` | string | `"medium"` | `"small"`, `"medium"`, or `"large"` |
| `modules` | map | `{ body: true, budget: true, baby: false }` | Module access (admin-controlled) |
| `requestedModules` | array | `["baby"]` | Modules user has requested access to |
| `createdAt` | string | `"2026-04-10T12:00:00Z"` | ISO 8601 |
| `updatedAt` | string | `"2026-04-15T09:00:00Z"` | ISO 8601 |

**Rules:** Owner + viewer + admin can read. Owner can update `theme`, `colorMode`, `name`, `requestedModules`. Admin can update anything (including `role`, `modules`).

**collectionGroup:** `useAllUsers()` queries all `profile` docs via `collectionGroup('profile')` — requires a Firestore collectionGroup index.

---

### `notifications/{notifId}`

Per-user notification inbox. Two types: module requests and admin alerts.

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `id` | string | `"uuid-1234"` | Notification ID |
| `type` | string | `"module_request"` | `"module_request"` or `"admin_alert"` |
| `moduleId` | string? | `"baby"` | Which module was requested (module_request only) |
| `requestedBy` | string? | `"def456"` | UID of requesting user (module_request only) |
| `requestedByName` | string? | `"Family Member"` | Display name of requester |
| `message` | string? | `"System update tonight"` | Alert message text (admin_alert only) |
| `severity` | string? | `"info"` | `"info"`, `"warning"`, `"critical"` (admin_alert only) |
| `alertType` | string? | `"notice"` | `"alert"` (persistent) or `"notice"` (dismissible) |
| `shownTillDate` | string? | `"2026-04-20"` | Expiry date for the alert |
| `createdAt` | string | `"2026-04-15T09:00:00Z"` | ISO 8601 |
| `read` | boolean | `false` | Whether user has seen it |
| `dismissed` | boolean | `false` | Whether user dismissed it |

**Rules:** Owner can read own notifications. Owner can update `read` + `dismissed` only. Any authenticated user can create `module_request` type (writes to admin's inbox). Admin has full write.

---

## Body Module

### `body_config/main`

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `floors` | boolean | `true` | Floors tracking enabled |
| `walking` | boolean | `true` | Walking tracking enabled |
| `running` | boolean | `false` | Running tracking enabled |
| `cycling` | boolean | `false` | Cycling tracking enabled |
| `yoga` | boolean | `false` | Yoga tracking enabled (coming soon) |
| `floorHeight` | number | `3.0` | Floor height in meters (2.5, 3.0, or 3.5) |
| `dailyGoal` | number | `50` | Daily score target |
| `configuredAt` | string | `"2026-04-10T12:00:00Z"` | ISO 8601 |

### `body/{dateKey}`

Daily aggregate document. Key is `YYYY-MM-DD`.

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `dateStr` | string | `"2026-04-15"` | Date string (matches doc ID) |
| `up` | number | `5` | Floors climbed up |
| `down` | number | `3` | Floors climbed down |
| `walkMeters` | number | `2500` | Total walking distance (meters) |
| `runMeters` | number | `0` | Total running distance (meters) |
| `total` | number | `31.5` | Computed daily score |
| `updatedAt` | string | `"2026-04-15T09:30:00Z"` | ISO 8601 |

**Scoring:** `floors_up x 1 + floors_down x 0.5 + walk_km x 10 + run_km x 20 + cycle_km x 15`

### `body_activities/{activityId}`

Individual activity entries (walk, run, cycle, yoga).

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `id` | string | `"uuid-5678"` | Activity ID |
| `type` | string | `"walk"` | `"walk"`, `"run"`, `"cycle"`, `"yoga"` |
| `distance` | number \| null | `1500` | Distance in meters (null for yoga) |
| `duration` | number \| null | `null` | Duration in minutes (yoga only) |
| `date` | string | `"2026-04-15"` | YYYY-MM-DD |
| `timestamp` | string | `"2026-04-15T09:15:00Z"` | ISO 8601 |
| `createdAt` | string | `"2026-04-15T09:15:00Z"` | ISO 8601 |

**Rules (body + body_activities):** Owner with `modules.body == true` + admin + viewer can read. Owner with module + admin can write.

---

## Budget Module

### `budget_config/main`

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `defaultView` | string | `"all"` | `"today"`, `"week"`, `"month"`, `"all"` |
| `configuredAt` | string | `"2026-04-10T12:00:00Z"` | ISO 8601 |

### `expenses/{expenseId}`

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `id` | string | `"uuid-9012"` | Expense ID |
| `date` | string | `"2026-04-15"` | YYYY-MM-DD |
| `category` | number | `1` | `ExpenseCategory` enum (0-14) |
| `subCat` | string | `""` | Subcategory text |
| `amount` | number | `150.50` | Amount in currency |
| `paymentMethod` | number | `4` | `PaymentMethod` enum (0-6) |
| `isSettlement` | boolean | `false` | CC payment settlement flag |
| `note` | string | `"Groceries"` | User note |
| `isDeleted` | boolean | `false` | Soft delete flag |
| `createdAt` | string | `"2026-04-15T10:00:00Z"` | ISO 8601 |
| `updatedAt` | string | `"2026-04-15T10:00:00Z"` | ISO 8601 |

### `income/{incomeId}`

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `id` | string | `"uuid-3456"` | Income ID |
| `amount` | number | `50000` | Amount in currency |
| `source` | number | `0` | `IncomeSource` enum (0-4) |
| `note` | string | `""` | User note |
| `date` | string | `"2026-04-01"` | YYYY-MM-DD |
| `paymentMethod` | number | `4` | `PaymentMethod` enum (0-6) |
| `createdAt` | string | `"2026-04-01T10:00:00Z"` | ISO 8601 |
| `updatedAt` | string | `"2026-04-01T10:00:00Z"` | ISO 8601 |

**Rules (expenses + income):** Owner with `modules.budget == true` + admin + viewer can read. Owner with module + admin can write.

---

## Baby Module

### `children/{childId}`

Child profile document. Nested subcollections hang off each child.

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `id` | string | `"uuid-7890"` | Child ID |
| `name` | string | `"Baby"` | Child's name |
| `dob` | string | `"2025-06-01"` | Date of birth (YYYY-MM-DD) |
| `config.feeding` | boolean | `true` | Feed tracking enabled |
| `config.sleep` | boolean | `true` | Sleep tracking enabled |
| `config.growth` | boolean | `true` | Growth tracking enabled |
| `config.diapers` | boolean | `true` | Diaper tracking enabled |
| `createdAt` | string | `"2026-04-10T12:00:00Z"` | ISO 8601 |
| `updatedAt` | string | `"2026-04-10T12:00:00Z"` | ISO 8601 |

### `children/{childId}/feeds/{feedId}`

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `id` | string | `"uuid-1111"` | Feed ID |
| `date` | string | `"2026-04-15"` | YYYY-MM-DD |
| `time` | string | `"08:30"` | HH:MM |
| `type` | number | `3` | `FeedType` enum (0=BreastLeft, 1=BreastRight, 2=BreastBoth, 3=Bottle, 4=SolidFood) |
| `amount` | number \| null | `120` | ml/g (Bottle + SolidFood only) |
| `timestamp` | string | `"2026-04-15T08:30:00Z"` | ISO 8601 |
| `createdAt` | string | `"2026-04-15T08:30:00Z"` | ISO 8601 |
| `notes` | string | `""` | User notes |

### `children/{childId}/sleep/{sleepId}`

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `id` | string | `"uuid-2222"` | Sleep ID |
| `date` | string | `"2026-04-15"` | YYYY-MM-DD |
| `startTime` | string | `"13:00"` | HH:MM |
| `endTime` | string | `"14:30"` | HH:MM |
| `type` | number | `0` | `SleepType` enum (0=Nap, 1=Night) |
| `quality` | number \| null | `0` | `SleepQuality` enum (0=Good, 1=Fair, 2=Poor) |
| `timestamp` | string | `"2026-04-15T13:00:00Z"` | ISO 8601 |
| `createdAt` | string | `"2026-04-15T13:00:00Z"` | ISO 8601 |
| `notes` | string | `""` | User notes |

### `children/{childId}/growth/{growthId}`

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `id` | string | `"uuid-3333"` | Growth ID |
| `date` | string | `"2026-04-15"` | YYYY-MM-DD |
| `weight` | number \| null | `7.5` | Weight in kg |
| `height` | number \| null | `68.0` | Height in cm |
| `headCircumference` | number \| null | `42.5` | Head circumference in cm |
| `createdAt` | string | `"2026-04-15T10:00:00Z"` | ISO 8601 |
| `notes` | string | `""` | User notes |

### `children/{childId}/diapers/{diaperId}`

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `id` | string | `"uuid-4444"` | Diaper ID |
| `date` | string | `"2026-04-15"` | YYYY-MM-DD |
| `time` | string | `"07:00"` | HH:MM |
| `type` | number | `2` | `DiaperType` enum (0=Wet, 1=Dirty, 2=Mixed) |
| `timestamp` | string | `"2026-04-15T07:00:00Z"` | ISO 8601 |
| `createdAt` | string | `"2026-04-15T07:00:00Z"` | ISO 8601 |
| `notes` | string | `""` | User notes |

**Rules (children + all subcollections):** Owner with `modules.baby == true` + admin + viewer can read. Owner with module + admin can write.

---

## Security Rules Summary

| Who | Can do | Scope |
|-----|--------|-------|
| **Admin (theAdminNick)** | Full read/write on everything | All collections |
| **User** | Read/write own data within enabled modules | Own subcollections only |
| **Viewer** | Read-only on `viewerOf` user's data | Target user's subcollections only |
| **Any authenticated** | Read `app/config`, invites, usernames. Redeem unclaimed invite. Create `module_request` notification to admin | Limited root collections |
| **Unauthenticated** | Nothing | Blocked |

---

## Enum Reference (stored as numbers in Firestore)

| Enum | Values |
|------|--------|
| `PaymentMethod` | 0=Cash, 1=IMPS, 2=RTGS, 3=NEFT, 4=UPI, 5=UPI+CC, 6=CreditCard |
| `ExpenseCategory` | 0=Housing, 1=Food, 2=Shopping, 3=Travel, 4=Vehicle, 5=Bills, 6=Medical, 7=Care, 8=Gifts, 9=Education, 10=Household, 11=Finance, 12=Entertainment, 13=Transfer, 14=Misc |
| `IncomeSource` | 0=Salary, 1=Business, 2=Interest, 3=Refund, 4=Other |
| `FeedType` | 0=BreastLeft, 1=BreastRight, 2=BreastBoth, 3=Bottle, 4=SolidFood |
| `SleepType` | 0=Nap, 1=Night |
| `SleepQuality` | 0=Good, 1=Fair, 2=Poor |
| `DiaperType` | 0=Wet, 1=Dirty, 2=Mixed |

String enums (`ActivityType`, `ModuleId`, `UserRole`, `NotificationType`, etc.) are stored as their string values.

---

## Path Patterns

```
/app/config                                          # Singleton
/invites/{code}                                      # Root collection
/usernames/{username}                                # Root collection
/users/{uid}/profile/main                            # One per user
/users/{uid}/notifications/{notifId}                 # Per-user inbox
/users/{uid}/body_config/main                        # Body settings
/users/{uid}/body/{YYYY-MM-DD}                       # Daily floor aggregate
/users/{uid}/body_activities/{uuid}                  # Activity entries
/users/{uid}/budget_config/main                      # Budget settings
/users/{uid}/expenses/{uuid}                         # Expense records
/users/{uid}/income/{uuid}                           # Income records
/users/{uid}/children/{childId}                      # Child profile
/users/{uid}/children/{childId}/feeds/{uuid}         # Feed entries
/users/{uid}/children/{childId}/sleep/{uuid}         # Sleep entries
/users/{uid}/children/{childId}/growth/{uuid}        # Growth entries
/users/{uid}/children/{childId}/diapers/{uuid}       # Diaper entries
```

**Segment count rule:** Firestore `collection()` requires odd segment counts (1, 3, 5...). All paths follow this — subcollections are flat under users, and baby subcollections nest under children.

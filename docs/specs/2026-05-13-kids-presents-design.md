# Design Spec: Kids Presents

## Goal
Implement a unified tracking system for kids' physical gifts and financial presents (money). The feature must support per-child logging and an aggregate financial view in the Budget module.

## Context & Background
Users currently track baby logs (feeding, sleep, etc.) but lack a way to record digital money gifts or physical presents received by their children. Since most money gifts are digital/transferred, it makes sense to aggregate these in the Budget module while keeping the physical gift inventory within the child's profile.

## Data Shape
Two new subcollections under `users/{uid}/children/{childId}/`:

### 1. `gifts` (Physical objects)
- `id`: string
- `date`: string (YYYY-MM-DD)
- `title`: string (e.g., "Lego Technic")
- `giver`: string (e.g., "Grandpa")
- `occasion`: string (e.g., "5th Birthday")
- `status`: `GiftStatus` (Wishlist, Received, Used, Outgrown)
- `notes`: string
- `createdAt`: string (ISO)
- `updatedAt`: string (ISO)

### 2. `finances` (Money)
- `id`: string
- `date`: string (YYYY-MM-DD)
- `amount`: number
- `description`: string (e.g., "Cash Gift")
- `giver`: string
- `occasion`: string
- `status`: `FinanceStatus` (Received, Saved, Spent)
- `notes`: string
- `createdAt`: string (ISO)
- `updatedAt`: string (ISO)

## UI/UX
### Baby Module (Per-Child)
- New "Presents" tab in `ChildDetail`.
- Sub-switcher for "Finances" vs "Gifts".
- Inline form for adding entries.
- Grouped list view by date.
- Tap-to-edit and swipe-to-delete support.

### Budget Module (Aggregate)
- New "Kids" tab in `ExpenseListPage` (gated by `modules.baby` enable state).
- Displays merged financial logs from all kids.
- Displays "Total Kid Wealth" (sum of all `finances` entries).
- Each entry is tagged with the child's name for clarity.

## Technical Approach
- **Storage**: Use `useBabyCollection` hook (StorageAdapter abstraction).
- **Aggregation**: A custom hook `useAllKidsFinances` will iterate through all children and set up listeners for their `finances` subcollections, merging them reactively into a single state.
- **Modularity**: The "Presents" feature is gated by a new `presents` flag in `ChildConfig`.

## Out of Scope
- Direct integration with bank accounts (all entries are manual).
- Complex investment tracking (handled by future "Budget -> Investment" phase).
- Media uploads for physical gifts (text-only for now).

## Resolved Questions
- **Location**: Both modules (Child Detail for logging, Budget for financial summary).
- **Naming**: Unified under "Presents" to cover both money and objects.

## Risks
- Performance with many children: The `useAllKidsFinances` hook sets up multiple listeners. For a typical family (1-3 kids), this is negligible. If a user has 50 kids (unlikely), we may need to optimize.
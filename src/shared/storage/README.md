# storage/

Backend-agnostic storage layer using the adapter pattern.

## Files

- **adapter.ts** — StorageAdapter interface (getAll, getById, save, remove, onSnapshot)
- **firebase-adapter.ts** — Firestore-backed StorageAdapter implementation
- **localStorage-adapter.ts** — localStorage-backed StorageAdapter for dev/offline mode
- **create-adapter.ts** — Factory that returns Firebase or localStorage adapter based on isFirebaseConfigured

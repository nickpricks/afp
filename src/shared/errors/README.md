# errors/

Error handling infrastructure: toast notifications and React error boundary.

## Files

- **toast-context.tsx** — `ToastProvider`, `ToastContext`, and `ToastOverlay` for auto-dismissing notifications. Supports toast actions (`{ action: { label, onClick }, durationMs }`) for undo-delete patterns
- **useToast.ts** — `useToast` hook consuming ToastContext (separate file for fast-refresh). Exposes `addToast(message, type, options?)`
- **ErrorBoundary.tsx** — Class component that catches render errors and displays a recovery UI

## Tests

Tests in `__tests__/`: `toast.test.ts`.

# errors/

Error handling infrastructure: toast notifications and React error boundary.

## Files

- **toast-context.tsx** — ToastProvider, ToastContext, and ToastOverlay for auto-dismissing notifications
- **useToast.ts** — useToast hook consuming ToastContext (separate file for fast-refresh)
- **ErrorBoundary.tsx** — Class component that catches render errors and displays a recovery UI

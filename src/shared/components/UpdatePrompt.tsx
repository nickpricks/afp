import { useRegisterSW } from 'virtual:pwa-register/react';

/** PWA update notification shown when a new service worker is available */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true });

  if (!needRefresh) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg bg-surface-card border border-line px-4 py-2 shadow-lg">
      <span className="text-sm text-fg">Update available</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-white"
      >
        Update
      </button>
    </div>
  );
}

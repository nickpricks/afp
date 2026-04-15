import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { ToastType } from '@/shared/types';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  action?: { label: string; onClick: () => void };
}

export interface ToastContextValue {
  toasts: Toast[];
  addToast: (
    message: string,
    type: ToastType,
    options?: { action?: Toast['action']; durationMs?: number },
  ) => void;
  removeToast: (id: string) => void;
}

const AUTO_DISMISS_MS = 4000;

export const ToastContext = createContext<ToastContextValue | null>(null);

/** Provides toast notification state and actions to the component tree */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (
      message: string,
      type: Toast['type'],
      options?: { action?: Toast['action']; durationMs?: number },
    ) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type, action: options?.action }]);
      const timer = setTimeout(() => removeToast(id), options?.durationMs ?? AUTO_DISMISS_MS);
      timers.current.set(id, timer);
    },
    [removeToast],
  );

  useEffect(() => {
    const current = timers.current;
    return () => {
      current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return (
    <ToastContext value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastOverlay toasts={toasts} onDismiss={removeToast} />
    </ToastContext>
  );
}

/** Resolves Tailwind classes for a given toast type */
function toastClasses(type: ToastType): string {
  switch (type) {
    case ToastType.Success:
      return 'bg-success text-white';
    case ToastType.Error:
      return 'bg-error text-white';
    case ToastType.Info:
      return 'bg-surface-card text-fg border border-line';
  }
}

/** Fixed overlay that renders active toast notifications */
function ToastOverlay({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className={`w-80 rounded-lg px-4 py-3 text-sm shadow-lg flex items-center justify-between gap-2 ${toastClasses(toast.type)}`}
        >
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="flex-1 text-left cursor-pointer"
          >
            {toast.message}
          </button>
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action!.onClick();
                onDismiss(toast.id);
              }}
              className="font-bold underline whitespace-nowrap"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, type: Toast['type']) => void;
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
    (message: string, type: Toast['type']) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);
      const timer = setTimeout(() => removeToast(id), AUTO_DISMISS_MS);
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
function toastClasses(type: Toast['type']): string {
  switch (type) {
    case 'success':
      return 'bg-success text-white';
    case 'error':
      return 'bg-error text-white';
    case 'info':
      return 'bg-surface-card text-fg border border-line';
  }
}

/** Fixed overlay that renders active toast notifications */
function ToastOverlay({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2">
      {
toasts.map((toast) => (
        <button
          key={toast.id}
          role="alert"
          onClick={() => onDismiss(toast.id)}
          className={`w-80 cursor-pointer rounded-lg px-4 py-3 text-sm shadow-lg ${toastClasses(toast.type)}`}
        >
          {toast.message}
        </button>
      ))
}
    </div>
  );
}

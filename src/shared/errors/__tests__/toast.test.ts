import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createElement } from 'react';

import { ToastProvider } from '@/shared/errors/toast-context';
import { useToast } from '@/shared/errors/useToast';

function wrapper({ children }: { children: ReactNode }) {
  return createElement(ToastProvider, null, children);
}

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds a toast with correct properties', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.addToast('saved', 'success');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'saved',
      type: 'success',
    });
    expect(result.current.toasts[0]!.id).toBeDefined();
  });

  it('removes a specific toast by id', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.addToast('first', 'info');
      result.current.addToast('second', 'error');
    });

    expect(result.current.toasts).toHaveLength(2);

    act(() => {
      result.current.removeToast(result.current.toasts[0]!.id);
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]!.message).toBe('second');
  });

  it('auto-dismisses after 4 seconds', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.addToast('bye', 'success');
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(result.current.toasts).toHaveLength(0);
  });
});

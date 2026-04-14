import { useRef, useCallback, type ReactNode } from 'react';

const SWIPE_THRESHOLD = 80;

/** Wrapper that enables swipe-right-to-delete on touch devices */
export function SwipeToDelete({
  onDelete,
  children,
}: {
  onDelete: () => void;
  children: ReactNode;
}) {
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const rowRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const swipingRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    startXRef.current = touch.clientX;
    currentXRef.current = 0;
    swipingRef.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    const deltaX = touch.clientX - startXRef.current;
    // Only allow right swipe (positive delta)
    if (deltaX <= 0) {
      if (rowRef.current) {
        rowRef.current.style.transform = '';
        rowRef.current.style.transition = 'transform 0.2s ease';
      }
      return;
    }

    swipingRef.current = true;

    // Reveal the red background
    if (bgRef.current) {
      bgRef.current.style.opacity = '1';
    }

    if (rowRef.current) {
      // Cap the visual displacement at 120px
      const capped = Math.min(deltaX, 120);
      rowRef.current.style.transition = 'none';
      rowRef.current.style.transform = `translateX(${capped}px)`;
    }

    currentXRef.current = deltaX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!swipingRef.current) return;
    swipingRef.current = false;

    const row = rowRef.current;
    if (!row) return;

    if (currentXRef.current >= SWIPE_THRESHOLD) {
      // Past threshold — slide out and delete
      row.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
      row.style.transform = 'translateX(100%)';
      row.style.opacity = '0';
      setTimeout(() => {
        onDelete();
        // Reset in case undo restores this row
        row.style.transition = '';
        row.style.transform = '';
        row.style.opacity = '';
      }, 200);
    } else {
      // Snap back
      row.style.transition = 'transform 0.2s ease';
      row.style.transform = '';
      // Hide the red background
      if (bgRef.current) {
        bgRef.current.style.opacity = '0';
      }
    }

    currentXRef.current = 0;
  }, [onDelete]);

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Red background — hidden until swipe starts, touch devices only */}
      <div
        ref={bgRef}
        className="absolute inset-0 flex items-center bg-red-500 px-4 rounded-lg opacity-0 pointer-events-none"
      >
        <span className="text-sm font-medium text-white">Delete</span>
      </div>
      {/* Sliding content row */}
      <div
        ref={rowRef}
        className="relative z-10 bg-surface"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

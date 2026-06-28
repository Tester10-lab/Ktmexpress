/**
 * useSwipeGesture — Detects horizontal swipe gestures on a ref element.
 *
 * Usage:
 *   const { ref } = useSwipeGesture({ onSwipeLeft: closeSidebar, onSwipeRight: openSidebar });
 *   <div ref={ref}>...</div>
 *
 * @param {Object} opts
 * @param {Function} [opts.onSwipeLeft]   Called when user swipes left
 * @param {Function} [opts.onSwipeRight]  Called when user swipes right
 * @param {number}   [opts.threshold=60]  Minimum px to qualify as a swipe
 * @param {number}   [opts.maxVertical=80] Max vertical drift allowed (to prevent conflicts with scroll)
 */
import { useRef, useEffect } from 'react';

export function useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold = 60, maxVertical = 80 } = {}) {
  const ref = useRef(null);
  const touchStart = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleTouchStart = (e) => {
      const t = e.touches[0];
      touchStart.current = { x: t.clientX, y: t.clientY };
    };

    const handleTouchEnd = (e) => {
      if (!touchStart.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.current.x;
      const dy = t.clientY - touchStart.current.y;

      // Only fire if horizontal movement exceeds threshold and vertical drift is small
      if (Math.abs(dx) >= threshold && Math.abs(dy) <= maxVertical) {
        if (dx < 0 && onSwipeLeft)  onSwipeLeft();
        if (dx > 0 && onSwipeRight) onSwipeRight();
      }
      touchStart.current = null;
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, threshold, maxVertical]);

  return { ref };
}

export default useSwipeGesture;

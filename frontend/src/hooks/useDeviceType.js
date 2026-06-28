/**
 * useDeviceType — Returns the current device type based on window width.
 * Updates automatically on resize (debounced 100ms).
 *
 * Returns one of:
 *   'smartwatch' | 'mobile-s' | 'mobile-m' | 'mobile-l' |
 *   'tablet' | 'laptop' | 'laptop-l' | 'desktop' | '4k'
 */
import { useState, useEffect } from 'react';

function getDeviceType(width) {
  if (width <= 280) return 'smartwatch';
  if (width <= 320) return 'mobile-s';
  if (width <= 375) return 'mobile-m';
  if (width <= 425) return 'mobile-l';
  if (width <= 768) return 'tablet';
  if (width <= 1024) return 'laptop';
  if (width <= 1440) return 'laptop-l';
  if (width <= 2560) return 'desktop';
  return '4k';
}

export function useDeviceType() {
  const [deviceType, setDeviceType] = useState(() =>
    typeof window !== 'undefined' ? getDeviceType(window.innerWidth) : 'desktop'
  );

  useEffect(() => {
    let timeout;
    const handler = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setDeviceType(getDeviceType(window.innerWidth));
      }, 100);
    };

    window.addEventListener('resize', handler);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', handler);
    };
  }, []);

  return deviceType;
}

export function useIsMobile() {
  const deviceType = useDeviceType();
  return ['smartwatch', 'mobile-s', 'mobile-m', 'mobile-l'].includes(deviceType);
}

export function useIsTablet() {
  const deviceType = useDeviceType();
  return deviceType === 'tablet';
}

export function useIsMobileOrTablet() {
  const deviceType = useDeviceType();
  return ['smartwatch', 'mobile-s', 'mobile-m', 'mobile-l', 'tablet'].includes(deviceType);
}

export default useDeviceType;

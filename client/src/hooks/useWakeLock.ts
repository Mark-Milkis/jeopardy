import { useEffect, useRef, useState } from 'react';

/**
 * Custom React hook to prevent screen from going to sleep using Screen Wake Lock API
 * Returns the current wake lock status for debugging/UI purposes
 */
export function useWakeLock(): { isActive: boolean; isSupported: boolean } {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isSupported] = useState(() => 'wakeLock' in navigator);

  useEffect(() => {
    // Only proceed if Wake Lock API is supported
    if (!isSupported) {
      console.warn('[useWakeLock] Screen Wake Lock API not supported in this browser');
      return;
    }

    const requestWakeLock = async () => {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        setIsActive(true);
        console.log('[useWakeLock] ✓ Screen wake lock activated');

        // Handle wake lock release (e.g., when tab becomes inactive)
        wakeLockRef.current.addEventListener('release', () => {
          console.log('[useWakeLock] Wake lock released');
          setIsActive(false);
        });
      } catch (err) {
        console.error('[useWakeLock] Failed to acquire wake lock:', err);
        setIsActive(false);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && wakeLockRef.current === null) {
        // Re-request wake lock when tab becomes visible again
        requestWakeLock();
      }
    };

    // Initial wake lock request
    requestWakeLock();

    // Re-request when tab becomes visible (wake lock is auto-released when tab hidden)
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => {
          console.log('[useWakeLock] Wake lock released on unmount');
          wakeLockRef.current = null;
          setIsActive(false);
        });
      }
    };
  }, [isSupported]);

  return { isActive, isSupported };
}

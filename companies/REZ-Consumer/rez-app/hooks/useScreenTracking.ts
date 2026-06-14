/**
 * useScreenTracking
 *
 * Lightweight hook for automatic screen-view tracking.
 * Call at the top of unknown screen component — tracks entry on mount
 * and time-on-screen on unmount.
 *
 * Usage:
 *   useScreenTracking('HomeScreen');
 *   useScreenTracking('StoreDetail', { storeId: '123' });
 */

import { useEffect, useRef } from 'react';
import { analytics } from '@/services/analytics/AnalyticsService';

export function useScreenTracking(
  screenName: string,
  properties?: Record<string, unknown>,
): void {
  const entryTime = useRef<number>(Date.now());

  useEffect(() => {
    entryTime.current = Date.now();

    // Track screen view on mount
    try {
      analytics.trackScreen(screenName, properties);
    } catch {
      // Analytics must never crash the app
    }

    return () => {
      // Track time on screen on unmount
      const durationMs = Date.now() - entryTime.current;
      try {
        analytics.trackEvent('screen_exit', {
          screen_name: screenName,
          duration_ms: durationMs,
          duration_s: Math.round(durationMs / 1000),
          ...properties,
        });
      } catch {
        // Ignore
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenName]); // Re-track if screenName changes (rare but possible in tabs)
}

export default useScreenTracking;

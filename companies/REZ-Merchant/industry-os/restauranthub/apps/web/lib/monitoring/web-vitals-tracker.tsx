'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { initializePerformanceMonitoring, getPerformanceMonitor } from './performance-monitor';

interface WebVitalsTrackerProps {
  userId?: string;
  apiEndpoint?: string;
  enableAutoReporting?: boolean;
  onMetricReceived?: (metric: { name: string; value: number; rating: string }) => void;
}

export function WebVitalsTracker({
  userId,
  apiEndpoint = '/api/v1/metrics/frontend',
  enableAutoReporting = true,
  onMetricReceived,
}: WebVitalsTrackerProps) {
  const pathname = usePathname();
  const isInitialized = useRef(false);
  const performanceMonitor = useRef<ReturnType<typeof getPerformanceMonitor>>(null);

  useEffect(() => {
    if (!isInitialized.current && typeof window !== 'undefined') {
      performanceMonitor.current = initializePerformanceMonitoring({
        userId,
        apiEndpoint,
        enableAutoReporting,
      });

      isInitialized.current = true;

      // Track page view
      performanceMonitor.current?.trackEvent('page-view', undefined, {
        pathname,
        timestamp: Date.now(),
      });
    }

    return () => {
      if (performanceMonitor.current) {
        performanceMonitor.current.disconnect();
      }
    };
  }, [userId, apiEndpoint, enableAutoReporting]);

  // Track route changes
  useEffect(() => {
    if (performanceMonitor.current && pathname) {
      const endTracking = performanceMonitor.current.startTracking('route-change');

      // Track the route change
      performanceMonitor.current.trackEvent('route-change', undefined, {
        from: document.referrer,
        to: pathname,
        timestamp: Date.now(),
      });

      // End tracking after a short delay to capture navigation timing
      setTimeout(() => {
        endTracking();
      }, 100);
    }
  }, [pathname]);

  // Update user ID when it changes
  useEffect(() => {
    if (performanceMonitor.current && userId) {
      performanceMonitor.current.setUserId(userId);
    }
  }, [userId]);

  return null; // This component doesn't render anything
}

export default WebVitalsTracker;
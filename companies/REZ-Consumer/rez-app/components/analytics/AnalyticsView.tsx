// @ts-nocheck
/**
 * AnalyticsView
 *
 * Drop-in View replacement that auto-tracks impressions when visible.
 * Uses Intersection Observer (via onLayout + scroll position) to fire
 * a 'component_viewed' event only once per mount.
 *
 * Usage:
 *   <AnalyticsView eventName="banner_viewed" properties={{ bannerId: 'hero' }}>
 *     <BannerComponent />
 *   </AnalyticsView>
 */

import React, { useRef, useCallback } from 'react';
import { View, ViewProps } from 'react-native';
import { analytics } from '@/services/analytics/AnalyticsService';

interface AnalyticsViewProps extends ViewProps {
  eventName: string;
  properties?: Record<string, unknown>;
  /** If true, fires the event every time the component is re-rendered. Default: false (once only). */
  trackEveryRender?: boolean;
  children: React.ReactNode;
}

export function AnalyticsView({
  eventName,
  properties,
  trackEveryRender = false,
  children,
  onLayout,
  ...viewProps
}: AnalyticsViewProps) {
  const hasTracked = useRef(false);

  const handleLayout = useCallback(
    (event) => {
      if (!hasTracked.current || trackEveryRender) {
        hasTracked.current = true;
        try {
          analytics.trackEvent(eventName, {
            ...properties,
            trigger: 'layout',
          });
        } catch {
          // Analytics must never crash the app
        }
      }
      onLayout?.(event);
    },
    [eventName, properties, trackEveryRender, onLayout],
  );

  return (
    <View {...viewProps} onLayout={handleLayout}>
      {children}
    </View>
  );
}

export default AnalyticsView;

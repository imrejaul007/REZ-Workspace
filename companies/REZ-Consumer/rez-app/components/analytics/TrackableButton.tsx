// @ts-nocheck
/**
 * TrackableButton
 *
 * TouchableOpacity wrapper that fires an analytics event on press.
 *
 * Usage:
 *   <TrackableButton
 *     eventName="add_to_cart_tapped"
 *     properties={{ productId: '123', price: 99 }}
 *     onPress={handleAddToCart}
 *   >
 *     <Text>Add to Cart</Text>
 *   </TrackableButton>
 */

import React, { useCallback } from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { analytics } from '@/services/analytics/AnalyticsService';

interface TrackableButtonProps extends TouchableOpacityProps {
  eventName: string;
  properties?: Record<string, unknown>;
  children: React.ReactNode;
}

export function TrackableButton({
  eventName,
  properties,
  onPress,
  children,
  ...rest
}: TrackableButtonProps) {
  const handlePress = useCallback(
    (event) => {
      try {
        analytics.trackEvent(eventName, {
          ...properties,
          interaction: 'tap',
        });
      } catch {
        // Analytics must never crash the app
      }
      onPress?.(event);
    },
    [eventName, properties, onPress],
  );

  return (
    <TouchableOpacity {...rest} onPress={handlePress} activeOpacity={rest.activeOpacity ?? 0.7}>
      {children}
    </TouchableOpacity>
  );
}

export default TrackableButton;

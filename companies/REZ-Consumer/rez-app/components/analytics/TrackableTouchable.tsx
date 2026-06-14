/**
 * TrackableTouchable
 *
 * TouchableHighlight/Pressable variant that fires analytics events on press,
 * long press, and optionally on release. Useful for complex gesture tracking.
 *
 * Usage:
 *   <TrackableTouchable
 *     eventName="deal_card_tapped"
 *     properties={{ dealId: '456', position: 2 }}
 *     onPress={handlePress}
 *   >
 *     <DealCard deal={deal} />
 *   </TrackableTouchable>
 */

import React, { useCallback } from 'react';
import { Pressable, PressableProps, GestureResponderEvent } from 'react-native';
import { analytics } from '@/services/analytics/AnalyticsService';

interface TrackableTouchableProps extends PressableProps {
  eventName: string;
  properties?: Record<string, unknown>;
  /** Event name for long-press. Defaults to `${eventName}_long_press`. */
  longPressEventName?: string;
  children: React.ReactNode;
}

export function TrackableTouchable({
  eventName,
  properties,
  longPressEventName,
  onPress,
  onLongPress,
  children,
  ...rest
}: TrackableTouchableProps) {
  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
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

  const handleLongPress = useCallback(
    (event: GestureResponderEvent) => {
      try {
        analytics.trackEvent(longPressEventName ?? `${eventName}_long_press`, {
          ...properties,
          interaction: 'long_press',
        });
      } catch {
        // Analytics must never crash the app
      }
      onLongPress?.(event);
    },
    [eventName, longPressEventName, properties, onLongPress],
  );

  return (
    <Pressable
      {...rest}
      onPress={handlePress}
      onLongPress={onLongPress ? handleLongPress : undefined}
    >
      {children}
    </Pressable>
  );
}

export default TrackableTouchable;

/**
 * AnimatedListItem - Staggered entrance animation for list items
 *
 * Features:
 * - Fade-in animation with vertical slide (translateY)
 * - Configurable stagger delay (50ms default per item index)
 * - Spring-based settlement for natural feel
 * - Optional scale pulse on appearance
 * - Perfect for list section enters (homepage tiles, cards, etc.)
 *
 * @example
 * <AnimatedListItem
 *   index={2}
 *   staggerDelay={50}
 *   duration={600}
 * >
 *   <Card title="Store A" />
 * </AnimatedListItem>
 */

import React, { useEffect } from 'react';
import { ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface AnimatedListItemProps extends ViewProps {
  children: React.ReactNode;
  index: number;
  staggerDelay?: number;
  duration?: number;
  enableScalePulse?: boolean;
}

export const AnimatedListItem: React.FC<AnimatedListItemProps> = ({
  children,
  index,
  staggerDelay = 50,
  duration = 600,
  enableScalePulse = false,
  style,
  ...viewProps
}) => {
  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(enableScalePulse ? 0.9 : 1);

  // LUCA: Staggered entrance animation - each item enters with 50ms delay (index * 50ms)
  useEffect(() => {
    const delay = index * staggerDelay;

    // Schedule animations with stagger
    const timer = setTimeout(() => {
      // LUCA: Fade-in with easing
      opacity.value = withTiming(1, {
        duration,
        easing: Easing.inOut(Easing.ease),
      });

      // LUCA: Slide up from 40px below with spring for natural settle
      translateY.value = withSpring(0, {
        damping: 10,
        stiffness: 100,
        overshootClamping: false,
      });

      // LUCA: Optional scale pulse (0.9 → 1.0) for micro-delight
      if (enableScalePulse) {
        scale.value = withSpring(1, {
          damping: 8,
          stiffness: 120,
          overshootClamping: false,
        });
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [index, staggerDelay, duration, translateY, opacity, scale, enableScalePulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[animatedStyle, style]}
      {...viewProps}
    >
      {children}
    </Animated.View>
  );
};

export default React.memo(AnimatedListItem);

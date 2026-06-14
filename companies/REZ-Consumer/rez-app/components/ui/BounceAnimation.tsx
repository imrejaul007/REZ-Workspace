/**
 * BounceAnimation - Reusable bounce/scale animation for reward moments
 *
 * Features:
 * - Spring-based scale bounce (0.8 → 1.2 → 1.0)
 * - Configurable bounce intensity and timing
 * - Perfect for cart counter updates, coin rewards, item adds
 * - Native performance with Reanimated
 *
 * @example
 * const { triggerBounce, animatedStyle } = useBounceAnimation();
 * // On cart item add: triggerBounce();
 * <Animated.View style={animatedStyle}>
 *   <CartIcon count={5} />
 * </Animated.View>
 */

import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useCallback } from 'react';

interface BounceAnimationConfig {
  intensity?: number; // 0.5 - 1.5 (default 0.2 scale range)
  stiffness?: number;
  damping?: number;
}

export function useBounceAnimation(config: BounceAnimationConfig = {}) {
  const {
    intensity = 0.2,
    stiffness = 200,
    damping = 8,
  } = config;

  const scale = useSharedValue(1);

  // LUCA: Trigger bounce animation - scales down and bounces back up with overshoot
  const triggerBounce = useCallback(() => {
    // First: scale down to 0.8 (1 - intensity)
    scale.value = withSpring(1 - intensity, {
      damping: 14,
      stiffness: 200,
      overshootClamping: false,
    });

    // Then: scale back with overshoot for celebration
    setTimeout(() => {
      scale.value = withSpring(1, {
        damping,
        stiffness,
        overshootClamping: false,
      });
    }, 100);
  }, [scale, intensity, stiffness, damping]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { triggerBounce, animatedStyle, scale };
}

export default useBounceAnimation;

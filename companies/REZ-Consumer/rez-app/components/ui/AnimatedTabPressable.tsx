/**
 * AnimatedTabPressable - Scale delight animation for tab bar items
 *
 * Features:
 * - Micro-scale animation on press (0.95 down, spring back to 1.1 then settle to 1.0)
 * - Haptic feedback support
 * - Color transition on active state
 * - Used for bottom tab navigation for celebratory feel
 *
 * @example
 * <AnimatedTabPressable
 *   onPress={() => setTab('home')}
 *   isActive={activeTab === 'home'}
 *   icon="home"
 *   label="Home"
 * />
 */

import React, { useCallback } from 'react';
import { Pressable, PressableProps, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface AnimatedTabPressableProps extends PressableProps {
  isActive?: boolean;
  onPress: () => void;
  haptic?: boolean;
  children: React.ReactNode;
}

export const AnimatedTabPressable: React.FC<AnimatedTabPressableProps> = ({
  isActive = false,
  onPress,
  haptic = true,
  children,
  style,
  ...pressableProps
}) => {
  const scale = useSharedValue(1);
  const activeScale = useSharedValue(isActive ? 1.05 : 1);

  // Update active state scale
  React.useEffect(() => {
    activeScale.value = withTiming(isActive ? 1.05 : 1, { duration: 200 });
  }, [isActive, activeScale]);

  const handlePressIn = useCallback(() => {
    // LUCA: Press down to 0.95
    scale.value = withSpring(0.95, { damping: 14, stiffness: 200 });

    if (haptic) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch {}
    }
  }, [scale, haptic]);

  const handlePressOut = useCallback(() => {
    // LUCA: Spring back with overshoot for celebration
    scale.value = withSpring(1.1, { damping: 8, stiffness: 100, overshootClamping: false });

    // Then settle to final position
    setTimeout(() => {
      scale.value = withSpring(isActive ? 1.05 : 1, { damping: 10, stiffness: 100 });
    }, 150);
  }, [scale, isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: Math.min(scale.value, activeScale.value) }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        {...pressableProps}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

export default React.memo(AnimatedTabPressable);

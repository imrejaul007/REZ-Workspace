/**
 * AnimatedCoinBalance - Number animation for coin balance updates
 *
 * Features:
 * - Smooth number tick animation when value changes (1000ms duration)
 * - Scale pulse on update for delight
 * - Uses Reanimated for performant native animations
 * - Accessibility-friendly with numeric announcements
 *
 * @example
 * <AnimatedCoinBalance value={1250} />
 */

import React, { useEffect, useMemo } from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

interface AnimatedCoinBalanceProps extends Omit<TextProps, 'children'> {
  value: number;
  color?: string;
  fontSize?: number;
  fontWeight?: '600' | '700' | '800';
  showLabel?: boolean;
}

export const AnimatedCoinBalance: React.FC<AnimatedCoinBalanceProps> = ({
  value,
  color,
  fontSize = 18,
  fontWeight = '700',
  showLabel = false,
  style,
  ...textProps
}) => {
  const { colors } = useTheme();
  const animProgress = useSharedValue(0);
  const scaleAnim = useSharedValue(1);
  const previousValue = React.useRef(value);

  // LUCA: Animate number ticks from previous to current value
  useEffect(() => {
    if (value !== previousValue.current) {
      // LUCA: Scale pulse on balance change (spring overshoot for celebration)
      scaleAnim.value = withSpring(1.1, { damping: 10, stiffness: 100, overshootClamping: false });

      // Reset animation progress
      animProgress.value = 0;

      // Animate progress from 0 to 1 over 1000ms (duration for number ticks)
      animProgress.value = withTiming(1, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      });

      // Scale back to normal after pulse
      scaleAnim.value = withSpring(1, { damping: 8, stiffness: 100, overshootClamping: false });

      previousValue.current = value;
    }
  }, [value, animProgress, scaleAnim]);

  // LUCA: Interpolate the displayed value between old and new
  // CA-CMP-054 FIX: Include animProgress in dependency array so displayValue updates
  // as the animation progresses, not just when the target value changes.
  const displayValue = useMemo(() => {
    const prevVal = previousValue.current;

    // Create an animated value that interpolates between prev and current
    return Math.round(
      interpolate(
        animProgress.value,
        [0, 1],
        [prevVal, value]
      )
    );
  }, [value, animProgress]);

  // LUCA: Scale pulse animation for delight
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const formattedValue = displayValue.toLocaleString();

  return (
    <Animated.Text
      {...textProps}
      style={[
        styles.text,
        scaleStyle,
        {
          color: color || colors.warning || '#ffcd57',
          fontSize,
          fontWeight,
        },
        style,
      ]}
      accessibilityLabel={`Coin balance: ${value}${showLabel ? ' coins' : ''}`}
    >
      {formattedValue}
      {showLabel && ' 🪙'}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontVariant: ['tabular-nums'],
  },
});

export default React.memo(AnimatedCoinBalance);

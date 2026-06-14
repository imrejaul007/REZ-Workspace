import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';

interface TypingIndicatorProps {
  visible?: boolean;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  visible = true,
}) => {
  const { colors, borderRadius, spacing } = useTheme();

  const dot1Opacity = useSharedValue(0.3);
  const dot2Opacity = useSharedValue(0.3);
  const dot3Opacity = useSharedValue(0.3);

  useEffect(() => {
    if (visible) {
      // Create wave effect
      dot1Opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        false
      );

      dot2Opacity.value = withDelay(
        200,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 400 }),
            withTiming(0.3, { duration: 400 })
          ),
          -1,
          false
        )
      );

      dot3Opacity.value = withDelay(
        400,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 400 }),
            withTiming(0.3, { duration: 400 })
          ),
          -1,
          false
        )
      );
    }
  }, [visible]);

  const dot1Style = useAnimatedStyle(() => ({
    opacity: dot1Opacity.value,
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: dot2Opacity.value,
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: dot3Opacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={[styles.container, { paddingHorizontal: spacing.md }]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: colors.backgroundElevated,
            borderRadius: borderRadius.lg,
            borderBottomLeftRadius: spacing.xs,
          },
        ]}
      >
        <View style={styles.dots}>
          <Animated.View
            style={[
              styles.dot,
              { backgroundColor: colors.labelTertiary },
              dot1Style,
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              { backgroundColor: colors.labelTertiary },
              dot2Style,
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              { backgroundColor: colors.labelTertiary },
              dot3Style,
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  bubble: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

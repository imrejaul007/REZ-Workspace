// @ts-nocheck
/**
 * SkeletonLoader - Base skeleton component with purple-tinted shimmer animation
 *
 * Features:
 * - Smooth shimmer gradient animation (1.5s loop)
 * - Purple theme (#7C3AED) to match app branding
 * - Light/dark mode support
 * - Optimized with useNativeDriver
 * - Accessible (hidden from screen readers)
 */

import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import Animated, { cancelAnimation, useSharedValue, useAnimatedStyle, withTiming, withRepeat, interpolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?;
  variant?: 'rect' | 'circle' | 'text';
}

function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
  variant = 'rect',
}: SkeletonLoaderProps) {
  const shimmerAnim = useSharedValue(0);
  const colorScheme = useColorScheme();

  useEffect(() => {
    shimmerAnim.value = withRepeat(withTiming(1, { duration: 1500 }), -1);
    return () => {
      cancelAnimation(shimmerAnim);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedTranslateStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmerAnim.value, [0, 1], [-300, 300]) }],
  }));

  const finalBorderRadius = variant === 'circle' ? height / 2 : borderRadius;
  const finalWidth = variant === 'circle' ? height : width;

  // Theme-aware colors
  const backgroundColor = colorScheme === 'dark' ? colors.neutral[700] : colors.neutral[200];
  const shimmerColors = colorScheme === 'dark'
    ? [colors.neutral[700], colors.neutral[600], colors.neutral[700]]
    : [colors.neutral[200], colors.neutral[100], colors.tint.purple, colors.neutral[100], colors.neutral[200]];

  return (
    <View
      style={[
        {
          width: finalWidth,
          height,
          borderRadius: finalBorderRadius,
          backgroundColor,
          overflow: 'hidden',
        },
        style,
      ]}
      accessibilityElementsHidden={true}
      importantForAccessibility="no"
    >
      <Animated.View
        style={[
          { flex: 1 },
          animatedTranslateStyle,
        ]}
      >
        <LinearGradient
          colors={shimmerColors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            flex: 1,
            width: 300,
          }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  skeletonCardRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  skeletonCardLines: {
    flex: 1,
    gap: 8,
  },
});

/**
 * SkeletonCard — full-width card preset with a circle avatar and 3 text lines.
 * Used as a drop-in replacement for list item placeholders during loading.
 */
export function SkeletonCard({ style }: { style?: unknown }) {
  return (
    <View style={[styles.skeletonCardContainer, style]}>
      <View style={styles.skeletonCardRow}>
        <SkeletonLoader width={44} height={44} borderRadius={22} />
        <View style={styles.skeletonCardLines}>
          <SkeletonLoader width="70%" height={14} borderRadius={6} />
          <SkeletonLoader width="50%" height={12} borderRadius={6} />
        </View>
      </View>
      <SkeletonLoader width="100%" height={12} borderRadius={6} />
    </View>
  );
}

/**
 * SkeletonList — renders N SkeletonCard items stacked vertically.
 * Swap for ActivityIndicator during feed/list data loading.
 */
export function SkeletonList({ count = 4, style }: { count?: number; style?: unknown }) {
  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

export default React.memo(SkeletonLoader);

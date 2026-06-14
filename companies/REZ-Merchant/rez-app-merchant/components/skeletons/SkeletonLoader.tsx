/**
 * SkeletonLoader - Base skeleton component with shimmer animation
 *
 * Features:
 * - Smooth shimmer gradient animation (1.5s loop)
 * - Theme-aware colors (light/dark mode)
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
import Animated, {
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?;
  variant?: 'rect' | 'circle' | 'text';
}

const LIGHT_COLORS = ['#f3f4f6', '#e5e7eb', '#f3f4f6'];
const DARK_COLORS = ['#374151', '#4b5563', '#374151'];

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
  }, []);

  const animatedTranslateStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmerAnim.value, [0, 1], [-300, 300]) }],
  }));

  const finalBorderRadius = variant === 'circle' ? height / 2 : borderRadius;
  const finalWidth = variant === 'circle' ? height : width;

  // Theme-aware colors
  const isDark = colorScheme === 'dark';
  const backgroundColor = isDark ? '#374151' : '#f3f4f6';
  const shimmerColors = isDark ? DARK_COLORS : LIGHT_COLORS;

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
          colors={shimmerColors as unknown}
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

const styles = StyleSheet.create({});

export default React.memo(SkeletonLoader);

/**
 * CoinBalanceAnimated
 * Displays coin balance with spring scale animation when coins earned
 *
 * Features:
 * - Scale animation (1 → 1.2 → 1) on balance change
 * - Pulses on earn events
 * - useNativeDriver: true
 * - Automatically detects balance increases
 *
 * Usage:
 * <CoinBalanceAnimated
 *   balance={userBalance}
 *   symbol="₹"
 *   label="REZ Coins"
 * />
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  cancelAnimation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/theme';

interface CoinBalanceAnimatedProps {
  balance: number;
  previousBalance?: number;
  symbol?: string;
  label?: string;
  fontSize?: number;
  labelFontSize?: number;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
  color?: string;
  onAnimationComplete?: () => void;
}

function CoinBalanceAnimated({
  balance,
  previousBalance = 0,
  symbol = '',
  label = 'Coins',
  fontSize = 28,
  labelFontSize = 12,
  containerStyle,
  textStyle,
  color = colors.successScale?.[400] || '#10b981',
  onAnimationComplete,
}: CoinBalanceAnimatedProps) {
  const scale = useSharedValue(1);
  const previousBalanceRef = useRef(balance);
  const animationInProgressRef = useRef(false);

  // Detect balance increase and trigger animation
  useEffect(() => {
    const balanceIncreased = balance > previousBalanceRef.current;

    if (balanceIncreased && !animationInProgressRef.current) {
      animationInProgressRef.current = true;

      // Trigger haptic feedback
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } catch (e) {
        // Silent fail
      }

      // Scale bounce animation: 1 → 1.2 → 1
      cancelAnimation(scale);
      scale.value = withSpring(1.2, {
        damping: 5,
        mass: 1,
        overshootClamping: false,
      });

      // Return to normal scale
      setTimeout(() => {
        scale.value = withSpring(1, {
          damping: 6,
          mass: 1,
          overshootClamping: false,
        });

        animationInProgressRef.current = false;
        onAnimationComplete?.();
      }, 250);
    }

    previousBalanceRef.current = balance;
  }, [balance, onAnimationComplete, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.Text
        style={[
          styles.balanceText,
          { fontSize, color },
          textStyle,
          animatedStyle,
        ]}
      >
        {symbol}
        {balance.toLocaleString()}
      </Animated.Text>
      {label && (
        <Text style={[styles.label, { fontSize: labelFontSize, color }]}>
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceText: {
    fontWeight: '700',
    lineHeight: 1.2,
  },
  label: {
    marginTop: 4,
    fontWeight: '500',
    opacity: 0.8,
  },
});

export default React.memo(CoinBalanceAnimated);

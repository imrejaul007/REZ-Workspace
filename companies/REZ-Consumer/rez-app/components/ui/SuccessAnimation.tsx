/**
 * SuccessAnimation - Consistent success state animation across the app
 *
 * Features:
 * - Smooth spring animation for checkmark
 * - Optional coin reward bounce animation
 * - Auto-dismiss after animation completes
 * - Callback support for post-animation actions
 * - Accessible (hidden from screen readers during animation)
 *
 * @example
 * <SuccessAnimation
 *   visible={isSuccess}
 *   message="Booking confirmed!"
 *   coinReward={50}
 *   onDone={() => navigation.pop()}
 * />
 */

import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface SuccessAnimationProps {
  /** Whether to show the animation */
  visible: boolean;
  /** Message to display below checkmark */
  message?: string;
  /** Optional coin reward amount to display */
  coinReward?: number;
  /** Callback when animation completes and fades out */
  onDone?: () => void;
}

/**
 * Consistent success animation component
 * Used after payment, booking confirmation, QR scan, etc.
 */
export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  visible,
  message = 'Done!',
  coinReward,
  onDone,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const coinBounce = useSharedValue(0);
  const { colors } = useTheme();

  useEffect(() => {
    if (!visible) {
      // Reset animations when hiding
      scale.value = 0;
      opacity.value = 0;
      coinBounce.value = 0;
      return;
    }

    // LUCA: Checkmark springs in with satisfying overshoot (damping: 8, stiffness: 100)
    scale.value = withSpring(1, { damping: 8, stiffness: 100, overshootClamping: false });
    opacity.value = withTiming(1, { duration: 200, easing: Easing.inOut(Easing.ease) });

    // After spring settles (delay 400ms), bounce the coin reward if present
    const coinTimer = setTimeout(() => {
      if (coinReward) {
        // LUCA: Coin bounces up with spring (damping: 8, stiffness: 150) then settles
        coinBounce.value = withSpring(-30, { damping: 8, stiffness: 150, overshootClamping: false });
      }

      // Hold for viewing time (800ms), then fade out
      const fadeTimer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 300, easing: Easing.inOut(Easing.ease) });
      }, 800);

      // Call onDone after fade completes (300ms after fadeTimer trigger)
      const doneTimer = setTimeout(() => {
        if (onDone) runOnJS(onDone)();
      }, 800 + 300);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(doneTimer);
      };
    }, coinReward ? 400 : 600);

    return () => clearTimeout(coinTimer);
  }, [visible, coinReward, scale, opacity, coinBounce, onDone]);

  // LUCA: Overlay fade animation
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // LUCA: Checkmark scale animation with overshoot celebration
  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // LUCA: Coin badge bounce upward with natural spring
  const coinBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: coinBounce.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.overlay, overlayStyle]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`Success: ${message}${coinReward ? ` Earned ${coinReward} coins` : ''}`}
    >
      <View style={styles.container}>
        {/* Animated checkmark circle */}
        <Animated.View
          style={[
            styles.circle,
            checkmarkStyle,
            {
              backgroundColor: colors.success || '#10b981',
            },
          ]}
        >
          <Ionicons
            name="checkmark"
            size={40}
            color="#fff"
            style={{ fontWeight: 'bold' }}
          />
        </Animated.View>

        {/* Message text */}
        <Text
          style={[
            styles.message,
            {
              color: colors.text?.primary || '#1a3a52',
            },
          ]}
          numberOfLines={2}
        >
          {message}
        </Text>

        {/* Coin reward badge with bounce animation */}
        {coinReward ? (
          <Animated.View
            style={[
              styles.coinBadge,
              coinBadgeStyle,
              {
                borderColor: colors.warning || '#ffcd57',
              },
            ]}
          >
            <Text
              style={[
                styles.coinText,
                {
                  color: colors.text?.primary || '#1a3a52',
                },
              ]}
            >
              +{coinReward} 🪙
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 9999,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  message: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  coinBadge: {
    marginTop: 12,
    backgroundColor: '#fff9e6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  coinText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default React.memo(SuccessAnimation);

/**
 * SavingsCelebration — Post-transaction savings dopamine hit.
 *
 * Shows an animated "You saved ₹X!" card after a successful order.
 * Uses Reanimated for a scale-in + shine effect. No Lottie dependency.
 *
 * Place this right after the success icon on order-confirmation screens.
 * Only renders when savedAmount > 0.
 */

import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withSequence,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

// ── Brand tokens ────────────────────────────────────────────────────────────
const MUSTARD      = '#FFC857';
const MUSTARD_BG   = '#FFF8E7';
const MUSTARD_DARK = '#B8860B';
const NILE_BLUE    = '#1a3a52';
const GREEN        = '#16A34A';
const GREEN_BG     = '#F0FDF4';
const WHITE        = '#FFFFFF';

interface SavingsCelebrationProps {
  savedAmount: number;
  currencySymbol?: string;
  totalSavedAllTime?: number;
  /** Delay before animation starts (ms) — stagger after confetti */
  delay?: number;
  onViewWallet?: () => void;
}

function SavingsCelebration({
  savedAmount,
  currencySymbol = '₹',
  totalSavedAllTime,
  delay = 600,
  onViewWallet,
}: SavingsCelebrationProps) {
  const scale = useSharedValue(0);
  const amountScale = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (savedAmount <= 0) return;

    // Card entrance
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 8, stiffness: 100 }),
    );

    // Amount pop — delayed further for stagger
    amountScale.value = withDelay(
      delay + 300,
      withSequence(
        withSpring(1.15, { damping: 6, stiffness: 120 }),
        withSpring(1, { damping: 10, stiffness: 100 }),
      ),
    );

    // Shimmer sweep
    shimmer.value = withDelay(
      delay + 800,
      withTiming(1, { duration: 600 }),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedAmount]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: scale.value,
    transform: [{ scale: scale.value }],
  }));

  const amountStyle = useAnimatedStyle(() => ({
    transform: [{ scale: amountScale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0, 0.4, 0]),
  }));

  if (savedAmount <= 0) return null;

  return (
    <Animated.View style={[styles.card, cardStyle]}>
      {/* Shimmer overlay */}
      <Animated.View style={[styles.shimmer, shimmerStyle]} />

      {/* Icon */}
      <View style={styles.iconCircle}>
        <Ionicons name="wallet" size={24} color={MUSTARD_DARK} />
      </View>

      {/* Headline */}
      <Text style={styles.headline}>You saved</Text>

      {/* Big amount */}
      <Animated.View style={amountStyle}>
        <Text style={styles.amount}>
          {currencySymbol}{Math.round(savedAmount)}
        </Text>
      </Animated.View>

      <Text style={styles.subline}>on this order!</Text>

      {/* All-time stat (if available) */}
      {totalSavedAllTime != null && totalSavedAllTime > 0 && (
        <View style={styles.allTimeRow}>
          <Ionicons name="trending-up" size={14} color={GREEN} />
          <Text style={styles.allTimeText}>
            {currencySymbol}{Math.round(totalSavedAllTime)} saved all time with REZ
          </Text>
        </View>
      )}

      {/* CTA */}
      {onViewWallet && (
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.8 }]}
          onPress={onViewWallet}
          accessibilityRole="button"
          accessibilityLabel="View your wallet"
        >
          <Text style={styles.ctaText}>View Wallet</Text>
          <Ionicons name="arrow-forward" size={14} color={NILE_BLUE} />
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: MUSTARD_BG,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,200,87,0.3)',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: WHITE,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: MUSTARD,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  headline: {
    fontSize: 14,
    fontWeight: '600',
    color: MUSTARD_DARK,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  amount: {
    fontSize: 48,
    fontWeight: '800',
    color: NILE_BLUE,
    letterSpacing: -1.5,
  },
  subline: {
    fontSize: 16,
    fontWeight: '500',
    color: NILE_BLUE,
    opacity: 0.7,
    marginTop: 2,
    marginBottom: 16,
  },
  allTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GREEN_BG,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 16,
  },
  allTimeText: {
    fontSize: 13,
    fontWeight: '600',
    color: GREEN,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: MUSTARD,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    color: NILE_BLUE,
  },
});

export default memo(SavingsCelebration);

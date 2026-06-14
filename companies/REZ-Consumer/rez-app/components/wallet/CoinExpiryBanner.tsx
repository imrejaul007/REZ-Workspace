/**
 * CoinExpiryBanner
 *
 * Phase 1.3 — Coin Expiry Nudge
 * Amber/orange banner: "{count} coins expiring in {days} days — Use them at nearby stores"
 * Tapping navigates to nearby merchants with offers.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

// ============================================================================
// TYPES
// ============================================================================

export interface CoinExpiryBannerProps {
  expiringCount: number;
  daysLeft: number;
  onPress: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const CoinExpiryBanner: React.FC<CoinExpiryBannerProps> = ({
  expiringCount,
  daysLeft,
  onPress,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Subtle pulse animation to draw attention
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const urgencyColor = daysLeft <= 2
    ? colors.error
    : daysLeft <= 4
      ? colors.warning
      : colors.warningScale[400];

  const bannerBg = daysLeft <= 2
    ? colors.errorScale[50]
    : colors.tint.amberLight;

  const borderColor = daysLeft <= 2
    ? colors.errorScale[200]
    : '#FCD34D';

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: pulseAnim }] }]}>
      <Pressable
        style={[styles.container, { backgroundColor: bannerBg, borderColor }]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${expiringCount} coins expiring in ${daysLeft} days. Tap to use them.`}
      >
        {/* Warning Icon */}
        <View style={[styles.iconWrapper, { backgroundColor: urgencyColor + '22' }]}>
          <Ionicons name="warning-outline" size={18} color={urgencyColor} />
        </View>

        {/* Text Content */}
        <View style={styles.textContent}>
          <ThemedText style={[styles.headline, { color: urgencyColor }]}>
            <ThemedText style={[styles.boldCount, { color: urgencyColor }]}>
              {expiringCount.toLocaleString('en-IN')} coins
            </ThemedText>
            {daysLeft <= 0 ? (
              <ThemedText style={[styles.boldCount, { color: urgencyColor }]}>
                {' '}expire today!
              </ThemedText>
            ) : (
              <>
                {' '}expiring in{' '}
                <ThemedText style={[styles.boldCount, { color: urgencyColor }]}>
                  {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                </ThemedText>
              </>
            )}
          </ThemedText>
          <ThemedText style={styles.subtext}>
            Use them at nearby stores before they expire
          </ThemedText>
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={18} color={urgencyColor} />
      </Pressable>
    </Animated.View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 12,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 10,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textContent: {
    flex: 1,
    gap: 2,
  },
  headline: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  boldCount: {
    fontWeight: '700',
  },
  subtext: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 16,
  },
});

export default React.memo(CoinExpiryBanner);

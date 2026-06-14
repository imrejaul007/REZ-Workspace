// @ts-nocheck
/**
 * VisitProgressBar
 *
 * Phase 1.4 — Visit Progress Visualization
 * Shows animated linear progress bar: "3/5 visits to unlock Gold at {merchant}"
 * Displays current tier icon and next tier icon on either side.
 * Animates fill on mount.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { colors } from '@/constants/theme';

// ============================================================================
// TYPES
// ============================================================================

// CV-14 FIX: TierName is now lowercase to match backend canonical values.
export type TierName = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface VisitProgressBarProps {
  currentVisits: number;
  requiredVisits: number;
  currentTier: TierName;
  nextTier: TierName;
  merchantName: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const TIER_CONFIG: Record<TierName, { emoji: string; color: string; bg: string }> = {
  bronze:   { emoji: '🥉', color: '#CD7F32', bg: '#FDF0E8' },
  silver:   { emoji: '🥈', color: '#9AA7B2', bg: '#F4F6F8' },
  gold:     { emoji: '🏆', color: colors.lightMustard, bg: colors.tint.amber },
  platinum: { emoji: '💎', color: '#B2DFDB', bg: '#E0F2F1' },
};

// ============================================================================
// COMPONENT
// ============================================================================

const VisitProgressBar: React.FC<VisitProgressBarProps> = ({
  currentVisits,
  requiredVisits,
  currentTier,
  nextTier,
  merchantName,
}) => {
  const progress = Math.min(currentVisits / requiredVisits, 1);
  const widthAnim = useRef(new Animated.Value(0)).current;

  const currentConfig = TIER_CONFIG[currentTier];
  const nextConfig = TIER_CONFIG[nextTier];
  const remaining = Math.max(requiredVisits - currentVisits, 0);

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 900,
      delay: 200,
      useNativeDriver: false,
    }).start();
  }, [progress, widthAnim]);

  return (
    <View style={styles.container}>
      {/* Label row */}
      <View style={styles.labelRow}>
        <ThemedText style={styles.visitLabel}>
          <ThemedText style={styles.visitCount}>{currentVisits}</ThemedText>
          <ThemedText style={styles.visitSeparator}>/{requiredVisits}</ThemedText>
          {' '}visits
        </ThemedText>
        <ThemedText style={styles.merchantName} numberOfLines={1}>
          {merchantName}
        </ThemedText>
      </View>

      {/* Progress track */}
      <View style={styles.trackRow}>
        {/* Current tier icon */}
        <View style={[styles.tierBadge, { backgroundColor: currentConfig.bg }]}>
          <ThemedText style={styles.tierEmoji}>{currentConfig.emoji}</ThemedText>
        </View>

        {/* Track */}
        <View style={styles.track}>
          <Animated.View
            style={[
              styles.fill,
              {
                width: widthAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: nextConfig.color,
              },
            ]}
          />
          {/* Visit dots */}
          {Array.from({ length: requiredVisits }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { left: `${((i + 1) / requiredVisits) * 100}%` as unknown },
                i < currentVisits && styles.dotFilled,
              ]}
            />
          ))}
        </View>

        {/* Next tier icon */}
        <View style={[styles.tierBadge, { backgroundColor: nextConfig.bg }]}>
          <ThemedText style={styles.tierEmoji}>{nextConfig.emoji}</ThemedText>
        </View>
      </View>

      {/* Sub-label */}
      <ThemedText style={styles.subLabel}>
        {remaining === 0
          ? `${nextTier} unlocked at ${merchantName}! 🎉`
          : `${remaining} more ${remaining === 1 ? 'visit' : 'visits'} to unlock ${nextTier}`}
      </ThemedText>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    shadowColor: colors.nileBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.tint.coolGray,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visitLabel: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  visitCount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  visitSeparator: {
    fontSize: 13,
    color: colors.gray[400],
  },
  merchantName: {
    fontSize: 12,
    color: colors.gray[500],
    maxWidth: '55%',
    textAlign: 'right',
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tierBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tierEmoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  track: {
    flex: 1,
    height: 10,
    backgroundColor: colors.gray[200],
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 5,
  },
  dot: {
    position: 'absolute',
    top: '50%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gray[300],
    marginTop: -3,
    marginLeft: -3,
  },
  dotFilled: {
    backgroundColor: colors.background.primary,
    borderWidth: 2,
    borderColor: colors.lightMustard,
  },
  subLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default React.memo(VisitProgressBar);

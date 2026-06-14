/**
 * PostPaymentSummary
 *
 * Phase 1.6 — "Check REZ Before Paying" Flow
 * Shown after payment completes:
 *  - Animated coin counter (earned)
 *  - Updated balance
 *  - Total lifetime savings
 *  - Streak updated badge
 *  - Next milestone preview
 *  - Share button
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Share,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

// ============================================================================
// TYPES
// ============================================================================

export interface PostPaymentSummaryProps {
  coinsEarned: number;
  newBalance: number;
  lifetimeSavings: number;
  streakDays: number;
  nextMilestone?: string;
  /** When true, coins have not been credited yet — display a pending message
   * instead of the animated zero counter */
  coinsPending?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

const PostPaymentSummary: React.FC<PostPaymentSummaryProps> = ({
  coinsEarned,
  newBalance,
  lifetimeSavings,
  streakDays,
  nextMilestone,
  coinsPending = false,
}) => {
  const [displayCount, setDisplayCount] = useState(0);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    // Entry animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 100,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Count-up animation
    const duration = 1000;
    const steps = 35;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayCount(Math.round(eased * coinsEarned));
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [coinsEarned, scaleAnim, opacityAnim]);

  const handleShare = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await Share.share({
        message: `I just saved Rs.${lifetimeSavings.toLocaleString('en-IN')} in total using REZ! Join me and start saving on every purchase 🪙 #REZ #SaveSmart`,
        title: 'My REZ Savings',
      });
    } catch {
      // User cancelled share
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      {/* Success header */}
      <View style={styles.successHeader}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={22} color={colors.background.primary} />
        </View>
        <ThemedText style={styles.successTitle}>Payment Complete!</ThemedText>
      </View>

      {/* Coins earned — or pending if coins have not been credited yet */}
      <View style={styles.earnedSection}>
        {coinsPending ? (
          <>
            <ThemedText style={styles.earnedLabel}>Coins Pending</ThemedText>
            <View style={styles.earnedRow}>
              <ThemedText style={styles.earnedEmoji}>🪙</ThemedText>
              <ThemedText style={[styles.earnedCount, styles.earnedPendingText]}>
                Pending
              </ThemedText>
            </View>
            <ThemedText style={styles.earnedPendingNote}>
              Coins will be credited when your order is delivered
            </ThemedText>
          </>
        ) : (
          <>
            <ThemedText style={styles.earnedLabel}>Coins Earned</ThemedText>
            <View style={styles.earnedRow}>
              <ThemedText style={styles.earnedEmoji}>🪙</ThemedText>
              <ThemedText style={styles.earnedCount}>
                +{displayCount.toLocaleString('en-IN')}
              </ThemedText>
            </View>
          </>
        )}
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        {/* New Balance */}
        <View style={styles.statCell}>
          <ThemedText style={styles.statLabel}>New Balance</ThemedText>
          <ThemedText style={styles.statValue}>
            {newBalance.toLocaleString('en-IN')}
          </ThemedText>
          <ThemedText style={styles.statUnit}>coins</ThemedText>
        </View>

        <View style={styles.statDivider} />

        {/* Lifetime savings */}
        <View style={styles.statCell}>
          <ThemedText style={styles.statLabel}>Lifetime Savings</ThemedText>
          <ThemedText style={[styles.statValue, styles.savingsValue]}>
            Rs.{lifetimeSavings.toLocaleString('en-IN')}
          </ThemedText>
          <ThemedText style={styles.statUnit}>total saved</ThemedText>
        </View>
      </View>

      {/* Streak badge */}
      {streakDays > 0 && (
        <View style={styles.streakBanner}>
          <ThemedText style={styles.streakEmoji}>🔥</ThemedText>
          <ThemedText style={styles.streakText}>
            {streakDays}-day savings streak!
            {streakDays >= 7 ? ' You\'re on fire!' : ' Keep it up!'}
          </ThemedText>
        </View>
      )}

      {/* Next milestone */}
      {nextMilestone ? (
        <View style={styles.milestonePill}>
          <Ionicons name="flag-outline" size={13} color={colors.lightMustard} />
          <ThemedText style={styles.milestoneText} numberOfLines={2}>
            Next: {nextMilestone}
          </ThemedText>
        </View>
      ) : null}

      {/* Share button */}
      <Pressable
        style={({ pressed }) => [styles.shareBtn, pressed ? styles.shareBtnPressed : null]}
        onPress={handleShare}
      >
        <Ionicons name="share-social-outline" size={18} color={colors.background.dark} />
        <ThemedText style={styles.shareBtnText}>Share your savings</ThemedText>
      </Pressable>
    </Animated.View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: 22,
    padding: 22,
    gap: 14,
    shadowColor: colors.nileBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  checkCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  earnedSection: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: colors.background.dark,
    borderRadius: 14,
  },
  earnedLabel: {
    fontSize: 12,
    color: colors.lightPeach,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  earnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  earnedEmoji: {
    fontSize: 30,
    lineHeight: 38,
  },
  earnedCount: {
    fontSize: 44,
    fontWeight: '900',
    color: colors.lightMustard,
    lineHeight: 50,
    letterSpacing: -1,
  },
  earnedPendingText: {
    fontSize: 28,
    color: colors.lightPeach,
    letterSpacing: 0,
  },
  earnedPendingNote: {
    fontSize: 12,
    color: colors.lightPeach,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 4,
    opacity: 0.85,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.tint.coolGray,
    borderRadius: 12,
    padding: 14,
    gap: 0,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.gray[200],
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.gray[500],
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
  },
  savingsValue: {
    color: colors.success,
  },
  statUnit: {
    fontSize: 10,
    color: colors.gray[400],
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.tint.amber,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  streakEmoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.warningScale[700],
  },
  milestonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background.dark,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  milestoneText: {
    fontSize: 12,
    color: colors.lightPeach,
    fontWeight: '500',
    flex: 1,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.lightMustard,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 2,
  },
  shareBtnPressed: {
    opacity: 0.85,
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.background.dark,
  },
});

export default React.memo(PostPaymentSummary);

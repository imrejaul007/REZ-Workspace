// @ts-nocheck
/**
 * Weekly Digest Screen
 *
 * "Your Week in REZ" - A comprehensive weekly summary that:
 * - Shows total savings with comparison
 * - Highlights discoveries made
 * - Reinforces good habits
 * - Previews what's coming
 *
 * Philosophy: End each week with a sense of progress and anticipation.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '@/constants/theme';
import { logger } from '@/utils/logger';
import {
  WeeklyDigest,
  MOCK_WEEKLY_DIGEST,
  WeekSummary,
} from '@/components/social/WeeklyDigestCard';
import { useTrendingItems, useFriendsActivity } from '@/hooks/useLiveActivity';

// ============================================================================
// TYPES
// ============================================================================

interface WeeklyState {
  currentWeek: WeekSummary;
  pastWeeks: WeekSummary[];
  isShowingPast: boolean;
  selectedPastIndex: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WeeklyDigestScreen() {
  const router = useRouter();
  const [state, setState] = useState<WeeklyState>({
    currentWeek: MOCK_WEEKLY_DIGEST,
    pastWeeks: [],
    isShowingPast: false,
    selectedPastIndex: -1,
  });

  // Live data for personalized tips
  const { items: trendingItems } = useTrendingItems();
  const { activities: friendsActivity } = useFriendsActivity();

  const handleDismiss = useCallback(() => {
    router.back();
  }, [router]);

  const handleActionPress = useCallback(
    (route: string) => {
      router.push(route as unknown);
    },
    [router]
  );

  const handleShare = useCallback(() => {
    // In production: native share sheet
    logger.debug('Share weekly digest');
  }, []);

  const displayWeek = state.isShowingPast && state.selectedPastIndex >= 0
    ? state.pastWeeks[state.selectedPastIndex]
    : state.currentWeek;

  // Personalized tips based on live data
  const personalizedTips = useMemo(() => {
    const tips: { icon: string; text: string }[] = [];

    // Tip about trending items
    if (trendingItems && trendingItems.length > 0) {
      const topItem = trendingItems[0];
      tips.push({
        icon: '🔥',
        text: `${topItem.name} is trending this week with ${topItem.cashback}% cashback`,
      });
    }

    // Tip about friends
    if (friendsActivity && friendsActivity.length > 0) {
      tips.push({
        icon: '👥',
        text: `${friendsActivity.length} friends have been active on REZ this week`,
      });
    }

    // Generic tips
    tips.push({
      icon: '💡',
      text: 'Try ordering from Korean restaurants on Fridays for extra cashback',
    });
    tips.push({
      icon: '🎯',
      text: 'Your Saturday spending is highest - consider planning ahead',
    });

    return tips;
  }, [trendingItems, friendsActivity]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={handleDismiss}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Your Week in REZ</Text>
          <Text style={styles.headerSubtitle}>Week {displayWeek.weekNumber}</Text>
        </View>
        <Pressable style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={colors.brand.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Digest Card */}
        <WeeklyDigest
          summary={displayWeek}
          onDismiss={handleDismiss}
          onActionPress={handleActionPress}
        />

        {/* Weekly Highlights */}
        <Animated.View entering={FadeIn.delay(600)} style={styles.highlightsSection}>
          <Text style={styles.highlightsTitle}>Highlights</Text>

          <View style={styles.highlightsList}>
            <View style={styles.highlightItem}>
              <View style={[styles.highlightIcon, { backgroundColor: '#E8F5E9' }]}>
                <Text style={styles.highlightEmoji}>🏆</Text>
              </View>
              <View style={styles.highlightContent}>
                <Text style={styles.highlightLabel}>Best savings day</Text>
                <Text style={styles.highlightValue}>Saturday - ₹420</Text>
              </View>
            </View>

            <View style={styles.highlightItem}>
              <View style={[styles.highlightIcon, { backgroundColor: '#E3F2FD' }]}>
                <Text style={styles.highlightEmoji}>🌟</Text>
              </View>
              <View style={styles.highlightContent}>
                <Text style={styles.highlightLabel}>Most used feature</Text>
                <Text style={styles.highlightValue}>Smart recommendations</Text>
              </View>
            </View>

            <View style={styles.highlightItem}>
              <View style={[styles.highlightIcon, { backgroundColor: '#FFF3E0' }]}>
                <Text style={styles.highlightEmoji}>📍</Text>
              </View>
              <View style={styles.highlightContent}>
                <Text style={styles.highlightLabel}>Most visited</Text>
                <Text style={styles.highlightValue}>Café Mocha - 4 visits</Text>
              </View>
            </View>

            <View style={styles.highlightItem}>
              <View style={[styles.highlightIcon, { backgroundColor: '#FCE4EC' }]}>
                <Text style={styles.highlightEmoji}>👥</Text>
              </View>
              <View style={styles.highlightContent}>
                <Text style={styles.highlightLabel}>Social impact</Text>
                <Text style={styles.highlightValue}>₹50 donated via Karma</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View entering={FadeIn.delay(700)} style={styles.statsSection}>
          <Text style={styles.statsTitle}>This Month</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>₹4,890</Text>
              <Text style={styles.statLabel}>Total saved</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>73</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>4</Text>
              <Text style={styles.statLabel}>New places</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>21</Text>
              <Text style={styles.statLabel}>Day streak</Text>
            </View>
          </View>
        </Animated.View>

        {/* Comparison Card */}
        <Animated.View entering={FadeIn.delay(800)} style={styles.comparisonSection}>
          <Text style={styles.comparisonTitle}>vs Last Month</Text>
          <View style={styles.comparisonCard}>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Savings</Text>
              <View style={styles.comparisonValue}>
                <Text style={[styles.comparisonAmount, { color: colors.success }]}>+18%</Text>
                <Ionicons name="trending-up" size={16} color={colors.success} />
              </View>
            </View>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Transactions</Text>
              <View style={styles.comparisonValue}>
                <Text style={[styles.comparisonAmount, { color: colors.success }]}>+12%</Text>
                <Ionicons name="trending-up" size={16} color={colors.success} />
              </View>
            </View>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Active days</Text>
              <View style={styles.comparisonValue}>
                <Text style={[styles.comparisonAmount, { color: colors.success }]}>+2</Text>
                <Ionicons name="trending-up" size={16} color={colors.success} />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Tips Section */}
        <Animated.View entering={FadeIn.delay(900)} style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Tips for Next Week</Text>
          <View style={styles.tipsList}>
            {personalizedTips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Text style={styles.tipIcon}>{tip.icon}</Text>
                <Text style={styles.tipText}>{tip.text}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  closeButton: {
    padding: spacing.sm,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.tertiary,
  },
  shareButton: {
    padding: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },

  // Highlights
  highlightsSection: {
    marginTop: spacing.xl,
  },
  highlightsTitle: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  highlightsList: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.md,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  highlightIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  highlightEmoji: {
    fontSize: 20,
  },
  highlightContent: {
    flex: 1,
  },
  highlightLabel: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.tertiary,
  },
  highlightValue: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text.primary,
  },

  // Stats
  statsSection: {
    marginTop: spacing.xl,
  },
  statsTitle: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.h4.fontSize,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  statLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
    marginTop: 2,
  },

  // Comparison
  comparisonSection: {
    marginTop: spacing.xl,
  },
  comparisonTitle: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  comparisonCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.lg,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  comparisonLabel: {
    fontSize: typography.body.fontSize,
    color: colors.text.secondary,
  },
  comparisonValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comparisonAmount: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    marginRight: spacing.xs,
  },

  // Tips
  tipsSection: {
    marginTop: spacing.xl,
  },
  tipsTitle: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  tipsList: {
    backgroundColor: colors.primary[100] + '10',
    borderRadius: 16,
    padding: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.brand.primary,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  tipIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});

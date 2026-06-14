/**
 * Weekly REZ Digest Component
 *
 * "Your Week in REZ" - A weekly summary that reinforces:
 * - How much was saved
 * - What was discovered
 * - How habits evolved
 * - What to look forward to
 *
 * Philosophy: End each week with a sense of progress and anticipation.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { colors, spacing, borderRadius, typography } from '@/constants/theme';

// ============================================================================
// TYPES
// ============================================================================

export interface WeekSummary {
  weekNumber: number;
  startDate: string;
  endDate: string;
  savings: {
    total: number;
    comparedToLastWeek: number; // percentage
    topCategory: string;
    transactions: number;
  };
  discoveries: {
    newPlaces: number;
    newProducts: number;
    friendsJoined: number;
  };
  engagement: {
    streakDays: number;
    activeDays: number;
    topFeature: string;
  };
  habits: {
    improved: string[];
    new: string[];
  };
  preview: {
    upcoming: string[];
    toExplore: string[];
  };
}

interface WeeklyDigestProps {
  summary: WeekSummary;
  onDismiss?: () => void;
  onActionPress?: (route: string) => void;
}

// ============================================================================
// MOCK DATA
// ============================================================================

export const MOCK_WEEKLY_DIGEST: WeekSummary = {
  weekNumber: 21,
  startDate: 'May 13',
  endDate: 'May 19',
  savings: {
    total: 1240,
    comparedToLastWeek: 23, // 23% more than last week
    topCategory: 'food delivery',
    transactions: 18,
  },
  discoveries: {
    newPlaces: 3,
    newProducts: 2,
    friendsJoined: 1,
  },
  engagement: {
    streakDays: 7,
    activeDays: 6,
    topFeature: 'Smart recommendations',
  },
  habits: {
    improved: ['Dining cashback', 'Smart ordering'],
    new: ['Friday evening shopping'],
  },
  preview: {
    upcoming: ['Weekend deals', 'New restaurant partners'],
    toExplore: ['Korean cuisine', 'Fitness partners'],
  },
};

// ============================================================================
// COMPONENTS
// ============================================================================

interface SavingsHighlightProps {
  total: number;
  comparedToLastWeek: number;
  topCategory: string;
  transactions: number;
}

function SavingsHighlight({
  total,
  comparedToLastWeek,
  topCategory,
  transactions,
}: SavingsHighlightProps) {
  const isPositive = comparedToLastWeek >= 0;

  return (
    <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.savingsCard}>
      <View style={styles.savingsHeader}>
        <Text style={styles.savingsEmoji}>💰</Text>
        <View>
          <Text style={styles.savingsLabel}>Total Saved This Week</Text>
          <Text style={styles.savingsAmount}>₹{total.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      <View style={styles.savingsStats}>
        <View style={styles.savingsStat}>
          <Ionicons
            name={isPositive ? 'trending-up' : 'trending-down'}
            size={16}
            color={isPositive ? colors.success : colors.error}
          />
          <Text style={[styles.savingsStatText, { color: isPositive ? colors.success : colors.error }]}>
            {isPositive ? '+' : ''}{comparedToLastWeek}% vs last week
          </Text>
        </View>
        <Text style={styles.savingsStatDivider}>•</Text>
        <Text style={styles.savingsStatText}>{transactions} transactions</Text>
      </View>

      <View style={styles.topCategory}>
        <Text style={styles.topCategoryLabel}>Top category:</Text>
        <Text style={styles.topCategoryValue}>{topCategory}</Text>
      </View>
    </Animated.View>
  );
}

interface DiscoveriesSectionProps {
  newPlaces: number;
  newProducts: number;
  friendsJoined: number;
}

function DiscoveriesSection({
  newPlaces,
  newProducts,
  friendsJoined,
}: DiscoveriesSectionProps) {
  const items = [
    { icon: '🏪', count: newPlaces, label: 'New places' },
    { icon: '🛍️', count: newProducts, label: 'New products' },
    { icon: '👥', count: friendsJoined, label: 'Friends joined' },
  ];

  return (
    <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
      <Text style={styles.sectionTitle}>What You Discovered</Text>
      <View style={styles.discoveriesGrid}>
        {items.map((item, index) => (
          <View key={index} style={styles.discoveryItem}>
            <Text style={styles.discoveryIcon}>{item.icon}</Text>
            <Text style={styles.discoveryCount}>{item.count}</Text>
            <Text style={styles.discoveryLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

interface HabitsSectionProps {
  improved: string[];
  new: string[];
}

function HabitsSection({ improved, new: newHabits }: HabitsSectionProps) {
  return (
    <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
      <Text style={styles.sectionTitle}>Your Habits</Text>

      {improved.length > 0 && (
        <View style={styles.habitsGroup}>
          <Text style={styles.habitsGroupLabel}>Improved</Text>
          <View style={styles.habitsChips}>
            {improved.map((habit, index) => (
              <View key={index} style={[styles.habitChip, styles.habitChipImproved]}>
                <Text style={styles.habitChipIcon}>📈</Text>
                <Text style={styles.habitChipText}>{habit}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {newHabits.length > 0 && (
        <View style={styles.habitsGroup}>
          <Text style={styles.habitsGroupLabel}>New this week</Text>
          <View style={styles.habitsChips}>
            {newHabits.map((habit, index) => (
              <View key={index} style={[styles.habitChip, styles.habitChipNew]}>
                <Text style={styles.habitChipIcon}>✨</Text>
                <Text style={styles.habitChipText}>{habit}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </Animated.View>
  );
}

interface EngagementSectionProps {
  streakDays: number;
  activeDays: number;
  topFeature: string;
}

function EngagementSection({
  streakDays,
  activeDays,
  topFeature,
}: EngagementSectionProps) {
  return (
    <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
      <Text style={styles.sectionTitle}>Your Engagement</Text>
      <View style={styles.engagementGrid}>
        <View style={styles.engagementItem}>
          <Text style={styles.engagementIcon}>🔥</Text>
          <Text style={styles.engagementValue}>{streakDays}</Text>
          <Text style={styles.engagementLabel}>Day streak</Text>
        </View>
        <View style={styles.engagementItem}>
          <Text style={styles.engagementIcon}>📅</Text>
          <Text style={styles.engagementValue}>{activeDays}/7</Text>
          <Text style={styles.engagementLabel}>Days active</Text>
        </View>
        <View style={styles.engagementItem}>
          <Text style={styles.engagementIcon}>⭐</Text>
          <Text style={styles.engagementValue} numberOfLines={1}>
            {topFeature}
          </Text>
          <Text style={styles.engagementLabel}>Top feature</Text>
        </View>
      </View>
    </Animated.View>
  );
}

interface PreviewSectionProps {
  upcoming: string[];
  toExplore: string[];
  onActionPress?: (route: string) => void;
}

function PreviewSection({ upcoming, toExplore, onActionPress }: PreviewSectionProps) {
  return (
    <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.section}>
      <Text style={styles.sectionTitle}>Coming Up</Text>

      <View style={styles.previewCard}>
        <Text style={styles.previewHeader}>This week on REZ</Text>
        {upcoming.map((item, index) => (
          <View key={index} style={styles.previewItem}>
            <Ionicons name="calendar-outline" size={16} color={colors.brand.primary} />
            <Text style={styles.previewText}>{item}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.exploreCard} onPress={() => onActionPress?.('/explore')}>
        <View style={styles.exploreContent}>
          <Text style={styles.exploreIcon}>🔮</Text>
          <View style={styles.exploreText}>
            <Text style={styles.exploreTitle}>To explore</Text>
            <Text style={styles.exploreSubtitle}>
              Based on your interests: {toExplore.join(', ')}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
      </Pressable>
    </Animated.View>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function WeeklyDigest({
  summary,
  onDismiss,
  onActionPress,
}: WeeklyDigestProps) {
  const formattedDateRange = `${summary.startDate} - ${summary.endDate}`;

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Your Week in REZ</Text>
          <Text style={styles.headerDate}>{formattedDateRange}</Text>
        </View>
        {onDismiss && (
          <Pressable style={styles.dismissButton} onPress={onDismiss}>
            <Ionicons name="close" size={20} color={colors.text.tertiary} />
          </Pressable>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <SavingsHighlight
          total={summary.savings.total}
          comparedToLastWeek={summary.savings.comparedToLastWeek}
          topCategory={summary.savings.topCategory}
          transactions={summary.savings.transactions}
        />

        <DiscoveriesSection
          newPlaces={summary.discoveries.newPlaces}
          newProducts={summary.discoveries.newProducts}
          friendsJoined={summary.discoveries.friendsJoined}
        />

        <EngagementSection
          streakDays={summary.engagement.streakDays}
          activeDays={summary.engagement.activeDays}
          topFeature={summary.engagement.topFeature}
        />

        <HabitsSection
          improved={summary.habits.improved}
          new={summary.habits.new}
        />

        <PreviewSection
          upcoming={summary.preview.upcoming}
          toExplore={summary.preview.toExplore}
          onActionPress={onActionPress}
        />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable style={styles.shareButton}>
          <Ionicons name="share-outline" size={20} color={colors.brand.primary} />
          <Text style={styles.shareButtonText}>Share progress</Text>
        </Pressable>
        <Text style={styles.footerText}>
          See you next week! 👋
        </Text>
      </View>
    </Animated.View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    backgroundColor: colors.brand.primary,
  },
  headerTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: '700',
    color: '#FFF',
  },
  headerDate: {
    fontSize: typography.bodySmall.fontSize,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
  },
  dismissButton: {
    padding: spacing.xs,
  },
  content: {
    maxHeight: 500,
  },
  contentContainer: {
    padding: spacing.lg,
  },

  // Savings Highlight
  savingsCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  savingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  savingsEmoji: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  savingsLabel: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.secondary,
  },
  savingsAmount: {
    fontSize: typography.h2.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
  },
  savingsStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  savingsStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savingsStatText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  savingsStatDivider: {
    marginHorizontal: spacing.sm,
    color: colors.text.tertiary,
  },
  topCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  topCategoryLabel: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.tertiary,
    marginRight: spacing.xs,
  },
  topCategoryValue: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.text.primary,
  },

  // Section
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },

  // Discoveries
  discoveriesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  discoveryItem: {
    alignItems: 'center',
  },
  discoveryIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  discoveryCount: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
  },
  discoveryLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
  },

  // Engagement
  engagementGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  engagementItem: {
    alignItems: 'center',
    flex: 1,
  },
  engagementIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  engagementValue: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  engagementLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
    marginTop: 2,
  },

  // Habits
  habitsGroup: {
    marginBottom: spacing.md,
  },
  habitsGroupLabel: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  habitsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  habitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  habitChipImproved: {
    backgroundColor: colors.success + '15',
  },
  habitChipNew: {
    backgroundColor: colors.primary[100] + '20',
  },
  habitChipIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  habitChipText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.primary,
  },

  // Preview
  previewCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  previewHeader: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  previewText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  exploreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[100] + '15',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  exploreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exploreIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  exploreText: {
    flex: 1,
  },
  exploreTitle: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.text.primary,
  },
  exploreSubtitle: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Footer
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.background.tertiary,
    alignItems: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primary + '15',
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  shareButtonText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.brand.primary,
    marginLeft: spacing.xs,
  },
  footerText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.tertiary,
  },
});

export default WeeklyDigest;

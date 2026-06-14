/**
 * SavingsHomeWidget - Embeddable savings preview for home screen
 *
 * Shows:
 * - Total savings with streak
 * - Quick action to view full dashboard
 * - Progress toward goals
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSavings } from '@/hooks/useSavings';
import { formatSavings } from '@/services/savingsApi';
import { Colors, Spacing, BorderRadius } from '@/constants/DesignSystem';

interface SavingsHomeWidgetProps {
  variant?: 'compact' | 'featured' | 'banner';
}

export default function SavingsHomeWidget({ variant = 'featured' }: SavingsHomeWidgetProps) {
  const router = useRouter();
  const { dashboard, dashboardLoading } = useSavings();

  // Don't render if no savings data
  if (!dashboard && !dashboardLoading) {
    return null;
  }

  // Compact variant - minimal card
  if (variant === 'compact') {
    return (
      <Pressable style={styles.compactContainer} onPress={() => router.push('/savings')}>
        <View style={styles.compactLeft}>
          <Text style={styles.compactIcon}>💰</Text>
          <View>
            <Text style={styles.compactLabel}>Savings</Text>
            <Text style={styles.compactAmount}>
              {dashboard ? formatSavings(dashboard.totalSavingsAmount) : '...'}
            </Text>
          </View>
        </View>
        {dashboard?.currentStreak && dashboard.currentStreak > 0 && (
          <View style={styles.compactStreak}>
            <Text style={styles.compactStreakIcon}>🔥</Text>
            <Text style={styles.compactStreakText}>{dashboard.currentStreak}</Text>
          </View>
        )}
      </Pressable>
    );
  }

  // Featured variant - card with stats
  if (variant === 'featured') {
    return (
      <Pressable onPress={() => router.push('/savings')}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featuredContainer}
        >
          <View style={styles.featuredHeader}>
            <View style={styles.featuredTitleRow}>
              <Text style={styles.featuredEmoji}>💰</Text>
              <Text style={styles.featuredTitle}>My Savings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
          </View>

          <View style={styles.featuredMain}>
            <Text style={styles.featuredAmount}>
              {dashboard ? formatSavings(dashboard.totalSavingsAmount) : '₹0'}
            </Text>
            <View style={styles.featuredMeta}>
              {dashboard && dashboard.thisMonthAmount > 0 && (
                <Text style={styles.featuredMetaText}>
                  +{formatSavings(dashboard.thisMonthAmount)} this month
                </Text>
              )}
            </View>
          </View>

          <View style={styles.featuredStats}>
            <View style={styles.featuredStat}>
              <Text style={styles.featuredStatValue}>
                {dashboard?.projection30Days ? formatSavings(dashboard.projection30Days) : '-'}
              </Text>
              <Text style={styles.featuredStatLabel}>30D</Text>
            </View>
            <View style={styles.featuredStatDivider} />
            <View style={styles.featuredStat}>
              <Text style={styles.featuredStatValue}>
                {dashboard?.currentStreak ?? 0}
              </Text>
              <Text style={styles.featuredStatLabel}>Streak</Text>
            </View>
            <View style={styles.featuredStatDivider} />
            <View style={styles.featuredStat}>
              <Text style={styles.featuredStatValue}>
                {dashboard?.goalProgress?.length ?? 0}
              </Text>
              <Text style={styles.featuredStatLabel}>Goals</Text>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    );
  }

  // Banner variant - horizontal strip
  return (
    <Pressable
      style={styles.bannerContainer}
      onPress={() => router.push('/savings')}
    >
      <View style={styles.bannerLeft}>
        <View style={styles.bannerIconContainer}>
          <Text style={styles.bannerIcon}>💰</Text>
        </View>
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>Total Savings</Text>
          <Text style={styles.bannerAmount}>
            {dashboard ? formatSavings(dashboard.totalSavingsAmount) : '...'}
          </Text>
        </View>
      </View>
      <View style={styles.bannerRight}>
        {dashboard?.currentStreak && dashboard.currentStreak > 0 && (
          <View style={styles.bannerStreak}>
            <Text style={styles.bannerStreakIcon}>🔥</Text>
            <Text style={styles.bannerStreakText}>{dashboard.currentStreak}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
      </View>
    </Pressable>
  );
}

// ─── Savings Goal Progress Card ───────────────────────────────────────────────

interface SavingsGoalProgressProps {
  compact?: boolean;
}

export function SavingsGoalProgressCard({ compact = false }: SavingsGoalProgressProps) {
  const router = useRouter();
  const { dashboard } = useSavings();

  const goals = dashboard?.goalProgress || [];

  if (goals.length === 0) {
    return (
      <View style={styles.goalEmptyCard}>
        <Text style={styles.goalEmptyIcon}>🎯</Text>
        <Text style={styles.goalEmptyTitle}>Set a Savings Goal</Text>
        <Text style={styles.goalEmptyText}>Start saving toward something special</Text>
        <Pressable
          style={styles.goalEmptyButton}
          onPress={() => router.push('/savings/goals')}
        >
          <Text style={styles.goalEmptyButtonText}>Create Goal</Text>
        </Pressable>
      </View>
    );
  }

  if (compact) {
    const topGoal = goals[0];
    return (
      <Pressable style={styles.goalCompactCard} onPress={() => router.push('/savings/goals')}>
        <View style={styles.goalCompactHeader}>
          <Text style={styles.goalCompactIcon}>{topGoal.icon || '🎯'}</Text>
          <View style={styles.goalCompactInfo}>
            <Text style={styles.goalCompactName}>{topGoal.name}</Text>
            <View style={styles.goalCompactBar}>
              <View style={[styles.goalCompactFill, { width: `${Math.min(topGoal.percent, 100)}%` }]} />
            </View>
          </View>
          <Text style={styles.goalCompactPercent}>{topGoal.percent}%</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.goalCard}>
      <View style={styles.goalCardHeader}>
        <Text style={styles.goalCardTitle}>Savings Goals</Text>
        <Pressable onPress={() => router.push('/savings/goals')}>
          <Text style={styles.goalCardSeeAll}>See All</Text>
        </Pressable>
      </View>

      {goals.slice(0, 3).map((goal) => (
        <Pressable
          key={goal.goalId}
          style={styles.goalItem}
          onPress={() => router.push(`/savings/goals/${goal.goalId}`)}
        >
          <View style={styles.goalItemLeft}>
            <Text style={styles.goalItemIcon}>{goal.icon || '🎯'}</Text>
            <View style={styles.goalItemInfo}>
              <Text style={styles.goalItemName}>{goal.name}</Text>
              <View style={styles.goalItemBar}>
                <View style={[styles.goalItemFill, { width: `${Math.min(goal.percent, 100)}%` }]} />
              </View>
              <Text style={styles.goalItemProgress}>
                {formatSavings(goal.current)} / {formatSavings(goal.target)}
              </Text>
            </View>
          </View>
          <Text style={styles.goalItemPercent}>{goal.percent}%</Text>
        </Pressable>
      ))}

      <Pressable
        style={styles.goalAddButton}
        onPress={() => router.push('/savings/goals')}
      >
        <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
        <Text style={styles.goalAddButtonText}>Add New Goal</Text>
      </Pressable>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Compact
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  compactIcon: {
    fontSize: 24,
  },
  compactLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  compactAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  compactStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  compactStreakIcon: {
    fontSize: 14,
  },
  compactStreakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
  },

  // Featured
  featuredContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featuredEmoji: {
    fontSize: 20,
  },
  featuredTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  featuredMain: {
    marginTop: Spacing.sm,
  },
  featuredAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
  },
  featuredMeta: {
    marginTop: 2,
  },
  featuredMetaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  featuredStats: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  featuredStat: {
    flex: 1,
    alignItems: 'center',
  },
  featuredStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  featuredStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  featuredStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Banner
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bannerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerIcon: {
    fontSize: 22,
  },
  bannerText: {
    gap: 2,
  },
  bannerTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  bannerAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  bannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bannerStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  bannerStreakIcon: {
    fontSize: 14,
  },
  bannerStreakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
  },

  // Goal Card
  goalEmptyCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  goalEmptyIcon: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  goalEmptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  goalEmptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  goalEmptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  goalEmptyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  goalCompactCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  goalCompactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  goalCompactIcon: {
    fontSize: 24,
  },
  goalCompactInfo: {
    flex: 1,
  },
  goalCompactName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  goalCompactBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    marginTop: 6,
    overflow: 'hidden',
  },
  goalCompactFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  goalCompactPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },

  goalCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  goalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  goalCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  goalCardSeeAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  goalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  goalItemIcon: {
    fontSize: 20,
  },
  goalItemInfo: {
    flex: 1,
  },
  goalItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  goalItemBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  goalItemFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  goalItemProgress: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  goalItemPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  goalAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: 6,
  },
  goalAddButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});

/**
 * SavingsWidget - Compact widget for displaying savings stats
 * Can be embedded in home screen, wallet screen, or notifications
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSavings } from '@/hooks/useSavings';
import { formatSavings } from '@/services/savingsApi';
import { Colors, Spacing, BorderRadius } from '@/constants/DesignSystem';

interface SavingsWidgetProps {
  variant?: 'compact' | 'full' | 'minimal';
  showStreak?: boolean;
  showProjection?: boolean;
  onPress?: () => void;
}

export default function SavingsWidget({
  variant = 'compact',
  showStreak = true,
  showProjection = true,
  onPress,
}: SavingsWidgetProps) {
  const router = useRouter();
  const { dashboard, dashboardLoading } = useSavings();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/savings');
    }
  };

  // Minimal variant - just the amount
  if (variant === 'minimal') {
    return (
      <Pressable style={styles.minimalContainer} onPress={handlePress}>
        <View style={styles.minimalContent}>
          <Text style={styles.minimalIcon}>💰</Text>
          <Text style={styles.minimalAmount}>
            {dashboard ? formatSavings(dashboard.totalSavingsAmount) : '₹0'}
          </Text>
        </View>
        {showStreak && dashboard?.currentStreak && dashboard.currentStreak > 0 && (
          <View style={styles.minimalStreak}>
            <Text style={styles.minimalStreakText}>🔥 {dashboard.currentStreak}</Text>
          </View>
        )}
      </Pressable>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <Pressable style={styles.compactContainer} onPress={handlePress}>
        <View style={styles.compactHeader}>
          <Text style={styles.compactLabel}>Total Savings</Text>
          {showStreak && dashboard?.streakActive && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakIcon}>🔥</Text>
              <Text style={styles.streakText}>{dashboard.currentStreak}</Text>
            </View>
          )}
        </View>

        <Text style={styles.compactAmount}>
          {dashboard ? formatSavings(dashboard.totalSavingsAmount) : '₹0'}
        </Text>

        {dashboard && dashboard.thisMonthAmount > 0 && (
          <Text style={styles.compactMonthly}>
            +{formatSavings(dashboard.thisMonthAmount)} this month
          </Text>
        )}

        {showProjection && dashboard && (
          <View style={styles.compactProjection}>
            <Text style={styles.projectionLabel}>30D:</Text>
            <Text style={styles.projectionValue}>
              {formatSavings(dashboard.projection30Days)}
            </Text>
          </View>
        )}
      </Pressable>
    );
  }

  // Full variant
  return (
    <Pressable style={styles.fullContainer} onPress={handlePress}>
      <View style={styles.fullHeader}>
        <View>
          <Text style={styles.fullLabel}>My Savings</Text>
          <Text style={styles.fullAmount}>
            {dashboard ? formatSavings(dashboard.totalSavingsAmount) : '₹0'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
      </View>

      {showStreak && dashboard && (
        <View style={styles.fullStreakRow}>
          <View style={styles.streakInfo}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakValue}>{dashboard.currentStreak} day streak</Text>
          </View>
          <Text style={styles.streakStatus}>
            {dashboard.streakActive ? 'Active' : 'At risk'}
          </Text>
        </View>
      )}

      {dashboard && (
        <View style={styles.fullStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>This Month</Text>
            <Text style={styles.statValue}>{formatSavings(dashboard.thisMonthAmount)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>30 Day Proj.</Text>
            <Text style={styles.statValue}>{formatSavings(dashboard.projection30Days)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>1 Year Proj.</Text>
            <Text style={styles.statValue}>{formatSavings(dashboard.projection365Days)}</Text>
          </View>
        </View>
      )}

      {dashboard && dashboard.thisMonthVsLastMonth !== 0 && (
        <View style={styles.fullComparison}>
          <Text style={styles.comparisonText}>
            {dashboard.thisMonthVsLastMonth > 0 ? '↑' : '↓'}{' '}
            {Math.abs(dashboard.thisMonthVsLastMonth)}% vs last month
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// ─── Savings Quick Stats Widget ─────────────────────────────────────────────────

interface SavingsQuickStatsProps {
  onPressHistory?: () => void;
  onPressGoals?: () => void;
}

export function SavingsQuickStats({ onPressHistory, onPressGoals }: SavingsQuickStatsProps) {
  const router = useRouter();
  const { dashboard } = useSavings();

  if (!dashboard) return null;

  return (
    <View style={styles.quickStatsContainer}>
      <Text style={styles.quickStatsTitle}>Quick Stats</Text>
      <View style={styles.quickStatsRow}>
        <Pressable
          style={styles.quickStatCard}
          onPress={onPressHistory || (() => router.push('/savings/history'))}
        >
          <Ionicons name="receipt-outline" size={20} color={Colors.primary} />
          <Text style={styles.quickStatValue}>{dashboard.transactionCount || 0}</Text>
          <Text style={styles.quickStatLabel}>Transactions</Text>
        </Pressable>

        <Pressable
          style={styles.quickStatCard}
          onPress={onPressGoals || (() => router.push('/savings/goals'))}
        >
          <Ionicons name="flag-outline" size={20} color={Colors.primary} />
          <Text style={styles.quickStatValue}>
            {dashboard.goalProgress?.length || 0}
          </Text>
          <Text style={styles.quickStatLabel}>Active Goals</Text>
        </Pressable>

        <View style={styles.quickStatCard}>
          <Ionicons name="trending-up-outline" size={20} color={Colors.primary} />
          <Text style={styles.quickStatValue}>
            {dashboard.thisMonthVsLastMonth > 0 ? '+' : ''}{dashboard.thisMonthVsLastMonth || 0}%
          </Text>
          <Text style={styles.quickStatLabel}>Growth</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Savings Streak Card ──────────────────────────────────────────────────────

interface SavingsStreakCardProps {
  compact?: boolean;
}

export function SavingsStreakCard({ compact = false }: SavingsStreakCardProps) {
  const { streak } = useSavings();
  const router = useRouter();

  if (!streak) return null;

  if (compact) {
    return (
      <Pressable style={styles.streakCompactCard} onPress={() => router.push('/savings')}>
        <View style={styles.streakCompactLeft}>
          <Text style={styles.streakCompactEmoji}>🔥</Text>
          <View>
            <Text style={styles.streakCompactDays}>{streak.currentStreak}</Text>
            <Text style={styles.streakCompactLabel}>day streak</Text>
          </View>
        </View>
        {streak.streakActive && (
          <View style={styles.streakActiveBadge}>
            <Text style={styles.streakActiveText}>Active</Text>
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <View style={styles.streakCard}>
      <View style={styles.streakCardHeader}>
        <View style={styles.streakCardTitle}>
          <Text style={styles.streakCardEmoji}>🔥</Text>
          <Text style={styles.streakCardTitleText}>Savings Streak</Text>
        </View>
        {streak.streakActive ? (
          <View style={styles.streakActiveBadge}>
            <Text style={styles.streakActiveText}>Active</Text>
          </View>
        ) : (
          <View style={styles.streakAtRiskBadge}>
            <Text style={styles.streakAtRiskText}>At Risk</Text>
          </View>
        )}
      </View>

      <View style={styles.streakCardStats}>
        <View style={styles.streakStatItem}>
          <Text style={styles.streakStatValue}>{streak.currentStreak}</Text>
          <Text style={styles.streakStatLabel}>Current</Text>
        </View>
        <View style={styles.streakStatDivider} />
        <View style={styles.streakStatItem}>
          <Text style={styles.streakStatValue}>{streak.longestStreak}</Text>
          <Text style={styles.streakStatLabel}>Longest</Text>
        </View>
        <View style={styles.streakStatDivider} />
        <View style={styles.streakStatItem}>
          <Text style={styles.streakStatValue}>{streak.totalStreakDays}</Text>
          <Text style={styles.streakStatLabel}>Total Days</Text>
        </View>
      </View>

      {!streak.streakActive && streak.daysUntilStreakLost === 1 && (
        <View style={styles.streakReminder}>
          <Text style={styles.streakReminderText}>
            Make a purchase today to keep your streak! 💪
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Minimal
  minimalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  minimalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  minimalIcon: {
    fontSize: 16,
  },
  minimalAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  minimalStreak: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  minimalStreakText: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '600',
  },

  // Compact
  compactContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  streakIcon: {
    fontSize: 12,
  },
  streakText: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '600',
  },
  compactAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.success,
    marginTop: 4,
  },
  compactMonthly: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  compactProjection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 4,
  },
  projectionLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  projectionValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Full
  fullContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  fullHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  fullLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  fullAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.success,
    marginTop: 4,
  },
  fullStreakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  streakStatus: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  fullStats: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  fullComparison: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  comparisonText: {
    fontSize: 12,
    color: Colors.primary,
    textAlign: 'center',
  },

  // Quick Stats
  quickStatsContainer: {
    marginTop: Spacing.md,
  },
  quickStatsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickStatCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  quickStatLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },

  // Streak Card
  streakCompactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  streakCompactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  streakCompactEmoji: {
    fontSize: 24,
  },
  streakCompactDays: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  streakCompactLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  streakAtRiskBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  streakAtRiskText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
  },

  // Full Streak Card
  streakCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  streakCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakCardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  streakCardEmoji: {
    fontSize: 24,
  },
  streakCardTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  streakActiveBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  streakActiveText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
  streakCardStats: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  streakStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  streakStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  streakStatLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  streakStatDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  streakReminder: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderRadius: BorderRadius.sm,
  },
  streakReminderText: {
    fontSize: 12,
    color: '#FF9500',
    textAlign: 'center',
  },
});

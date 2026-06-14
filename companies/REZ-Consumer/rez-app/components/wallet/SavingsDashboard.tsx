/**
 * SavingsDashboard - Complete savings module UI component
 *
 * Shows:
 * - Total savings summary
 * - Savings streak
 * - Projections (30/90/365 days)
 * - Goals progress
 * - Insights and recommendations
 * - Quick actions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSavings } from '@/contexts/SavingsContext';
import { formatSavings, getSavingsTypeInfo, getGoalCategoryInfo } from '@/services/savingsApi';
import { Colors, Spacing, BorderRadius } from '@/constants/DesignSystem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SavingsDashboardProps {
  compact?: boolean; // Show compact version in wallet header
}

// ─── Streak Badge ────────────────────────────────────────────────────────────────

function StreakBadge({ streak, active }: { streak: number; active: boolean }) {
  if (!active || streak === 0) return null;

  return (
    <View style={styles.streakBadge}>
      <Text style={styles.streakIcon}>🔥</Text>
      <Text style={styles.streakText}>{streak} day streak</Text>
    </View>
  );
}

// ─── Projection Card ───────────────────────────────────────────────────────────

function ProjectionCard({ days, amount, label }: { days: number; amount: number; label: string }) {
  return (
    <View style={styles.projectionItem}>
      <Text style={styles.projectionDays}>{days}D</Text>
      <Text style={styles.projectionAmount}>{formatSavings(amount)}</Text>
      <Text style={styles.projectionLabel}>{label}</Text>
    </View>
  );
}

// ─── Goal Progress Item ───────────────────────────────────────────────────────

function GoalProgressItem({
  goal,
  onPress,
}: {
  goal: { goalId: string; name: string; current: number; target: number; percent: number; icon: string };
  onPress: () => void;
}) {
  const categoryInfo = getGoalCategoryInfo();

  return (
    <Pressable style={styles.goalItem} onPress={onPress}>
      <View style={styles.goalIcon}>
        <Text style={styles.goalIconText}>{goal.icon || '🎯'}</Text>
      </View>
      <View style={styles.goalInfo}>
        <Text style={styles.goalName}>{goal.name}</Text>
        <View style={styles.goalProgressBar}>
          <View style={[styles.goalProgressFill, { width: `${Math.min(goal.percent, 100)}%` }]} />
        </View>
        <Text style={styles.goalProgressText}>
          {formatSavings(goal.current)} / {formatSavings(goal.target)} ({goal.percent}%)
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Savings Type Breakdown ────────────────────────────────────────────────────

function SavingsBreakdown({
  byType,
}: {
  byType: Record<string, number>;
}) {
  const total = Object.values(byType).reduce((sum, val) => sum + val, 0);
  if (total === 0) return null;

  const entries = Object.entries(byType)
    .filter(([, amount]) => amount > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  return (
    <View style={styles.breakdownSection}>
      <Text style={styles.sectionTitle}>Savings Breakdown</Text>
      {entries.map(([type, amount]) => {
        const info = getSavingsTypeInfo(type as 'cashback' | 'reward' | 'referral' | 'loyalty' | 'promo' | 'cashback_bonus');
        const percentage = Math.round((amount / total) * 100);

        return (
          <View key={type} style={styles.breakdownItem}>
            <View style={styles.breakdownLabel}>
              <Text style={styles.breakdownIcon}>{info.icon}</Text>
              <Text style={styles.breakdownType}>{info.label}</Text>
            </View>
            <View style={styles.breakdownValues}>
              <Text style={styles.breakdownAmount}>{formatSavings(amount)}</Text>
              <Text style={styles.breakdownPercent}>{percentage}%</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Recommendation Card ─────────────────────────────────────────────────────

function RecommendationCard({
  recommendation,
  onAction,
}: {
  recommendation: { id: string; title: string; description: string; potentialSavings: number; icon: string; actionText: string; priority: 'high' | 'medium' | 'low' };
  onAction: () => void;
}) {
  const priorityColors = {
    high: '#FF5722',
    medium: '#FF9800',
    low: '#4CAF50',
  };

  return (
    <View style={[styles.recommendationCard, { borderLeftColor: priorityColors[recommendation.priority] }]}>
      <View style={styles.recommendationHeader}>
        <Text style={styles.recommendationIcon}>{recommendation.icon}</Text>
        <View style={styles.recommendationContent}>
          <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
          <Text style={styles.recommendationDescription}>{recommendation.description}</Text>
        </View>
      </View>
      <View style={styles.recommendationFooter}>
        <Text style={styles.recommendationSavings}>
          Up to {formatSavings(recommendation.potentialSavings)} potential
        </Text>
        <Pressable style={styles.recommendationAction} onPress={onAction}>
          <Text style={styles.recommendationActionText}>{recommendation.actionText}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────

export default function SavingsDashboard({ compact = false }: SavingsDashboardProps) {
  const router = useRouter();
  const {
    dashboard,
    dashboardLoading,
    dashboardError,
    refreshDashboard,
    recommendations,
  } = useSavings();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshDashboard();
    setRefreshing(false);
  };

  // Loading state
  if (dashboardLoading && !dashboard) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your savings...</Text>
      </View>
    );
  }

  // Error state
  if (dashboardError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={Colors.error} />
        <Text style={styles.errorText}>{dashboardError}</Text>
        <Pressable style={styles.retryButton} onPress={refreshDashboard}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  // Empty state
  if (!dashboard || dashboard.totalSavings === 0) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.emptyContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💰</Text>
          <Text style={styles.emptyTitle}>Start Your Savings Journey</Text>
          <Text style={styles.emptyDescription}>
            Make purchases with REZ to earn cashback and rewards that add up to real savings!
          </Text>
          <Pressable
            style={styles.startButton}
            onPress={() => router.push('/wallet-screen')}
          >
            <Text style={styles.startButtonText}>Explore Deals</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  // Compact view (for wallet header)
  if (compact) {
    return (
      <LinearGradient
        colors={['#4CAF50', '#2E7D32']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.compactContainer}
      >
        <View style={styles.compactHeader}>
          <View>
            <Text style={styles.compactLabel}>Total Savings</Text>
            <Text style={styles.compactAmount}>{formatSavings(dashboard.totalSavingsAmount)}</Text>
          </View>
          <View style={styles.compactStats}>
            <StreakBadge streak={dashboard.currentStreak} active={dashboard.streakActive} />
            <Text style={styles.compactMonth}>
              +{formatSavings(dashboard.thisMonthAmount)} this month
            </Text>
          </View>
        </View>
        <Pressable
          style={styles.compactCta}
          onPress={() => router.push('/savings')}
        >
          <Text style={styles.compactCtaText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </Pressable>
      </LinearGradient>
    );
  }

  // Full dashboard view
  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header Hero */}
      <LinearGradient
        colors={['#4CAF50', '#2E7D32']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        <View style={styles.heroHeader}>
          <Text style={styles.heroLabel}>Your Savings</Text>
          <StreakBadge streak={dashboard.currentStreak} active={dashboard.streakActive} />
        </View>
        <Text style={styles.heroAmount}>{formatSavings(dashboard.totalSavingsAmount)}</Text>
        <Text style={styles.heroSubtext}>
          {dashboard.thisMonthVsLastMonth >= 0 ? '📈' : '📉'}{' '}
          {Math.abs(dashboard.thisMonthVsLastMonth)}% vs last month
        </Text>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatLabel}>This Month</Text>
            <Text style={styles.quickStatValue}>{formatSavings(dashboard.thisMonthAmount)}</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStat}>
            <Text style={styles.quickStatLabel}>Transactions</Text>
            <Text style={styles.quickStatValue}>{dashboard.transactionCount || 0}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Projections Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Savings Projections</Text>
        <View style={styles.projectionsRow}>
          <ProjectionCard days={30} amount={dashboard.projection30Days} label="30 Days" />
          <ProjectionCard days={90} amount={dashboard.projection90Days} label="3 Months" />
          <ProjectionCard days={365} amount={dashboard.projection365Days} label="1 Year" />
        </View>
      </View>

      {/* Goals Section */}
      {dashboard.goalProgress && dashboard.goalProgress.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Savings Goals</Text>
            <Pressable onPress={() => router.push('/savings/goals')}>
              <Text style={styles.seeAllText}>See All</Text>
            </Pressable>
          </View>
          {dashboard.goalProgress.slice(0, 3).map((goal) => (
            <GoalProgressItem
              key={goal.goalId}
              goal={goal}
              onPress={() => router.push(`/savings/goals/${goal.goalId}`)}
            />
          ))}
        </View>
      )}

      {/* Recommendations Section */}
      {recommendations && recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {recommendations.slice(0, 3).map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              onAction={() => {
                // Handle recommendation action based on category
                if (rec.category === 'streak') {
                  router.push('/wallet-screen');
                } else if (rec.category === 'goal') {
                  router.push('/savings/goals');
                } else {
                  router.push('/wallet-screen');
                }
              }}
            />
          ))}
        </View>
      )}

      {/* Insights Section */}
      {dashboard.insights && dashboard.insights.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights</Text>
          {dashboard.insights.slice(0, 3).map((insight) => (
            <View key={insight.id} style={styles.insightItem}>
              <View style={styles.insightIcon}>
                <Ionicons
                  name={
                    insight.insightType === 'best_category'
                      ? 'star'
                      : insight.insightType === 'savings_trend'
                      ? 'trending-up'
                      : 'lightbulb'
                  }
                  size={20}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightDescription}>{insight.description}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <Pressable
          style={styles.actionButton}
          onPress={() => router.push('/savings/history')}
        >
          <Ionicons name="receipt-outline" size={24} color={Colors.primary} />
          <Text style={styles.actionButtonText}>View History</Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => router.push('/savings/goals')}
        >
          <Ionicons name="flag-outline" size={24} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Set a Goal</Text>
        </Pressable>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  errorText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  startButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  startButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  // Compact View
  compactContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  compactLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  compactAmount: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  compactStats: {
    alignItems: 'flex-end',
  },
  compactMonth: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginTop: 4,
  },
  compactCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  compactCtaText: {
    color: '#fff',
    fontWeight: '600',
    marginRight: 4,
  },

  // Hero Header
  heroGradient: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  heroAmount: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '800',
    marginVertical: Spacing.sm,
  },
  heroSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  quickStats: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  quickStatValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: Spacing.md,
  },

  // Streak Badge
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  streakIcon: {
    fontSize: 14,
  },
  streakText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Sections
  section: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    marginTop: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  seeAllText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Projections
  projectionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  projectionItem: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    marginHorizontal: 4,
  },
  projectionDays: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
  },
  projectionAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginVertical: 4,
  },
  projectionLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },

  // Goals
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalIconText: {
    fontSize: 20,
  },
  goalInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  goalName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  goalProgressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    marginVertical: 6,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  goalProgressText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  // Breakdown
  breakdownSection: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    marginTop: Spacing.sm,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  breakdownLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  breakdownType: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  breakdownValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  breakdownPercent: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    minWidth: 35,
    textAlign: 'right',
  },

  // Recommendations
  recommendationCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
  },
  recommendationHeader: {
    flexDirection: 'row',
  },
  recommendationIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  recommendationDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  recommendationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  recommendationSavings: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  recommendationAction: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  recommendationActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Insights
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  insightDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Actions
  actionSection: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionButtonText: {
    marginLeft: Spacing.sm,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },

  bottomPadding: {
    height: 40,
  },
});

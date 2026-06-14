// RevenueDashboard Component
// Displays merchant revenue metrics, charts, and trends
//
// UX/UI FIXES APPLIED:
// 1. Replaced hardcoded colors with design tokens from constants/theme.ts
// 2. Replaced inline loading state with shared LoadingSpinner component
// 3. Added accessibility attributes (accessibilityRole, accessibilityLabel)
// 4. Added keyboardShouldPersistTaps to ScrollView
// 5. Replaced console.error with proper error state display

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useMerchant } from '../contexts/MerchantContext';
import { LoadingSpinner } from './common';
import { ErrorState } from './common';
import {
  getMerchantStats,
  getMerchantHealthScore,
  getRevenueChartData,
  getRevenueBreakdown,
  MerchantStats,
  MerchantHealthScore,
  RevenueChartData,
  RevenueBreakdown,
} from '../services/merchant.service';
import { colors, spacing, borderRadius, shadows, typography } from '../constants/theme';

const { width } = Dimensions.get('window');

interface RevenueDashboardProps {
  onRefresh?: () => void;
}

type TimePeriod = 'day' | 'week' | 'month' | 'year';

export function RevenueDashboard({ onRefresh }: RevenueDashboardProps): React.JSX.Element {
  const { merchant } = useMerchant();
  const [stats, setStats] = useState<MerchantStats | null>(null);
  const [healthScore, setHealthScore] = useState<MerchantHealthScore | null>(null);
  const [chartData, setChartData] = useState<RevenueChartData[]>([]);
  const [breakdown, setBreakdown] = useState<RevenueBreakdown | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const merchantId = merchant?.id || 'demo-merchant';

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [statsData, healthData, chartDataResult, breakdownData] = await Promise.all([
        getMerchantStats(merchantId),
        getMerchantHealthScore(merchantId),
        getRevenueChartData(merchantId, selectedPeriod),
        getRevenueBreakdown(merchantId),
      ]);

      setStats(statsData);
      setHealthScore(healthData);
      setChartData(chartDataResult);
      setBreakdown(breakdownData);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [merchantId, selectedPeriod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefreshHandler = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    onRefresh?.();
  }, [fetchData, onRefresh]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable'): string => {
    switch (trend) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '→';
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable'): string => {
    return trend === 'up' ? colors.successMain : trend === 'down' ? colors.errorMain : colors.text.secondary;
  };

  const getHealthScoreColor = (score: number): string => {
    if (score >= 80) return colors.successMain;
    if (score >= 60) return colors.warningMain;
    return colors.errorMain;
  };

  const maxChartValue = Math.max(...chartData.map(d => d.revenue), 1);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefreshHandler}
          colors={[colors.primaryMain]}
        />
      }
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      accessibilityRole="main"
      accessibilityLabel="Revenue Dashboard"
    >
      {/* Health Score Card */}
      {healthScore && (
        <View style={styles.healthCard} accessibilityRole="region" accessibilityLabel="Merchant Health Score">
          <View style={styles.healthHeader}>
            <Text style={styles.healthTitle}>Merchant Health</Text>
            <View
              style={[
                styles.healthBadge,
                { backgroundColor: getHealthScoreColor(healthScore.overall) },
              ]}
              accessibilityLabel={`Health score: ${healthScore.overall}`}
            >
              <Text style={styles.healthScore}>{healthScore.overall}</Text>
            </View>
          </View>
          <View style={styles.healthMetrics}>
            {Object.entries(healthScore.components).map(([key, component]) => (
              <View key={key} style={styles.healthMetric} accessibilityLabel={`${formatHealthLabel(key)}: ${component.score}`}>
                <View style={styles.healthMetricHeader}>
                  <Text style={styles.healthMetricLabel}>{formatHealthLabel(key)}</Text>
                  <Text style={[styles.healthMetricTrend, { color: getTrendColor(component.trend) }]}>
                    {getTrendIcon(component.trend)} {component.score}
                  </Text>
                </View>
                <View style={styles.healthBarBg}>
                  <View
                    style={[
                      styles.healthBar,
                      {
                        width: `${component.score}%`,
                        backgroundColor: getHealthScoreColor(component.score),
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Stats Overview */}
      {stats && (
        <View style={styles.statsGrid} accessibilityRole="group" accessibilityLabel="Revenue Statistics">
          <StatCard
            title="Today's Revenue"
            value={formatCurrency(stats.dailyRevenue)}
            trend={stats.growthRate}
            icon="₹"
          />
          <StatCard
            title="This Week"
            value={formatCurrency(stats.weeklyRevenue)}
            trend={8.5}
            icon="📅"
          />
          <StatCard
            title="This Month"
            value={formatCurrency(stats.monthlyRevenue)}
            trend={12.3}
            icon="📊"
          />
          <StatCard
            title="Orders"
            value={stats.totalOrders.toString()}
            subtitle={`Avg: ${formatCurrency(stats.avgOrderValue)}`}
            icon="🛒"
          />
        </View>
      )}

      {/* Period Selector */}
      <View style={styles.periodSelector} accessibilityRole="tablist" accessibilityLabel="Time Period Selection">
        {(['day', 'week', 'month', 'year'] as TimePeriod[]).map(period => (
          <TouchableOpacity
            key={period}
            style={[styles.periodButton, selectedPeriod === period && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod(period)}
            accessibilityRole="tab"
            accessibilityState={{ selected: selectedPeriod === period }}
            accessibilityLabel={`${period.charAt(0).toUpperCase() + period.slice(1)} period`}
          >
            <Text
              style={[styles.periodButtonText, selectedPeriod === period && styles.periodButtonTextActive]}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Revenue Chart */}
      <View style={styles.chartCard} accessibilityRole="img" accessibilityLabel="Revenue Trend Chart">
        <Text style={styles.chartTitle}>Revenue Trend</Text>
        <View style={styles.chartContainer}>
          {chartData.map((item, index) => (
            <View key={index} style={styles.chartBar} accessibilityLabel={`${item.period}: ${formatCurrency(item.revenue)}`}>
              <View
                style={[
                  styles.chartBarFill,
                  {
                    height: `${(item.revenue / maxChartValue) * 100}%`,
                  },
                ]}
              />
              <Text style={styles.chartBarLabel}>{item.period}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* QR Scans Stats */}
      {stats && (
        <View style={styles.qrStatsCard} accessibilityRole="group" accessibilityLabel="QR and Offer Statistics">
          <View style={styles.qrStatItem}>
            <Text style={styles.qrStatValue}>{stats.qrScans}</Text>
            <Text style={styles.qrStatLabel}>QR Scans</Text>
          </View>
          <View style={styles.qrStatDivider} />
          <View style={styles.qrStatItem}>
            <Text style={styles.qrStatValue}>{stats.activeOffers}</Text>
            <Text style={styles.qrStatLabel}>Active Offers</Text>
          </View>
          <View style={styles.qrStatDivider} />
          <View style={styles.qrStatItem}>
            <Text style={styles.qrStatValue}>{stats.customerRetention}%</Text>
            <Text style={styles.qrStatLabel}>Retention</Text>
          </View>
        </View>
      )}

      {/* Revenue Breakdown */}
      {breakdown && (
        <View style={styles.breakdownCard} accessibilityRole="table" accessibilityLabel="Revenue by Payment Method">
          <Text style={styles.breakdownTitle}>Revenue by Payment Method</Text>
          {breakdown.byPaymentMethod.map((item, index) => (
            <View key={index} style={styles.breakdownItem} accessibilityLabel={`${item.method}: ${formatCurrency(item.amount)}`}>
              <View style={styles.breakdownLeft}>
                <Text style={styles.breakdownLabel}>{item.method}</Text>
                <Text style={styles.breakdownPercent}>{item.percentage}%</Text>
              </View>
              <View style={styles.breakdownRight}>
                <View style={styles.breakdownBarBg}>
                  <View
                    style={[styles.breakdownBar, { width: `${item.percentage}%` }]}
                  />
                </View>
                <Text style={styles.breakdownAmount}>{formatCurrency(item.amount)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Health Insights */}
      {healthScore && healthScore.insights.length > 0 && (
        <View style={styles.insightsCard} accessibilityRole="region" accessibilityLabel="Health Insights">
          <Text style={styles.insightsTitle}>Insights</Text>
          {healthScore.insights.map((insight, index) => (
            <View
              key={index}
              style={[
                styles.insightItem,
                insight.type === 'positive' && styles.insightPositive,
                insight.type === 'warning' && styles.insightWarning,
                insight.type === 'critical' && styles.insightCritical,
              ]}
              accessibilityRole="alert"
            >
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightDescription}>{insight.description}</Text>
              {insight.action && <Text style={styles.insightAction}>{insight.action}</Text>}
            </View>
          ))}
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  icon: string;
}

function StatCard({ title, value, subtitle, trend, icon }: StatCardProps): React.JSX.Element {
  return (
    <View style={styles.statCard} accessibilityRole="text" accessibilityLabel={`${title}: ${value}`}>
      <View style={styles.statCardHeader}>
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      {trend !== undefined && (
        <View style={styles.statTrend}>
          <Text
            style={[
              styles.statTrendText,
              { color: trend >= 0 ? colors.successMain : colors.errorMain },
            ]}
          >
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
          </Text>
        </View>
      )}
    </View>
  );
}

// Helper function
function formatHealthLabel(key: string): string {
  const labels: Record<string, string> = {
    revenue: 'Revenue',
    orders: 'Orders',
    customerSatisfaction: 'Satisfaction',
    engagement: 'Engagement',
    offerPerformance: 'Offers',
  };
  return labels[key] || key;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  healthCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    margin: spacing.base,
    ...shadows.md,
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  healthTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  healthBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthScore: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  healthMetrics: {
    gap: spacing.md,
  },
  healthMetric: {
    marginBottom: spacing.xs,
  },
  healthMetricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  healthMetricLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  healthMetricTrend: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  healthBarBg: {
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  healthBar: {
    height: '100%',
    borderRadius: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    width: (width - spacing['2xl'] * 2 - spacing.sm) / 2,
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    ...shadows.sm,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  statTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  statSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[400],
  },
  statTrend: {
    marginTop: spacing.xs,
  },
  statTrendText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.base,
    gap: spacing.sm,
  },
  periodButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
    minWidth: 70,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.primaryMain,
    borderColor: colors.primaryMain,
  },
  periodButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  periodButtonTextActive: {
    color: colors.text.inverse,
  },
  chartCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.base,
    ...shadows.md,
  },
  chartTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.base,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 150,
    justifyContent: 'space-between',
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  chartBarFill: {
    width: '60%',
    backgroundColor: colors.primaryMain,
    borderRadius: 4,
    minHeight: 4,
  },
  chartBarLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[400],
    marginTop: spacing.xs,
  },
  qrStatsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    margin: spacing.base,
    ...shadows.md,
  },
  qrStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  qrStatDivider: {
    width: 1,
    backgroundColor: colors.border.default,
    marginHorizontal: spacing.sm,
  },
  qrStatValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  qrStatLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  breakdownCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.base,
    ...shadows.md,
  },
  breakdownTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.base,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  breakdownLeft: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  breakdownPercent: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  breakdownRight: {
    flex: 2,
    alignItems: 'flex-end',
  },
  breakdownBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    marginBottom: spacing.xs,
  },
  breakdownBar: {
    height: '100%',
    backgroundColor: colors.primaryMain,
    borderRadius: 3,
  },
  breakdownAmount: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  insightsCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    margin: spacing.base,
    ...shadows.md,
  },
  insightsTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.base,
  },
  insightItem: {
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
  },
  insightPositive: {
    backgroundColor: colors.success[50],
    borderLeftColor: colors.successMain,
  },
  insightWarning: {
    backgroundColor: colors.warning[50],
    borderLeftColor: colors.warningMain,
  },
  insightCritical: {
    backgroundColor: colors.error[50],
    borderLeftColor: colors.errorMain,
  },
  insightTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  insightDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  insightAction: {
    fontSize: typography.fontSize.xs,
    color: colors.primaryMain,
    marginTop: spacing.sm,
    fontWeight: typography.fontWeight.medium,
  },
  bottomPadding: {
    height: 100,
  },
});

export default RevenueDashboard;

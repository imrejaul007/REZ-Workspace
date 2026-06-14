/**
 * Customer Insights Analytics Screen
 * Comprehensive customer analytics with LTV, retention, churn analysis, and segmentation
 * Production-ready version with ReZ Design System
 * Desktop & Mobile responsive
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { analyticsService } from '@/services/api/analytics';
import { useHasPermission } from '@/hooks/usePermissions';
import { formatDate, formatMonthYear } from '@/utils/dateUtils';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

// ReZ Design System Colors
const REZ_COLORS = {
  primary: '#00C06A',
  primaryLight: '#E8F8F0',
  primaryDark: '#007642',
  secondary: '#00796B',
  gold: '#FFC857',
  navy: '#0B2240',
  gray: '#9AA7B2',
  grayLight: '#F5F7F9',
  success: '#2ECC71',
  warning: '#FF9F1C',
  error: '#E74C3C',
  info: '#00796B',
  white: '#FFFFFF',
  cardShadow: 'rgba(0, 0, 0, 0.08)',
};

// Desktop layout constants
const DESKTOP_MAX_WIDTH = 1200;
const TABLET_MAX_WIDTH = 900;

export default function CustomerInsightsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<
    'overview' | 'ltv' | 'retention' | 'churn' | 'segments'
  >('overview');

  const layout = useResponsiveLayout();
  const { isDesktop, isTablet, isPhone, screenWidth } = layout;

  const canViewAnalytics = useHasPermission('analytics:view');

  // Responsive values
  const contentMaxWidth = isDesktop ? DESKTOP_MAX_WIDTH : isTablet ? TABLET_MAX_WIDTH : screenWidth;
  const horizontalPadding = isDesktop ? 32 : isTablet ? 24 : 16;
  const gridColumns = isDesktop ? 4 : isTablet ? 4 : 2;
  const cardGap = isDesktop ? 20 : isTablet ? 16 : 12;

  const {
    data: insights,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['customer-insights'],
    queryFn: () => analyticsService.getCustomerInsights(),
    enabled: canViewAnalytics,
    staleTime: 5 * 60 * 1000,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: 'grid-outline' },
    { key: 'ltv' as const, label: 'LTV', icon: 'trophy-outline' },
    { key: 'retention' as const, label: 'Retention', icon: 'repeat-outline' },
    { key: 'churn' as const, label: 'Churn', icon: 'warning-outline' },
    { key: 'segments' as const, label: 'Segments', icon: 'people-outline' },
  ];

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'high_value':
        return REZ_COLORS.success;
      case 'medium_value':
        return REZ_COLORS.info;
      case 'low_value':
        return REZ_COLORS.warning;
      case 'churned':
        return REZ_COLORS.error;
      default:
        return REZ_COLORS.gray;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return REZ_COLORS.error;
      case 'high':
        return '#FF6B6B';
      case 'medium':
        return REZ_COLORS.warning;
      case 'low':
        return REZ_COLORS.success;
      default:
        return REZ_COLORS.gray;
    }
  };

  // Overview Tab - Quick Stats Dashboard
  const OverviewContent = () => {
    if (!insights) return null;

    const stats = [
      {
        label: 'Total Customers',
        value: insights.totalCustomers?.toString() || '0',
        icon: 'people',
        color: REZ_COLORS.primary,
        trend: null,
      },
      {
        label: 'Active (30d)',
        value: insights.activeCustomers?.toString() || '0',
        icon: 'pulse',
        color: REZ_COLORS.success,
        trend:
          insights.totalCustomers > 0
            ? `${((insights.activeCustomers / insights.totalCustomers) * 100).toFixed(0)}%`
            : null,
      },
      {
        label: 'New This Month',
        value: insights.newCustomers?.toString() || '0',
        icon: 'person-add',
        color: REZ_COLORS.info,
        trend: null,
      },
      {
        label: 'At Risk',
        value: insights.churn?.atRiskCount?.toString() || '0',
        icon: 'alert-circle',
        color: REZ_COLORS.warning,
        trend: null,
      },
    ];

    const kpiCards = [
      {
        label: 'Average LTV',
        value: formatCurrency(insights.ltv?.averageLTV || 0),
        subtitle: `${insights.ltv?.highValueCount || 0} high-value customers`,
        icon: 'cash',
        color: REZ_COLORS.gold,
      },
      {
        label: 'Retention Rate',
        value: formatPercentage(insights.retention?.overallRetentionRate || 0),
        subtitle: `${insights.retention?.repeatCustomerCount || 0} repeat customers`,
        icon: 'refresh-circle',
        color: REZ_COLORS.primary,
      },
      {
        label: 'Churn Rate',
        value: formatPercentage(insights.churn?.churnRate || 0),
        subtitle: `${insights.churnedCustomers || 0} churned customers`,
        icon: 'trending-down',
        color: REZ_COLORS.error,
      },
    ];

    return (
      <View style={styles.tabContent}>
        {/* Quick Stats Row */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: stat.color + '15' }]}>
                <Ionicons name={stat.icon as unknown as keyof typeof Ionicons.glyphMap} size={20} color={stat.color} />
              </View>
              <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
              <ThemedText style={styles.statLabel}>{stat.label}</ThemedText>
              {stat.trend && (
                <ThemedText style={[styles.statTrend, { color: REZ_COLORS.success }]}>
                  {stat.trend} active
                </ThemedText>
              )}
            </View>
          ))}
        </View>

        {/* KPI Cards */}
        <View style={styles.kpiSection}>
          <ThemedText style={styles.sectionTitle}>Key Metrics</ThemedText>
          {kpiCards.map((kpi, index) => (
            <View key={index} style={styles.kpiCard}>
              <View style={[styles.kpiIconContainer, { backgroundColor: kpi.color + '20' }]}>
                <Ionicons name={kpi.icon as unknown as keyof typeof Ionicons.glyphMap} size={28} color={kpi.color} />
              </View>
              <View style={styles.kpiContent}>
                <ThemedText style={styles.kpiLabel}>{kpi.label}</ThemedText>
                <ThemedText style={styles.kpiValue}>{kpi.value}</ThemedText>
                <ThemedText style={styles.kpiSubtitle}>{kpi.subtitle}</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={REZ_COLORS.gray} />
            </View>
          ))}
        </View>

        {/* Customer Breakdown */}
        <View style={styles.breakdownSection}>
          <ThemedText style={styles.sectionTitle}>Customer Status</ThemedText>
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownDot, { backgroundColor: REZ_COLORS.success }]} />
                <ThemedText style={styles.breakdownLabel}>Active</ThemedText>
                <ThemedText style={styles.breakdownValue}>
                  {insights.activeCustomers || 0}
                </ThemedText>
              </View>
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownDot, { backgroundColor: REZ_COLORS.warning }]} />
                <ThemedText style={styles.breakdownLabel}>Inactive</ThemedText>
                <ThemedText style={styles.breakdownValue}>
                  {insights.inactiveCustomers || 0}
                </ThemedText>
              </View>
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownDot, { backgroundColor: REZ_COLORS.error }]} />
                <ThemedText style={styles.breakdownLabel}>Churned</ThemedText>
                <ThemedText style={styles.breakdownValue}>
                  {insights.churnedCustomers || 0}
                </ThemedText>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressSegment,
                  {
                    backgroundColor: REZ_COLORS.success,
                    flex: insights.activeCustomers || 1,
                  },
                ]}
              />
              <View
                style={[
                  styles.progressSegment,
                  {
                    backgroundColor: REZ_COLORS.warning,
                    flex: insights.inactiveCustomers || 0,
                  },
                ]}
              />
              <View
                style={[
                  styles.progressSegment,
                  {
                    backgroundColor: REZ_COLORS.error,
                    flex: insights.churnedCustomers || 0,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Insights Summary */}
        {insights.summary && (
          <View style={styles.insightsSummarySection}>
            <ThemedText style={styles.sectionTitle}>Quick Insights</ThemedText>
            <View style={styles.insightsGrid}>
              <View style={styles.insightItem}>
                <Ionicons name="time-outline" size={20} color={REZ_COLORS.info} />
                <View style={styles.insightTextContainer}>
                  <ThemedText style={styles.insightValue}>
                    {insights.summary.averageCustomerAge} days
                  </ThemedText>
                  <ThemedText style={styles.insightLabel}>Avg. Customer Age</ThemedText>
                </View>
              </View>
              <View style={styles.insightItem}>
                <Ionicons name="cart-outline" size={20} color={REZ_COLORS.primary} />
                <View style={styles.insightTextContainer}>
                  <ThemedText style={styles.insightValue}>
                    {insights.summary.avgOrdersPerCustomer}
                  </ThemedText>
                  <ThemedText style={styles.insightLabel}>Avg. Orders/Customer</ThemedText>
                </View>
              </View>
              <View style={styles.insightItem}>
                <Ionicons name="wallet-outline" size={20} color={REZ_COLORS.gold} />
                <View style={styles.insightTextContainer}>
                  <ThemedText style={styles.insightValue}>
                    {formatCurrency(insights.summary.avgSpendPerCustomer)}
                  </ThemedText>
                  <ThemedText style={styles.insightLabel}>Avg. Spend/Customer</ThemedText>
                </View>
              </View>
              <View style={styles.insightItem}>
                <Ionicons name="star-outline" size={20} color={REZ_COLORS.success} />
                <View style={styles.insightTextContainer}>
                  <ThemedText style={styles.insightValue}>{insights.summary.topSegment}</ThemedText>
                  <ThemedText style={styles.insightLabel}>Top Segment</ThemedText>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  // LTV Tab
  const LTVContent = () => {
    if (!insights?.ltv) return <EmptyState message="No LTV data available" />;

    return (
      <View style={styles.tabContent}>
        {/* LTV Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconContainer}>
            <Ionicons name="trophy" size={40} color={REZ_COLORS.gold} />
          </View>
          <View style={styles.heroContent}>
            <ThemedText style={styles.heroLabel}>Average Customer LTV</ThemedText>
            <ThemedText style={styles.heroValue}>
              {formatCurrency(insights.ltv.averageLTV)}
            </ThemedText>
            <View style={styles.heroBadge}>
              <Ionicons name="star" size={12} color={REZ_COLORS.gold} />
              <ThemedText style={styles.heroBadgeText}>
                {insights.ltv.highValueCount} high-value customers (≥{' '}
                {formatCurrency(insights.ltv.highValueThreshold)})
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Top Customers List */}
        <View style={styles.listSection}>
          <ThemedText style={styles.sectionTitle}>Top Customers (90 Days)</ThemedText>
          {(insights.ltv.ltv90Days ?? []).slice(0, 10).map((customer, index) => (
            <View key={customer.customerId} style={styles.customerCard}>
              <View style={styles.customerRank}>
                <ThemedText style={styles.rankNumber}>#{index + 1}</ThemedText>
              </View>
              <View style={styles.customerInfo}>
                <View style={styles.customerHeader}>
                  <ThemedText style={styles.customerValue}>
                    {formatCurrency(customer.estimatedLTV)}
                  </ThemedText>
                  <View
                    style={[
                      styles.segmentBadge,
                      { backgroundColor: getSegmentColor(customer.segment) },
                    ]}
                  >
                    <ThemedText style={styles.segmentBadgeText}>
                      {customer.segment.replace('_', ' ').toUpperCase()}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.customerMetrics}>
                  <View style={styles.customerMetric}>
                    <Ionicons name="cart" size={12} color={REZ_COLORS.gray} />
                    <ThemedText style={styles.customerMetricText}>
                      {customer.totalPurchases} orders
                    </ThemedText>
                  </View>
                  <View style={styles.customerMetric}>
                    <Ionicons name="cash" size={12} color={REZ_COLORS.gray} />
                    <ThemedText style={styles.customerMetricText}>
                      {formatCurrency(customer.totalSpent)}
                    </ThemedText>
                  </View>
                  <View style={styles.customerMetric}>
                    <Ionicons name="trending-up" size={12} color={REZ_COLORS.gray} />
                    <ThemedText style={styles.customerMetricText}>
                      {formatCurrency(customer.averageOrderValue)} AOV
                    </ThemedText>
                  </View>
                </View>
                {customer.nextPredictedPurchase && (
                  <View style={styles.predictionContainer}>
                    <Ionicons name="calendar-outline" size={12} color={REZ_COLORS.info} />
                    <ThemedText style={styles.predictionText}>
                      Next purchase: {formatDate(customer.nextPredictedPurchase)}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Retention Tab
  const RetentionContent = () => {
    if (!insights?.retention) return <EmptyState message="No retention data available" />;

    return (
      <View style={styles.tabContent}>
        {/* Retention Metrics */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Ionicons name="people" size={24} color={REZ_COLORS.success} />
            <ThemedText style={styles.metricValue}>
              {formatPercentage(insights.retention.overallRetentionRate)}
            </ThemedText>
            <ThemedText style={styles.metricLabel}>Retention Rate</ThemedText>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="repeat" size={24} color={REZ_COLORS.primary} />
            <ThemedText style={styles.metricValue}>
              {formatPercentage(insights.retention.repeatCustomerRate)}
            </ThemedText>
            <ThemedText style={styles.metricLabel}>Repeat Rate</ThemedText>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="arrow-redo" size={24} color={REZ_COLORS.info} />
            <ThemedText style={styles.metricValue}>
              {insights.retention.repeatCustomerCount}
            </ThemedText>
            <ThemedText style={styles.metricLabel}>Repeat Buyers</ThemedText>
          </View>
        </View>

        {/* Cohort Analysis */}
        <View style={styles.listSection}>
          <ThemedText style={styles.sectionTitle}>Cohort Retention Analysis</ThemedText>
          {(insights.retention.cohorts ?? []).map((cohort, index) => (
            <View key={index} style={styles.cohortCard}>
              <View style={styles.cohortHeader}>
                <ThemedText style={styles.cohortDate}>
                  {formatMonthYear(cohort.cohortDate)}
                </ThemedText>
                <ThemedText style={styles.cohortSize}>{cohort.cohortSize} customers</ThemedText>
              </View>

              <View style={styles.retentionBar}>
                <View
                  style={[
                    styles.retentionBarFill,
                    {
                      width: `${Math.min(cohort.avgRetentionRate, 100)}%`,
                      backgroundColor:
                        cohort.avgRetentionRate >= 70
                          ? REZ_COLORS.success
                          : cohort.avgRetentionRate >= 40
                            ? REZ_COLORS.warning
                            : REZ_COLORS.error,
                    },
                  ]}
                />
                <ThemedText style={styles.retentionBarText}>
                  {formatPercentage(cohort.avgRetentionRate)}
                </ThemedText>
              </View>

              {cohort.retention?.length > 0 && (
                <View style={styles.retentionTimeline}>
                  {cohort.retention.slice(0, 5).map((point, idx) => (
                    <View key={idx} style={styles.timelinePoint}>
                      <ThemedText style={styles.timelineDay}>D{point.day}</ThemedText>
                      <ThemedText style={styles.timelinePercentage}>
                        {point.percentage.toFixed(0)}%
                      </ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Churn Tab
  const ChurnContent = () => {
    if (!insights?.churn) return <EmptyState message="No churn data available" />;

    return (
      <View style={styles.tabContent}>
        {/* Churn Overview */}
        <View style={[styles.heroCard, { borderLeftColor: REZ_COLORS.error, borderLeftWidth: 4 }]}>
          <View style={[styles.heroIconContainer, { backgroundColor: REZ_COLORS.error + '20' }]}>
            <Ionicons name="alert-circle" size={40} color={REZ_COLORS.error} />
          </View>
          <View style={styles.heroContent}>
            <ThemedText style={styles.heroLabel}>Overall Churn Rate</ThemedText>
            <ThemedText style={[styles.heroValue, { color: REZ_COLORS.error }]}>
              {formatPercentage(insights.churn.churnRate)}
            </ThemedText>
            <View style={styles.churnStats}>
              <View style={styles.churnStat}>
                <ThemedText style={styles.churnStatValue}>{insights.churn.atRiskCount}</ThemedText>
                <ThemedText style={styles.churnStatLabel}>At Risk</ThemedText>
              </View>
              <View style={styles.churnStatDivider} />
              <View style={styles.churnStat}>
                <ThemedText style={styles.churnStatValue}>{insights.churn.churnedCount}</ThemedText>
                <ThemedText style={styles.churnStatLabel}>Churned</ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* At-Risk Customers */}
        <View style={styles.listSection}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Customers at Risk</ThemedText>
            <View style={styles.countBadge}>
              <ThemedText style={styles.countBadgeText}>
                {(insights.churn.predictions ?? []).length}
              </ThemedText>
            </View>
          </View>

          {(insights.churn.predictions ?? []).slice(0, 10).map((prediction, index) => (
            <View
              key={index}
              style={[styles.churnCard, { borderLeftColor: getRiskColor(prediction.riskLevel) }]}
            >
              <View style={styles.churnCardHeader}>
                <View style={styles.churnCardInfo}>
                  <ThemedText style={styles.churnCardEmail} numberOfLines={1}>
                    {prediction.email}
                  </ThemedText>
                  <ThemedText style={styles.churnCardDate}>
                    Last purchase: {prediction.daysSinceLastPurchase} days ago
                  </ThemedText>
                </View>
                <View style={styles.riskIndicator}>
                  <View
                    style={[
                      styles.riskBadge,
                      { backgroundColor: getRiskColor(prediction.riskLevel) },
                    ]}
                  >
                    <ThemedText style={styles.riskBadgeText}>
                      {prediction.churnProbability.toFixed(0)}%
                    </ThemedText>
                  </View>
                  <ThemedText
                    style={[styles.riskLabel, { color: getRiskColor(prediction.riskLevel) }]}
                  >
                    {prediction.riskLevel.toUpperCase()}
                  </ThemedText>
                </View>
              </View>

              {prediction.reasons?.length > 0 && (
                <View style={styles.reasonsBox}>
                  {prediction.reasons.slice(0, 2).map((reason, idx) => (
                    <View key={idx} style={styles.reasonItem}>
                      <View style={styles.reasonDot} />
                      <ThemedText style={styles.reasonText}>{reason}</ThemedText>
                    </View>
                  ))}
                </View>
              )}

              {prediction.recommendedActions?.length > 0 && (
                <View style={styles.actionsBox}>
                  <ThemedText style={styles.actionsTitle}>Recommended:</ThemedText>
                  {prediction.recommendedActions.slice(0, 1).map((action, idx) => (
                    <View key={idx} style={styles.actionItem}>
                      <Ionicons name="checkmark-circle" size={14} color={REZ_COLORS.success} />
                      <ThemedText style={styles.actionText}>{action}</ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Segments Tab
  const SegmentsContent = () => {
    if (!insights?.segments || !insights?.summary)
      return <EmptyState message="No segment data available" />;

    const totalCustomers = insights.totalCustomers || 1;

    // RFM Segment data
    const rfmSegments = [
      {
        key: 'champion',
        label: 'Champion',
        count: insights.segments.champion || 0,
        color: '#FFD700',
        icon: 'star',
        hint: 'Best customers - frequent & high-value',
      },
      {
        key: 'loyalist',
        label: 'Loyalist',
        count: insights.segments.loyalist || 0,
        color: REZ_COLORS.success,
        icon: 'heart',
        hint: 'Regular buyers with consistent behavior',
      },
      {
        key: 'at_risk',
        label: 'At Risk',
        count: insights.segments.at_risk || 0,
        color: REZ_COLORS.warning,
        icon: 'alert-circle',
        hint: 'Previously good customers showing decline',
      },
      {
        key: 'lost',
        label: 'Lost',
        count: insights.segments.lost || 0,
        color: REZ_COLORS.error,
        icon: 'close-circle',
        hint: 'Inactive for extended period',
      },
      {
        key: 'new',
        label: 'New',
        count: insights.segments.new || 0,
        color: REZ_COLORS.info,
        icon: 'sparkles',
        hint: 'Recently acquired customers',
      },
    ];

    const segmentData = rfmSegments;

    return (
      <View style={styles.tabContent}>
        {/* Customer Summary */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <ThemedText style={styles.summaryLabel}>Total</ThemedText>
            <ThemedText style={styles.summaryValue}>{totalCustomers}</ThemedText>
          </View>
          <View style={styles.summaryCard}>
            <ThemedText style={styles.summaryLabel}>New</ThemedText>
            <ThemedText style={[styles.summaryValue, { color: REZ_COLORS.info }]}>
              {insights.newCustomers || 0}
            </ThemedText>
          </View>
          <View style={styles.summaryCard}>
            <ThemedText style={styles.summaryLabel}>Active</ThemedText>
            <ThemedText style={[styles.summaryValue, { color: REZ_COLORS.success }]}>
              {insights.activeCustomers || 0}
            </ThemedText>
          </View>
          <View style={styles.summaryCard}>
            <ThemedText style={styles.summaryLabel}>Inactive</ThemedText>
            <ThemedText style={[styles.summaryValue, { color: REZ_COLORS.warning }]}>
              {insights.inactiveCustomers || 0}
            </ThemedText>
          </View>
        </View>

        {/* Segment Distribution */}
        <View style={styles.listSection}>
          <ThemedText style={styles.sectionTitle}>RFM Segments</ThemedText>
          {segmentData.map((segment) => {
            const percentage = (segment.count / totalCustomers) * 100;
            return (
              <TouchableOpacity
                key={segment.key}
                style={styles.segmentRow}
                onPress={() => router.push(`/crm?segment=${segment.key}`)}
              >
                <View style={styles.segmentLeft}>
                  <View style={[styles.segmentIcon, { backgroundColor: segment.color + '20' }]}>
                    <Ionicons name={segment.icon as unknown as keyof typeof Ionicons.glyphMap} size={18} color={segment.color} />
                  </View>
                  <View>
                    <ThemedText style={styles.segmentName}>{segment.label}</ThemedText>
                    <ThemedText style={styles.segmentCount}>{segment.count} customers</ThemedText>
                    {segment.hint && (
                      <ThemedText style={styles.segmentHint}>{segment.hint}</ThemedText>
                    )}
                  </View>
                </View>
                <View style={styles.segmentRight}>
                  <ThemedText style={styles.segmentPercentage}>
                    {formatPercentage(percentage)}
                  </ThemedText>
                  <Ionicons name="chevron-forward" size={18} color={Colors.light.icon} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Visual Distribution */}
        <View style={styles.distributionSection}>
          <ThemedText style={styles.sectionTitle}>Distribution</ThemedText>
          <View style={styles.distributionBar}>
            {segmentData.map((segment) => {
              const percentage = (segment.count / totalCustomers) * 100;
              if (percentage === 0) return null;
              return (
                <View
                  key={segment.key}
                  style={[
                    styles.distributionSegment,
                    { backgroundColor: segment.color, flex: segment.count || 0.01 },
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.legendRow}>
            {segmentData.map((segment) => (
              <View key={segment.key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: segment.color }]} />
                <ThemedText style={styles.legendText}>{segment.label}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  // Empty State Component
  const EmptyState = ({ message }: { message: string }) => (
    <View style={styles.emptyState}>
      <Ionicons name="analytics-outline" size={48} color={REZ_COLORS.gray} />
      <ThemedText style={styles.emptyStateText}>{message}</ThemedText>
    </View>
  );

  if (!canViewAnalytics) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <Ionicons name="lock-closed" size={48} color={REZ_COLORS.error} />
        <ThemedText style={styles.errorText}>Access Denied</ThemedText>
      </ThemedView>
    );
  }

  if (isLoading && !insights) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={REZ_COLORS.primary} />
        <ThemedText style={styles.loadingText}>Analyzing customers...</ThemedText>
      </ThemedView>
    );
  }

  // Dynamic styles for responsive layout
  const responsiveStyles = {
    wrapper: {
      flex: 1,
      alignItems: 'center' as const,
      backgroundColor: REZ_COLORS.grayLight,
    },
    innerContainer: {
      width: '100%' as const,
      maxWidth: contentMaxWidth,
      paddingHorizontal: horizontalPadding,
    },
    statsGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: cardGap,
    },
    statCard: {
      flex: isPhone ? 1 : undefined,
      minWidth: isPhone ? '45%' : isTablet ? 180 : 220,
      maxWidth: isDesktop ? 280 : undefined,
    },
    kpiCard: {
      maxWidth: isDesktop ? 600 : undefined,
    },
    customerCard: {
      maxWidth: isDesktop ? 700 : undefined,
    },
    cohortCard: {
      maxWidth: isDesktop ? 700 : undefined,
    },
    churnCard: {
      maxWidth: isDesktop ? 700 : undefined,
    },
    segmentRow: {
      maxWidth: isDesktop ? 600 : undefined,
    },
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={responsiveStyles.wrapper}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[REZ_COLORS.primary]}
            tintColor={REZ_COLORS.primary}
          />
        }
      >
        <View style={responsiveStyles.innerContainer}>
          {/* Header */}
          <View style={[styles.header, { paddingHorizontal: 0 }]}>
            <ThemedText style={[styles.headerTitle, isDesktop && { fontSize: 36 }]}>
              Customer Insights
            </ThemedText>
            <ThemedText style={[styles.headerSubtitle, isDesktop && { fontSize: 16 }]}>
              LTV, retention & churn analysis
            </ThemedText>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <ScrollView
              horizontal={isPhone}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.tabsScrollContent,
                !isPhone && { flexWrap: 'wrap', paddingHorizontal: 0 },
              ]}
            >
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.tab,
                    selectedTab === tab.key && styles.activeTab,
                    isDesktop && { paddingHorizontal: 24, paddingVertical: 12 },
                    Platform.OS === 'web' && ({ cursor: 'pointer' } as const),
                  ]}
                  onPress={() => setSelectedTab(tab.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={tab.icon as unknown as keyof typeof Ionicons.glyphMap}
                    size={isDesktop ? 20 : 18}
                    color={selectedTab === tab.key ? REZ_COLORS.white : REZ_COLORS.gray}
                  />
                  <ThemedText
                    style={[
                      styles.tabText,
                      selectedTab === tab.key && styles.activeTabText,
                      isDesktop && { fontSize: 14 },
                    ]}
                  >
                    {tab.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Tab Content */}
          <View style={[styles.contentContainer, { paddingHorizontal: 0 }]}>
            {selectedTab === 'overview' && <OverviewContent />}
            {selectedTab === 'ltv' && <LTVContent />}
            {selectedTab === 'retention' && <RetentionContent />}
            {selectedTab === 'churn' && <ChurnContent />}
            {selectedTab === 'segments' && <SegmentsContent />}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: REZ_COLORS.grayLight,
  },
  scrollView: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: REZ_COLORS.navy,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: REZ_COLORS.gray,
  },
  tabsContainer: {
    paddingVertical: 12,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: REZ_COLORS.white,
    borderRadius: 24,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeTab: {
    backgroundColor: REZ_COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: REZ_COLORS.gray,
  },
  activeTabText: {
    color: REZ_COLORS.white,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  tabContent: {
    gap: 16,
  },

  // Stats Grid - Desktop friendly
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
  },
  statCard: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: Platform.OS === 'web' ? '23%' : '45%',
    minWidth: 140,
    maxWidth: Platform.OS === 'web' ? 280 : undefined,
    backgroundColor: REZ_COLORS.white,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: REZ_COLORS.navy,
  },
  statLabel: {
    fontSize: 12,
    color: REZ_COLORS.gray,
    marginTop: 4,
  },
  statTrend: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },

  // KPI Section
  kpiSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: REZ_COLORS.navy,
    marginBottom: 8,
  },
  kpiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: REZ_COLORS.white,
    padding: 16,
    borderRadius: 16,
    gap: 16,
    maxWidth: Platform.OS === 'web' ? 600 : undefined,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiContent: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: 12,
    color: REZ_COLORS.gray,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '700',
    color: REZ_COLORS.navy,
    marginVertical: 2,
  },
  kpiSubtitle: {
    fontSize: 11,
    color: REZ_COLORS.gray,
  },

  // Breakdown Section
  breakdownSection: {
    gap: 12,
  },
  breakdownCard: {
    backgroundColor: REZ_COLORS.white,
    padding: 20,
    borderRadius: 16,
    maxWidth: Platform.OS === 'web' ? 700 : undefined,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  breakdownItem: {
    alignItems: 'center',
    gap: 4,
  },
  breakdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  breakdownLabel: {
    fontSize: 12,
    color: REZ_COLORS.gray,
  },
  breakdownValue: {
    fontSize: 18,
    fontWeight: '700',
    color: REZ_COLORS.navy,
  },
  progressBarContainer: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: REZ_COLORS.grayLight,
  },
  progressSegment: {
    height: '100%',
  },

  // Insights Summary
  insightsSummarySection: {
    gap: 12,
  },
  insightsGrid: {
    backgroundColor: REZ_COLORS.white,
    padding: 16,
    borderRadius: 16,
    gap: 12,
    maxWidth: Platform.OS === 'web' ? 700 : undefined,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: REZ_COLORS.grayLight,
  },
  insightTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '600',
    color: REZ_COLORS.navy,
  },
  insightLabel: {
    fontSize: 12,
    color: REZ_COLORS.gray,
  },

  // Hero Card
  heroCard: {
    flexDirection: 'row',
    backgroundColor: REZ_COLORS.white,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    gap: 16,
    maxWidth: Platform.OS === 'web' ? 700 : undefined,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  heroIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: REZ_COLORS.gold + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 13,
    color: REZ_COLORS.gray,
    marginBottom: 4,
  },
  heroValue: {
    fontSize: 32,
    fontWeight: '800',
    color: REZ_COLORS.navy,
    marginBottom: 8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroBadgeText: {
    fontSize: 12,
    color: REZ_COLORS.gray,
  },

  // List Section
  listSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countBadge: {
    backgroundColor: REZ_COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: REZ_COLORS.white,
  },

  // Customer Card
  customerCard: {
    flexDirection: 'row',
    backgroundColor: REZ_COLORS.white,
    padding: 16,
    borderRadius: 16,
    gap: 12,
    maxWidth: Platform.OS === 'web' ? 700 : undefined,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  customerRank: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: REZ_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: REZ_COLORS.white,
  },
  customerInfo: {
    flex: 1,
    gap: 8,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerValue: {
    fontSize: 18,
    fontWeight: '700',
    color: REZ_COLORS.navy,
  },
  segmentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  segmentBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: REZ_COLORS.white,
  },
  customerMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  customerMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customerMetricText: {
    fontSize: 11,
    color: REZ_COLORS.gray,
  },
  predictionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  predictionText: {
    fontSize: 11,
    color: REZ_COLORS.info,
    fontStyle: 'italic',
  },

  // Metrics Row
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: REZ_COLORS.white,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '700',
    color: REZ_COLORS.navy,
  },
  metricLabel: {
    fontSize: 10,
    color: REZ_COLORS.gray,
    textAlign: 'center',
  },

  // Cohort Card
  cohortCard: {
    backgroundColor: REZ_COLORS.white,
    padding: 16,
    borderRadius: 16,
    gap: 12,
    maxWidth: Platform.OS === 'web' ? 700 : undefined,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cohortHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cohortDate: {
    fontSize: 14,
    fontWeight: '600',
    color: REZ_COLORS.navy,
  },
  cohortSize: {
    fontSize: 12,
    color: REZ_COLORS.gray,
  },
  retentionBar: {
    height: 36,
    backgroundColor: REZ_COLORS.grayLight,
    borderRadius: 8,
    position: 'relative',
    justifyContent: 'center',
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  retentionBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 8,
  },
  retentionBarText: {
    fontSize: 14,
    fontWeight: '700',
    color: REZ_COLORS.navy,
    zIndex: 1,
  },
  retentionTimeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelinePoint: {
    alignItems: 'center',
    flex: 1,
  },
  timelineDay: {
    fontSize: 10,
    color: REZ_COLORS.gray,
    marginBottom: 2,
  },
  timelinePercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: REZ_COLORS.navy,
  },

  // Churn Card
  churnStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  churnStat: {
    alignItems: 'center',
  },
  churnStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: REZ_COLORS.navy,
  },
  churnStatLabel: {
    fontSize: 11,
    color: REZ_COLORS.gray,
  },
  churnStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: REZ_COLORS.grayLight,
    marginHorizontal: 20,
  },
  churnCard: {
    backgroundColor: REZ_COLORS.white,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    gap: 10,
    maxWidth: Platform.OS === 'web' ? 700 : undefined,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  churnCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  churnCardInfo: {
    flex: 1,
    marginRight: 12,
  },
  churnCardEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: REZ_COLORS.navy,
    marginBottom: 4,
  },
  churnCardDate: {
    fontSize: 11,
    color: REZ_COLORS.gray,
  },
  riskIndicator: {
    alignItems: 'flex-end',
    gap: 4,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  riskBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: REZ_COLORS.white,
  },
  riskLabel: {
    fontSize: 9,
    fontWeight: '700',
  },
  reasonsBox: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: REZ_COLORS.grayLight,
    gap: 4,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reasonDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: REZ_COLORS.gray,
  },
  reasonText: {
    fontSize: 11,
    color: REZ_COLORS.gray,
  },
  actionsBox: {
    backgroundColor: REZ_COLORS.success + '10',
    padding: 10,
    borderRadius: 8,
    gap: 4,
  },
  actionsTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: REZ_COLORS.success,
    marginBottom: 2,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 11,
    color: REZ_COLORS.navy,
    flex: 1,
  },

  // Summary Row
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: REZ_COLORS.white,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryLabel: {
    fontSize: 10,
    color: REZ_COLORS.gray,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: REZ_COLORS.navy,
  },

  // Segment Row
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: REZ_COLORS.white,
    padding: 16,
    borderRadius: 12,
    maxWidth: Platform.OS === 'web' ? 600 : undefined,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  segmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  segmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentName: {
    fontSize: 14,
    fontWeight: '600',
    color: REZ_COLORS.navy,
  },
  segmentCount: {
    fontSize: 11,
    color: REZ_COLORS.gray,
  },
  segmentHint: {
    fontSize: 10,
    color: REZ_COLORS.gray,
    marginTop: 2,
  },
  segmentRight: {
    alignItems: 'flex-end',
  },
  segmentPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: REZ_COLORS.navy,
  },

  // Distribution Section
  distributionSection: {
    gap: 12,
  },
  distributionBar: {
    flexDirection: 'row',
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: REZ_COLORS.grayLight,
  },
  distributionSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: REZ_COLORS.gray,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: REZ_COLORS.gray,
  },

  // Loading & Error
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: REZ_COLORS.gray,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: REZ_COLORS.error,
    fontWeight: '600',
  },
});

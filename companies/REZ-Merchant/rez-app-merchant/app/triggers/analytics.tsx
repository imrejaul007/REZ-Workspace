/**
 * Trigger Analytics Screen
 *
 * Displays comprehensive analytics for trigger rules.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useTriggerStats } from './hooks';
import { TriggerType } from './types';

const ACCENT = Colors.light.primary;

const TRIGGER_TYPE_CONFIG: Record<TriggerType, { label: string; color: string }> = {
  inactivity: { label: 'Inactivity', color: '#8B5CF6' },
  location: { label: 'Location', color: '#3B82F6' },
  birthday: { label: 'Birthday', color: '#EC4899' },
  first_visit: { label: 'First Visit', color: '#10B981' },
  loyalty_milestone: { label: 'Loyalty', color: '#F59E0B' },
  custom: { label: 'Custom', color: '#6B7280' },
};

type TimeRange = '7d' | '30d' | '90d' | 'all';

const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: 'all', label: 'All Time' },
];

export default function TriggerAnalyticsScreen() {
  const router = useRouter();
  const { stats, isLoading } = useTriggerStats();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ACCENT} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {TIME_RANGES.map((range) => (
            <TouchableOpacity
              key={range.key}
              style={[
                styles.timeRangeBtn,
                timeRange === range.key && styles.timeRangeBtnActive,
              ]}
              onPress={() => setTimeRange(range.key)}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  timeRange === range.key && styles.timeRangeTextActive,
                ]}
              >
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: ACCENT + '20' }]}>
                <Ionicons name="pulse" size={24} color={ACCENT} />
              </View>
              <Text style={styles.statValue}>{stats?.totalRules ?? 0}</Text>
              <Text style={styles.statLabel}>Total Rules</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: Colors.light.success + '20' }]}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.light.success} />
              </View>
              <Text style={styles.statValue}>{stats?.activeRules ?? 0}</Text>
              <Text style={styles.statLabel}>Active Rules</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#8B5CF620' }]}>
                <Ionicons name="flash" size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.statValue}>{stats?.totalTriggers ?? 0}</Text>
              <Text style={styles.statLabel}>Total Triggers</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#3B82F620' }]}>
                <Ionicons name="trending-up" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.statValue}>{stats?.averageConversionRate?.toFixed(1) ?? '0'}%</Text>
              <Text style={styles.statLabel}>Avg. Conversion</Text>
            </View>
          </View>
        </View>

        {/* Performance Chart Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trigger Volume</Text>
          <View style={styles.chartPlaceholder}>
            <View style={styles.chartBars}>
              {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((height, index) => (
                <View
                  key={index}
                  style={[
                    styles.chartBar,
                    { height: `${height}%`, backgroundColor: ACCENT },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.chartLabel}>Last 12 {timeRange === 'all' ? 'months' : 'periods'}</Text>
          </View>
        </View>

        {/* Top Performing Rule */}
        {stats?.topPerformingRule && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Performing Rule</Text>
            <View style={styles.topRuleCard}>
              <View style={styles.topRuleHeader}>
                <View style={styles.topRuleInfo}>
                  <Text style={styles.topRuleName}>{stats.topPerformingRule.name}</Text>
                  <Text style={styles.topRuleType}>
                    {TRIGGER_TYPE_CONFIG[stats.topPerformingRule.type]?.label ||
                      stats.topPerformingRule.type}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.viewRuleBtn}
                  onPress={() => router.push(`/triggers/${stats.topPerformingRule.id}`)}
                >
                  <Text style={styles.viewRuleText}>View</Text>
                  <Ionicons name="chevron-forward" size={16} color={ACCENT} />
                </TouchableOpacity>
              </View>
              <View style={styles.topRuleStats}>
                <View style={styles.topRuleStat}>
                  <Text style={styles.topRuleStatValue}>
                    {stats.topPerformingRule.executionCount}
                  </Text>
                  <Text style={styles.topRuleStatLabel}>Executions</Text>
                </View>
                <View style={styles.topRuleStat}>
                  <Text style={styles.topRuleStatValue}>
                    {stats.topPerformingRule.analytics?.conversionRate?.toFixed(1) ?? '0'}%
                  </Text>
                  <Text style={styles.topRuleStatLabel}>Conversion</Text>
                </View>
                <View style={styles.topRuleStat}>
                  <Text style={styles.topRuleStatValue}>
                    {stats.topPerformingRule.analytics?.last30Days ?? 0}
                  </Text>
                  <Text style={styles.topRuleStatLabel}>Last 30d</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Conversion Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conversion Breakdown</Text>
          <View style={styles.conversionContainer}>
            <View style={styles.conversionBar}>
              <View
                style={[
                  styles.conversionFill,
                  { width: `${stats?.averageConversionRate ?? 0}%` },
                ]}
              />
            </View>
            <View style={styles.conversionLabels}>
              <View style={styles.conversionLabel}>
                <View style={[styles.conversionDot, { backgroundColor: ACCENT }]} />
                <Text style={styles.conversionText}>Converted</Text>
              </View>
              <View style={styles.conversionLabel}>
                <View style={[styles.conversionDot, { backgroundColor: Colors.light.border }]} />
                <Text style={styles.conversionText}>Not Converted</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Insights</Text>
          <View style={styles.insightsContainer}>
            <View style={styles.insightItem}>
              <View style={[styles.insightIcon, { backgroundColor: Colors.light.successLight }]}>
                <Ionicons name="trending-up" size={18} color={Colors.light.success} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Best Performing Type</Text>
                <Text style={styles.insightValue}>
                  {TRIGGER_TYPE_CONFIG.location?.label || 'Location'}-based triggers
                </Text>
              </View>
            </View>
            <View style={styles.insightItem}>
              <View style={[styles.insightIcon, { backgroundColor: Colors.light.warningLight }]}>
                <Ionicons name="alert-circle" size={18} color={Colors.light.warning} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Optimization Tip</Text>
                <Text style={styles.insightValue}>
                  Birthday triggers have 23% higher engagement
                </Text>
              </View>
            </View>
            <View style={styles.insightItem}>
              <View style={[styles.insightIcon, { backgroundColor: Colors.light.primaryLight2 }]}>
                <Ionicons name="time" size={18} color={ACCENT} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Peak Engagement</Text>
                <Text style={styles.insightValue}>
                  Push notifications sent at 10 AM perform best
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Rule Type Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rule Type Distribution</Text>
          <View style={styles.distributionContainer}>
            {Object.entries(TRIGGER_TYPE_CONFIG).map(([type, config]) => (
              <View key={type} style={styles.distributionItem}>
                <View style={styles.distributionHeader}>
                  <View style={[styles.distributionDot, { backgroundColor: config.color }]} />
                  <Text style={styles.distributionLabel}>{config.label}</Text>
                  <Text style={styles.distributionValue}>
                    {Math.floor(Math.random() * 30) + 1}% {/* Placeholder */}
                  </Text>
                </View>
                <View style={styles.distributionBar}>
                  <View
                    style={[
                      styles.distributionFill,
                      {
                        width: `${Math.floor(Math.random() * 30) + 1}%`,
                        backgroundColor: config.color,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.textMuted,
    marginTop: 12,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Time Range
  timeRangeContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  timeRangeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  timeRangeBtnActive: {
    backgroundColor: ACCENT,
  },
  timeRangeText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.textMuted,
  },
  timeRangeTextActive: {
    color: '#fff',
  },

  // Sections
  section: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginBottom: 16,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 4,
  },

  // Chart
  chartPlaceholder: {
    height: 180,
    justifyContent: 'flex-end',
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  chartBar: {
    width: 20,
    borderRadius: 4,
    opacity: 0.8,
  },
  chartLabel: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 8,
  },

  // Top Rule Card
  topRuleCard: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: ACCENT,
  },
  topRuleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  topRuleInfo: {
    flex: 1,
  },
  topRuleName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  topRuleType: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  viewRuleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewRuleText: {
    fontSize: 14,
    fontWeight: '600',
    color: ACCENT,
  },
  topRuleStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  topRuleStat: {
    alignItems: 'center',
  },
  topRuleStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: ACCENT,
  },
  topRuleStatLabel: {
    fontSize: 11,
    color: Colors.light.textMuted,
    marginTop: 2,
  },

  // Conversion
  conversionContainer: {
    gap: 12,
  },
  conversionBar: {
    height: 24,
    backgroundColor: Colors.light.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  conversionFill: {
    height: '100%',
    backgroundColor: ACCENT,
    borderRadius: 12,
  },
  conversionLabels: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  conversionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  conversionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  conversionText: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },

  // Insights
  insightsContainer: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 10,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  insightValue: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },

  // Distribution
  distributionContainer: {
    gap: 14,
  },
  distributionItem: {
    gap: 6,
  },
  distributionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distributionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  distributionLabel: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  distributionValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  distributionBar: {
    height: 8,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  distributionFill: {
    height: '100%',
    borderRadius: 4,
  },
});

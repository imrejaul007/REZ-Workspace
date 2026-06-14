/**
 * Period Comparison Dashboard
 * Side-by-side comparison of this month vs last month analytics metrics
 */
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { Colors } from '@/constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PeriodData {
  revenue: number;
  visits: number;
  coinsIssued: number;
  newCustomers: number;
  avgTransactionValue: number;
}

interface MetricConfig {
  key: keyof PeriodData;
  label: string;
  format: (v: number) => string;
  barColor: string;
}

const METRIC_CONFIGS: MetricConfig[] = [
  {
    key: 'revenue',
    label: 'Revenue',
    format: (v) => `₹${v.toLocaleString()}`,
    barColor: '#7C3AED',
  },
  { key: 'visits', label: 'Visits', format: (v) => v.toLocaleString(), barColor: '#3B82F6' },
  {
    key: 'coinsIssued',
    label: 'Coins Issued',
    format: (v) => v.toLocaleString(),
    barColor: '#F59E0B',
  },
  {
    key: 'newCustomers',
    label: 'New Customers',
    format: (v) => v.toLocaleString(),
    barColor: '#10B981',
  },
  {
    key: 'avgTransactionValue',
    label: 'Avg Transaction',
    format: (v) => `₹${v.toLocaleString()}`,
    barColor: '#EF4444',
  },
];

function calcChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

function ChangeBadge({ pct }: { pct: number }) {
  if (pct === 0) {
    return (
      <View style={[styles.changeBadge, styles.changeBadgeNeutral]}>
        <Text style={styles.changeBadgeTextNeutral}>—</Text>
      </View>
    );
  }
  const isPositive = pct > 0;
  return (
    <View style={[styles.changeBadge, isPositive ? styles.changeBadgeUp : styles.changeBadgeDown]}>
      <Ionicons
        name={isPositive ? 'arrow-up' : 'arrow-down'}
        size={11}
        color={isPositive ? '#16A34A' : '#DC2626'}
      />
      <Text style={[styles.changeBadgeText, { color: isPositive ? '#16A34A' : '#DC2626' }]}>
        {Math.abs(pct).toFixed(1)}%
      </Text>
    </View>
  );
}

async function fetchPeriodData(period: string): Promise<PeriodData> {
  const res = await apiClient.get<PeriodData>(`/merchant/analytics?period=${period}`);
  const d = (res as unknown as { data?: PeriodData }).data ?? res;
  return d as PeriodData;
}

function BarChart({ thisMonth, lastMonth }: { thisMonth: PeriodData; lastMonth: PeriodData }) {
  const BAR_MAX_HEIGHT = 100;
  const BAR_WIDTH = 24;

  return (
    <View style={styles.barChartContainer}>
      <Text style={styles.chartTitle}>Monthly Comparison</Text>
      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#1a3a52' }]} />
          <Text style={styles.legendText}>This Month</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#D1D5DB' }]} />
          <Text style={styles.legendText}>Last Month</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.barsRow}>
          {METRIC_CONFIGS.map((m) => {
            const thisVal = thisMonth[m.key];
            const lastVal = lastMonth[m.key];
            const maxVal = Math.max(thisVal, lastVal, 1);
            const thisH = Math.round((thisVal / maxVal) * BAR_MAX_HEIGHT);
            const lastH = Math.round((lastVal / maxVal) * BAR_MAX_HEIGHT);
            return (
              <View key={m.key} style={styles.barGroup}>
                <View style={styles.barPair}>
                  <View
                    style={[
                      styles.barFill,
                      { height: thisH, width: BAR_WIDTH, backgroundColor: '#1a3a52' },
                    ]}
                  />
                  <View
                    style={[
                      styles.barFill,
                      { height: lastH, width: BAR_WIDTH, backgroundColor: '#D1D5DB' },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel} numberOfLines={2}>
                  {m.label}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export default function PeriodComparisonScreen() {
  const {
    data: thisMonthData,
    isLoading: loadingThis,
    refetch: refetchThis,
  } = useQuery({
    queryKey: ['analytics-period', 'this_month'],
    queryFn: () => fetchPeriodData('this_month'),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: lastMonthData,
    isLoading: loadingLast,
    refetch: refetchLast,
  } = useQuery({
    queryKey: ['analytics-period', 'last_month'],
    queryFn: () => fetchPeriodData('last_month'),
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = loadingThis || loadingLast;

  const handleRefresh = async () => {
    await Promise.all([refetchThis(), refetchLast()]);
  };

  const revenuePct = useMemo(() => {
    if (!thisMonthData || !lastMonthData) return 0;
    return calcChange(thisMonthData.revenue, lastMonthData.revenue);
  }, [thisMonthData, lastMonthData]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Period Comparison' }} />
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading comparison...</Text>
      </View>
    );
  }

  const thisMonth = thisMonthData ?? {
    revenue: 0,
    visits: 0,
    coinsIssued: 0,
    newCustomers: 0,
    avgTransactionValue: 0,
  };
  const lastMonth = lastMonthData ?? {
    revenue: 0,
    visits: 0,
    coinsIssued: 0,
    newCustomers: 0,
    avgTransactionValue: 0,
  };

  const isRevenueUp = revenuePct > 0;
  const isRevenueZero = revenuePct === 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={false} onRefresh={handleRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ title: 'Period Comparison' }} />

      {/* Summary Card */}
      <View
        style={[
          styles.summaryCard,
          { borderLeftColor: isRevenueZero ? '#9CA3AF' : isRevenueUp ? '#16A34A' : '#DC2626' },
        ]}
      >
        <View style={styles.summaryRow}>
          <Ionicons
            name={
              isRevenueZero
                ? 'remove-circle-outline'
                : isRevenueUp
                  ? 'trending-up'
                  : 'trending-down'
            }
            size={28}
            color={isRevenueZero ? '#9CA3AF' : isRevenueUp ? '#16A34A' : '#DC2626'}
          />
          <Text style={styles.summaryText}>
            {isRevenueZero
              ? 'Revenue unchanged vs last month'
              : `Revenue ${isRevenueUp ? 'up' : 'down'} ${Math.abs(revenuePct).toFixed(1)}% vs last month`}
          </Text>
        </View>
      </View>

      {/* Metric Cards */}
      {METRIC_CONFIGS.map((m) => {
        const thisVal = thisMonth[m.key];
        const lastVal = lastMonth[m.key];
        const pct = calcChange(thisVal, lastVal);
        return (
          <View key={m.key} style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricName}>{m.label}</Text>
              <ChangeBadge pct={pct} />
            </View>
            <View style={styles.metricValues}>
              <View style={styles.metricValueBlock}>
                <Text style={styles.metricValueLabel}>This Month</Text>
                <Text style={[styles.metricValue, { color: m.barColor }]}>{m.format(thisVal)}</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricValueBlock}>
                <Text style={styles.metricValueLabel}>Last Month</Text>
                <Text style={styles.metricValueGray}>{m.format(lastVal)}</Text>
              </View>
            </View>
          </View>
        );
      })}

      {/* Bar Chart */}
      <BarChart thisMonth={thisMonth} lastMonth={lastMonth} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },

  // Metric Cards
  metricCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  metricValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricValueBlock: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.light.border,
    marginHorizontal: 8,
  },
  metricValueLabel: {
    fontSize: 11,
    color: Colors.light.textMuted,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  metricValueGray: {
    fontSize: 18,
    fontWeight: '700',
    color: '#9CA3AF',
  },

  // Change Badge
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3,
  },
  changeBadgeUp: {
    backgroundColor: '#DCFCE7',
  },
  changeBadgeDown: {
    backgroundColor: '#FEE2E2',
  },
  changeBadgeNeutral: {
    backgroundColor: '#F3F4F6',
  },
  changeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  changeBadgeTextNeutral: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },

  // Bar Chart
  barChartContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginTop: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginBottom: 12,
  },
  chartLegend: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
    minWidth: SCREEN_WIDTH - 64,
  },
  barGroup: {
    alignItems: 'center',
    flex: 1,
    minWidth: 80,
  },
  barPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 100,
    marginBottom: 8,
  },
  barFill: {
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    maxWidth: 72,
  },
});

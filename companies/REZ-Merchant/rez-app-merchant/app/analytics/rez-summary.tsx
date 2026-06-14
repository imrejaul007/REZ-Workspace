/**
 * REZ Analytics Summary Screen
 *
 * Fetches merchant-level analytics from the analytics-events service:
 *   GET EXPO_PUBLIC_ANALYTICS_SERVICE_URL/api/analytics/merchant/:merchantId/summary?period=30d
 *
 * Displays:
 *   - Revenue card (current period vs previous, % change)
 *   - Visitors card
 *   - Top 5 products bar chart (View-based, no charting lib)
 *   - New vs Returning donut-style percentage display
 *   - Pull-to-refresh
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/api/client';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TopProduct {
  productId: string;
  name: string;
  revenue: number;
  quantity: number;
}

interface AnalyticsSummary {
  merchantId: string;
  period: string;
  revenue: number;
  visitors: number;
  topProducts: TopProduct[];
  newVsReturning: {
    new: number;
    returning: number;
    ratio: number;
  };
  days: Array<{ date: string; revenue: number; visitors: number }>;
}

type PeriodKey = '7d' | '30d' | '90d';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (n: number) => `\u20B9${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

function calcChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// ---------------------------------------------------------------------------
// Revenue Forecast helpers
// ---------------------------------------------------------------------------

function linearForecast(data: number[]): number[] {
  const n = data.length;
  if (n < 2) return [];
  const xMean = (n - 1) / 2;
  const yMean = data.reduce((a, b) => a + b, 0) / n;
  const slope =
    data.reduce((sum, y, x) => sum + (x - xMean) * (y - yMean), 0) /
    data.reduce((sum, _, x) => sum + (x - xMean) ** 2, 0);
  const intercept = yMean - slope * xMean;
  return Array.from({ length: 7 }, (_, i) => Math.max(0, Math.round(intercept + slope * (n + i))));
}

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface ForecastSectionBarProps {
  value: number;
  maxValue: number;
  label: string;
}

const ForecastSectionBar = ({ value, maxValue, label }: ForecastSectionBarProps) => {
  const barHeight = maxValue > 0 ? (value / maxValue) * 80 : 0;
  return (
    <View style={forecastBarStyles.wrapper}>
      <Text style={forecastBarStyles.value}>
        {value > 0 ? `\u20B9${Math.round(value / 1000)}k` : '0'}
      </Text>
      <View style={forecastBarStyles.track}>
        <View style={[forecastBarStyles.fill, { height: Math.max(2, barHeight) }]} />
      </View>
      <Text style={forecastBarStyles.label}>{label}</Text>
    </View>
  );
};

const forecastBarStyles = StyleSheet.create({
  wrapper: { flex: 1, alignItems: 'center', gap: 4 },
  value: { fontSize: 9, fontWeight: '600', color: '#6366f1' },
  track: {
    width: 28,
    height: 80,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  fill: { width: '100%', backgroundColor: '#a5b4fc', borderRadius: 6 },
  label: { fontSize: 9, color: '#9ca3af', textAlign: 'center' },
});

interface RevenueForecastSectionProps {
  days: Array<{ date: string; revenue: number; visitors: number }>;
}

const RevenueForecastSection = ({ days }: RevenueForecastSectionProps) => {
  const revenuePoints = days.slice(-28).map((d) => d.revenue);

  if (revenuePoints.length < 7) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trending-up" size={18} color="#6366f1" />
          <Text style={styles.sectionTitle}>Next 7 Days Forecast</Text>
        </View>
        <Text style={styles.emptyNote}>Not enough data for forecast yet</Text>
      </View>
    );
  }

  const forecast = linearForecast(revenuePoints);
  const maxVal = Math.max(...forecast, 1);
  const todayDow = new Date().getDay();
  const labels = Array.from({ length: 7 }, (_, i) => DAY_SHORT[(todayDow + i) % 7]);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="trending-up" size={18} color="#6366f1" />
        <Text style={styles.sectionTitle}>Next 7 Days Forecast</Text>
      </View>
      <Text style={forecastSectionStyles.subtitle}>
        Based on last {revenuePoints.length} days trend
      </Text>
      <View style={forecastSectionStyles.barsRow}>
        {forecast.map((val, i) => (
          <ForecastSectionBar key={i} value={val} maxValue={maxVal} label={labels[i]} />
        ))}
      </View>
    </View>
  );
};

const forecastSectionStyles = StyleSheet.create({
  subtitle: { fontSize: 12, color: '#9ca3af', marginBottom: 16 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, paddingTop: 8 },
});

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface MetricCardProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  change?: number;
}

const MetricCard = ({ icon, iconColor, iconBg, label, value, change }: MetricCardProps) => (
  <View style={styles.metricCard}>
    <View style={[styles.metricIcon, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={22} color={iconColor} />
    </View>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
    {change !== undefined && (
      <View style={styles.changeRow}>
        <Ionicons
          name={change >= 0 ? 'trending-up' : 'trending-down'}
          size={12}
          color={change >= 0 ? '#10b981' : '#ef4444'}
        />
        <Text style={[styles.changeText, { color: change >= 0 ? '#10b981' : '#ef4444' }]}>
          {fmtPct(change)} vs prev period
        </Text>
      </View>
    )}
  </View>
);

interface ProductBarProps {
  product: TopProduct;
  maxRevenue: number;
  rank: number;
}

const ProductBar = ({ product, maxRevenue, rank }: ProductBarProps) => {
  const barWidth = maxRevenue > 0 ? (product.revenue / maxRevenue) * 100 : 0;
  return (
    <View style={styles.barRow}>
      <View style={styles.barRankBadge}>
        <Text style={styles.barRankText}>{rank}</Text>
      </View>
      <View style={styles.barContent}>
        <View style={styles.barLabelRow}>
          <Text style={styles.barName} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={styles.barRevenue}>{fmt(product.revenue)}</Text>
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${barWidth}%` }]} />
        </View>
        <Text style={styles.barQty}>{product.quantity} units sold</Text>
      </View>
    </View>
  );
};

interface DonutDisplayProps {
  newCount: number;
  returningCount: number;
}

// ---------------------------------------------------------------------------
// 7-Day Forecast
// ---------------------------------------------------------------------------

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface ForecastBarProps {
  day: string;
  amount: number;
  maxAmount: number;
}

const ForecastBar = ({ day, amount, maxAmount }: ForecastBarProps) => {
  const barHeight = maxAmount > 0 ? Math.max(4, (amount / maxAmount) * 80) : 4;
  return (
    <View style={forecastStyles.barCol}>
      <Text style={forecastStyles.barAmt}>{`\u20B9${Math.round(amount / 1000)}k`}</Text>
      <View style={forecastStyles.barTrack}>
        <View style={[forecastStyles.barFill, { height: barHeight }]} />
      </View>
      <Text style={forecastStyles.barDay}>{day}</Text>
    </View>
  );
};

interface RevenueForecastProps {
  summary: AnalyticsSummary | null;
}

const RevenueForecast = ({ summary }: RevenueForecastProps) => {
  // Calculate daily average from last 30-day data
  const dailyAvg = (() => {
    if (summary?.days && summary.days.length >= 7) {
      const recent = summary.days.slice(-28);
      const total = recent.reduce((sum, d) => sum + (d.revenue || 0), 0);
      return total / recent.length;
    }
    // Fallback: totalRevenue / 30
    return (summary?.revenue ?? 0) / 30;
  })();

  const growthFactor = 1.05;
  const today = new Date();

  const forecastDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1);
    return {
      day: DAY_ABBR[d.getDay()],
      amount: dailyAvg * growthFactor,
    };
  });

  const maxAmount = Math.max(...forecastDays.map((d) => d.amount), 1);
  const weekTotal = forecastDays.reduce((sum, d) => sum + d.amount, 0);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="trending-up" size={18} color="#6366f1" />
        <Text style={styles.sectionTitle}>7-Day Forecast</Text>
        <View style={forecastStyles.weekBadge}>
          <Text style={forecastStyles.weekBadgeText}>{fmt(weekTotal)} projected</Text>
        </View>
      </View>
      <View style={forecastStyles.barsRow}>
        {forecastDays.map((d, i) => (
          <ForecastBar key={i} day={d.day} amount={d.amount} maxAmount={maxAmount} />
        ))}
      </View>
      <Text style={forecastStyles.disclaimer}>Forecast based on last 30-day average</Text>
    </View>
  );
};

const forecastStyles = StyleSheet.create({
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 110,
    paddingTop: 8,
    marginBottom: 10,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barAmt: { fontSize: 9, fontWeight: '600', color: '#6b7280', marginBottom: 2 },
  barTrack: {
    width: '60%',
    height: 80,
    justifyContent: 'flex-end',
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#a5b4fc',
    borderRadius: 4,
  },
  barDay: { fontSize: 10, fontWeight: '600', color: '#9ca3af', marginTop: 4 },
  weekBadge: {
    marginLeft: 'auto',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  weekBadgeText: { fontSize: 11, fontWeight: '700', color: '#6366f1' },
  disclaimer: { fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 4 },
});

const DonutDisplay = ({ newCount, returningCount }: DonutDisplayProps) => {
  const total = newCount + returningCount;
  const newPct = total > 0 ? Math.round((newCount / total) * 100) : 0;
  const retPct = 100 - newPct;

  return (
    <View style={styles.donutContainer}>
      {/* Left: visual representation */}
      <View style={styles.donutVisual}>
        <View style={styles.donutOuter}>
          <View style={[styles.donutSegmentNew, { flex: newPct }]} />
          <View style={[styles.donutSegmentRet, { flex: retPct }]} />
        </View>
        <View style={styles.donutCenter}>
          <Text style={styles.donutCenterPct}>{retPct}%</Text>
          <Text style={styles.donutCenterLabel}>returning</Text>
        </View>
      </View>

      {/* Right: legend */}
      <View style={styles.donutLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#6366f1' }]} />
          <View>
            <Text style={styles.legendLabel}>New Customers</Text>
            <Text style={styles.legendValue}>
              {newCount.toLocaleString()} ({newPct}%)
            </Text>
          </View>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
          <View>
            <Text style={styles.legendLabel}>Returning</Text>
            <Text style={styles.legendValue}>
              {returningCount.toLocaleString()} ({retPct}%)
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function REZAnalyticsSummaryScreen() {
  const { merchant } = useAuth();
  const merchantId = merchant?.id;

  const [period, setPeriod] = useState<PeriodKey>('30d');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [prevRevenue, setPrevRevenue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(
    async (selectedPeriod: PeriodKey) => {
      if (!merchantId) {
        setError('Merchant ID not available');
        setLoading(false);
        return;
      }
      try {
        setError(null);
        const response = await apiClient.get(
          `/analytics/merchant/${merchantId}/summary?period=${selectedPeriod}`
        );
        const json = response.data as unknown as AnalyticsSummary;
        if (!response.success || !json) {
          throw new Error((response as unknown as { error?: string }).error || 'Failed to load analytics');
        }
        setSummary(json as AnalyticsSummary);

        // Fetch previous period for % change comparison
        const prevPeriodMap: Record<PeriodKey, PeriodKey> = {
          '7d': '7d',
          '30d': '30d',
          '90d': '90d',
        };
        // Use same period length offset — simple: prev period = same window, different offset
        // We approximate by fetching the 2x window and splitting manually. For now use stored
        // previous revenue heuristic: half of 2x period total.
        // A cleaner approach: just show absolute revenue without % when we can't compare.
        setPrevRevenue(null); // reset — % change will be shown only when both available
      } catch (err) {
        setError(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [merchantId]
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchSummary(period);
    }, [fetchSummary, period])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSummary(period);
  }, [fetchSummary, period]);

  const handlePeriodChange = (p: PeriodKey) => {
    setPeriod(p);
    setLoading(true);
    setSummary(null);
    fetchSummary(p);
  };

  // --- Loading state ---
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- Error state ---
  if (error && !summary) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              fetchSummary(period);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const top5 = (summary?.topProducts ?? []).slice(0, 5);
  const maxRevenue = top5.length > 0 ? Math.max(...top5.map((p) => p.revenue)) : 1;
  const revenueChange =
    prevRevenue !== null ? calcChange(summary?.revenue ?? 0, prevRevenue) : undefined;

  const PERIODS: { key: PeriodKey; label: string }[] = [
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '90 Days' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.periodChip, period === p.key && styles.periodChipActive]}
              onPress={() => handlePeriodChange(p.key)}
            >
              <Text
                style={[styles.periodChipText, period === p.key && styles.periodChipTextActive]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Metric Cards */}
        <View style={styles.metricsRow}>
          <MetricCard
            icon="cash"
            iconColor="#059669"
            iconBg="#d1fae5"
            label="Revenue"
            value={fmt(summary?.revenue ?? 0)}
            change={revenueChange}
          />
          <MetricCard
            icon="people"
            iconColor="#6366f1"
            iconBg="#eef2ff"
            label="Unique Visitors"
            value={(summary?.visitors ?? 0).toLocaleString()}
          />
        </View>

        {/* Top Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bar-chart" size={18} color="#6366f1" />
            <Text style={styles.sectionTitle}>Top Products by Revenue</Text>
          </View>
          {top5.length === 0 ? (
            <Text style={styles.emptyNote}>No product data for this period.</Text>
          ) : (
            top5.map((product, i) => (
              <ProductBar
                key={product.productId}
                product={product}
                maxRevenue={maxRevenue}
                rank={i + 1}
              />
            ))
          )}
        </View>

        {/* New vs Returning */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pie-chart" size={18} color="#6366f1" />
            <Text style={styles.sectionTitle}>New vs Returning Customers</Text>
          </View>
          {summary && summary.newVsReturning.new + summary.newVsReturning.returning > 0 ? (
            <DonutDisplay
              newCount={summary.newVsReturning.new}
              returningCount={summary.newVsReturning.returning}
            />
          ) : (
            <Text style={styles.emptyNote}>No customer data for this period.</Text>
          )}
        </View>

        {/* Revenue Forecast */}
        <RevenueForecastSection days={summary?.days ?? []} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6b7280' },
  errorText: { marginTop: 12, fontSize: 14, color: '#ef4444', textAlign: 'center' },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: { color: '#fff', fontWeight: '600' },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Period selector
  periodRow: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  periodChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodChipActive: { backgroundColor: '#6366f1' },
  periodChipText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  periodChipTextActive: { color: '#fff' },

  // Metric cards
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  metricIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricLabel: { fontSize: 12, color: '#9ca3af', fontWeight: '500', marginBottom: 4 },
  metricValue: { fontSize: 22, fontWeight: '700', color: '#111827' },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  changeText: { fontSize: 11, fontWeight: '600' },

  // Sections
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  emptyNote: { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingVertical: 16 },

  // Bar chart
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 10,
  },
  barRankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  barRankText: { fontSize: 11, fontWeight: '700', color: '#6366f1' },
  barContent: { flex: 1 },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  barName: { fontSize: 13, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  barRevenue: { fontSize: 13, fontWeight: '700', color: '#059669' },
  barTrack: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 3,
  },
  barFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  barQty: { fontSize: 11, color: '#9ca3af' },

  // Donut display
  donutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  donutVisual: {
    width: 110,
    height: 110,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    flexDirection: 'row',
    position: 'absolute',
  },
  donutSegmentNew: { backgroundColor: '#6366f1' },
  donutSegmentRet: { backgroundColor: '#10b981' },
  donutCenter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  donutCenterPct: { fontSize: 18, fontWeight: '800', color: '#111827' },
  donutCenterLabel: { fontSize: 10, color: '#6b7280', marginTop: 1 },
  donutLegend: { flex: 1, gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { fontSize: 12, color: '#6b7280' },
  legendValue: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 1 },
});

/**
 * MerchantGrowthDashboard
 * Phase 3.2 — Merchant-Driven Growth
 *
 * Shows the merchant:
 * - "REZ brought you X repeat customers this month"
 * - KPI cards: total REZ customers, repeat rate, revenue from REZ, avg visits
 * - Trend chart: REZ customers vs total customers
 * - Top loyal customers list with visit counts
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useStore } from '@/contexts/StoreContext';
import { apiClient } from '@/services/api/client';
import { logger } from '@/utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RoiHeroKpi {
  valuePaise: number;
  vsLastMonth: number;
}

interface RoiHeroData {
  revenueViaRez: RoiHeroKpi;
  newCustomers: { count: number; cac: number; vsLastMonth: number };
  repeatRate: { percent: number; vsLastMonth: number };
  aov: RoiHeroKpi;
}

interface ActionItem {
  id: string;
  priority: 'critical' | 'high' | 'medium' | string;
  category: string;
  icon: string;
  title: string;
  description: string;
  impact: string;
  ctaLabel: string;
  ctaRoute?: string;
}

interface GrowthMetrics {
  totalRezCustomers: number;
  newRezCustomersThisMonth: number;
  repeatCustomersThisMonth: number;
  repeatRate: number; // percentage 0-100
  revenueFromRez: number;
  avgVisitsPerCustomer: number;
  totalRezRevenue: number;
  revenueGrowth: number;
}

interface LoyalCustomer {
  userId: string;
  name: string;
  phone?: string;
  visitCount: number;
  totalSpend: number;
  lastVisit: string;
  tier: string;
}

interface TrendDataPoint {
  label: string; // e.g. "Jan", "Feb"
  rezCustomers: number;
  totalCustomers: number;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------
async function fetchGrowthMetrics(storeId: string): Promise<GrowthMetrics> {
  const response = await apiClient.get(`/merchant/growth/metrics?storeId=${storeId}`);
  return response.data?.data ?? response.data;
}

async function fetchLoyalCustomers(storeId: string): Promise<LoyalCustomer[]> {
  const response = await apiClient.get(
    `/merchant/growth/loyal-customers?storeId=${storeId}&minVisits=3&limit=20`
  );
  return response.data?.data ?? response.data ?? [];
}

async function fetchCustomerTrend(storeId: string): Promise<TrendDataPoint[]> {
  const response = await apiClient.get(
    `/merchant/growth/customer-trend?storeId=${storeId}&months=6`
  );
  return response.data?.data ?? response.data ?? [];
}

async function fetchRoiHero(storeId: string): Promise<RoiHeroData | null> {
  // MERCH-AUDIT-FIX: Removed double /api/ prefix (apiClient prepends baseURL/api).
  // The endpoint merchant/intelligence/roi-hero exists in backend source but is NOT
  // mounted in routes.ts, so this will 404. Return null gracefully.
  try {
    const response = await apiClient.get(`merchant/intelligence/roi-hero?storeId=${storeId}`);
    return response.data?.data ?? response.data;
  } catch (err) {
    if (__DEV__) console.warn('[growth.tsx] fetchRoiHero failed (endpoint not mounted):', err);
    return null;
  }
}

async function fetchActionCenter(storeId: string): Promise<ActionItem[]> {
  // MERCH-AUDIT-FIX: Removed double /api/ prefix and added error handling.
  // The endpoint merchant/intelligence/action-center exists in backend source but is NOT
  // mounted in routes.ts, so this will 404. Return empty gracefully.
  try {
    const response = await apiClient.get(`merchant/intelligence/action-center?storeId=${storeId}`);
    return response.data?.data?.actions ?? response.data?.actions ?? [];
  } catch (err) {
    if (__DEV__) console.warn('[growth.tsx] fetchActionCenter failed (endpoint not mounted):', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function KpiCard({
  title,
  value,
  subtitle,
  icon,
  color,
  gradient,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  color: string;
  gradient: [string, string];
}) {
  return (
    <View style={kpiStyles.card}>
      <LinearGradient
        colors={gradient}
        style={kpiStyles.iconCircle}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={icon as unknown as keyof typeof Ionicons.glyphMap} size={22} color="#fff" />
      </LinearGradient>
      <ThemedText style={kpiStyles.value}>{value}</ThemedText>
      <ThemedText style={kpiStyles.title}>{title}</ThemedText>
      {subtitle ? <ThemedText style={kpiStyles.subtitle}>{subtitle}</ThemedText> : null}
    </View>
  );
}

const kpiStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 16,
    width: (SCREEN_WIDTH - 48) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: 2,
  },
  title: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 11,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
});

// Simple bar chart rendered without a chart library dependency
function TrendBars({ data }: { data: TrendDataPoint[] }) {
  const maxVal = Math.max(...data.map((d) => d.totalCustomers), 1);

  return (
    <View style={chartStyles.container}>
      <ThemedText style={chartStyles.title}>Customer Trend (6 months)</ThemedText>
      <View style={chartStyles.legend}>
        <View style={chartStyles.legendItem}>
          <View style={[chartStyles.legendDot, { backgroundColor: '#7c3aed' }]} />
          <ThemedText style={chartStyles.legendText}>REZ Customers</ThemedText>
        </View>
        <View style={chartStyles.legendItem}>
          <View style={[chartStyles.legendDot, { backgroundColor: '#e2e8f0' }]} />
          <ThemedText style={chartStyles.legendText}>Total Customers</ThemedText>
        </View>
      </View>
      <View style={chartStyles.bars}>
        {data.map((point, i) => {
          const totalH = Math.max(4, (point.totalCustomers / maxVal) * 120);
          const rezH = Math.max(2, (point.rezCustomers / maxVal) * 120);
          return (
            <View key={i} style={chartStyles.barGroup}>
              <View style={chartStyles.barPair}>
                {/* Total bar (background) */}
                <View
                  style={[
                    chartStyles.bar,
                    { height: totalH, backgroundColor: '#e2e8f0', marginRight: 2 },
                  ]}
                />
                {/* REZ bar (foreground) */}
                <View style={[chartStyles.bar, { height: rezH, backgroundColor: '#7c3aed' }]} />
              </View>
              <ThemedText style={chartStyles.barLabel}>{point.label}</ThemedText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: Colors.light.textSecondary },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
  },
  barGroup: { alignItems: 'center', flex: 1 },
  barPair: { flexDirection: 'row', alignItems: 'flex-end' },
  bar: { width: 10, borderRadius: 4 },
  barLabel: {
    fontSize: 10,
    color: Colors.light.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
});

// ---------------------------------------------------------------------------
// ROI Hero sub-components
// ---------------------------------------------------------------------------
function DeltaBadge({ vsLastMonth }: { vsLastMonth: number }) {
  const positive = vsLastMonth >= 0;
  return (
    <View style={[roiStyles.deltaBadge, { backgroundColor: positive ? '#dcfce7' : '#fee2e2' }]}>
      <Ionicons
        name={positive ? 'arrow-up' : 'arrow-down'}
        size={10}
        color={positive ? '#16a34a' : '#dc2626'}
      />
      <ThemedText style={[roiStyles.deltaText, { color: positive ? '#16a34a' : '#dc2626' }]}>
        {Math.abs(vsLastMonth).toFixed(1)}%
      </ThemedText>
    </View>
  );
}

function RoiCard({
  label,
  value,
  vsLastMonth,
  gradient,
  icon,
}: {
  label: string;
  value: string;
  vsLastMonth: number;
  gradient: [string, string];
  icon: string;
}) {
  return (
    <View style={roiStyles.card}>
      <LinearGradient
        colors={gradient}
        style={roiStyles.iconCircle}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={icon as unknown as keyof typeof Ionicons.glyphMap} size={18} color="#fff" />
      </LinearGradient>
      <ThemedText style={roiStyles.value}>{value}</ThemedText>
      <ThemedText style={roiStyles.label}>{label}</ThemedText>
      <DeltaBadge vsLastMonth={vsLastMonth} />
    </View>
  );
}

const roiStyles = StyleSheet.create({
  section: { marginBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  scroll: { marginHorizontal: -16, paddingHorizontal: 16 },
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 14,
    width: 148,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontWeight: '500',
    marginBottom: 8,
  },
  deltaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  deltaText: { fontSize: 11, fontWeight: '700' },
  loadingBox: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ---------------------------------------------------------------------------
// Action Center sub-component
// ---------------------------------------------------------------------------
const PRIORITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
};

function ActionCard({ action }: { action: ActionItem }) {
  const barColor = PRIORITY_COLORS[action.priority] ?? '#94a3b8';
  return (
    <View style={actionStyles.card}>
      <View style={[actionStyles.priorityBar, { backgroundColor: barColor }]} />
      <View style={actionStyles.cardInner}>
        <View style={actionStyles.topRow}>
          <View style={actionStyles.iconWrap}>
            <Ionicons name={action.icon as unknown as keyof typeof Ionicons.glyphMap} size={20} color="#7c3aed" />
          </View>
          <View style={actionStyles.textBlock}>
            <ThemedText style={actionStyles.title}>{action.title}</ThemedText>
            <ThemedText style={actionStyles.description}>{action.description}</ThemedText>
          </View>
        </View>
        <ThemedText style={actionStyles.impact}>{action.impact}</ThemedText>
        {action.ctaLabel ? (
          <TouchableOpacity
            style={actionStyles.ctaButton}
            onPress={() => {
              if (action.ctaRoute) {
                router.push(action.ctaRoute);
              }
            }}
            accessibilityLabel={action.ctaLabel}
          >
            <ThemedText style={actionStyles.ctaLabel}>{action.ctaLabel}</ThemedText>
            <Ionicons name="chevron-forward" size={14} color="#7c3aed" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const actionStyles = StyleSheet.create({
  section: { marginBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  priorityBar: { width: 4 },
  cardInner: { flex: 1, padding: 14 },
  topRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1 },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 3,
  },
  description: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 17,
  },
  impact: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
    marginBottom: 10,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: '#ede9fe',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ctaLabel: { fontSize: 12, color: '#7c3aed', fontWeight: '700' },
  emptyText: {
    textAlign: 'center',
    color: Colors.light.textSecondary,
    fontSize: 14,
    paddingVertical: 16,
  },
  loadingBox: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function MerchantGrowthDashboard() {
  const { activeStore } = useStore();
  const storeId = activeStore?._id;
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ['merchant-growth-metrics', storeId],
    queryFn: () => fetchGrowthMetrics(storeId!),
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: loyalCustomers = [],
    isLoading: loyalLoading,
    refetch: refetchLoyal,
  } = useQuery({
    queryKey: ['merchant-loyal-customers', storeId],
    queryFn: () => fetchLoyalCustomers(storeId!),
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: trendData = [],
    isLoading: trendLoading,
    refetch: refetchTrend,
  } = useQuery({
    queryKey: ['merchant-customer-trend', storeId],
    queryFn: () => fetchCustomerTrend(storeId!),
    enabled: !!storeId,
    staleTime: 10 * 60 * 1000,
  });

  const {
    data: roiHero,
    isLoading: roiHeroLoading,
    refetch: refetchRoiHero,
  } = useQuery({
    queryKey: ['merchant-roi-hero', storeId],
    queryFn: () => fetchRoiHero(storeId!),
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: actions = [],
    isLoading: actionsLoading,
    refetch: refetchActions,
  } = useQuery({
    queryKey: ['merchant-action-center', storeId],
    queryFn: () => fetchActionCenter(storeId!),
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000,
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchMetrics(),
      refetchLoyal(),
      refetchTrend(),
      refetchRoiHero(),
      refetchActions(),
    ]);
    setRefreshing(false);
  }, [refetchMetrics, refetchLoyal, refetchTrend, refetchRoiHero, refetchActions]);

  const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  const formatPct = (n: number) => `${n.toFixed(1)}%`;

  if (!storeId) {
    return (
      <ThemedView style={[styles.centered, styles.container]}>
        <Ionicons name="storefront-outline" size={48} color={Colors.light.textMuted} />
        <ThemedText style={styles.emptyText}>Select a store to see growth data</ThemedText>
      </ThemedView>
    );
  }

  if (metricsLoading && !metrics) {
    return (
      <ThemedView style={[styles.centered, styles.container]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <ThemedText style={styles.loadingText}>Loading growth data...</ThemedText>
      </ThemedView>
    );
  }

  // FE-H5 fix: metricsError was captured from useQuery but never rendered.
  // Show an error state with retry so the merchant knows the data failed to load.
  if (metricsError && !metrics) {
    return (
      <ThemedView style={[styles.centered, styles.container]}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <ThemedText style={[styles.emptyText, { color: '#ef4444' }]}>
          Failed to load growth data. Please check your connection.
        </ThemedText>
        <TouchableOpacity
          onPress={() => refetchMetrics()}
          style={{
            marginTop: 16,
            backgroundColor: Colors.light.primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ROI Hero section */}
      <View style={roiStyles.section}>
        <View style={roiStyles.headerRow}>
          <LinearGradient
            colors={['#4f46e5', '#7c3aed']}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="stats-chart" size={14} color="#fff" />
          </LinearGradient>
          <ThemedText style={roiStyles.sectionTitle}>REZ Impact This Month</ThemedText>
        </View>
        {roiHeroLoading ? (
          <View style={roiStyles.loadingBox}>
            <ActivityIndicator color="#7c3aed" />
          </View>
        ) : roiHero ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={roiStyles.scroll}
            contentContainerStyle={{ paddingRight: 16 }}
          >
            <RoiCard
              label="Revenue via REZ"
              value={`₹${(roiHero.revenueViaRez.valuePaise / 100).toLocaleString('en-IN')}`}
              vsLastMonth={roiHero.revenueViaRez.vsLastMonth}
              gradient={['#4f46e5', '#818cf8']}
              icon="cash-outline"
            />
            <RoiCard
              label="New Customers"
              value={roiHero.newCustomers.count.toLocaleString()}
              vsLastMonth={roiHero.newCustomers.vsLastMonth}
              gradient={['#7c3aed', '#a78bfa']}
              icon="person-add-outline"
            />
            <RoiCard
              label="Repeat Rate"
              value={`${roiHero.repeatRate.percent.toFixed(1)}%`}
              vsLastMonth={roiHero.repeatRate.vsLastMonth}
              gradient={['#6d28d9', '#c4b5fd']}
              icon="repeat-outline"
            />
            <RoiCard
              label="Avg Order Value"
              value={`₹${(roiHero.aov.valuePaise / 100).toLocaleString('en-IN')}`}
              vsLastMonth={roiHero.aov.vsLastMonth}
              gradient={['#4338ca', '#a5b4fc']}
              icon="bag-outline"
            />
          </ScrollView>
        ) : null}
      </View>

      {/* Action Center section */}
      <View style={actionStyles.section}>
        <View style={actionStyles.headerRow}>
          <Ionicons name="flash" size={18} color="#f59e0b" />
          <ThemedText style={actionStyles.sectionTitle}>Growth Actions</ThemedText>
        </View>
        {actionsLoading ? (
          <View style={actionStyles.loadingBox}>
            <ActivityIndicator color="#7c3aed" />
          </View>
        ) : actions.length === 0 ? (
          <ThemedText style={actionStyles.emptyText}>
            No actions needed — you're on track! 🎯
          </ThemedText>
        ) : (
          actions.slice(0, 6).map((action) => <ActionCard key={action.id} action={action} />)
        )}
      </View>

      {/* Hero banner */}
      <LinearGradient
        colors={['#7c3aed', '#a78bfa']}
        style={styles.heroBanner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.heroLeft}>
          <ThemedText style={styles.heroLabel}>REZ brought you</ThemedText>
          <ThemedText style={styles.heroNumber}>
            {metrics?.repeatCustomersThisMonth ?? '—'}
          </ThemedText>
          <ThemedText style={styles.heroSubLabel}>repeat customers this month</ThemedText>
        </View>
        <View style={styles.heroIcon}>
          <Ionicons name="people" size={52} color="rgba(255,255,255,0.3)" />
        </View>
      </LinearGradient>

      {/* KPI Grid */}
      <ThemedText style={styles.sectionTitle}>Performance Snapshot</ThemedText>
      <View style={styles.kpiGrid}>
        <KpiCard
          title="Total REZ Customers"
          value={metrics?.totalRezCustomers?.toLocaleString() ?? '—'}
          icon="person-circle"
          color="#7c3aed"
          gradient={['#7c3aed', '#a78bfa']}
        />
        <KpiCard
          title="Repeat Visit Rate"
          value={metrics ? formatPct(metrics.repeatRate) : '—'}
          subtitle="Customers who returned"
          icon="repeat"
          color="#10b981"
          gradient={['#059669', '#34d399']}
        />
        <KpiCard
          title="Revenue from REZ"
          value={metrics ? formatCurrency(metrics.revenueFromRez) : '—'}
          subtitle="This month"
          icon="cash"
          color="#f59e0b"
          gradient={['#d97706', '#fbbf24']}
        />
        <KpiCard
          title="Avg Visits / Customer"
          value={metrics ? metrics.avgVisitsPerCustomer.toFixed(1) : '—'}
          subtitle="Per REZ user"
          icon="trending-up"
          color="#3b82f6"
          gradient={['#2563eb', '#60a5fa']}
        />
      </View>

      {/* Trend chart */}
      {!trendLoading && trendData.length > 0 && <TrendBars data={trendData} />}

      {/* Loyal customers list */}
      <View style={styles.loyalSection}>
        <View style={styles.loyalHeader}>
          <ThemedText style={[styles.sectionTitle, { marginBottom: 0 }]}>
            Top Loyal Customers
          </ThemedText>
          <TouchableOpacity
            onPress={() => router.push('/customer-push')}
            accessibilityLabel="Send push to loyal customers"
          >
            <ThemedText style={styles.sendPushLink}>Send Offer</ThemedText>
          </TouchableOpacity>
        </View>

        {loyalLoading ? (
          <ActivityIndicator style={{ marginVertical: 16 }} color={Colors.light.primary} />
        ) : loyalCustomers.length === 0 ? (
          <View style={styles.emptyLoyal}>
            <ThemedText style={styles.emptyLoyalText}>
              No customers with 3+ visits yet. Keep building loyalty!
            </ThemedText>
          </View>
        ) : (
          loyalCustomers.slice(0, 10).map((customer, index) => (
            <View key={customer.userId} style={styles.customerRow}>
              <View style={styles.customerRankBadge}>
                <ThemedText style={styles.customerRank}>#{index + 1}</ThemedText>
              </View>
              <View style={styles.customerInfo}>
                <ThemedText style={styles.customerName}>{customer.name}</ThemedText>
                <ThemedText style={styles.customerStats}>
                  {customer.visitCount} visits • {formatCurrency(customer.totalSpend)}
                </ThemedText>
              </View>
              <View style={styles.tierBadge}>
                <ThemedText style={styles.tierText}>{customer.tier}</ThemedText>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Toolkit CTA */}
      <TouchableOpacity
        style={styles.toolkitCta}
        onPress={() => router.push('/promotion-toolkit')}
        accessibilityLabel="Open promotion toolkit"
      >
        <LinearGradient
          colors={['#1e1b4b', '#4c1d95']}
          style={styles.toolkitGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name="print" size={22} color="#a78bfa" />
          <View style={styles.toolkitText}>
            <ThemedText style={styles.toolkitTitle}>Promotion Toolkit</ThemedText>
            <ThemedText style={styles.toolkitSubtitle}>
              Print QR posters, table tents & stickers
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#a78bfa" />
        </LinearGradient>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  content: {
    padding: 16,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: Colors.light.textSecondary,
  },

  // Hero
  heroBanner: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroLeft: { flex: 1 },
  heroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 4 },
  heroNumber: { color: '#fff', fontSize: 48, fontWeight: '900', lineHeight: 52 },
  heroSubLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 15, marginTop: 4 },
  heroIcon: { opacity: 0.8 },

  // Sections
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },

  // Loyal customers
  loyalSection: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  loyalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sendPushLink: { color: '#7c3aed', fontSize: 13, fontWeight: '600' },
  emptyLoyal: { paddingVertical: 16, alignItems: 'center' },
  emptyLoyalText: { color: Colors.light.textSecondary, fontSize: 13, textAlign: 'center' },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.backgroundSecondary,
    gap: 12,
  },
  customerRankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerRank: { color: '#7c3aed', fontSize: 13, fontWeight: '700' },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 14, fontWeight: '600', color: Colors.light.text },
  customerStats: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  tierBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierText: { fontSize: 11, color: '#7c3aed', fontWeight: '600' },

  // Toolkit CTA
  toolkitCta: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  toolkitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  toolkitText: { flex: 1 },
  toolkitTitle: { color: '#e2d9f3', fontSize: 15, fontWeight: '700' },
  toolkitSubtitle: { color: '#a78bfa', fontSize: 12, marginTop: 2 },
});

/**
 * Store Performance Comparison Screen
 *
 * GAP FIX #5 — Multi-store merchants can now compare revenue, order count,
 * average order value, and new-customer acquisition side-by-side across
 * all of their stores for a selected look-back period.
 *
 * API:  GET /api/merchant/analytics/stores/compare
 *       ?period=<days>&metric=<revenue|orders|avg_order_value|customers>
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { analyticsService } from '@/services/api/analytics';
import { useHasPermission } from '@/hooks/usePermissions';

// ─── Types ───────────────────────────────────────────────────────────────────

type Metric = 'revenue' | 'orders' | 'avg_order_value' | 'customers';
type Period = 7 | 30 | 90;

interface StoreRow {
  storeId: string;
  storeName: string;
  revenue: number;
  orderCount: number;
  avgOrderValue: number;
  newCustomers: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const METRIC_OPTIONS: { key: Metric; label: string; icon; color: string }[] = [
  { key: 'revenue', label: 'Revenue', icon: 'cash-outline', color: '#10B981' },
  { key: 'orders', label: 'Orders', icon: 'receipt-outline', color: '#3B82F6' },
  { key: 'avg_order_value', label: 'Avg Order', icon: 'calculator-outline', color: '#F59E0B' },
  { key: 'customers', label: 'Customers', icon: 'person-add-outline', color: '#8B5CF6' },
];

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: 7, label: '7 days' },
  { key: 30, label: '30 days' },
  { key: 90, label: '90 days' },
];

function metricValue(row: StoreRow, metric: Metric): number {
  switch (metric) {
    case 'revenue':
      return row.revenue;
    case 'orders':
      return row.orderCount;
    case 'avg_order_value':
      return row.avgOrderValue;
    case 'customers':
      return row.newCustomers;
  }
}

function formatValue(value: number, metric: Metric): string {
  if (metric === 'revenue' || metric === 'avg_order_value') {
    return `₹${value.toLocaleString('en-IN')}`;
  }
  return value.toLocaleString('en-IN');
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function StoresCompareScreen() {
  const canViewAnalytics = useHasPermission('analytics:view');

  const [metric, setMetric] = useState<Metric>('revenue');
  const [period, setPeriod] = useState<Period>(30);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['stores-compare', period, metric],
    queryFn: () => analyticsService.compareStores({ period, metric }),
    enabled: canViewAnalytics,
    staleTime: 3 * 60 * 1000, // 3-minute cache — fresh enough for strategy decisions
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (!canViewAnalytics) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <Ionicons name="lock-closed" size={48} color={Colors.light.textMuted} />
        <ThemedText style={styles.grayText}>
          You do not have permission to view analytics.
        </ThemedText>
      </ThemedView>
    );
  }

  const stores: StoreRow[] = data?.stores ?? [];
  const totals = data?.totals;

  // Maximum value for percentage-bar scaling
  const maxValue = stores.length > 0 ? Math.max(...stores.map((s) => metricValue(s, metric))) : 1;

  const activeMetaColor =
    METRIC_OPTIONS.find((m) => m.key === metric)?.color ?? Colors.light.primary;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.light.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Back */}
      <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={Colors.light.text} />
        <ThemedText style={styles.backText}>Back</ThemedText>
      </TouchableOpacity>

      {/* Title */}
      <ThemedText style={styles.title}>Store Comparison</ThemedText>
      <ThemedText style={styles.subtitle}>
        Side-by-side performance across all your stores
      </ThemedText>

      {/* Period Selector */}
      <View style={styles.selectorRow}>
        {PERIOD_OPTIONS.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.chip, period === p.key && { backgroundColor: Colors.light.primary }]}
            onPress={() => setPeriod(p.key)}
          >
            <ThemedText style={[styles.chipText, period === p.key && styles.chipTextActive]}>
              {p.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Metric Selector */}
      <View style={styles.metricRow}>
        {METRIC_OPTIONS.map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[
              styles.metricChip,
              metric === m.key && { borderColor: m.color, backgroundColor: m.color + '18' },
            ]}
            onPress={() => setMetric(m.key)}
          >
            <Ionicons
              name={m.icon}
              size={16}
              color={metric === m.key ? m.color : Colors.light.textMuted}
            />
            <ThemedText
              style={[
                styles.metricChipText,
                metric === m.key && { color: m.color, fontWeight: '700' },
              ]}
            >
              {m.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Loading */}
      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <ThemedText style={styles.grayText}>Loading comparison…</ThemedText>
        </View>
      )}

      {/* Error */}
      {error && !isLoading && (
        <View style={styles.centered}>
          <Ionicons name="alert-circle" size={40} color={Colors.light.error} />
          <ThemedText style={styles.errorText}>Failed to load comparison data.</ThemedText>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <ThemedText style={styles.retryBtnText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* No stores */}
      {!isLoading && !error && stores.length === 0 && (
        <View style={styles.centered}>
          <Ionicons name="storefront-outline" size={48} color={Colors.light.textMuted} />
          <ThemedText style={styles.grayText}>No store data found for this period.</ThemedText>
        </View>
      )}

      {/* Store bars */}
      {!isLoading && stores.length > 0 && (
        <View style={styles.barsSection}>
          <ThemedText style={styles.sectionTitle}>
            {METRIC_OPTIONS.find((m) => m.key === metric)?.label} by Store
          </ThemedText>

          {stores.map((store, idx) => {
            const val = metricValue(store, metric);
            const barPct = maxValue > 0 ? (val / maxValue) * 100 : 0;

            return (
              <View key={store.storeId} style={styles.barRow}>
                {/* Rank badge */}
                <View style={[styles.rankBadge, { backgroundColor: activeMetaColor + '20' }]}>
                  <ThemedText style={[styles.rankText, { color: activeMetaColor }]}>
                    #{idx + 1}
                  </ThemedText>
                </View>

                <View style={styles.barContent}>
                  <View style={styles.barLabelRow}>
                    <ThemedText style={styles.storeName} numberOfLines={1}>
                      {store.storeName}
                    </ThemedText>
                    <ThemedText style={[styles.barValue, { color: activeMetaColor }]}>
                      {formatValue(val, metric)}
                    </ThemedText>
                  </View>

                  {/* Progress bar */}
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: barPct > 0 ? `${barPct}%` : 0, backgroundColor: activeMetaColor },
                      ]}
                    />
                  </View>

                  {/* Secondary metrics */}
                  <View style={styles.secondaryRow}>
                    <ThemedText style={styles.secondaryText}>{store.orderCount} orders</ThemedText>
                    <ThemedText style={styles.secondaryText}>
                      ₹{store.avgOrderValue.toLocaleString('en-IN')} avg
                    </ThemedText>
                    <ThemedText style={styles.secondaryText}>
                      {store.newCustomers} customers
                    </ThemedText>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Totals card */}
      {!isLoading && totals && stores.length > 0 && (
        <View style={styles.totalsCard}>
          <ThemedText style={styles.totalsTitle}>All Stores Combined</ThemedText>
          <View style={styles.totalsGrid}>
            <View style={styles.totalItem}>
              <ThemedText style={[styles.totalValue, { color: '#10B981' }]}>
                ₹{totals.revenue.toLocaleString('en-IN')}
              </ThemedText>
              <ThemedText style={styles.totalLabel}>Revenue</ThemedText>
            </View>
            <View style={styles.totalItem}>
              <ThemedText style={[styles.totalValue, { color: '#3B82F6' }]}>
                {totals.orderCount.toLocaleString('en-IN')}
              </ThemedText>
              <ThemedText style={styles.totalLabel}>Orders</ThemedText>
            </View>
            <View style={styles.totalItem}>
              <ThemedText style={[styles.totalValue, { color: '#F59E0B' }]}>
                ₹{totals.avgOrderValue.toLocaleString('en-IN')}
              </ThemedText>
              <ThemedText style={styles.totalLabel}>Avg Order</ThemedText>
            </View>
            <View style={styles.totalItem}>
              <ThemedText style={[styles.totalValue, { color: '#8B5CF6' }]}>
                {totals.newCustomers.toLocaleString('en-IN')}
              </ThemedText>
              <ThemedText style={styles.totalLabel}>Customers</ThemedText>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },

  // Navigation
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  backText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },

  // Title
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 20,
  },

  // Selectors
  selectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },

  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: Colors.light.background,
  },
  metricChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },

  // Bars
  barsSection: {
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 16,
  },

  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 10,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
  },

  barContent: {
    flex: 1,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
    marginRight: 8,
  },
  barValue: {
    fontSize: 14,
    fontWeight: '700',
  },

  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 4,
  },

  secondaryRow: {
    flexDirection: 'row',
    gap: 14,
  },
  secondaryText: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },

  // Totals
  totalsCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  totalsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 14,
  },
  totalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  totalItem: {
    flex: 1,
    minWidth: '40%',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 11,
    color: Colors.light.textMuted,
    fontWeight: '500',
  },

  // Misc
  grayText: {
    color: Colors.light.textSecondary,
    textAlign: 'center',
    fontSize: 14,
    paddingHorizontal: 24,
  },
  errorText: {
    color: Colors.light.error,
    textAlign: 'center',
    fontSize: 14,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    marginTop: 4,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

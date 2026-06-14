import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { analyticsService } from '@/services/api/analytics';
import type { AnalyticsOverview } from '@/types/analytics';

export default function OverviewAnalyticsScreen() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const overview = await analyticsService.getAnalyticsOverview();
      setData(overview);
    } catch (err) {
      setError(err.message || 'Failed to load overview data');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const formatCurrency = (value: number) =>
    `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const renderMetricCard = (label: string, value: string, icon: string, color: string) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]} key={label}>
      <View style={styles.metricIconRow}>
        <Ionicons name={icon as unknown as keyof typeof Ionicons.glyphMap} size={20} color={color} />
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics Overview</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading overview...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              fetchData();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {data ? (
            <>
              <Text style={styles.sectionTitle}>Key Metrics</Text>
              <View style={styles.metricsGrid}>
                {renderMetricCard(
                  'Total Revenue',
                  formatCurrency(data.totalRevenue ?? 0),
                  'cash-outline',
                  '#6366f1'
                )}
                {renderMetricCard(
                  'Total Orders',
                  String(data.totalOrders ?? 0),
                  'receipt-outline',
                  '#10b981'
                )}
                {renderMetricCard(
                  'Avg Order Value',
                  formatCurrency(data.averageOrderValue ?? 0),
                  'trending-up-outline',
                  '#f59e0b'
                )}
                {renderMetricCard(
                  'Total Customers',
                  String(data.totalCustomers ?? 0),
                  'people-outline',
                  '#3b82f6'
                )}
              </View>

              {(data.revenueGrowth != null || data.orderGrowth != null) && (
                <>
                  <Text style={styles.sectionTitle}>Growth</Text>
                  <View style={styles.metricsGrid}>
                    {data.revenueGrowth != null &&
                      renderMetricCard(
                        'Revenue Growth',
                        `${data.revenueGrowth >= 0 ? '+' : ''}${data.revenueGrowth.toFixed(1)}%`,
                        data.revenueGrowth >= 0 ? 'trending-up' : 'trending-down',
                        data.revenueGrowth >= 0 ? '#10b981' : '#ef4444'
                      )}
                    {data.orderGrowth != null &&
                      renderMetricCard(
                        'Order Growth',
                        `${data.orderGrowth >= 0 ? '+' : ''}${data.orderGrowth.toFixed(1)}%`,
                        data.orderGrowth >= 0 ? 'trending-up' : 'trending-down',
                        data.orderGrowth >= 0 ? '#10b981' : '#ef4444'
                      )}
                  </View>
                </>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="bar-chart-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No data yet</Text>
              <Text style={styles.emptySubtitle}>
                Overview metrics will appear here once you have transactions.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
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
  scrollContent: { padding: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    marginTop: 8,
  },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  metricLabel: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  metricValue: { fontSize: 22, fontWeight: '700' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151' },
  emptySubtitle: { fontSize: 14, color: '#9ca3af', textAlign: 'center', maxWidth: 280 },
});

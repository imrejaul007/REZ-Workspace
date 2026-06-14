import React, { useState, useEffect, useCallback } from 'react';
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
import { analyticsService } from '../../services/api/analytics';
import { useStore } from '../../contexts/StoreContext';
import type { SalesByDayResponse } from '../../types/analytics';
import { logger } from '@/utils/logger';

type PeriodOption = 'week' | 'month' | 'quarter';

const PERIOD_OPTIONS: { label: string; value: PeriodOption }[] = [
  { label: '7 Days', value: 'week' },
  { label: '30 Days', value: 'month' },
  { label: '90 Days', value: 'quarter' },
];

export default function SalesAnalyticsScreen() {
  const { activeStore } = useStore();
  const [period, setPeriod] = useState<PeriodOption>('month');
  const [data, setData] = useState<SalesByDayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      try {
        if (!isRefresh) setLoading(true);
        setError(null);

        if (activeStore?._id) {
          analyticsService.setActiveStore(activeStore._id);
        }

        // Map period option to DateRangeFilter preset
      const presetMap: Record<PeriodOption, string> = {
        week: '7d',
        month: '30d',
        quarter: '90d',
      };
      const result = await analyticsService.getSalesByDay({ preset: presetMap[period] as '7d' | '30d' | '90d' });
        setData(result);
      } catch (err) {
        setError(err.message || 'Failed to load sales data');
        logger.error('Sales fetch error:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period, activeStore]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const formatCurrency = (amount: number) =>
    `\u20B9${amount >= 1000 ? (amount / 1000).toFixed(1) + 'K' : amount.toFixed(0)}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sales Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.periodRow}>
        {PERIOD_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.periodBtn, period === opt.value && styles.periodBtnActive]}
            onPress={() => setPeriod(opt.value)}
          >
            <Text style={[styles.periodText, period === opt.value && styles.periodTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6C5CE7" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.scrollContent}
        >
          {data?.summary && (
            <>
              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Total Revenue</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(data.summary.totalRevenue)}
                  </Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Total Orders</Text>
                  <Text style={styles.summaryValue}>{data.summary.totalOrders}</Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Avg Daily Revenue</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(data.summary.avgDailyRevenue)}
                  </Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Avg Daily Orders</Text>
                  <Text style={styles.summaryValue}>{Math.round(data.summary.avgDailyOrders)}</Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, { backgroundColor: '#e8f5e9' }]}>
                  <Text style={styles.summaryLabel}>Best Day</Text>
                  <Text style={[styles.summaryValue, { color: '#27ae60' }]}>
                    {data.summary.bestDay}
                  </Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: '#fce4ec' }]}>
                  <Text style={styles.summaryLabel}>Slowest Day</Text>
                  <Text style={[styles.summaryValue, { color: '#e74c3c' }]}>
                    {data.summary.worstDay}
                  </Text>
                </View>
              </View>
            </>
          )}

          {data?.data && data.data.length > 0 && (
            <View style={styles.listSection}>
              <Text style={styles.sectionTitle}>Daily Breakdown</Text>
              {data.data.slice(0, 14).map((day, idx: number) => (
                <View key={idx} style={styles.dayRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dayLabel}>{day.dayOfWeek}</Text>
                    <Text style={styles.dayDate}>{day.date}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.dayRevenue}>{formatCurrency(day.revenue)}</Text>
                    <Text style={styles.dayOrders}>{day.orders} orders</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  periodRow: { flexDirection: 'row', padding: 12, gap: 8 },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  periodBtnActive: { backgroundColor: '#6C5CE7', borderColor: '#6C5CE7' },
  periodText: { fontSize: 14, fontWeight: '600', color: '#666' },
  periodTextActive: { color: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { fontSize: 14, color: '#e74c3c', textAlign: 'center', marginHorizontal: 32 },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#6C5CE7',
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  scrollContent: { padding: 12, gap: 12 },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 4 },
  summaryLabel: { fontSize: 12, color: '#888', fontWeight: '500' },
  summaryValue: { fontSize: 20, fontWeight: '700', color: '#333' },
  listSection: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 4 },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dayLabel: { fontSize: 14, fontWeight: '600', color: '#333' },
  dayDate: { fontSize: 12, color: '#999', marginTop: 2 },
  dayRevenue: { fontSize: 14, fontWeight: '700', color: '#333' },
  dayOrders: { fontSize: 12, color: '#888', marginTop: 2 },
});

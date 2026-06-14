import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';
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
import type { RevenueBreakdownResponse } from '../../types/analytics';

type PeriodOption = 'week' | 'month' | 'quarter';

const PERIOD_OPTIONS: { label: string; value: PeriodOption }[] = [
  { label: '7 Days', value: 'week' },
  { label: '30 Days', value: 'month' },
  { label: '90 Days', value: 'quarter' },
];

export default function RevenueAnalyticsScreen() {
  const { activeStore } = useStore();
  const [period, setPeriod] = useState<PeriodOption>('month');
  const [data, setData] = useState<RevenueBreakdownResponse | null>(null);
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

        const result = await analyticsService.getRevenueBreakdown({ preset: period as '7d' | '30d' | '90d' });
        setData(result);
      } catch (err) {
        setError(err.message || 'Failed to load revenue data');
        logger.error('Revenue fetch error:', err);
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
        <Text style={styles.headerTitle}>Revenue Analytics</Text>
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
          {data && (
            <>
              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Total Revenue</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency((data as unknown as RevenueBreakdownResponse).totalRevenue || 0)}
                  </Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Orders</Text>
                  <Text style={styles.summaryValue}>{(data as unknown as { totalOrders?: number }).totalOrders || 0}</Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Avg Order Value</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency((data as unknown as { avgOrderValue?: number }).avgOrderValue || 0)}
                  </Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Growth</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: ((data as unknown as { growth?: number }).growth || 0) >= 0 ? '#27ae60' : '#e74c3c' },
                    ]}
                  >
                    {((data as unknown as { growth?: number }).growth || 0) >= 0 ? '+' : ''}
                    {((data as unknown as { growth?: number }).growth || 0).toFixed(1)}%
                  </Text>
                </View>
              </View>

              {((data as unknown as { breakdown?: { byPaymentMethod?: Array<{ category?: string; source?: string; revenue?: number; amount?: number }> } }).breakdown?.byPaymentMethod) && Array.isArray((data as unknown as { breakdown?: { byPaymentMethod?: unknown[] } }).breakdown?.byPaymentMethod) && (
                <View style={styles.breakdownSection}>
                  <Text style={styles.sectionTitle}>Revenue Breakdown</Text>
                  {((data as unknown as { breakdown?: { byPaymentMethod?: Array<{ category?: string; source?: string; revenue?: number; amount?: number }> } }).breakdown?.byPaymentMethod ?? []).map((item: { category?: string; source?: string; revenue?: number; amount?: number }, idx: number) => (
                    <View key={idx} style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>
                        {item.category || item.source || `Item ${idx + 1}`}
                      </Text>
                      <Text style={styles.breakdownValue}>
                        {formatCurrency(item.revenue || item.amount || 0)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
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
  breakdownSection: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  breakdownLabel: { fontSize: 14, color: '#555' },
  breakdownValue: { fontSize: 14, fontWeight: '600', color: '#333' },
});

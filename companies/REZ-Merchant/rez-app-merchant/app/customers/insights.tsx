import React, { useState, useCallback } from 'react';
import { logger } from '@/utils/logger';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { platformAlertSimple } from '@/utils/platformAlert';

interface TopCustomer {
  userId: string;
  visitCount: number;
  coinsEarned?: number;
  lastVisit?: string;
}

interface VisitFrequency {
  daily: number;
  weekly: number;
  monthly: number;
}

interface NewVsReturning {
  new: number;
  returning: number;
}

interface InsightsData {
  topCustomers: TopCustomer[];
  visitFrequency: VisitFrequency;
  newVsReturning: NewVsReturning;
}

function shortenUserId(id: string): string {
  if (!id) return '—';
  const str = String(id);
  if (str.length <= 10) return str;
  return `${str.slice(0, 5)}...${str.slice(-4)}`;
}

function formatLastVisit(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  } catch {
    return '—';
  }
}

export default function CustomerInsightsScreen() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await apiClient.get<unknown>('merchant/customers/insights');
      const payload = res.data ?? res;

      if (!payload || !payload.topCustomers) {
        throw new Error('Unexpected response format');
      }

      setData({
        topCustomers: payload.topCustomers || [],
        visitFrequency: payload.visitFrequency || { daily: 0, weekly: 0, monthly: 0 },
        newVsReturning: payload.newVsReturning || { new: 0, returning: 0 },
      });
    } catch (err) {
      logger.error('CustomerInsights fetch error:', err);
      const msg = err.message || 'Failed to load customer insights';
      setError(msg);
      if (!isRefreshing) platformAlertSimple('Error', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const totalVisitors = data ? data.newVsReturning.new + data.newVsReturning.returning || 1 : 1;

  const newPct = data ? Math.round((data.newVsReturning.new / totalVisitors) * 100) : 0;
  const returningPct = data ? 100 - newPct : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          Customer Insights
        </ThemedText>
        <TouchableOpacity
          onPress={() => fetchInsights(true)}
          style={styles.refreshBtn}
          disabled={refreshing}
        >
          <Ionicons name="refresh" size={22} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <ThemedText style={styles.loadingText}>Loading insights...</ThemedText>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.light.destructive} />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchInsights()}>
            <ThemedText style={styles.retryBtnText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchInsights(true)}
              colors={[Colors.light.primary]}
              tintColor={Colors.light.primary}
            />
          }
        >
          {/* New vs Returning */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>New vs Returning (Last 30 Days)</ThemedText>
            <View style={styles.newVsRow}>
              <View style={[styles.nvBox, { backgroundColor: '#E8F5E9' }]}>
                <ThemedText style={[styles.nvCount, { color: '#2E7D32' }]}>
                  {data?.newVsReturning.new ?? 0}
                </ThemedText>
                <ThemedText style={[styles.nvLabel, { color: '#388E3C' }]}>New</ThemedText>
                <ThemedText style={[styles.nvPct, { color: '#4CAF50' }]}>{newPct}%</ThemedText>
              </View>
              <View style={[styles.nvBox, { backgroundColor: '#E3F2FD' }]}>
                <ThemedText style={[styles.nvCount, { color: '#1565C0' }]}>
                  {data?.newVsReturning.returning ?? 0}
                </ThemedText>
                <ThemedText style={[styles.nvLabel, { color: '#1976D2' }]}>Returning</ThemedText>
                <ThemedText style={[styles.nvPct, { color: '#2196F3' }]}>
                  {returningPct}%
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Visit Frequency */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Visit Frequency (Last 30 Days)</ThemedText>
            <View style={styles.freqRow}>
              <View style={styles.freqCard}>
                <Ionicons name="today-outline" size={20} color={Colors.light.primary} />
                <ThemedText style={styles.freqValue}>{data?.visitFrequency.daily ?? 0}</ThemedText>
                <ThemedText style={styles.freqLabel}>Daily Avg</ThemedText>
              </View>
              <View style={styles.freqCard}>
                <Ionicons name="calendar-outline" size={20} color={Colors.light.primary} />
                <ThemedText style={styles.freqValue}>{data?.visitFrequency.weekly ?? 0}</ThemedText>
                <ThemedText style={styles.freqLabel}>Weekly Avg</ThemedText>
              </View>
              <View style={styles.freqCard}>
                <Ionicons name="stats-chart-outline" size={20} color={Colors.light.primary} />
                <ThemedText style={styles.freqValue}>
                  {data?.visitFrequency.monthly ?? 0}
                </ThemedText>
                <ThemedText style={styles.freqLabel}>Monthly Avg</ThemedText>
              </View>
            </View>
          </View>

          {/* Top Customers */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Top Customers</ThemedText>
            {(data?.topCustomers ?? []).length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={40} color={Colors.light.textSecondary} />
                <ThemedText style={styles.emptyText}>No customer data yet</ThemedText>
              </View>
            ) : (
              <>
                <View style={styles.tableHeader}>
                  <ThemedText style={[styles.col, styles.colRank]}>#</ThemedText>
                  <ThemedText style={[styles.col, styles.colId]}>Customer</ThemedText>
                  <ThemedText style={[styles.col, styles.colVisits]}>Visits</ThemedText>
                  <ThemedText style={[styles.col, styles.colDate]}>Last Visit</ThemedText>
                </View>
                {(data?.topCustomers ?? []).map((c, idx) => (
                  <View
                    key={String(c.userId)}
                    style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}
                  >
                    <View style={[styles.colRank]}>
                      <View style={[styles.rankBadge, idx < 3 && styles.rankBadgeTop]}>
                        <ThemedText style={[styles.rankText, idx < 3 && styles.rankTextTop]}>
                          {idx + 1}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText style={[styles.col, styles.colId, styles.userId]}>
                      {shortenUserId(String(c.userId))}
                    </ThemedText>
                    <ThemedText style={[styles.col, styles.colVisits, styles.visitCount]}>
                      {c.visitCount}
                    </ThemedText>
                    <ThemedText style={[styles.col, styles.colDate, styles.dateText]}>
                      {formatLastVisit(c.lastVisit)}
                    </ThemedText>
                  </View>
                ))}
              </>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
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
  backBtn: { padding: 4 },
  refreshBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '600', color: Colors.light.text },
  scroll: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: { fontSize: 14, color: Colors.light.textSecondary, marginTop: 8 },
  errorText: { fontSize: 14, color: Colors.light.destructive, textAlign: 'center' },
  retryBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
  },
  retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  section: {
    backgroundColor: Colors.light.background,
    marginBottom: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 14,
  },
  // New vs Returning
  newVsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nvBox: {
    flex: 1,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  nvCount: { fontSize: 32, fontWeight: '700' },
  nvLabel: { fontSize: 13, fontWeight: '500' },
  nvPct: { fontSize: 12, fontWeight: '400' },
  // Visit Frequency
  freqRow: {
    flexDirection: 'row',
    gap: 10,
  },
  freqCard: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  freqValue: { fontSize: 22, fontWeight: '700', color: Colors.light.text },
  freqLabel: { fontSize: 11, color: Colors.light.textSecondary, textAlign: 'center' },
  // Top Customers table
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tableRowAlt: { backgroundColor: Colors.light.backgroundSecondary },
  col: { fontSize: 13, color: Colors.light.text },
  colRank: { width: 36, alignItems: 'center' },
  colId: { flex: 1, paddingHorizontal: 4 },
  colVisits: { width: 52, textAlign: 'center' },
  colDate: { width: 76, textAlign: 'right' },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeTop: { backgroundColor: '#FFC857' },
  rankText: { fontSize: 11, fontWeight: '600', color: Colors.light.textSecondary },
  rankTextTop: { color: '#7B5A00' },
  userId: { fontSize: 13, color: Colors.light.text },
  visitCount: { fontSize: 14, fontWeight: '600', color: Colors.light.primary },
  dateText: { fontSize: 11, color: Colors.light.textSecondary },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: { fontSize: 14, color: Colors.light.textSecondary },
});

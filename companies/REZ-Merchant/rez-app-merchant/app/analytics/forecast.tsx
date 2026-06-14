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
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '@/services/api/client';
import { logger } from '@/utils/logger';

interface ForecastDay {
  date: string;
  forecastRevenue: number;
  confidence: number;
}

interface ForecastData {
  forecastDays: number;
  avgDailyRevenue: number;
  forecast: ForecastDay[];
  generatedAt: string;
}

const PERIOD_OPTIONS: { label: string; days: 7 | 30 | 60 | 90 }[] = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '60d', days: 60 },
  { label: '90d', days: 90 },
];

export default function ForecastAnalyticsScreen() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<7 | 30 | 60 | 90>(30);

  const fetchForecast = useCallback(
    async (forecastDays: number = days) => {
      setError(null);
      try {
        const res = await apiClient.get<unknown>(
          `merchant/analytics/forecast/sales?forecastDays=${forecastDays}`
        );
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError((res as unknown as { message?: string }).message || 'Failed to load forecast');
        }
      } catch (err) {
        logger.error('Forecast analytics error:', err);
        setError(err?.message || 'Failed to load forecast');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [days]
  );

  useFocusEffect(
    useCallback(() => {
      fetchForecast(days);
    }, [days])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchForecast(days);
  };

  const handlePeriodChange = (newDays: 7 | 30 | 60 | 90) => {
    setDays(newDays);
    setLoading(true);
    fetchForecast(newDays);
  };

  const maxRevenue = data?.forecast?.length
    ? Math.max(...data.forecast.map((f) => f.forecastRevenue), 1)
    : 1;

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.screenTitle}>Forecast Analytics</Text>

      {/* Period selector */}
      <View style={styles.periodRow}>
        {PERIOD_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.days}
            style={[styles.periodChip, days === opt.days && styles.periodChipActive]}
            onPress={() => handlePeriodChange(opt.days)}
          >
            <Text style={[styles.periodChipText, days === opt.days && styles.periodChipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1a3a52" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchForecast(days)}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : !data || !data.forecast?.length ? (
        <View style={styles.center}>
          <Ionicons name="stats-chart-outline" size={56} color="#999" />
          <Text style={styles.emptyTitle}>No forecast data</Text>
          <Text style={styles.emptySubtitle}>
            More sales history is needed to generate a forecast.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Avg Daily Revenue</Text>
              <Text style={styles.summaryValue}>
                ₹{data.avgDailyRevenue.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Forecast Days</Text>
              <Text style={styles.summaryValue}>{data.forecastDays}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Projected</Text>
              <Text style={styles.summaryValue}>
                ₹{data.forecast.reduce((s, f) => s + f.forecastRevenue, 0).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {/* Bar chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Daily Revenue Forecast</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.barsContainer}>
                {data.forecast.map((day, i) => {
                  const pct = maxRevenue > 0 ? day.forecastRevenue / maxRevenue : 0;
                  const barHeight = Math.max(4, Math.round(pct * 100));
                  const label = day.date.slice(5); // MM-DD
                  return (
                    <View key={i} style={styles.barCol}>
                      <Text style={styles.barValue}>
                        {day.forecastRevenue > 0
                          ? `₹${(day.forecastRevenue / 1000).toFixed(1)}k`
                          : ''}
                      </Text>
                      <View style={styles.barBg}>
                        <View style={[styles.barFill, { height: barHeight }]} />
                      </View>
                      <Text style={styles.barLabel}>{label}</Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Table of first 14 days */}
          <View style={styles.tableCard}>
            <Text style={styles.chartTitle}>Next {Math.min(14, data.forecast.length)} Days</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tcol, styles.tcolDate, styles.thText]}>Date</Text>
              <Text style={[styles.tcol, styles.tcolRev, styles.thText]}>Forecast</Text>
              <Text style={[styles.tcol, styles.tcolConf, styles.thText]}>Confidence</Text>
            </View>
            {data.forecast.slice(0, 14).map((day, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
                <Text style={[styles.tcol, styles.tcolDate]}>{day.date}</Text>
                <Text style={[styles.tcol, styles.tcolRev]}>
                  ₹{day.forecastRevenue.toLocaleString('en-IN')}
                </Text>
                <Text style={[styles.tcol, styles.tcolConf]}>
                  {Math.round(day.confidence * 100)}%
                </Text>
              </View>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const BAR_MAX_HEIGHT = 100;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  backButton: { padding: 16 },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a3a52',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  periodChipActive: { borderColor: '#1a3a52', backgroundColor: '#1a3a52' },
  periodChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  periodChipTextActive: { color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  errorText: { color: '#EF4444', fontSize: 14, textAlign: 'center' },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#1a3a52',
    borderRadius: 8,
  },
  retryBtnText: { color: '#fff', fontWeight: '600' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  emptySubtitle: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 20 },
  scroll: { flex: 1 },

  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#1a3a52',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryValue: { fontSize: 15, fontWeight: '800', color: '#fff' },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },

  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
  },
  chartTitle: { fontSize: 14, fontWeight: '700', color: '#1a3a52', marginBottom: 12 },
  barsContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, paddingBottom: 4 },
  barCol: { alignItems: 'center', width: 36 },
  barValue: { fontSize: 8, color: '#9CA3AF', marginBottom: 2, height: 12 },
  barBg: {
    width: 20,
    height: BAR_MAX_HEIGHT,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', backgroundColor: '#1a3a52', borderRadius: 4 },
  barLabel: { fontSize: 8, color: '#9CA3AF', marginTop: 4 },

  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
    marginBottom: 4,
  },
  thText: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 10 },
  tableRowAlt: { backgroundColor: '#F9FAFB' },
  tcol: { fontSize: 13, color: '#374151' },
  tcolDate: { flex: 1 },
  tcolRev: { width: 100, textAlign: 'right', fontWeight: '600', color: '#1a3a52' },
  tcolConf: { width: 80, textAlign: 'right', color: '#6B7280' },
});

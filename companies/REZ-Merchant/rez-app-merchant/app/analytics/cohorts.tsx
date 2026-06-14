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

interface CohortEntry {
  week: 0 | 1 | 2 | 4;
  returnRate: number;
  userCount: number;
}

interface CohortsResponse {
  cohorts: CohortEntry[];
}

const WEEK_LABELS: Record<number, string> = {
  0: 'Week 0',
  1: 'Week 1',
  2: 'Week 2',
  4: 'Week 4',
};

const BAR_COLORS: Record<number, string> = {
  0: '#7C3AED',
  1: '#10B981',
  2: '#3B82F6',
  4: '#F59E0B',
};

const ORDERED_WEEKS = [0, 1, 2, 4];

function BarChart({ cohorts }: { cohorts: CohortEntry[] }) {
  const maxRate = Math.max(...cohorts.map((c) => c.returnRate), 1);
  const BAR_MAX_HEIGHT = 140;

  const byWeek: Record<number, CohortEntry> = {};
  for (const c of cohorts) byWeek[c.week] = c;

  return (
    <View style={chartStyles.container}>
      {/* Y-axis labels */}
      <View style={chartStyles.yAxis}>
        {[100, 75, 50, 25, 0].map((pct) => (
          <ThemedText key={pct} style={chartStyles.yLabel}>
            {pct}%
          </ThemedText>
        ))}
      </View>

      {/* Bars area */}
      <View style={chartStyles.barsArea}>
        {/* Grid lines */}
        <View style={[chartStyles.gridLine, { bottom: BAR_MAX_HEIGHT * 1 }]} />
        <View style={[chartStyles.gridLine, { bottom: BAR_MAX_HEIGHT * 0.75 }]} />
        <View style={[chartStyles.gridLine, { bottom: BAR_MAX_HEIGHT * 0.5 }]} />
        <View style={[chartStyles.gridLine, { bottom: BAR_MAX_HEIGHT * 0.25 }]} />
        <View style={[chartStyles.gridLine, { bottom: 0 }]} />

        {ORDERED_WEEKS.map((week) => {
          const entry = byWeek[week];
          const rate = entry ? entry.returnRate : 0;
          const barHeight = Math.max((rate / 100) * BAR_MAX_HEIGHT, 2);
          const color = BAR_COLORS[week] ?? Colors.light.primary;

          return (
            <View key={week} style={chartStyles.barColumn}>
              <View style={chartStyles.barWrapper}>
                <ThemedText style={chartStyles.barValueLabel}>{rate.toFixed(0)}%</ThemedText>
                <View style={[chartStyles.bar, { height: barHeight, backgroundColor: color }]} />
              </View>
              <ThemedText style={chartStyles.xLabel}>{WEEK_LABELS[week]}</ThemedText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 200,
    paddingTop: 12,
  },
  yAxis: {
    width: 36,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  yLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    textAlign: 'right',
  },
  barsArea: {
    flex: 1,
    position: 'relative',
    paddingHorizontal: 8,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  barColumn: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    width: '22%',
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 160,
  },
  barValueLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  bar: {
    width: 28,
    borderRadius: 4,
  },
  xLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
});

export default function CohortRetentionScreen() {
  const [data, setData] = useState<CohortsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCohorts = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await apiClient.get<unknown>('merchant/analytics/cohorts');
      const payload = res.data ?? res;

      if (!payload || !Array.isArray(payload.cohorts)) {
        throw new Error('Unexpected response format');
      }

      setData({ cohorts: payload.cohorts });
    } catch (err) {
      logger.error('Cohorts fetch error:', err);
      const msg = err.message || 'Failed to load cohort data';
      setError(msg);
      if (!isRefreshing) platformAlertSimple('Error', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCohorts();
  }, [fetchCohorts]);

  const week1 = data?.cohorts.find((c) => c.week === 1);
  const week1Rate = week1 ? week1.returnRate : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          Cohort Retention
        </ThemedText>
        <TouchableOpacity
          onPress={() => fetchCohorts(true)}
          style={styles.refreshBtn}
          disabled={refreshing}
        >
          <Ionicons name="refresh" size={22} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <ThemedText style={styles.loadingText}>Loading cohort data...</ThemedText>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.light.destructive} />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchCohorts()}>
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
              onRefresh={() => fetchCohorts(true)}
              colors={[Colors.light.primary]}
              tintColor={Colors.light.primary}
            />
          }
        >
          {/* Interpretation card */}
          <View style={styles.interpretCard}>
            <View style={styles.interpretIconWrap}>
              <Ionicons name="trending-up" size={24} color="#10B981" />
            </View>
            <View style={styles.interpretText}>
              <ThemedText style={styles.interpretHeadline}>
                {week1Rate.toFixed(0)}% of new customers return within a week
              </ThemedText>
              <ThemedText style={styles.interpretSub}>
                Based on Week 1 cohort return rate
              </ThemedText>
            </View>
          </View>

          {/* Bar chart */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Return Rate by Week</ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              Percentage of customers who returned after first visit
            </ThemedText>
            {data && data.cohorts.length > 0 ? (
              <View style={styles.chartContainer}>
                <BarChart cohorts={data.cohorts} />
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <Ionicons name="bar-chart-outline" size={40} color={Colors.light.textSecondary} />
                <ThemedText style={styles.emptyText}>No cohort data available</ThemedText>
              </View>
            )}
          </View>

          {/* Table */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Cohort Details</ThemedText>
            <View style={styles.table}>
              {/* Table header */}
              <View style={[styles.tableRow, styles.tableHeader]}>
                <View style={styles.colWeek}>
                  <ThemedText style={[styles.tableCell, styles.tableCellHeader]}>Period</ThemedText>
                </View>
                <View style={styles.colUsers}>
                  <ThemedText
                    style={[styles.tableCell, styles.tableCellHeader, styles.colUsersText]}
                  >
                    Users
                  </ThemedText>
                </View>
                <View style={styles.colRate}>
                  <ThemedText style={[styles.tableCell, styles.tableCellHeader]}>
                    Return Rate
                  </ThemedText>
                </View>
              </View>

              {ORDERED_WEEKS.map((week, idx) => {
                const entry = data?.cohorts.find((c) => c.week === week);
                const rate = entry?.returnRate ?? 0;
                const users = entry?.userCount ?? 0;
                const color = BAR_COLORS[week] ?? Colors.light.primary;

                return (
                  <View key={week} style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}>
                    <View style={[styles.colWeek, styles.weekCell]}>
                      <View style={[styles.weekDot, { backgroundColor: color }]} />
                      <ThemedText style={styles.tableCellText}>{WEEK_LABELS[week]}</ThemedText>
                    </View>
                    <View style={styles.colUsers}>
                      <ThemedText style={[styles.tableCellText, styles.colUsersText]}>
                        {users.toLocaleString('en-IN')}
                      </ThemedText>
                    </View>
                    <View style={[styles.colRate]}>
                      <View style={styles.rateBarBg}>
                        <View
                          style={[
                            styles.rateBarFill,
                            { width: `${Math.min(rate, 100)}%`, backgroundColor: color },
                          ]}
                        />
                      </View>
                      <ThemedText style={[styles.tableCellText, { color, fontWeight: '700' }]}>
                        {rate.toFixed(1)}%
                      </ThemedText>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legendSection}>
            <ThemedText style={styles.legendTitle}>What do these mean?</ThemedText>
            <ThemedText style={styles.legendText}>
              <ThemedText style={styles.legendBold}>Week 0:</ThemedText> First-time visits
              (baseline).
            </ThemedText>
            <ThemedText style={styles.legendText}>
              <ThemedText style={styles.legendBold}>Week 1:</ThemedText> Customers who returned
              within 1 week.
            </ThemedText>
            <ThemedText style={styles.legendText}>
              <ThemedText style={styles.legendBold}>Week 2:</ThemedText> Customers who returned
              within 2 weeks.
            </ThemedText>
            <ThemedText style={styles.legendText}>
              <ThemedText style={styles.legendBold}>Week 4:</ThemedText> Customers who returned
              within 4 weeks (monthly).
            </ThemedText>
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
  // Interpretation card
  interpretCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    margin: 14,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  interpretIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  interpretText: { flex: 1 },
  interpretHeadline: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
    lineHeight: 20,
  },
  interpretSub: {
    fontSize: 12,
    color: '#047857',
    marginTop: 3,
  },
  // Sections
  section: {
    backgroundColor: Colors.light.background,
    marginHorizontal: 14,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 16,
  },
  chartContainer: {
    marginTop: 4,
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  emptyText: { fontSize: 13, color: Colors.light.textSecondary },
  // Table
  table: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tableHeader: {
    backgroundColor: Colors.light.backgroundSecondary,
  },
  tableRowAlt: {
    backgroundColor: Colors.light.backgroundSecondary,
  },
  tableCell: {
    fontSize: 13,
    color: Colors.light.text,
  },
  tableCellHeader: {
    fontWeight: '600',
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  tableCellText: {
    fontSize: 13,
    color: Colors.light.text,
  },
  colWeek: { flex: 1.2, flexDirection: 'row', alignItems: 'center', gap: 6 },
  colUsers: { flex: 0.8, alignItems: 'center' },
  colUsersText: { textAlign: 'center' },
  colRate: { flex: 1.2, flexDirection: 'row', alignItems: 'center', gap: 8 },
  weekCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weekDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rateBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.light.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  rateBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  // Legend
  legendSection: {
    backgroundColor: Colors.light.background,
    marginHorizontal: 14,
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  legendText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  legendBold: {
    fontWeight: '600',
    color: Colors.light.text,
  },
});

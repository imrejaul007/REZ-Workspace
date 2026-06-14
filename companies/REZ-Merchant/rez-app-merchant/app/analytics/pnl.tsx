import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { apiClient } from '@/services/api/client';
import { platformAlertSimple } from '@/utils/platformAlert';

interface PnLData {
  month: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
  expenses: number;
  netProfit: number;
  marginPercentage: number;
  cogsPercentage: number;
  expensesPercentage: number;
  byCategory: Array<{ category: string; amount: number; percentage: number }>;
}

export default function PnLScreen() {
  const [data, setData] = useState<PnLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const fetchData = useCallback(
    async (isRefreshing = false) => {
      try {
        if (isRefreshing) setRefreshing(true);
        else setLoading(true);

        const res = await apiClient.get<unknown>(`/merchant/analytics/expenses?month=${selectedMonth}`);
        const raw = res.data || res;

        if (raw) {
          const grossProfit = (raw.revenue || 0) - (raw.cogs || 0);
          const grossMargin = raw.revenue > 0 ? (grossProfit / raw.revenue) * 100 : 0;
          setData({
            month: raw.month || selectedMonth,
            revenue: raw.revenue || 0,
            cogs: raw.cogs || 0,
            grossProfit,
            grossMargin,
            expenses: raw.expenses || 0,
            netProfit: raw.netProfit || 0,
            marginPercentage: raw.marginPercentage || 0,
            cogsPercentage: raw.cogsPercentage || 0,
            expensesPercentage: raw.expensesPercentage || 0,
            byCategory: raw.byCategory || [],
          });
        }
      } catch {
        platformAlertSimple('Error', 'Failed to load P&L data');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedMonth]
  );

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const [year, mon] = selectedMonth.split('-');
  const monthName = new Date(parseInt(year), parseInt(mon) - 1).toLocaleString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  const fmt = (n: number) =>
    n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const pct = (n: number) => `${n.toFixed(1)}%`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>P&L Statement</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Month Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.monthScroll}
        contentContainerStyle={styles.monthContent}
      >
        {months.map((m) => {
          const [y, mo] = m.split('-');
          const label = new Date(parseInt(y), parseInt(mo) - 1).toLocaleString('en-IN', {
            month: 'short',
            year: '2-digit',
          });
          return (
            <TouchableOpacity
              key={m}
              style={[styles.monthChip, selectedMonth === m && styles.monthChipActive]}
              onPress={() => {
                setSelectedMonth(m);
                setData(null);
              }}
            >
              <Text
                style={[styles.monthChipText, selectedMonth === m && styles.monthChipTextActive]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading P&L...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />
          }
        >
          <Text style={styles.periodLabel}>Profit & Loss — {monthName}</Text>

          {/* Revenue */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: '#16a34a' }]} />
              <Text style={styles.sectionTitle}>Revenue</Text>
            </View>
            {data && (
              <View style={styles.plCard}>
                <PLRow label="Gross Revenue" value={`₹${fmt(data.revenue)}`} bold />
              </View>
            )}
          </View>

          {/* Cost of Goods Sold */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.sectionTitle}>Cost of Goods Sold (COGS)</Text>
            </View>
            {data && (
              <View style={styles.plCard}>
                <PLRow
                  label="COGS"
                  value={`₹${fmt(data.cogs)}`}
                  sub={`${pct(data.cogsPercentage)} of revenue`}
                />
                <View style={styles.divider} />
                <PLRow
                  label="Gross Profit"
                  value={`₹${fmt(data.grossProfit)}`}
                  sub={`Margin: ${pct(data.grossMargin)}`}
                  bold
                  highlight={data.grossProfit >= 0}
                />
              </View>
            )}
          </View>

          {/* Operating Expenses */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.sectionTitle}>Operating Expenses</Text>
            </View>
            {data && (
              <View style={styles.plCard}>
                {data.byCategory.length > 0 ? (
                  <>
                    {data.byCategory.map((cat, i) => (
                      <PLRow
                        key={`${cat.category}-${i}`}
                        label={cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}
                        value={`₹${fmt(cat.amount)}`}
                        sub={`${cat.percentage.toFixed(1)}% of expenses`}
                      />
                    ))}
                    <View style={styles.divider} />
                  </>
                ) : null}
                <PLRow
                  label="Total Expenses"
                  value={`₹${fmt(data.expenses)}`}
                  sub={`${pct(data.expensesPercentage)} of revenue`}
                  bold
                />
              </View>
            )}
          </View>

          {/* Net Profit */}
          {data && (
            <View
              style={[styles.netCard, { borderColor: data.netProfit >= 0 ? '#16a34a' : '#ef4444' }]}
            >
              <View style={styles.netTop}>
                <Text style={styles.netLabel}>Net Profit</Text>
                <Text
                  style={[styles.netValue, { color: data.netProfit >= 0 ? '#16a34a' : '#ef4444' }]}
                >
                  {data.netProfit < 0 ? '-' : ''}₹{fmt(Math.abs(data.netProfit))}
                </Text>
              </View>
              <View style={styles.netBottom}>
                <View style={styles.netMetric}>
                  <Text style={styles.netMetricVal}>{pct(Math.abs(data.marginPercentage))}</Text>
                  <Text style={styles.netMetricLabel}>Net Margin</Text>
                </View>
                <View style={styles.netMetric}>
                  <Text style={styles.netMetricVal}>₹{fmt(data.revenue)}</Text>
                  <Text style={styles.netMetricLabel}>Revenue</Text>
                </View>
                <View style={styles.netMetric}>
                  <Text style={styles.netMetricVal}>₹{fmt(data.expenses + data.cogs)}</Text>
                  <Text style={styles.netMetricLabel}>Total Costs</Text>
                </View>
              </View>

              {/* Waterfall breakdown */}
              <View style={styles.waterfall}>
                <WaterfallBar
                  label="Revenue"
                  amount={data.revenue}
                  total={data.revenue}
                  color="#16a34a"
                />
                <WaterfallBar
                  label="COGS"
                  amount={data.cogs}
                  total={data.revenue}
                  color="#ef4444"
                />
                <WaterfallBar
                  label="Expenses"
                  amount={data.expenses}
                  total={data.revenue}
                  color="#f59e0b"
                />
                <WaterfallBar
                  label="Net Profit"
                  amount={Math.max(0, data.netProfit)}
                  total={data.revenue}
                  color={data.netProfit >= 0 ? '#4f46e5' : '#9ca3af'}
                />
              </View>
            </View>
          )}

          {/* Tip */}
          <View style={styles.tip}>
            <Ionicons name="bulb-outline" size={16} color="#7c3aed" />
            <Text style={styles.tipText}>
              Share this with your CA for bookkeeping. Revenue is from REZ transactions; add manual
              income/expenses in the Expenses section.
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function PLRow({
  label,
  value,
  sub,
  bold,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <View style={styles.plRow}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.plLabel, bold && styles.plLabelBold]}>{label}</Text>
        {sub ? <Text style={styles.plSub}>{sub}</Text> : null}
      </View>
      <Text
        style={[
          styles.plValue,
          bold && styles.plValueBold,
          highlight === false && { color: '#ef4444' },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const BAR_W = 200;
function WaterfallBar({
  label,
  amount,
  total,
  color,
}: {
  label: string;
  amount: number;
  total: number;
  color: string;
}) {
  const width = total > 0 ? Math.max(4, Math.round((amount / total) * BAR_W)) : 4;
  return (
    <View style={styles.wRow}>
      <Text style={styles.wLabel}>{label}</Text>
      <View style={[styles.wBar, { width, backgroundColor: color }]} />
      <Text style={styles.wValue}>
        ₹{amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111' },
  monthScroll: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  monthContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  monthChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  monthChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  monthChipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  monthChipTextActive: { color: '#fff' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { fontSize: 14, color: '#6b7280' },
  content: { padding: 16, paddingBottom: 48 },
  periodLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: { marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#374151' },
  plCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  plRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  plLabel: { fontSize: 13, color: '#6b7280' },
  plLabelBold: { fontWeight: '700', color: '#111', fontSize: 14 },
  plSub: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  plValue: { fontSize: 13, color: '#374151', fontWeight: '500' },
  plValueBold: { fontWeight: '800', fontSize: 15, color: '#111' },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 4 },
  netCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  netTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  netLabel: { fontSize: 16, fontWeight: '700', color: '#111' },
  netValue: { fontSize: 24, fontWeight: '900' },
  netBottom: { flexDirection: 'row', marginBottom: 16 },
  netMetric: { flex: 1, alignItems: 'center' },
  netMetricVal: { fontSize: 14, fontWeight: '700', color: '#111' },
  netMetricLabel: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  waterfall: { gap: 8 },
  wRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wLabel: { width: 70, fontSize: 11, color: '#6b7280', textAlign: 'right' },
  wBar: { height: 18, borderRadius: 4 },
  wValue: { fontSize: 11, color: '#374151', fontWeight: '600' },
  tip: { flexDirection: 'row', backgroundColor: '#f5f3ff', borderRadius: 10, padding: 12, gap: 8 },
  tipText: { flex: 1, fontSize: 12, color: '#7c3aed', lineHeight: 17 },
});

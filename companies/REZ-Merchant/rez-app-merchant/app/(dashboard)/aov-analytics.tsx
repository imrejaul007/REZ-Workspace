import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { useStore } from '@/contexts/StoreContext';

type Period = '7' | '30' | '90';

interface AOVData {
  currentAOV: number;
  prevAOV: number;
  aovGrowth: number;
  trend: 'up' | 'down' | 'stable';
  totalOrders: number;
  totalRevenue: number;
  aovTrend: Array<{ date: string; aov: number; orders: number }>;
  upsellStats: Array<{
    ruleId: string;
    name: string;
    product: string;
    impressions: number;
    accepted: number;
    conversionRate: number;
  }>;
  period: string;
}

export default function AOVAnalyticsScreen() {
  const { activeStore } = useStore();
  const [data, setData] = useState<AOVData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false); // FE-H4 fix: track error state
  const [period, setPeriod] = useState<Period>('30');

  const load = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        const res = await apiClient.get<AOVData>(
          `merchant/analytics/aov?days=${period}${activeStore?._id ? `&storeId=${activeStore._id}` : ''}`
        );
        if (res.success && res.data) {
          setData(res.data);
          setError(false);
        }
      } catch {
        // FE-H4 fix: set error state so the screen can render an error UI instead of blank
        setError(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period, activeStore?._id]
  );

  useEffect(() => {
    load();
  }, [load]);

  const trendIcon = (t: 'up' | 'down' | 'stable') =>
    t === 'up' ? 'trending-up' : t === 'down' ? 'trending-down' : 'remove';
  const trendColor = (t: 'up' | 'down' | 'stable') =>
    t === 'up' ? '#059669' : t === 'down' ? '#ef4444' : '#6b7280';

  if (loading)
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.light.primary} />
      </SafeAreaView>
    );

  // FE-H4 fix: render error state with retry button instead of blank screen
  if (error)
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 16, color: '#ef4444', textAlign: 'center', marginBottom: 16 }}>
            Failed to load AOV analytics. Please check your connection and try again.
          </Text>
          <Pressable
            onPress={() => {
              setError(false);
              load();
            }}
            style={{
              backgroundColor: Colors.light.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AOV Analytics</Text>
        <Text style={styles.headerSub}>Average Order Value</Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periods}>
        {(['7', '30', '90'] as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p === '7' ? 'Week' : p === '30' ? 'Month' : '3 Months'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      >
        {data && (
          <>
            {/* AOV Summary */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Current AOV</Text>
                <Text style={styles.summaryValue}>₹{(data.currentAOV ?? 0).toFixed(0)}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Ionicons name={trendIcon(data.trend)} size={14} color={trendColor(data.trend)} />
                  <Text style={[styles.growthText, { color: trendColor(data.trend) }]}>
                    {data.aovGrowth > 0 ? '+' : ''}
                    {(data.aovGrowth ?? 0).toFixed(1)}% vs prev
                  </Text>
                </View>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Orders</Text>
                <Text style={styles.summaryValue}>{data.totalOrders}</Text>
                <Text style={styles.summarySubLabel}>
                  Revenue: ₹{((data.totalRevenue ?? 0) / 1000).toFixed(1)}K
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Previous AOV</Text>
                <Text style={[styles.summaryValue, { color: '#6b7280' }]}>
                  ₹{(data.prevAOV ?? 0).toFixed(0)}
                </Text>
                <Text style={styles.summarySubLabel}>{data.period}</Text>
              </View>
            </View>

            {/* AOV Trend (simple text chart) */}
            {data.aovTrend.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Daily AOV Trend</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 8 }}>
                    {data.aovTrend.slice(-14).map((d, i) => {
                      const maxAOV = Math.max(...data.aovTrend.map((x) => x.aov));
                      const barH = maxAOV > 0 ? Math.max(8, (d.aov / maxAOV) * 80) : 8;
                      return (
                        <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                          <Text style={styles.barValue}>₹{d.aov.toFixed(0)}</Text>
                          <View style={[styles.bar, { height: barH }]} />
                          <Text style={styles.barLabel}>{d.date.slice(5)}</Text>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Upsell Conversion */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upsell Performance</Text>
              {data.upsellStats.length === 0 ? (
                <View style={styles.emptyUpsell}>
                  <Ionicons name="trending-up-outline" size={32} color="#d1d5db" />
                  <Text style={styles.emptyText}>No upsell rules set up yet.</Text>
                  <Text style={styles.emptySubText}>
                    Set up upsell rules to track conversion rates here.
                  </Text>
                </View>
              ) : (
                data.upsellStats.map((u) => (
                  <View key={u.ruleId} style={styles.upsellRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.upsellName}>{u.name}</Text>
                      <Text style={styles.upsellProduct}>{u.product}</Text>
                    </View>
                    <View style={styles.upsellStats}>
                      <Text style={styles.upsellConversion}>{u.conversionRate.toFixed(1)}%</Text>
                      <Text style={styles.upsellMeta}>
                        {u.accepted}/{u.impressions} accepted
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* AOV Optimization Tips */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Increase AOV Tips</Text>
              {[
                {
                  icon: 'cube',
                  tip: 'Create combo bundles — customers who buy bundles spend 25–40% more per visit',
                  action: 'Go to Bundles',
                  color: '#7C3AED',
                },
                {
                  icon: 'trending-up',
                  tip: 'Set up upsell rules — suggest a complementary item at checkout',
                  action: 'Set up upsells',
                  color: '#059669',
                },
                {
                  icon: 'gift',
                  tip: 'Add a threshold offer — "Spend ₹500 more to unlock cashback"',
                  action: 'Create offer',
                  color: '#d97706',
                },
              ].map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Ionicons name={tip.icon as unknown as keyof typeof Ionicons.glyphMap} size={20} color={tip.color} />
                  <Text style={styles.tipText}>{tip.tip}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  headerSub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  periods: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  periodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  periodBtnActive: { backgroundColor: '#7C3AED' },
  periodText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  periodTextActive: { color: '#fff' },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: { fontSize: 22, fontWeight: '800', color: '#111', marginTop: 4 },
  summarySubLabel: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  growthText: { fontSize: 12, fontWeight: '600' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 12 },
  barValue: { fontSize: 10, color: '#374151', fontWeight: '600' },
  bar: { width: 28, backgroundColor: '#7C3AED', borderRadius: 4, opacity: 0.8 },
  barLabel: { fontSize: 10, color: '#6b7280' },
  emptyUpsell: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  emptyText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  emptySubText: { fontSize: 13, color: '#6b7280', textAlign: 'center' },
  upsellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  upsellName: { fontSize: 14, fontWeight: '600', color: '#111' },
  upsellProduct: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  upsellStats: { alignItems: 'flex-end' },
  upsellConversion: { fontSize: 18, fontWeight: '800', color: '#7C3AED' },
  upsellMeta: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  tipText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 18 },
});

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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/api/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MonthlyBucket {
  month: string;
  newCount: number;
  returningCount: number;
}
interface LoyalCustomer {
  customerId: string;
  name: string;
  visitCount: number;
  totalSpent: number;
}

interface GrowthData {
  repeatCustomersThisMonth: number;
  totalCustomersThisMonth: number;
  monthlyBreakdown: MonthlyBucket[];
  topLoyalCustomers: LoyalCustomer[];
  qrScansThisMonth: number;
  coinsGiven: number;
  ordersFromLoyalty: number;
  loyaltyRevenue: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (n: number) => `\u20B9${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

function normaliseGrowthData(c: Record<string, unknown>, s: Record<string, unknown>): GrowthData {
  const monthlyRaw = Array.isArray(c.monthlyBreakdown) ? (c.monthlyBreakdown as unknown[]) : [];
  const loyalRaw = Array.isArray(c.topLoyalCustomers) ? (c.topLoyalCustomers as unknown[]) : [];

  return {
    repeatCustomersThisMonth:
      typeof c.repeatCustomersThisMonth === 'number' ? c.repeatCustomersThisMonth : 0,
    totalCustomersThisMonth:
      typeof c.totalCustomersThisMonth === 'number' ? c.totalCustomersThisMonth : 0,
    monthlyBreakdown: monthlyRaw.map((b) => {
      const x = (b && typeof b === 'object' ? b : {}) as Record<string, unknown>;
      return {
        month: typeof x.month === 'string' ? x.month : '',
        newCount: typeof x.newCount === 'number' ? x.newCount : 0,
        returningCount: typeof x.returningCount === 'number' ? x.returningCount : 0,
      };
    }),
    topLoyalCustomers: loyalRaw.slice(0, 5).map((l) => {
      const x = (l && typeof l === 'object' ? l : {}) as Record<string, unknown>;
      return {
        customerId: typeof x.customerId === 'string' ? x.customerId : String(x.id ?? ''),
        name: typeof x.name === 'string' ? x.name : 'Unknown',
        visitCount: typeof x.visitCount === 'number' ? x.visitCount : 0,
        totalSpent: typeof x.totalSpent === 'number' ? x.totalSpent : 0,
      };
    }),
    qrScansThisMonth: typeof s.qrScansThisMonth === 'number' ? s.qrScansThisMonth : 0,
    coinsGiven: typeof s.coinsGiven === 'number' ? s.coinsGiven : 0,
    ordersFromLoyalty: typeof s.ordersFromLoyalty === 'number' ? s.ordersFromLoyalty : 0,
    loyaltyRevenue: typeof s.loyaltyRevenue === 'number' ? s.loyaltyRevenue : 0,
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const HighlightCard = ({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  sub,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  sub?: string;
}) => (
  <View style={S.highlightCard}>
    <View style={[S.cardIcon, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <Text style={S.cardLabel}>{label}</Text>
    <Text style={S.cardValue}>{value}</Text>
    {sub ? <Text style={S.cardSub}>{sub}</Text> : null}
  </View>
);

const NewVsReturningChart = ({ buckets }: { buckets: MonthlyBucket[] }) => {
  if (buckets.length === 0)
    return <Text style={S.emptyNote}>No monthly breakdown available yet.</Text>;
  const maxVal = Math.max(...buckets.map((b) => b.newCount + b.returningCount), 1);
  return (
    <View>
      <View style={S.legendRow}>
        {[
          ['#6366f1', 'New'],
          ['#10b981', 'Returning'],
        ].map(([color, label]) => (
          <View key={label} style={S.legendItem}>
            <View style={[S.legendDot, { backgroundColor: color }]} />
            <Text style={S.legendText}>{label}</Text>
          </View>
        ))}
      </View>
      <View style={S.barsRow}>
        {buckets.map((b) => {
          const total = b.newCount + b.returningCount;
          const totalH = Math.max(4, (total / maxVal) * 80);
          const newH = total > 0 ? (b.newCount / total) * totalH : 0;
          return (
            <View key={b.month} style={S.barCol}>
              <Text style={S.barTotal}>{total}</Text>
              <View style={[S.barSeg, { height: Math.max(2, newH), backgroundColor: '#6366f1' }]} />
              <View
                style={[
                  S.barSeg,
                  { height: Math.max(2, totalH - newH), backgroundColor: '#10b981' },
                ]}
              />
              <Text style={S.barLabel}>{b.month}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const LoyalCustomerRow = ({ customer, rank }: { customer: LoyalCustomer; rank: number }) => (
  <View style={S.loyalRow}>
    <View style={S.loyalBadge}>
      <Text style={S.loyalRank}>{rank}</Text>
    </View>
    <View style={S.loyalInfo}>
      <Text style={S.loyalName} numberOfLines={1}>
        {customer.name}
      </Text>
      <Text style={S.loyalVisits}>
        {customer.visitCount} visit{customer.visitCount !== 1 ? 's' : ''}
      </Text>
    </View>
    <Text style={S.loyalSpent}>{fmt(customer.totalSpent)}</Text>
  </View>
);

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function MerchantGrowthDashboard() {
  const { merchant: _merchant } = useAuth();
  const [data, setData] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [cRes, sRes] = await Promise.all([
        apiClient.get('merchant/analytics/customers'),
        apiClient.get('merchant/analytics/summary'),
      ]);
      const cPayload = (cRes.success && cRes.data ? cRes.data : cRes) as Record<string, unknown>;
      const sPayload = (sRes.success && sRes.data ? sRes.data : sRes) as Record<string, unknown>;
      setData(normaliseGrowthData(cPayload, sPayload));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load growth data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const repeatPct =
    data && data.totalCustomersThisMonth > 0
      ? Math.round((data.repeatCustomersThisMonth / data.totalCustomersThisMonth) * 100)
      : 0;
  const roiRatio =
    data && data.coinsGiven > 0 ? (data.ordersFromLoyalty / data.coinsGiven).toFixed(2) : null;

  const Header = () => (
    <View style={S.header}>
      <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
        <Ionicons name="chevron-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={S.headerTitle}>Growth Dashboard</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={S.container}>
        <Header />
        <View style={S.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={S.loadingText}>Loading growth data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={S.container}>
        <Header />
        <View style={S.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={S.errorText}>{error}</Text>
          <TouchableOpacity
            style={S.retryBtn}
            onPress={() => {
              setLoading(true);
              fetchData();
            }}
          >
            <Text style={S.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={S.container}>
      <Header />
      <ScrollView
        contentContainerStyle={S.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 1 — REZ repeat customers banner */}
        <View style={S.banner}>
          <Ionicons name="people" size={28} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={S.bannerHeadline}>
              REZ brought you{' '}
              <Text style={S.bannerCount}>{data?.repeatCustomersThisMonth ?? 0}</Text> repeat
              customers this month
            </Text>
            <Text style={S.bannerSub}>
              {repeatPct}% of your {data?.totalCustomersThisMonth ?? 0} total customers visited 2+
              times
            </Text>
          </View>
        </View>

        {/* Quick-stats row */}
        <View style={S.cardsRow}>
          <HighlightCard
            icon="qr-code-outline"
            iconColor="#6366f1"
            iconBg="#eef2ff"
            label="QR Scans"
            value={(data?.qrScansThisMonth ?? 0).toLocaleString()}
            sub="This month"
          />
          <HighlightCard
            icon="star-outline"
            iconColor="#f59e0b"
            iconBg="#fffbeb"
            label="Coins Given"
            value={(data?.coinsGiven ?? 0).toLocaleString()}
            sub="Loyalty coins"
          />
          <HighlightCard
            icon="cart-outline"
            iconColor="#10b981"
            iconBg="#ecfdf5"
            label="Loyalty Orders"
            value={(data?.ordersFromLoyalty ?? 0).toLocaleString()}
            sub="From coins"
          />
        </View>

        {/* 2 — New vs Returning bar chart */}
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <Ionicons name="bar-chart-outline" size={18} color="#6366f1" />
            <Text style={S.sectionTitle}>New vs Returning Customers</Text>
          </View>
          <NewVsReturningChart buckets={data?.monthlyBreakdown ?? []} />
        </View>

        {/* 3 — Top 5 loyal customers */}
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <Ionicons name="ribbon-outline" size={18} color="#6366f1" />
            <Text style={S.sectionTitle}>Top 5 Loyal Customers</Text>
          </View>
          {data && data.topLoyalCustomers.length > 0 ? (
            data.topLoyalCustomers.map((c, i) => (
              <LoyalCustomerRow key={c.customerId || i} customer={c} rank={i + 1} />
            ))
          ) : (
            <Text style={S.emptyNote}>No loyal customer data available yet.</Text>
          )}
        </View>

        {/* 5 — Loyalty ROI */}
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <Ionicons name="trending-up-outline" size={18} color="#6366f1" />
            <Text style={S.sectionTitle}>Loyalty Program ROI</Text>
          </View>
          <View style={S.roiGrid}>
            <View style={S.roiCard}>
              <Text style={S.roiLabel}>Coins Distributed</Text>
              <Text style={[S.roiValue, { color: '#f59e0b' }]}>
                {(data?.coinsGiven ?? 0).toLocaleString()}
              </Text>
              <Text style={S.roiSub}>loyalty coins given</Text>
            </View>
            <View style={S.roiDivider} />
            <View style={S.roiCard}>
              <Text style={S.roiLabel}>Revenue Driven</Text>
              <Text style={[S.roiValue, { color: '#10b981' }]}>
                {fmt(data?.loyaltyRevenue ?? 0)}
              </Text>
              <Text style={S.roiSub}>{data?.ordersFromLoyalty ?? 0} orders generated</Text>
            </View>
          </View>
          {roiRatio !== null && (
            <View style={S.roiBadge}>
              <Ionicons name="flash" size={14} color="#6366f1" />
              <Text style={S.roiBadgeText}>
                {roiRatio} orders per coin — keep rewarding loyalty!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const S = StyleSheet.create({
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
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6b7280' },
  errorText: { marginTop: 12, fontSize: 14, color: '#ef4444', textAlign: 'center' },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: { color: '#fff', fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 40 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  bannerHeadline: { fontSize: 14, fontWeight: '600', color: '#fff', lineHeight: 20 },
  bannerCount: { fontSize: 18, fontWeight: '800' },
  bannerSub: { fontSize: 12, color: '#c7d2fe', marginTop: 4 },
  cardsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  highlightCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardLabel: { fontSize: 11, color: '#6b7280', textAlign: 'center', fontWeight: '500' },
  cardValue: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 2 },
  cardSub: { fontSize: 10, color: '#9ca3af', marginTop: 2 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151' },
  emptyNote: { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingVertical: 12 },
  legendRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#6b7280' },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingTop: 4 },
  barCol: { flex: 1, alignItems: 'center', gap: 2 },
  barTotal: { fontSize: 9, fontWeight: '600', color: '#374151' },
  barSeg: { width: '100%', borderRadius: 3 },
  barLabel: { fontSize: 9, color: '#9ca3af', marginTop: 4, textAlign: 'center' },
  loyalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  loyalBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loyalRank: { fontSize: 12, fontWeight: '700', color: '#6366f1' },
  loyalInfo: { flex: 1 },
  loyalName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  loyalVisits: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  loyalSpent: { fontSize: 14, fontWeight: '700', color: '#10b981' },
  roiGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  roiCard: { flex: 1, alignItems: 'center' },
  roiDivider: { width: 1, height: 56, backgroundColor: '#e5e7eb', marginHorizontal: 8 },
  roiLabel: { fontSize: 11, color: '#6b7280', fontWeight: '500', marginBottom: 4 },
  roiValue: { fontSize: 22, fontWeight: '800' },
  roiSub: { fontSize: 11, color: '#9ca3af', marginTop: 4, textAlign: 'center' },
  roiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eef2ff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  roiBadgeText: { fontSize: 12, color: '#6366f1', fontWeight: '600', flex: 1 },
});

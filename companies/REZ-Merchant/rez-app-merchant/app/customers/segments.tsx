import React, { useState, useCallback } from 'react';
import { logger } from '@/utils/logger';
import {
  View,
  StyleSheet,
  FlatList,
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

interface Customer {
  userId: string;
  name: string;
  totalSpend: number;
  visitCount: number;
  lastVisit: string;
  coinBalance: number;
}

interface SegmentsResponse {
  high_value: Customer[];
  at_risk: Customer[];
  new_users: Customer[];
}

type TabKey = 'high_value' | 'at_risk' | 'new_users';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'high_value', label: 'High Value' },
  { key: 'at_risk', label: 'At Risk' },
  { key: 'new_users', label: 'New Users' },
];

function formatLastVisit(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  } catch {
    return '—';
  }
}

function CustomerCard({ customer }: { customer: Customer }) {
  const handleSendOffer = () => {
    router.push(`/discounts/builder?userId=${customer.userId}`);
  };

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.cardHeader}>
        <View style={cardStyles.avatar}>
          <ThemedText style={cardStyles.avatarText}>
            {customer.name ? customer.name.charAt(0).toUpperCase() : '?'}
          </ThemedText>
        </View>
        <View style={cardStyles.info}>
          <ThemedText style={cardStyles.name}>{customer.name || '—'}</ThemedText>
          <ThemedText style={cardStyles.lastVisit}>
            Last visit: {formatLastVisit(customer.lastVisit)}
          </ThemedText>
        </View>
        <TouchableOpacity style={cardStyles.offerBtn} onPress={handleSendOffer}>
          <ThemedText style={cardStyles.offerBtnText}>Send Offer</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={cardStyles.statsRow}>
        <View style={cardStyles.stat}>
          <ThemedText style={cardStyles.statValue}>{customer.visitCount}</ThemedText>
          <ThemedText style={cardStyles.statLabel}>Visits</ThemedText>
        </View>
        <View style={cardStyles.statDivider} />
        <View style={cardStyles.stat}>
          <ThemedText style={cardStyles.statValue}>
            ₹{(customer.totalSpend ?? 0).toLocaleString('en-IN')}
          </ThemedText>
          <ThemedText style={cardStyles.statLabel}>Total Spend</ThemedText>
        </View>
        <View style={cardStyles.statDivider} />
        <View style={cardStyles.stat}>
          <ThemedText style={cardStyles.statValue}>
            {(customer.coinBalance ?? 0).toLocaleString('en-IN')}
          </ThemedText>
          <ThemedText style={cardStyles.statLabel}>Coins</ThemedText>
        </View>
      </View>
    </View>
  );
}

export default function CustomerSegmentsScreen() {
  const [data, setData] = useState<SegmentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('high_value');

  const fetchSegments = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await apiClient.get<unknown>('merchant/customers/segments');
      const payload = res.data ?? res;

      if (!payload || typeof payload !== 'object') {
        throw new Error('Unexpected response format');
      }

      setData({
        high_value: payload.high_value || [],
        at_risk: payload.at_risk || [],
        new_users: payload.new_users || [],
      });
    } catch (err) {
      logger.error('CustomerSegments fetch error:', err);
      const msg = err.message || 'Failed to load customer segments';
      setError(msg);
      if (!isRefreshing) platformAlertSimple('Error', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  const activeCustomers: Customer[] = data ? data[activeTab] : [];

  const tabCount = (key: TabKey): number => (data ? data[key].length : 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          Customer Segments
        </ThemedText>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push('/customers/message')}
            style={styles.messageBtn}
          >
            <Ionicons name="send-outline" size={18} color={Colors.light.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => fetchSegments(true)}
            style={styles.refreshBtn}
            disabled={refreshing}
          >
            <Ionicons name="refresh" size={22} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <ThemedText style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </ThemedText>
            {!loading && data && (
              <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
                <ThemedText
                  style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}
                >
                  {tabCount(tab.key)}
                </ThemedText>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <ThemedText style={styles.loadingText}>Loading segments...</ThemedText>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.light.destructive} />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchSegments()}>
            <ThemedText style={styles.retryBtnText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={activeCustomers}
          keyExtractor={(item) => String(item.userId)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchSegments(true)}
              colors={[Colors.light.primary]}
              tintColor={Colors.light.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={Colors.light.textSecondary} />
              <ThemedText style={styles.emptyText}>No customers in this segment</ThemedText>
            </View>
          }
          renderItem={({ item }) => <CustomerCard customer={item} />}
        />
      )}
    </SafeAreaView>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    marginBottom: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primaryLight2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  lastVisit: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  offerBtn: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  offerBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 8,
    padding: 10,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.light.border,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
});

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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  messageBtn: { padding: 4 },
  refreshBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '600', color: Colors.light.text },
  tabsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  tabTextActive: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: Colors.light.primaryLight2,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  tabBadgeTextActive: {
    color: Colors.light.primary,
  },
  listContent: {
    padding: 14,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.light.destructive,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});

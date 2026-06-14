// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
/**
 * Wallet Transaction History Screen
 *
 * Full paginated list of wallet transactions with filter tabs (All / Credits / Debits).
 * Infinite scroll via FlashList, pull-to-refresh, empty state.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform,
  FlatList,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import walletApi, { TransactionResponse } from '@/services/walletApi';
import { colors } from '@/constants/theme';
import { Colors, Spacing, BorderRadius } from '@/constants/DesignSystem';

// ============================================================================
// CONSTANTS
// ============================================================================

const PAGE_SIZE = 20;
type FilterType = 'all' | 'credit' | 'debit';

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function categoryLabel(tx: TransactionResponse): string {
  const map: Record<string, string> = {
    earning: 'Earned',
    spending: 'Spent',
    refund: 'Refund',
    withdrawal: 'Withdrawal',
    topup: 'Top-up',
    bonus: 'Bonus',
    penalty: 'Penalty',
    cashback: 'Cashback',
  };
  return map[tx.category] ?? tx.category;
}

// ============================================================================
// TRANSACTION ITEM
// ============================================================================

function TransactionItem({ item }: { item: TransactionResponse }) {
  const isCredit = item.type === 'credit';
  return (
    <View style={itemStyles.row}>
      <View style={[itemStyles.iconWrap, isCredit ? itemStyles.iconCredit : itemStyles.iconDebit]}>
        <Ionicons name={isCredit ? 'arrow-down' : 'arrow-up'} size={18} color={isCredit ? '#16A34A' : '#DC2626'} />
      </View>
      <View style={itemStyles.info}>
        <Text style={itemStyles.description} numberOfLines={1}>
          {item.description || categoryLabel(item)}
        </Text>
        <Text style={itemStyles.meta}>
          {categoryLabel(item)} · {formatDate(item.createdAt)} at {formatTime(item.createdAt)}
        </Text>
      </View>
      <View style={itemStyles.amountCol}>
        <Text style={[itemStyles.amount, isCredit ? itemStyles.amountCredit : itemStyles.amountDebit]}>
          {isCredit ? '+' : '-'}₹{Math.abs(item.amount).toFixed(2)}
        </Text>
        <Text
          style={[
            itemStyles.statusBadge,
            item.status?.current === 'completed'
              ? itemStyles.statusCompleted
              : item.status?.current === 'failed'
                ? itemStyles.statusFailed
                : itemStyles.statusPending,
          ]}
        >
          {item.status?.current ?? 'completed'}
        </Text>
      </View>
    </View>
  );
}

const itemStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[200],
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCredit: { backgroundColor: '#F0FDF4' },
  iconDebit: { backgroundColor: '#FEF2F2' },
  info: { flex: 1, gap: 3 },
  description: { fontSize: 14, fontWeight: '600', color: colors.text.primary },
  meta: { fontSize: 11, color: colors.gray[500] },
  amountCol: { alignItems: 'flex-end', gap: 4 },
  amount: { fontSize: 15, fontWeight: '700' },
  amountCredit: { color: '#16A34A' },
  amountDebit: { color: '#DC2626' },
  statusBadge: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
    textTransform: 'capitalize',
  },
  statusCompleted: { backgroundColor: '#DCFCE7', color: '#15803D' },
  statusFailed: { backgroundColor: '#FEE2E2', color: '#B91C1C' },
  statusPending: { backgroundColor: '#FEF3C7', color: '#92400E' },
});

// ============================================================================
// FILTER TABS
// ============================================================================

function FilterTabs({ active, onChange }: { active: FilterType; onChange: (t: FilterType) => void }) {
  const tabs: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Credits', value: 'credit' },
    { label: 'Debits', value: 'debit' },
  ];
  return (
    <View style={tabStyles.row}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.value}
          style={[tabStyles.tab, active === tab.value && tabStyles.tabActive]}
          onPress={() => onChange(tab.value)}
          accessibilityRole="tab"
          accessibilityState={{ selected: active === tab.value }}
        >
          <Text style={[tabStyles.label, active === tab.value && tabStyles.labelActive]}>{tab.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[200],
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: colors.tint.slate,
  },
  tabActive: {
    backgroundColor: colors.nileBlue,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  labelActive: {
    color: '#fff',
  },
});

// ============================================================================
// MAIN SCREEN
// ============================================================================

// CD-TS-05 FIX: Wrap with ErrorBoundary to prevent crashes from killing the entire screen
function WalletHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [filter, setFilter] = useState<FilterType>('all');
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchPage = useCallback(async (pageNum: number, currentFilter: FilterType, append: boolean) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page: pageNum, limit: PAGE_SIZE };
      if (currentFilter !== 'all') params.type = currentFilter;
      const res = await walletApi.getTransactions(params);
      if (!mountedRef.current) return;
      if (res.success && res.data) {
        const newItems = res.data.transactions ?? [];
        setTransactions((prev) => (append ? [...prev, ...newItems] : newItems));
        setHasMore(res.data.pagination?.hasNext ?? false);
        setPage(pageNum);
      } else {
        setError(res.message || 'Failed to load transactions.');
      }
    } catch (err) {
      if (mountedRef.current) setError(err?.message || 'Failed to load transactions.');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  // Reload whenever filter changes or screen focuses
  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true;
      setTransactions([]);
      setPage(1);
      setHasMore(true);
      fetchPage(1, filter, false);
      return () => {
        mountedRef.current = false;
      };
    }, [filter, fetchPage]),
  );

  const handleFilterChange = useCallback((newFilter: FilterType) => {
    setFilter(newFilter);
    // useFocusEffect will re-run due to filter change, no need to manually fetch
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPage(1, filter, false);
    setRefreshing(false);
  }, [fetchPage, filter]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    fetchPage(page + 1, filter, true);
  }, [hasMore, loadingMore, loading, page, filter, fetchPage]);

  // ── Render helpers ─────────────────────────────────────────────────────────

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <Ionicons name="receipt-outline" size={52} color={colors.gray[400]} />
        <Text style={styles.emptyTitle}>No transactions yet</Text>
        <Text style={styles.emptySub}>
          {filter === 'all'
            ? 'Your wallet activity will appear here.'
            : filter === 'credit'
              ? 'No credits found.'
              : 'No debits found.'}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <ActivityIndicator color={colors.nileBlue} size="small" />
      </View>
    );
  };

  return (
    <View style={[styles.screen]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.nileBlue} />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient colors={[colors.nileBlue, '#2A5577']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel="Go back" accessibilityRole="button">
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Transaction History</Text>
          <View style={{ width: 30 }} />
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <FilterTabs active={filter} onChange={handleFilterChange} />

      {/* Error state */}
      {error && !loading && (
        <View style={styles.errorWrap}>
          <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => fetchPage(1, filter, false)} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Loading skeleton */}
      {loading && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.nileBlue} size="large" />
          <Text style={{ marginTop: 12, color: colors.gray[500], fontSize: 13 }}>Loading transactions...</Text>
        </View>
      )}

      {/* List */}
      {!loading &&
        (Platform.OS === 'web' ? (
          <FlatList
            data={transactions}
            renderItem={({ item }) => <TransactionItem item={item} />}
            keyExtractor={(item) => item.id || item.transactionId}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.nileBlue}
                colors={[colors.nileBlue]}
              />
            }
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          />
        ) : (
          <FlashList
            data={transactions}
            renderItem={({ item }) => <TransactionItem item={item} />}
            keyExtractor={(item) => item.id || item.transactionId}
            estimatedItemSize={72}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.nileBlue}
                colors={[colors.nileBlue]}
              />
            }
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          />
        ))}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  errorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    padding: 14,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    flexWrap: 'wrap',
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    flex: 1,
  },
  retryBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: colors.error,
    borderRadius: 8,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
});

export default withErrorBoundary(WalletHistoryScreen, 'WalletHistory');

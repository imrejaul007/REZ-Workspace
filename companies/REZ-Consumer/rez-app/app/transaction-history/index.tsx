// @ts-nocheck
/**
 * Transaction History Screen
 * Shows paginated list of coin transactions with filters, search, and date range selection
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CachedImage from '@/components/ui/CachedImage';
import EmptyState from '@/components/ui/EmptyState';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import apiClient from '@/services/apiClient';
import { useIsMounted } from '@/hooks/useIsMounted';
import { withErrorBoundary } from '@/utils/withErrorBoundary';

type FilterType = 'all' | 'earned' | 'redeemed' | 'expired';
type DateRange = 'this_month' | 'last_month' | 'last_3_months';

interface Transaction {
  _id: string;
  type: 'earned' | 'redeemed' | 'expired';
  description: string;
  amount: number;
  storeName?: string;
  storeLogo?: string;
  source?: string;
  createdAt: string;
}

interface TransactionPage {
  transactions: Transaction[];
  cursor?: string;
  hasMore: boolean;
  summary: {
    totalEarned: number;
    totalRedeemed: number;
  };
}

const DATE_RANGE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'Last 3 Months', value: 'last_3_months' },
];

const FILTER_OPTIONS: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Earned', value: 'earned' },
  { label: 'Redeemed', value: 'redeemed' },
  { label: 'Expired', value: 'expired' },
];

function getDateRangeBounds(range: DateRange): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString();

  if (range === 'this_month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return { from, to };
  }
  if (range === 'last_month') {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const toDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
    return { from, to: toDate };
  }
  // last_3_months
  const from = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();
  return { from, to };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function TransactionHistoryScreen() {
  const isMounted = useIsMounted();
  const router = useRouter();

  const [filter, setFilter] = useState<FilterType>('all');
  const [dateRange, setDateRange] = useState<DateRange>('this_month');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const cursorRef = useRef<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({ totalEarned: 0, totalRedeemed: 0 });

  const fetchTransactions = useCallback(
    async (opts: { reset?: boolean } = {}) => {
      const { reset = false } = opts;
      const { from, to } = getDateRangeBounds(dateRange);

      try {
        const params: Record<string, string> = {
          limit: '30',
          from,
          to,
        };
        if (filter !== 'all') {
          params.type = filter;
        }
        if (!reset && cursorRef.current) {
          params.cursor = cursorRef.current;
        }

        const response = await apiClient.get('/user/transactions', { params: params as unknown });
        const data = response.data as TransactionPage | undefined;
        if (!data) return;

        if (!isMounted()) return;

        if (reset) {
          setTransactions(data.transactions ?? []);
        } else {
          setTransactions((prev) => [...prev, ...(data.transactions ?? [])]);
        }
        cursorRef.current = data.cursor;
        setCursor(data.cursor);
        setHasMore(data.hasMore ?? false);
        if (reset && data.summary) {
          setSummary(data.summary);
        }
      } catch (_err) {
        // silently handle – keep existing data
      } finally {
        if (!isMounted()) return;
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [filter, dateRange, isMounted],
  );

  // Reset and reload when filter or date range changes
  useEffect(() => {
    setLoading(true);
    cursorRef.current = undefined;
    setCursor(undefined);
    setTransactions([]);
    fetchTransactions({ reset: true });
  }, [filter, dateRange, fetchTransactions]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setCursor(undefined);
    fetchTransactions({ reset: true });
  }, [fetchTransactions]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    fetchTransactions({ reset: false });
  }, [hasMore, loadingMore, fetchTransactions]);

  // Client-side search filter
  const filteredTransactions = searchQuery.trim()
    ? transactions.filter((t) =>
        (t.storeName || t.description || '').toLowerCase().includes(searchQuery.trim().toLowerCase()),
      )
    : transactions;

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isEarned = item.type === 'earned';
    const isExpired = item.type === 'expired';
    const amountColor = isEarned ? Colors.success : isExpired ? colors.text.tertiary : Colors.error;
    const amountPrefix = isEarned ? '+' : isExpired ? '' : '-';

    return (
      <View style={styles.transactionRow}>
        <View style={styles.transactionIcon}>
          {item.storeLogo ? (
            <CachedImage source={item.storeLogo} style={styles.storeLogo} />
          ) : (
            <View style={styles.coinIconBox}>
              <Ionicons name="logo-bitcoin" size={22} color={Colors.warning} />
            </View>
          )}
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription} numberOfLines={1}>
            {item.description}
          </Text>
          {item.storeName ? (
            <Text style={styles.transactionStore} numberOfLines={1}>
              {item.storeName}
            </Text>
          ) : null}
          <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={styles.transactionAmount}>
          <Text style={[styles.amountText, { color: amountColor }]}>
            {amountPrefix}
            {item.amount}
          </Text>
          <Text style={styles.coinsLabel}>coins</Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    const emptyMessages: Record<FilterType, string> = {
      all: 'No transactions yet',
      earned: 'No coins earned in this period',
      redeemed: 'No coins redeemed in this period',
      expired: 'No expired coins in this period',
    };
    return (
      <EmptyState
        iconName="receipt-outline"
        title={emptyMessages[filter]}
        subtitle="Shop at partner stores to start earning coins"
      />
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.brand.purple} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as unknown))}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
        </Pressable>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Summary Banner */}
      <View style={styles.summaryBanner}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Earned this month</Text>
          <Text style={[styles.summaryValue, { color: Colors.success }]}>+{summary.totalEarned}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Redeemed</Text>
          <Text style={[styles.summaryValue, { color: Colors.error }]}>-{summary.totalRedeemed}</Text>
        </View>
      </View>

      {/* Date Range Picker */}
      <View style={styles.dateRangeRow}>
        <Pressable style={styles.dateRangeButton} onPress={() => setShowDatePicker((v) => !v)}>
          <Ionicons name="calendar-outline" size={16} color={Colors.brand.purple} />
          <Text style={styles.dateRangeText}>
            {DATE_RANGE_OPTIONS.find((d) => d.value === dateRange)?.label ?? 'This Month'}
          </Text>
          <Ionicons name={showDatePicker ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.brand.purple} />
        </Pressable>
      </View>

      {showDatePicker && (
        <View style={styles.datePickerDropdown}>
          {DATE_RANGE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.datePickerItem, dateRange === opt.value && styles.datePickerItemActive]}
              onPress={() => {
                setDateRange(opt.value);
                setShowDatePicker(false);
              }}
            >
              <Text style={[styles.datePickerItemText, dateRange === opt.value && styles.datePickerItemTextActive]}>
                {opt.label}
              </Text>
              {dateRange === opt.value && <Ionicons name="checkmark" size={16} color={Colors.brand.purple} />}
            </Pressable>
          ))}
        </View>
      )}

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            style={[styles.filterPill, filter === opt.value && styles.filterPillActive]}
            onPress={() => setFilter(opt.value)}
          >
            <Text style={[styles.filterPillText, filter === opt.value && styles.filterPillTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.text.tertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by store name..."
          placeholderTextColor={colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Transaction List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.brand.purple} />
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item._id}
          renderItem={renderTransaction}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.brand.purple]}
              tintColor={Colors.brand.purple}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          contentContainerStyle={filteredTransactions.length === 0 ? styles.emptyListContent : styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          // PERFORMANCE: FlatList optimization props
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={50}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.nileBlue,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  backButton: {
    padding: Spacing.sm,
    width: 40,
  },
  headerTitle: {
    fontSize: Typography.h4.fontSize,
    fontWeight: '700',
    color: colors.text.inverse,
    flex: 1,
    textAlign: 'center',
  },
  summaryBanner: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: colors.text.tertiary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: Typography.h4.fontSize,
    fontWeight: '700',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.border.default,
    marginVertical: 4,
  },
  dateRangeRow: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
  },
  dateRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.brand.purple,
  },
  dateRangeText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: Colors.brand.purple,
  },
  datePickerDropdown: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.xs,
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  datePickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  datePickerItemActive: {
    backgroundColor: `${Colors.brand.purple}10`,
  },
  datePickerItemText: {
    fontSize: Typography.body.fontSize,
    color: colors.text.primary,
  },
  datePickerItemTextActive: {
    color: Colors.brand.purple,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  filterPill: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.secondary,
  },
  filterPillActive: {
    borderColor: Colors.brand.purple,
    backgroundColor: Colors.brand.purple,
  },
  filterPillText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  filterPillTextActive: {
    color: colors.text.inverse,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.body.fontSize,
    color: colors.text.primary,
    padding: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingTop: Spacing.md,
    paddingBottom: 100,
  },
  emptyListContent: {
    flex: 1,
    paddingBottom: 100,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: colors.background.primary,
  },
  transactionIcon: {
    marginRight: Spacing.md,
  },
  storeLogo: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: colors.background.secondary,
  },
  coinIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: `${Colors.warning}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  transactionStore: {
    fontSize: Typography.bodySmall.fontSize,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: Typography.caption.fontSize,
    color: colors.text.tertiary,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: Typography.h4.fontSize,
    fontWeight: '700',
  },
  coinsLabel: {
    fontSize: Typography.caption.fontSize,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.default,
    marginHorizontal: Spacing.base,
  },
  footerLoader: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
});

export default withErrorBoundary(TransactionHistoryScreen, 'TransactionHistory');

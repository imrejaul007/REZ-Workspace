// @ts-nocheck
/**
 * TransactionHistory — Real-API backed transaction list with:
 * - Live data from walletApi.getTransactions()
 * - All / Credits / Debits tabs
 * - Date grouping (Today / Yesterday / This Week / Earlier)
 * - Pull-to-refresh
 * - Infinite scroll pagination
 * - Friendly empty state
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  SectionList,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';
import { colors as themeColors } from '@/constants/theme';
import walletApi, { TransactionResponse } from '@/services/walletApi';
import { useIsMounted } from '@/hooks/useIsMounted';
import { useRouter } from 'expo-router';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type TabId = 'all' | 'credits' | 'debits';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'all', label: 'All' },
  { id: 'credits', label: 'Credits' },
  { id: 'debits', label: 'Debits' },
];

interface TransactionHistoryProps {
  onTransactionPress?: (transaction: TransactionResponse) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  maxHeight?: number;
}

// ---------------------------------------------------------------------------
// Date grouping helpers
// ---------------------------------------------------------------------------
function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Earlier';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return 'This Week';
  return 'Earlier';
}

function groupTransactionsByDate(
  transactions: TransactionResponse[]
): { title: string; data: TransactionResponse[] }[] {
  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Earlier'];
  const groups: Record<string, TransactionResponse[]> = {};
  for (const txn of transactions) {
    const key = getDateGroup(txn.createdAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(txn);
  }
  return groupOrder
    .filter((g) => groups[g] && groups[g].length > 0)
    .map((g) => ({ title: g, data: groups[g] }));
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ---------------------------------------------------------------------------
// Transaction Item
// ---------------------------------------------------------------------------
const ICON_MAP: Record<string, string> = {
  earning: 'arrow-down-circle',
  spending: 'arrow-up-circle',
  refund: 'refresh-circle',
  withdrawal: 'remove-circle',
  topup: 'add-circle',
  bonus: 'gift',
  penalty: 'warning',
  cashback: 'cash',
};

function getIcon(category: string): string {
  return ICON_MAP[category] || 'swap-horizontal';
}

const STATUS_COLORS: Record<string, string> = {
  completed: '#059669',
  pending: '#F59E0B',
  processing: '#3B82F6',
  failed: '#EF4444',
  cancelled: '#6B7280',
  reversed: '#1a3a52',
};

function statusColor(status: string): string {
  return STATUS_COLORS[status] || '#6B7280';
}

// Gradient pairs per transaction direction
const CREDIT_GRADIENT: [string, string] = ['#10B981', '#34D399'];
const DEBIT_GRADIENT: [string, string] = ['#EF4444', '#F87171'];
const TRANSFER_GRADIENT: [string, string] = ['#3B82F6', '#60A5FA'];

function getGradientForCategory(category: string, isCredit: boolean): [string, string] {
  if (category === 'withdrawal' || category === 'transfer') return TRANSFER_GRADIENT;
  return isCredit ? CREDIT_GRADIENT : DEBIT_GRADIENT;
}

function TransactionItem({
  txn,
  onPress,
  isLast,
}: {
  txn: TransactionResponse;
  onPress?: (t: TransactionResponse) => void;
  isLast?: boolean;
}) {
  const isCredit = txn.type === 'credit';
  const amountColor = isCredit ? '#059669' : '#EF4444';
  const amountPrefix = isCredit ? '+' : '-';
  const icon = getIcon(txn.category);
  const gradColors = getGradientForCategory(txn.category, isCredit);
  const status = txn.status?.current || 'completed';
  const sc = statusColor(status);

  // Description: prefer source.description, then txn.description, then category
  const label =
    txn.source?.description || txn.description || txn.category || 'Transaction';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.txnCard,
        !isLast && styles.txnCardBorder,
        pressed && styles.txnCardPressed,
      ]}
      onPress={() => onPress?.(txn)}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${amountPrefix}${typeof txn.amount === 'number' ? txn.amount : '—'} ${txn.currency || ''}, ${status}`}
    >
      {/* Left: gradient circle icon */}
      <LinearGradient
        colors={gradColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.txnIconWrap}
      >
        <Ionicons name={icon as unknown} size={20} color="#fff" />
      </LinearGradient>

      {/* Center: title + subtitle + date */}
      <View style={styles.txnBody}>
        <Text style={styles.txnLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.txnSubtitle} numberOfLines={1}>
          {(txn.source as unknown)?.name || txn.source?.type || txn.category || 'Wallet'}
        </Text>
        <Text style={styles.txnDate}>{formatDate(txn.createdAt)}</Text>
      </View>

      {/* Right: amount + status badge */}
      <View style={styles.txnRight}>
        <Text style={[styles.txnAmount, { color: amountColor }]}>
          {amountPrefix}
          {typeof txn.amount === 'number' ? txn.amount : '—'} {txn.currency || ''}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: sc + '18' }]}>
          <Text style={[styles.statusText, { color: sc }]}>
            {status.replace('_', ' ')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
function TransactionHistory({
  onTransactionPress,
  refreshing = false,
  onRefresh,
  maxHeight,
}: TransactionHistoryProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useIsMounted();
  const PAGE_SIZE = 20;

  const loadTransactions = useCallback(
    async (tab: TabId, pageNum: number, append: boolean) => {
      try {
        if (pageNum === 1) {
          setIsLoading(true);
          setError(null);
        } else {
          setIsLoadingMore(true);
        }

        const filters: Record<string, unknown> = { page: pageNum, limit: PAGE_SIZE };
        if (tab === 'credits') filters.type = 'credit';
        if (tab === 'debits') filters.type = 'debit';

        const res = await walletApi.getTransactions(filters);

        if (!isMounted()) return;

        if (!res.success || !res.data) {
          setError(res.message || 'Failed to load transactions');
          return;
        }

        const fetched = res.data.transactions ?? [];
        const pagination = res.data.pagination;

        if (append) {
          setTransactions((prev) => [...prev, ...fetched]);
        } else {
          setTransactions(fetched);
        }

        setHasMore(pagination?.hasNext ?? fetched.length === PAGE_SIZE);
        setPage(pageNum);
      } catch (e) {
        if (isMounted()) setError(e?.message || 'Something went wrong');
      } finally {
        if (isMounted()) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [isMounted]
  );

  // Reload when tab changes
  useEffect(() => {
    loadTransactions(activeTab, 1, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleTabPress = useCallback(
    (tab: TabId) => {
      if (tab !== activeTab) {
        setActiveTab(tab);
        setPage(1);
        setHasMore(true);
      }
    },
    [activeTab]
  );

  const handleRefresh = useCallback(() => {
    onRefresh?.();
    setPage(1);
    setHasMore(true);
    loadTransactions(activeTab, 1, false);
  }, [activeTab, onRefresh, loadTransactions]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && !isLoading) {
      loadTransactions(activeTab, page + 1, true);
    }
  }, [hasMore, isLoadingMore, isLoading, activeTab, page, loadTransactions]);

  // Group into sections
  const sections = useMemo(() => groupTransactionsByDate(transactions), [transactions]);

  // --- Loading state (initial) ---
  if (isLoading && transactions.length === 0) {
    return (
      <View style={styles.container}>
        <_Tabs activeTab={activeTab} onPress={handleTabPress} />
        <View style={styles.centeredBox}>
          <ActivityIndicator size="large" color={colors.nileBlue} />
          <Text style={styles.loadingText}>Loading transactions…</Text>
        </View>
      </View>
    );
  }

  // --- Error state ---
  if (error && transactions.length === 0) {
    return (
      <View style={styles.container}>
        <_Tabs activeTab={activeTab} onPress={handleTabPress} />
        <View style={styles.centeredBox}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
          </View>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => loadTransactions(activeTab, 1, false)}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, maxHeight ? { maxHeight } : undefined]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recent Transactions</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View all transactions"
          onPress={() => router.push('/earnings-history' as unknown)}
        >
          <Text style={styles.viewAllLink}>View All</Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <_Tabs activeTab={activeTab} onPress={handleTabPress} />

      {/* List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id || item.transactionId}
        renderItem={({ item, index, section }) => (
          <TransactionItem
            txn={item}
            onPress={onTransactionPress}
            isLast={index === section.data.length - 1}
          />
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderPill}>
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.centeredBox}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="wallet-outline" size={44} color={colors.nileBlue} />
            </View>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptySubtitle}>
              Start earning coins by shopping!
            </Text>
            <Pressable
              style={styles.exploreBtn}
              accessibilityRole="button"
              accessibilityLabel="Explore stores"
              onPress={() => router.push('/explore' as unknown)}
            >
              <Text style={styles.exploreBtnText}>Explore Stores</Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.nileBlue} />
              <Text style={styles.loadingText}>Loading more…</Text>
            </View>
          ) : null
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.nileBlue}
            colors={[colors.nileBlue]}
            progressBackgroundColor="#fff"
          />
        }
        style={styles.list}
        contentContainerStyle={transactions.length === 0 ? styles.emptyListContent : undefined}
        stickySectionHeadersEnabled
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Tabs sub-component
// ---------------------------------------------------------------------------
function _Tabs({
  activeTab,
  onPress,
}: {
  activeTab: TabId;
  onPress: (id: TabId) => void;
}) {
  return (
    <View style={styles.tabsContainer}>
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <Pressable
            key={tab.id}
            style={[styles.tab, isActive ? styles.tabActive : null]}
            onPress={() => onPress(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            {isActive ? (
              <LinearGradient
                colors={['#1a3a52', '#2A5577']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.tabActiveGradient}
              >
                <Text style={[styles.tabText, styles.tabTextActive]}>{tab.label}</Text>
              </LinearGradient>
            ) : (
              <Text style={styles.tabText}>{tab.label}</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background.secondary,
    borderRadius: 0,
    marginHorizontal: 0,
    marginTop: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: themeColors.background.primary,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: themeColors.text.primary,
    letterSpacing: -0.3,
  },
  viewAllLink: {
    fontSize: 13,
    color: themeColors.nileBlue,
    fontWeight: '700',
  },
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: themeColors.background.primary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: themeColors.border.light,
  },
  tab: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: themeColors.neutral[100],
    borderWidth: 1,
    borderColor: themeColors.border.light,
  },
  tabActive: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  tabActiveGradient: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: themeColors.text.secondary,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  tabTextActive: {
    color: themeColors.text.inverse,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  // Section header
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    backgroundColor: themeColors.background.secondary,
  },
  sectionHeaderPill: {
    alignSelf: 'flex-start',
    backgroundColor: themeColors.neutral[200],
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: themeColors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  // Transaction card
  txnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: themeColors.background.primary,
    gap: 16,
  },
  txnCardBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: themeColors.neutral[100],
  },
  txnCardPressed: {
    backgroundColor: themeColors.background.secondary,
  },
  txnIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  txnBody: {
    flex: 1,
    gap: 2,
  },
  txnLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: themeColors.text.primary,
    letterSpacing: -0.1,
  },
  txnSubtitle: {
    fontSize: 12,
    color: themeColors.text.secondary,
    fontWeight: '500',
  },
  txnDate: {
    fontSize: 11,
    color: themeColors.text.tertiary,
    fontWeight: '400',
    marginTop: 1,
  },
  txnRight: {
    alignItems: 'flex-end',
    gap: 5,
  },
  txnAmount: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  // List states
  list: {
    flex: 1,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  centeredBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 56,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: themeColors.tint.slate,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: themeColors.text.primary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 13,
    color: themeColors.text.secondary,
    textAlign: 'center',
    lineHeight: 19,
    fontWeight: '500',
  },
  exploreBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: themeColors.nileBlue,
    borderRadius: 50,
    shadowColor: themeColors.nileBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  exploreBtnText: {
    color: themeColors.text.inverse,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  errorIconWrap: {
    marginBottom: 4,
  },
  loadingText: {
    fontSize: 13,
    color: themeColors.text.secondary,
    marginTop: 8,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 13,
    color: themeColors.error,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 28,
    paddingVertical: 11,
    backgroundColor: themeColors.nileBlue,
    borderRadius: 50,
  },
  retryBtnText: {
    color: themeColors.text.inverse,
    fontWeight: '700',
    fontSize: 14,
  },
  footerLoader: {
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
});

export default React.memo(TransactionHistory);

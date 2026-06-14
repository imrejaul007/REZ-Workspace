import { withErrorBoundary } from '@/utils/withErrorBoundary';
// Check-in History Screen — Sprint 11
// Timeline of QR check-in cashback transactions, grouped by date

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  StatusBar,
  Platform,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import EmptyState from '@/components/ui/EmptyState';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import apiClient from '@/services/apiClient';
import { useIsMounted } from '@/hooks/useIsMounted';

// ============================================================================
// TYPES
// ============================================================================

interface CheckInTransaction {
  _id: string;
  type: 'earned' | 'redeemed' | 'expired';
  description: string;
  amount: number;
  storeName?: string;
  source?: string;
  createdAt: string;
  metadata?: {
    storeId?: string;
    storeName?: string;
    streak?: number;
  };
}

interface GroupedSection {
  title: string;
  data: CheckInTransaction[];
  isConsecutive?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const dDay = d.toDateString();
  if (dDay === today.toDateString()) return 'Today';
  if (dDay === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function groupByDate(transactions: CheckInTransaction[]): GroupedSection[] {
  const map = new Map<string, CheckInTransaction[]>();
  for (const tx of transactions) {
    const label = getDayLabel(tx.createdAt);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(tx);
  }

  const sections: GroupedSection[] = [];
  let prevDateKey: string | null = null;

  map.forEach((data, title) => {
    // Detect if this date is consecutive with previous (for streak indicator)
    let isConsecutive = false;
    if (
      prevDateKey !== null &&
      prevDateKey !== 'Today' &&
      prevDateKey !== 'Yesterday' &&
      title !== 'Today' &&
      title !== 'Yesterday'
    ) {
      try {
        const prev = new Date(data[0].createdAt);
        prev.setDate(prev.getDate() + 1);
        isConsecutive =
          prev.toDateString() === new Date(sections[sections.length - 1].data[0].createdAt).toDateString();
      } catch {
        isConsecutive = false;
      }
    }
    prevDateKey = title;
    sections.push({ title, data, isConsecutive });
  });

  return sections;
}

// ============================================================================
// ITEM COMPONENTS
// ============================================================================

function SectionHeader({ title, isConsecutive }: { title: string; isConsecutive: boolean }) {
  return (
    <View style={styles.sectionHeader}>
      <ThemedText style={styles.sectionHeaderText}>{title}</ThemedText>
      {isConsecutive && (
        <View style={styles.streakBadge}>
          <ThemedText style={styles.streakEmoji}>🔥</ThemedText>
          <ThemedText style={styles.streakBadgeText}>Streak</ThemedText>
        </View>
      )}
    </View>
  );
}

function CheckInRow({ item, isLast, onPress }: { item: CheckInTransaction; isLast: boolean; onPress: () => void }) {
  const storeName = item.metadata?.storeName ?? item.storeName ?? item.description ?? 'Store Visit';
  const coins = item.amount;

  return (
    <Pressable style={styles.timelineItem} onPress={onPress} accessibilityRole="button">
      {/* Left timeline line + dot */}
      <View style={styles.timelineLeft}>
        <View style={styles.timelineDot} />
        {!isLast && <View style={styles.timelineLine} />}
      </View>

      {/* Content */}
      <View style={styles.timelineContent}>
        <View style={styles.timelineRow}>
          <View style={styles.timelineTextGroup}>
            <ThemedText style={styles.storeName} numberOfLines={1}>
              {storeName}
            </ThemedText>
            <ThemedText style={styles.timeText}>{formatTime(item.createdAt)}</ThemedText>
          </View>
          <View style={styles.coinsContainer}>
            <ThemedText style={styles.coinsText}>+{coins} coins</ThemedText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ============================================================================
// FLAT LIST ITEM TYPE
// ============================================================================

type ListItem =
  | { type: 'header'; title: string; isConsecutive: boolean }
  | { type: 'row'; tx: CheckInTransaction; isLast: boolean };

// ============================================================================
// SCREEN
// ============================================================================

const PAGE_LIMIT = 30;

function CheckInHistoryScreen() {
  const router = useRouter();
  const isMounted = useIsMounted();

  const [transactions, setTransactions] = useState<CheckInTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cursorRef = useRef<string | undefined>(undefined);

  const fetchTransactions = useCallback(
    async (reset: boolean) => {
      if (!reset && (!hasMore || loadingMore)) return;
      if (reset) {
        cursorRef.current = undefined;
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        const params: Record<string, string | number> = {
          source: 'cashback',
          limit: PAGE_LIMIT,
        };
        if (!reset && cursorRef.current) {
          params.cursor = cursorRef.current;
        }

        const res = await apiClient.get<unknown>('/user/transactions', params);

        if (!isMounted()) return;

        const newTxs: CheckInTransaction[] = res.data?.transactions ?? res.data ?? [];
        cursorRef.current = res.data?.cursor ?? undefined;
        setHasMore(!!res.data?.hasMore);

        setTransactions((prev) => (reset ? newTxs : [...prev, ...newTxs]));
      } catch (err) {
        if (isMounted()) setError('Could not load check-in history. Pull to retry.');
      } finally {
        if (!isMounted()) return;
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [hasMore, loadingMore, isMounted],
  );

  // Initial load
  React.useEffect(() => {
    fetchTransactions(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setHasMore(true);
    fetchTransactions(true);
  }, [fetchTransactions]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchTransactions(false);
    }
  }, [fetchTransactions, loadingMore, hasMore]);

  const handleRowPress = (tx: CheckInTransaction) => {
    const storeId = tx.metadata?.storeId;
    if (storeId) {
      router.push(`/store-detail?storeId=${storeId}` as unknown as string);
    }
  };

  // Build flat list items
  const grouped = groupByDate(transactions);
  const listItems: ListItem[] = [];
  for (const section of grouped) {
    listItems.push({ type: 'header', title: section.title, isConsecutive: !!section.isConsecutive });
    section.data.forEach((tx, i) => {
      listItems.push({ type: 'row', tx, isLast: i === section.data.length - 1 });
    });
  }

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'header') {
      return <SectionHeader title={item.title} isConsecutive={item.isConsecutive} />;
    }
    return <CheckInRow item={item.tx} isLast={item.isLast} onPress={() => handleRowPress(item.tx)} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary[400]} translucent={false} />

      {/* Header */}
      <LinearGradient colors={[colors.primary[300], colors.primary[400]]} style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable
            style={styles.backButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <View style={styles.headerTextContainer}>
            <ThemedText style={styles.headerTitle}>Check-in History</ThemedText>
            {!loading && (
              <ThemedText style={styles.headerSubtitle}>
                {transactions.length} total check-in{transactions.length !== 1 ? 's' : ''}
              </ThemedText>
            )}
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[300]} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <Pressable style={styles.retryButton} onPress={handleRefresh}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </Pressable>
        </View>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon="🏪"
          title="No check-ins yet"
          subtitle="Visit a REZ store and scan the QR code to earn coins!"
        />
      ) : (
        <FlatList
          data={listItems}
          keyExtractor={(item, index) =>
            item.type === 'header' ? `header-${item.title}` : `row-${item.tx._id}-${index}`
          }
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary[300]}
              colors={[colors.primary[300]]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary[300]} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 20 : 0,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorText: {
    ...Typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary[300],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h3,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    ...Typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 120,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  sectionHeaderText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3CC',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  streakEmoji: {
    fontSize: 12,
  },
  streakBadgeText: {
    ...Typography.caption,
    color: Colors.gold,
    fontWeight: '700',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  timelineLeft: {
    width: 20,
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary[300],
    marginTop: Spacing.base,
    zIndex: 1,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border.default,
    marginTop: 2,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineTextGroup: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  storeName: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  timeText: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
  },
  coinsContainer: {
    backgroundColor: '#F0FFF4',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  coinsText: {
    ...Typography.body,
    fontWeight: '700',
    color: '#16A34A',
  },
  footerLoader: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
});

export default withErrorBoundary(CheckInHistoryScreen, 'CheckInHistory');

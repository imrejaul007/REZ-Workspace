// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
// Order History Page
// Displays user's order history with server-side filtering, search, and pagination.
// Tab 1: regular delivery/store orders.  Tab 2: REZ Now web orders.

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  FlatList,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { platformAlertSimple } from '@/utils/platformAlert';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import OrderHistoryItem from '@/components/order/OrderHistoryItem';
import OrderFilterModal from '@/components/order/OrderFilterModal';
import { useOrderHistory, OrderFilterParams } from '@/hooks/useOrderHistory';
import { OrderFilter } from '@/types/order';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';
import { getWebOrderHistory, WebOrderHistoryItem } from '@/services/webOrderApi';

const { width } = Dimensions.get('window');

type HistoryTab = 'orders' | 'web_orders';

/** Status chip colours for REZ Now order statuses */
function webOrderStatusColor(status: string): { bg: string; text: string } {
  switch (status.toLowerCase()) {
    case 'pending':
      return { bg: '#FFF7ED', text: '#C2410C' };
    case 'confirmed':
    case 'preparing':
      return { bg: '#EFF6FF', text: '#1D4ED8' };
    case 'ready':
      return { bg: '#F0FDF4', text: '#15803D' };
    case 'delivered':
    case 'completed':
      return { bg: '#F0FDF4', text: '#166534' };
    case 'cancelled':
      return { bg: '#FEF2F2', text: '#B91C1C' };
    default:
      return { bg: colors.background.secondary, text: colors.text.secondary };
  }
}

function formatWebOrderDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Row component for a single REZ Now web order */
const WebOrderRow = ({
  item,
  onPress,
}: {
  item: WebOrderHistoryItem;
  onPress: (item: WebOrderHistoryItem) => void;
}) => {
  const chipColors = webOrderStatusColor(item.status);
  const itemSummary = item.items
    .slice(0, 2)
    .map((i) => `${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ''}`)
    .join(', ')
    .concat(item.items.length > 2 ? ` +${item.items.length - 2} more` : '');

  return (
    <Pressable
      style={webOrderStyles.row}
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`REZ Now order from ${item.storeName}`}
    >
      <View style={webOrderStyles.rowLeft}>
        <Text style={webOrderStyles.storeName} numberOfLines={1}>
          {item.storeName}
        </Text>
        <Text style={webOrderStyles.itemsSummary} numberOfLines={1}>
          {itemSummary}
        </Text>
        <Text style={webOrderStyles.dateText}>{formatWebOrderDate(item.createdAt)}</Text>
      </View>
      <View style={webOrderStyles.rowRight}>
        <Text style={webOrderStyles.totalText}>
          {'\u20B9'}
          {item.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        <View style={[webOrderStyles.statusChip, { backgroundColor: chipColors.bg }]}>
          <Text style={[webOrderStyles.statusChipText, { color: chipColors.text }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase()}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const webOrderStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  rowLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  storeName: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  itemsSummary: {
    ...Typography.body,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  dateText: {
    ...Typography.caption,
    color: colors.text.tertiary,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  totalText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: colors.text.primary,
  },
  statusChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusChipText: {
    ...Typography.caption,
    fontWeight: '600',
  },
});

// Skeleton loader for order cards
const OrderSkeleton = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonHeader}>
      <View>
        <View style={[styles.skeletonBox, { width: 140, height: 16 }]} />
        <View style={[styles.skeletonBox, { width: 90, height: 14, marginTop: Spacing.xs }]} />
      </View>
      <View style={[styles.skeletonBox, { width: 80, height: 24, borderRadius: BorderRadius.md }]} />
    </View>
    <View style={styles.skeletonItemRow}>
      <View style={[styles.skeletonBox, { width: 50, height: 50, borderRadius: BorderRadius.sm }]} />
      <View style={{ flex: 1, marginLeft: Spacing.md }}>
        <View style={[styles.skeletonBox, { width: '70%', height: 14 }]} />
        <View style={[styles.skeletonBox, { width: 40, height: 12, marginTop: Spacing.xs }]} />
      </View>
      <View style={[styles.skeletonBox, { width: 70, height: 14 }]} />
    </View>
    <View style={[styles.skeletonFooter]}>
      <View style={[styles.skeletonBox, { width: 100, height: 16 }]} />
      <View style={[styles.skeletonBox, { width: 90, height: 28, borderRadius: 6 }]} />
    </View>
  </View>
);

function dateRangeToISO(dateRange: string): { dateFrom?: string; dateTo?: string } {
  if (!dateRange || dateRange === 'all') return {};
  const now = new Date();
  let start: Date;
  switch (dateRange) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      return {};
  }
  return { dateFrom: start.toISOString(), dateTo: now.toISOString() };
}

function OrderHistoryPage() {
  const isMounted = useIsMounted();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<HistoryTab>('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<OrderFilter>({
    status: 'all',
    dateRange: 'all',
    sortBy: 'newest',
  });
  const [refreshing, setRefreshing] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // REZ Now web orders state
  const [webOrders, setWebOrders] = useState<WebOrderHistoryItem[]>([]);
  const [webOrdersLoading, setWebOrdersLoading] = useState(false);
  const [webOrdersHasNext, setWebOrdersHasNext] = useState(false);
  const [webOrdersPage, setWebOrdersPage] = useState(1);
  const [webOrdersRefreshing, setWebOrdersRefreshing] = useState(false);

  const { orders, isLoading, error, hasMore, loadMore, refresh } = useOrderHistory();

  const buildServerFilter = useCallback((filter: OrderFilter, search?: string): OrderFilterParams => {
    const dates = dateRangeToISO(filter.dateRange);
    return {
      status: filter.status !== 'all' ? filter.status : undefined,
      search: search?.trim() || undefined,
      dateFrom: dates.dateFrom,
      dateTo: dates.dateTo,
      sort: filter.sortBy as OrderFilterParams['sort'],
    };
  }, []);

  // Fetch REZ Now web orders
  const fetchWebOrders = useCallback(
    async (page: number, reset: boolean) => {
      if (reset) {
        setWebOrdersLoading(true);
      }
      try {
        const result = await getWebOrderHistory(page);
        if (!isMounted()) return;
        if (reset) {
          setWebOrders(result.orders);
        } else {
          setWebOrders((prev) => [...prev, ...result.orders]);
        }
        setWebOrdersHasNext(result.hasNext);
        setWebOrdersPage(page);
      } catch {
        // silently keep existing data
      } finally {
        if (!isMounted()) return;
        setWebOrdersLoading(false);
        setWebOrdersRefreshing(false);
      }
    },
    [isMounted],
  );

  // Load web orders when tab becomes active (lazy — only fetch on first switch)
  const webOrdersFetchedRef = useRef(false);
  useEffect(() => {
    if (activeTab === 'web_orders' && !webOrdersFetchedRef.current) {
      webOrdersFetchedRef.current = true;
      fetchWebOrders(1, true);
    }
  }, [activeTab, fetchWebOrders]);

  const handleWebOrdersRefresh = useCallback(() => {
    setWebOrdersRefreshing(true);
    webOrdersFetchedRef.current = true;
    fetchWebOrders(1, true);
  }, [fetchWebOrders]);

  const handleWebOrdersLoadMore = useCallback(() => {
    if (webOrdersHasNext && !webOrdersLoading) {
      fetchWebOrders(webOrdersPage + 1, false);
    }
  }, [webOrdersHasNext, webOrdersLoading, webOrdersPage, fetchWebOrders]);

  const handleWebOrderPress = useCallback((item: WebOrderHistoryItem) => {
    // Open the order detail in the REZ Now in-app browser
    const url = `https://now.rez.money/${item.storeSlug}/order/${item.orderNumber}`;
    import('expo-web-browser')
      .then(({ openBrowserAsync }) => {
        openBrowserAsync(url).catch(() => {});
      })
      .catch(() => {});
  }, []);

  const handleBackPress = useCallback(() => {
    // eslint-disable-next-line no-unused-expressions
    router.canGoBack() ? router.back() : router.replace('/(tabs)');
  }, [router]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh(buildServerFilter(selectedFilter, searchQuery));
    } catch (err) {
      platformAlertSimple('Error', 'Failed to refresh orders');
    } finally {
      if (!isMounted()) return;
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh, selectedFilter, searchQuery, buildServerFilter]);

  const handleOrderPress = useCallback(
    (order) => {
      const orderId = order.id || order._id;
      router.push(`/tracking/${orderId}` as unknown as string);
    },
    [router],
  );

  const handleReorder = useCallback(
    (orderId: string) => {
      // Navigate to tracking page with reorder intent — the tracking page has reorder functionality
      router.push(`/tracking/${orderId}` as unknown as string);
    },
    [router],
  );

  const handleTrack = useCallback(
    (orderId: string) => {
      router.push(`/tracking/${orderId}` as unknown as string);
    },
    [router],
  );

  const handleFilterApply = useCallback(
    (filter: OrderFilter) => {
      setSelectedFilter(filter);
      setShowFilterModal(false);
      refresh(buildServerFilter(filter, searchQuery));
    },
    [refresh, searchQuery, buildServerFilter],
  );

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      // Debounce server search by 400ms
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        refresh(buildServerFilter(selectedFilter, text));
      }, 400);
    },
    [refresh, selectedFilter, buildServerFilter],
  );

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      loadMore();
    }
  }, [hasMore, isLoading, loadMore]);

  const renderOrderItem = useCallback(
    ({ item }: { item: unknown }) => (
      <OrderHistoryItem
        order={item}
        onPress={() => handleOrderPress(item)}
        onReorder={handleReorder}
        onTrack={handleTrack}
      />
    ),
    [handleOrderPress, handleReorder, handleTrack],
  );

  const renderEmptyState = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={80} color={colors.neutral[200]} />
        <ThemedText style={styles.emptyTitle}>No Orders Found</ThemedText>
        <ThemedText style={styles.emptyDescription}>
          {searchQuery.trim() ? 'No orders match your search criteria' : "You haven't placed unknown orders yet"}
        </ThemedText>
        {!searchQuery.trim() && selectedFilter.status === 'all' && (
          <Pressable
            style={styles.shopButton}
            onPress={() => router.push('/(tabs)')}
            accessibilityLabel="Start shopping"
            accessibilityRole="button"
          >
            <ThemedText style={styles.shopButtonText}>Start Shopping</ThemedText>
          </Pressable>
        )}
      </View>
    );
  };

  const renderFooter = () => {
    if (!isLoading || !hasMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={colors.nileBlue} />
        <ThemedText style={styles.loadingText}>Loading more orders...</ThemedText>
      </View>
    );
  };

  const renderSkeletons = () => (
    <View style={styles.listContainer}>
      {[0, 1, 2, 3].map((i) => (
        <OrderSkeleton key={i} />
      ))}
    </View>
  );

  if (error && !orders.length) {
    return (
      <ThemedView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.nileBlue} />
        <LinearGradient colors={[colors.nileBlue, colors.brand.nileBlueLight]} style={styles.headerBg}>
          <View style={styles.headerContainer}>
            <Pressable
              style={styles.backButton}
              onPress={handleBackPress}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
            </Pressable>
            <ThemedText style={styles.headerTitle}>Order History</ThemedText>
            <View style={styles.headerRight} />
          </View>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <ThemedText style={styles.errorTitle}>Unable to load orders</ThemedText>
          <ThemedText style={styles.errorDetails}>{error}</ThemedText>
          <Pressable
            style={styles.retryButton}
            onPress={handleRefresh}
            accessibilityLabel="Try again"
            accessibilityRole="button"
          >
            <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.nileBlue} />

        {/* Header */}
        <LinearGradient colors={[colors.nileBlue, colors.brand.nileBlueLight]} style={styles.headerBg}>
          <View style={styles.headerContainer}>
            <Pressable
              style={styles.backButton}
              onPress={handleBackPress}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
            </Pressable>
            <ThemedText style={styles.headerTitle}>Order History</ThemedText>
            {activeTab === 'orders' ? (
              <Pressable
                style={styles.filterButton}
                onPress={() => setShowFilterModal(true)}
                accessibilityLabel="Open filter options"
                accessibilityRole="button"
              >
                <Ionicons name="filter-outline" size={24} color={colors.text.inverse} />
              </Pressable>
            ) : (
              <View style={styles.headerRight} />
            )}
          </View>
        </LinearGradient>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tabItem, activeTab === 'orders' && styles.tabItemActive]}
            onPress={() => setActiveTab('orders')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'orders' }}
          >
            <Text style={[styles.tabItemText, activeTab === 'orders' && styles.tabItemTextActive]}>Store Orders</Text>
          </Pressable>
          <Pressable
            style={[styles.tabItem, activeTab === 'web_orders' && styles.tabItemActive]}
            onPress={() => setActiveTab('web_orders')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'web_orders' }}
          >
            <Text style={[styles.tabItemText, activeTab === 'web_orders' && styles.tabItemTextActive]}>REZ Now</Text>
          </Pressable>
        </View>

        {activeTab === 'orders' ? (
          <>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={20} color={colors.text.tertiary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  placeholderTextColor={colors.neutral[400]}
                  accessibilityLabel="Search orders"
                  accessibilityHint="Enter order number, product name, or store name"
                />
                {searchQuery.length > 0 && (
                  <Pressable
                    onPress={() => handleSearchChange('')}
                    accessibilityLabel="Clear search"
                    accessibilityRole="button"
                  >
                    <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Skeleton or Orders List */}
            {isLoading && orders.length === 0 ? (
              renderSkeletons()
            ) : (
              <FlashList
                data={orders}
                keyExtractor={(item) => item.id || item._id || item.orderNumber}
                renderItem={renderOrderItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                estimatedItemSize={120}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor={colors.nileBlue}
                    colors={[colors.nileBlue]}
                  />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.1}
                ListEmptyComponent={renderEmptyState}
                ListFooterComponent={renderFooter}
              />
            )}
          </>
        ) : /* REZ Now web orders list */
        webOrdersLoading && webOrders.length === 0 ? (
          renderSkeletons()
        ) : (
          <FlatList
            data={webOrders}
            keyExtractor={(item) => item.orderNumber}
            renderItem={({ item }) => <WebOrderRow item={item} onPress={handleWebOrderPress} />}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={webOrdersRefreshing}
                onRefresh={handleWebOrdersRefresh}
                tintColor={colors.nileBlue}
                colors={[colors.nileBlue]}
              />
            }
            onEndReached={handleWebOrdersLoadMore}
            onEndReachedThreshold={0.1}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="fast-food-outline" size={80} color={colors.neutral[200]} />
                <ThemedText style={styles.emptyTitle}>No REZ Now Orders</ThemedText>
                <ThemedText style={styles.emptyDescription}>
                  Your REZ Now food and delivery orders will appear here
                </ThemedText>
              </View>
            }
            ListFooterComponent={
              webOrdersLoading && webOrders.length > 0 ? (
                <View style={styles.loadingFooter}>
                  <ActivityIndicator size="small" color={colors.nileBlue} />
                </View>
              ) : null
            }
          />
        )}

        {/* Filter Modal (only relevant for store orders tab) */}
        <OrderFilterModal
          visible={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          onApply={handleFilterApply}
          currentFilter={selectedFilter}
        />
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  headerBg: {
    paddingTop: StatusBar.currentHeight || 50,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    color: colors.text.inverse,
    ...Typography.h3,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  filterButton: {
    padding: Spacing.sm,
  },
  headerRight: {
    width: 40,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border?.default ?? '#E2E8F0',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.nileBlue,
  },
  tabItemText: {
    ...Typography.bodyLarge,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
  tabItemTextActive: {
    fontWeight: '700',
    color: colors.nileBlue,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    backgroundColor: colors.background.primary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.md,
    ...Typography.bodyLarge,
    color: colors.text.primary,
  },
  listContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  // Skeleton styles
  skeletonCard: {
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  skeletonItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  skeletonBox: {
    backgroundColor: colors.neutral[200],
    borderRadius: 4,
    height: 14,
  } as unknown,
  // Empty & Error states
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    ...Typography.h3,
    fontWeight: 'bold',
    color: colors.text.secondary,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    ...Typography.bodyLarge,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: 40,
  },
  shopButton: {
    backgroundColor: colors.nileBlue,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  shopButtonText: {
    color: colors.text.inverse,
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  loadingText: {
    marginLeft: Spacing.sm,
    color: colors.text.tertiary,
    ...Typography.body,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  errorTitle: {
    ...Typography.h4,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  errorDetails: {
    ...Typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  retryButton: {
    backgroundColor: colors.nileBlue,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: colors.text.inverse,
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
});

export default withErrorBoundary(OrderHistoryPage, 'OrderHistory');

/**
 * Aggregator Order Inbox
 *
 * Displays incoming orders from food aggregator platforms (Swiggy, Zomato, Dunzo, ONDC).
 * Merchants can accept, prepare, mark ready, and cancel orders directly from this screen.
 *
 * Route: /(dashboard)/aggregator-orders
 * Accessible from: Integrations screen → "View Orders" button
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { platformAlertSimple, platformAlertDestructive } from '@/utils/platformAlert';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useStore } from '@/contexts/StoreContext';
import { apiClient } from '@/services/api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = 'all' | 'swiggy' | 'zomato' | 'dunzo' | 'ondc';
type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'delivered'
  | 'cancelled';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface AggregatorOrder {
  id: string;
  platform: 'swiggy' | 'zomato' | 'dunzo' | 'ondc';
  orderNumber: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  customerName?: string;
  deliveryAddress?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> =
  {
    swiggy: { label: 'Swiggy', color: '#FC8019', bg: '#FFF3E0', icon: 'bicycle' },
    zomato: { label: 'Zomato', color: '#E23744', bg: '#FEECEE', icon: 'restaurant' },
    dunzo: { label: 'Dunzo', color: '#00D290', bg: '#E6FFF7', icon: 'flash' },
    ondc: { label: 'ONDC', color: '#3F51B5', bg: '#E8EAF6', icon: 'globe' },
  };

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; icon: string }
> = {
  pending: { label: 'New', color: '#F59E0B', bg: '#FEF3C7', icon: 'time-outline' },
  accepted: {
    label: 'Accepted',
    color: '#7C3AED',
    bg: '#F5F3FF',
    icon: 'checkmark-circle-outline',
  },
  preparing: { label: 'Preparing', color: '#2563EB', bg: '#EFF6FF', icon: 'flame-outline' },
  ready: { label: 'Ready', color: '#059669', bg: '#ECFDF5', icon: 'bag-check-outline' },
  picked_up: { label: 'Picked Up', color: '#0891B2', bg: '#ECFEFF', icon: 'car-outline' },
  delivered: {
    label: 'Delivered',
    color: '#16A34A',
    bg: '#F0FDF4',
    icon: 'checkmark-done-outline',
  },
  cancelled: { label: 'Cancelled', color: '#DC2626', bg: '#FEF2F2', icon: 'close-circle-outline' },
};

// Next status transitions a merchant can trigger
const NEXT_ACTIONS: Partial<
  Record<OrderStatus, { label: string; nextStatus: OrderStatus; icon: string; color: string }>
> = {
  pending: {
    label: 'Accept Order',
    nextStatus: 'accepted',
    icon: 'checkmark-circle',
    color: '#7C3AED',
  },
  accepted: { label: 'Start Preparing', nextStatus: 'preparing', icon: 'flame', color: '#2563EB' },
  preparing: { label: 'Mark Ready', nextStatus: 'ready', icon: 'bag-check', color: '#059669' },
  ready: { label: 'Mark Picked Up', nextStatus: 'picked_up', icon: 'car', color: '#0891B2' },
};

const PLATFORM_TABS: { id: Platform; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'swiggy', label: 'Swiggy' },
  { id: 'zomato', label: 'Zomato' },
  { id: 'dunzo', label: 'Dunzo' },
  { id: 'ondc', label: 'ONDC' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(isoString: string): string {
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────

function OrderDetailModal({
  order,
  visible,
  onClose,
  onAction,
  actionLoading,
}: {
  order: AggregatorOrder | null;
  visible: boolean;
  onClose: () => void;
  onAction: (order: AggregatorOrder, nextStatus: OrderStatus) => void;
  actionLoading: boolean;
}) {
  if (!order) return null;

  const platform = PLATFORM_CONFIG[order.platform];
  const statusConf = STATUS_CONFIG[order.status];
  const nextAction = NEXT_ACTIONS[order.status];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={modalStyles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
            <Ionicons name="close" size={22} color="#374151" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={modalStyles.headerTitle}>Order #{order.orderNumber}</Text>
            <Text style={modalStyles.headerSub}>
              {platform.label} · {timeAgo(order.createdAt)}
            </Text>
          </View>
          <View style={[modalStyles.statusChip, { backgroundColor: statusConf.bg }]}>
            <Ionicons name={statusConf.icon as unknown as keyof typeof Ionicons.glyphMap} size={13} color={statusConf.color} />
            <Text style={[modalStyles.statusLabel, { color: statusConf.color }]}>
              {statusConf.label}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={modalStyles.body}>
          {/* Platform badge */}
          <View style={[modalStyles.platformBanner, { backgroundColor: platform.bg }]}>
            <Ionicons name={platform.icon as unknown as keyof typeof Ionicons.glyphMap} size={20} color={platform.color} />
            <Text style={[modalStyles.platformName, { color: platform.color }]}>
              {platform.label} Order
            </Text>
          </View>

          {/* Customer info */}
          {(order.customerName || order.deliveryAddress) && (
            <View style={modalStyles.section}>
              <Text style={modalStyles.sectionTitle}>Delivery Details</Text>
              {order.customerName && (
                <View style={modalStyles.detailRow}>
                  <Ionicons name="person-outline" size={15} color="#6B7280" />
                  <Text style={modalStyles.detailText}>{order.customerName}</Text>
                </View>
              )}
              {order.deliveryAddress && (
                <View style={modalStyles.detailRow}>
                  <Ionicons name="location-outline" size={15} color="#6B7280" />
                  <Text style={modalStyles.detailText}>{order.deliveryAddress}</Text>
                </View>
              )}
            </View>
          )}

          {/* Items */}
          <View style={modalStyles.section}>
            <Text style={modalStyles.sectionTitle}>Order Items</Text>
            {order.items.map((item, idx) => (
              <View key={idx} style={modalStyles.itemRow}>
                <View style={modalStyles.itemQtyBox}>
                  <Text style={modalStyles.itemQty}>{item.quantity}×</Text>
                </View>
                <Text style={modalStyles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={modalStyles.itemPrice}>
                  {formatCurrency(item.price * item.quantity)}
                </Text>
              </View>
            ))}
            <View style={modalStyles.divider} />
            <View style={modalStyles.totalRow}>
              <Text style={modalStyles.totalLabel}>Total</Text>
              <Text style={modalStyles.totalAmount}>{formatCurrency(order.total)}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={modalStyles.footer}>
          {order.status !== 'cancelled' &&
            order.status !== 'delivered' &&
            order.status !== 'picked_up' && (
              <TouchableOpacity
                style={modalStyles.cancelBtn}
                onPress={() => onAction(order, 'cancelled')}
                disabled={actionLoading}
              >
                <Text style={modalStyles.cancelBtnText}>Cancel Order</Text>
              </TouchableOpacity>
            )}
          {nextAction && (
            <TouchableOpacity
              style={[
                modalStyles.actionBtn,
                { backgroundColor: nextAction.color, opacity: actionLoading ? 0.7 : 1 },
              ]}
              onPress={() => onAction(order, nextAction.nextStatus)}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name={nextAction.icon as unknown as keyof typeof Ionicons.glyphMap} size={18} color="#fff" />
                  <Text style={modalStyles.actionBtnText}>{nextAction.label}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({
  order,
  onPress,
  index,
}: {
  order: AggregatorOrder;
  onPress: () => void;
  index: number;
}) {
  const platform = PLATFORM_CONFIG[order.platform];
  const statusConf = STATUS_CONFIG[order.status];
  const isPending = order.status === 'pending';

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <TouchableOpacity
        style={[styles.card, isPending && styles.cardPending]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {/* Left accent bar for pending orders */}
        {isPending && <View style={styles.pendingAccent} />}

        <View style={styles.cardTop}>
          {/* Platform badge */}
          <View style={[styles.platformBadge, { backgroundColor: platform.bg }]}>
            <Ionicons name={platform.icon as unknown as keyof typeof Ionicons.glyphMap} size={14} color={platform.color} />
            <Text style={[styles.platformLabel, { color: platform.color }]}>{platform.label}</Text>
          </View>

          {/* Status chip */}
          <View style={[styles.statusChip, { backgroundColor: statusConf.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusConf.color }]} />
            <Text style={[styles.statusText, { color: statusConf.color }]}>{statusConf.label}</Text>
          </View>
        </View>

        <View style={styles.cardMid}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
            <Text style={styles.itemsSummary} numberOfLines={1}>
              {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
            </Text>
          </View>
          <View style={styles.amountBlock}>
            <Text style={styles.amount}>{formatCurrency(order.total)}</Text>
            <Text style={styles.timeAgo}>{timeAgo(order.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <Text style={styles.itemCount}>
            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
          </Text>
          {isPending && (
            <View style={styles.actionHint}>
              <Text style={styles.actionHintText}>Tap to accept</Text>
              <Ionicons name="chevron-forward" size={14} color="#7C3AED" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AggregatorOrdersScreen() {
  const router = useRouter();
  const { activeStore } = useStore();
  const storeId = activeStore?._id;

  const [orders, setOrders] = useState<AggregatorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [platform, setPlatform] = useState<Platform>('all');
  const [selectedOrder, setSelectedOrder] = useState<AggregatorOrder | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const isMountedRef = useRef(true);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchOrders = useCallback(
    async (isRefresh = false, loadPage = 1) => {
      if (!storeId) {
        setLoading(false);
        return;
      }
      try {
        isRefresh ? setRefreshing(true) : setLoading(true);
        const platformParam = platform === 'all' ? '' : `&platform=${platform}`;
        const res = await apiClient.get<{ orders: AggregatorOrder[]; totalPages: number }>(
          `merchant/integrations/aggregator/orders?storeId=${storeId}&page=${loadPage}${platformParam}`
        );
        if (!isMountedRef.current) return;
        if (res.success && res.data) {
          const newOrders = res.data.orders ?? [];
          setOrders(isRefresh || loadPage === 1 ? newOrders : (prev) => [...prev, ...newOrders]);
          setHasMore(loadPage < (res.data.totalPages ?? 1));
          setPage(loadPage);
        }
      } catch {
        // silently handle
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [storeId, platform]
  );

  useFocusEffect(
    useCallback(() => {
      fetchOrders(true, 1);
    }, [fetchOrders])
  );

  // Re-fetch when platform filter changes
  React.useEffect(() => {
    fetchOrders(true, 1);
  }, [platform]);

  const handleStatusUpdate = useCallback(
    async (order: AggregatorOrder, nextStatus: OrderStatus) => {
      const isCancellation = nextStatus === 'cancelled';
      if (isCancellation) {
        platformAlertDestructive(
          'Cancel Order',
          `Cancel order #${order.orderNumber}? This cannot be undone.`,
          () => doStatusUpdate(order, nextStatus),
          'Cancel Order',
          'Keep Order'
        );
        return;
      }
      doStatusUpdate(order, nextStatus);
    },
    []
  );

  const doStatusUpdate = async (order: AggregatorOrder, nextStatus: OrderStatus) => {
    setActionLoading(true);
    try {
      const res = await apiClient.patch(
        `merchant/integrations/aggregator/orders/${order.id}/status`,
        { status: nextStatus }
      );
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? { ...o, status: nextStatus } : o))
        );
        if (selectedOrder?.id === order.id) {
          setSelectedOrder((prev) => (prev ? { ...prev, status: nextStatus } : prev));
        }
        if (nextStatus === 'cancelled' || nextStatus === 'delivered') {
          setSelectedOrder(null);
        }
      } else {
        platformAlertSimple('Error', res.message || 'Failed to update order status');
      }
    } catch {
      platformAlertSimple('Error', 'Failed to update order status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredOrders = orders; // API already filters by platform

  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name="receipt-outline" size={52} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No orders yet</Text>
      <Text style={styles.emptySub}>
        {platform === 'all'
          ? 'Orders from connected aggregators will appear here.'
          : `No orders from ${PLATFORM_CONFIG[platform]?.label ?? platform}.`}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <TouchableOpacity style={styles.loadMore} onPress={() => fetchOrders(false, page + 1)}>
        <Text style={styles.loadMoreText}>Load more</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={['#7C3AED', '#6366F1']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Aggregator Orders</Text>
          <Text style={styles.headerSub}>
            {pendingCount > 0
              ? `${pendingCount} new order${pendingCount !== 1 ? 's' : ''} waiting`
              : 'All caught up'}
          </Text>
        </View>
        {pendingCount > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Platform filter tabs */}
      <View style={styles.tabBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {PLATFORM_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, platform === tab.id && styles.tabActive]}
              onPress={() => setPlatform(tab.id)}
            >
              <Text style={[styles.tabText, platform === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Order list */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <OrderCard order={item} index={index} onPress={() => setSelectedOrder(item)} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchOrders(true, 1)}
              tintColor="#7C3AED"
            />
          }
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Order detail modal */}
      <OrderDetailModal
        order={selectedOrder}
        visible={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onAction={handleStatusUpdate}
        actionLoading={actionLoading}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 20, gap: 12 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  pendingBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    minWidth: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  pendingBadgeText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // Tab bar
  tabBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tabScroll: { paddingHorizontal: 12, gap: 8, paddingVertical: 10 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  tabActive: { backgroundColor: '#7C3AED' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#fff' },

  // List
  listContent: { padding: 12, paddingBottom: 32 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: 'hidden',
  },
  cardPending: { borderColor: '#7C3AED', borderWidth: 1.5 },
  pendingAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#F59E0B',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  platformLabel: { fontSize: 11, fontWeight: '700' },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardMid: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  orderNumber: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 3 },
  itemsSummary: { fontSize: 12, color: '#6B7280' },
  amountBlock: { alignItems: 'flex-end' },
  amount: { fontSize: 16, fontWeight: '800', color: '#111827' },
  timeAgo: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemCount: { fontSize: 11, color: '#9CA3AF' },
  actionHint: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionHintText: { fontSize: 12, color: '#7C3AED', fontWeight: '600' },

  // Empty
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', maxWidth: 260, lineHeight: 20 },

  // Load more
  loadMore: {
    margin: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
  },
  loadMoreText: { color: '#7C3AED', fontWeight: '600', fontSize: 14 },
});

const modalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  headerSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  statusLabel: { fontSize: 11, fontWeight: '700' },
  body: { padding: 16, paddingBottom: 8 },
  platformBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  platformName: { fontSize: 14, fontWeight: '700' },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  detailText: { fontSize: 14, color: '#374151', flex: 1 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  itemQtyBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  itemQty: { fontSize: 12, fontWeight: '700', color: '#374151' },
  itemName: { flex: 1, fontSize: 14, color: '#111827' },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#374151' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  totalAmount: { fontSize: 18, fontWeight: '800', color: '#111827' },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    alignItems: 'center',
  },
  cancelBtnText: { color: '#DC2626', fontWeight: '700', fontSize: 14 },
  actionBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

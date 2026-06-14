/**
 * WebOrdersScreen — Dedicated tab screen for REZ Now web orders.
 *
 * Fetches GET /api/web-ordering/orders?storeSlug={slug}&status=pending,confirmed,preparing,ready&limit=30
 * on mount and every 30 seconds. Merchants can advance each order through:
 *   pending → confirmed → preparing → ready → completed
 * via PATCH /api/web-ordering/order/:orderNumber/status.
 *
 * Also listens to `web-order:status-update` socket events for real-time pushes.
 */

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/DesignTokens';
import { apiClient } from '@/services/api/client';
import { useSocket } from '@/contexts/SocketContext';
import { useStore } from '@/contexts/StoreContext';
import { logger } from '@/utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

type WebOrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed';

interface WebOrderItem {
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface WebOrder {
  _id: string;
  orderNumber: string;
  status: WebOrderStatus;
  customerName: string;
  customerPhone?: string;
  tableNumber?: string;
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  items: WebOrderItem[];
  totalAmount: number;
  createdAt: string;
  createdAtMs: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<WebOrderStatus, string> = {
  pending: 'PENDING',
  confirmed: 'CONFIRMED',
  preparing: 'PREPARING',
  ready: 'READY',
  completed: 'COMPLETED',
};

const STATUS_COLOR: Record<WebOrderStatus, string> = {
  pending: Colors.error[500],
  confirmed: Colors.primary[500],
  preparing: Colors.warning[500],
  ready: Colors.success[600],
  completed: Colors.success[700],
};

/** Which statuses can be advanced, and what they advance to */
const NEXT_STATUS: Partial<Record<WebOrderStatus, WebOrderStatus>> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'completed',
};

const NEXT_ACTION_LABEL: Partial<Record<WebOrderStatus, string>> = {
  pending: 'CONFIRM ORDER',
  confirmed: 'START COOKING',
  preparing: 'MARK READY',
  ready: 'MARK COMPLETED',
};

const ORDER_TYPE_LABEL: Record<string, string> = {
  dine_in: 'DINE-IN',
  takeaway: 'TAKEAWAY',
  delivery: 'DELIVERY',
};

const ORDER_TYPE_COLOR: Record<string, string> = {
  dine_in: Colors.primary[500],
  takeaway: Colors.warning[600],
  delivery: Colors.success[600],
};

/** Statuses to fetch — active orders needing merchant attention */
const FETCH_STATUS = 'pending,confirmed,preparing,ready';
const POLL_INTERVAL_MS = 30_000;
const FETCH_LIMIT = 30;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_RANK: Record<WebOrderStatus, number> = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  ready: 3,
  completed: 4,
};

function normalizeWebOrder(raw): WebOrder {
  return {
    _id: raw._id || raw.id,
    orderNumber: raw.orderNumber || String(raw._id).slice(-6).toUpperCase(),
    status: raw.status ?? 'pending',
    customerName: raw.customerName || raw.customer?.name || 'Guest',
    customerPhone: raw.customerPhone || raw.customer?.phone,
    tableNumber: raw.tableNumber || raw.diningDetails?.tableNumber,
    orderType: raw.orderType ?? 'takeaway',
    items: (raw.items || []).map((item) => ({
      name: item.name || item.productName || 'Item',
      quantity: item.quantity ?? 1,
      price: item.price ?? item.unitPrice ?? 0,
      notes: item.notes || item.specialInstructions,
    })),
    totalAmount: raw.totalAmount ?? raw.total ?? 0,
    createdAt: raw.createdAt,
    createdAtMs: raw.createdAt ? new Date(raw.createdAt).getTime() : Date.now(),
  };
}

/** Returns a human-readable elapsed time string e.g. "5m ago", "2h ago" */
function formatElapsed(createdAtMs: number): string {
  const diffMs = Date.now() - createdAtMs;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/** Truncate item names list for preview */
function formatItemsSummary(items: WebOrderItem[]): string {
  if (items.length === 0) return 'No items';
  const names = items.map((i) => `${i.quantity}x ${i.name}`);
  if (names.length <= 2) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
}

// ─── WebOrderCard ─────────────────────────────────────────────────────────────

interface WebOrderCardProps {
  order: WebOrder;
  onAdvance: (order: WebOrder) => void;
  advancing: boolean;
}

const WebOrderCard = React.memo(({ order, onAdvance, advancing }: WebOrderCardProps) => {
  const nextStatus = NEXT_STATUS[order.status];
  const orderTypeColor = ORDER_TYPE_COLOR[order.orderType] ?? Colors.gray[500];
  const orderTypeLabel = ORDER_TYPE_LABEL[order.orderType] ?? 'ORDER';
  const elapsed = formatElapsed(order.createdAtMs);
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const itemsSummary = formatItemsSummary(order.items);

  return (
    <View style={[styles.card, { borderLeftColor: STATUS_COLOR[order.status] }]}>
      {/* Header row: order number, elapsed, total */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <Text style={styles.elapsed}>{elapsed}</Text>
        </View>
        <Text style={styles.totalAmount}>
          {'\u20B9'}
          {order.totalAmount.toFixed(0)}
        </Text>
      </View>

      {/* Badges: order type + status */}
      <View style={styles.badgeRow}>
        <View style={[styles.badge, { backgroundColor: orderTypeColor }]}>
          <Text style={styles.badgeText}>{orderTypeLabel}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: STATUS_COLOR[order.status] }]}>
          <Text style={styles.badgeText}>{STATUS_LABEL[order.status]}</Text>
        </View>
      </View>

      {/* Customer + table */}
      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={13} color={Colors.text.secondary} />
          <Text style={styles.detailText}>{order.customerName}</Text>
        </View>
        {order.tableNumber ? (
          <View style={styles.detailRow}>
            <Ionicons name="grid-outline" size={13} color={Colors.text.secondary} />
            <Text style={styles.detailText}>Table {order.tableNumber}</Text>
          </View>
        ) : null}
      </View>

      {/* Items summary */}
      <View style={styles.itemsSummary}>
        <Text style={styles.itemCount}>
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </Text>
        <Text style={styles.itemNames} numberOfLines={1}>
          {itemsSummary}
        </Text>
      </View>

      {/* Action button */}
      {nextStatus ? (
        <TouchableOpacity
          style={[
            styles.actionBtn,
            { backgroundColor: STATUS_COLOR[nextStatus] },
            advancing && styles.actionBtnDisabled,
          ]}
          onPress={() => onAdvance(order)}
          disabled={advancing}
          accessibilityRole="button"
          accessibilityLabel={`${NEXT_ACTION_LABEL[order.status]} for order ${order.orderNumber}`}
        >
          {advancing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.actionBtnText}>{NEXT_ACTION_LABEL[order.status]}</Text>
          )}
        </TouchableOpacity>
      ) : (
        <View style={[styles.actionBtn, { backgroundColor: Colors.success[700] }]}>
          <Ionicons name="checkmark-circle" size={16} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.actionBtnText}>ORDER COMPLETE</Text>
        </View>
      )}
    </View>
  );
});

WebOrderCard.displayName = 'WebOrderCard';

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function WebOrdersScreen() {
  const insets = useSafeAreaInsets();
  const { activeStore } = useStore();
  const { on, off } = useSocket();

  const storeSlug = activeStore?.slug ?? null;

  const [orders, setOrders] = useState<WebOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [advancingIds, setAdvancingIds] = useState<Set<string>>(new Set());
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Derived counts for badge ──────────────────────────────────────────────
  const attentionCount = useMemo(
    () => orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length,
    [orders]
  );

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchOrders = useCallback(
    async (isRefresh = false) => {
      if (!storeSlug) {
        setIsLoading(false);
        return;
      }
      try {
        if (isRefresh) setRefreshing(true);

        const res = await apiClient.get<unknown>(
          `web-ordering/orders?storeSlug=${storeSlug}&status=${FETCH_STATUS}&limit=${FETCH_LIMIT}`
        );
        const raw: unknown[] = res?.data?.orders ?? [];
        const normalized = raw.map(normalizeWebOrder).sort((a, b) => b.createdAtMs - a.createdAtMs); // most recent first

        setOrders((prev) => {
          const existingById = new Map(prev.map((o) => [o._id, o]));
          return normalized.map((incoming) => {
            const local = existingById.get(incoming._id);
            if (!local) return incoming;
            // Keep optimistic local status when it's ahead of server
            if (STATUS_RANK[local.status] > STATUS_RANK[incoming.status]) return local;
            return incoming;
          });
        });
      } catch (err) {
        if (__DEV__) logger.warn('[WebOrders] Poll failed', err);
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [storeSlug]
  );

  // ── Initial load + polling ────────────────────────────────────────────────

  useEffect(() => {
    setIsLoading(true);
    fetchOrders();

    pollIntervalRef.current = setInterval(() => fetchOrders(), POLL_INTERVAL_MS);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [fetchOrders]);

  // ── Real-time socket ──────────────────────────────────────────────────────

  useEffect(() => {
    const handleStatusUpdate = (data) => {
      if (__DEV__) logger.log('[WebOrders] web-order:status-update', data);

      const orderId: string = data._id || data.id || data.orderId;
      const newStatus: WebOrderStatus = data.status;

      if (!orderId || !newStatus) return;

      setOrders((prev) => {
        const exists = prev.some((o) => o._id === orderId);

        // New order arriving via socket
        if (!exists && newStatus !== 'completed' && data.orderNumber) {
          return [normalizeWebOrder(data), ...prev];
        }

        // Completed orders leave the active list
        if (newStatus === 'completed') {
          return prev.filter((o) => o._id !== orderId);
        }

        return prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o));
      });
    };

    on('web-order:status-update', handleStatusUpdate);
    return () => {
      off('web-order:status-update', handleStatusUpdate);
    };
  }, [on, off]);

  // ── Advance order status ──────────────────────────────────────────────────

  const handleAdvance = useCallback(async (order: WebOrder) => {
    const nextStatus = NEXT_STATUS[order.status];
    if (!nextStatus) return;

    // Optimistic update
    setAdvancingIds((prev) => new Set([...prev, order._id]));
    setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, status: nextStatus } : o)));

    try {
      await apiClient.patch(`web-ordering/order/${order.orderNumber}/status`, {
        status: nextStatus,
      });
      if (__DEV__) logger.log(`[WebOrders] ${order.orderNumber} → ${nextStatus}`);

      // Remove completed orders from the list after a brief delay
      if (nextStatus === 'completed') {
        setTimeout(() => {
          setOrders((prev) => prev.filter((o) => o._id !== order._id));
        }, 1200);
      }
    } catch (err) {
      // Revert on failure
      setOrders((prev) =>
        prev.map((o) => (o._id === order._id ? { ...o, status: order.status } : o))
      );
      if (__DEV__) logger.error('[WebOrders] Status update failed', { message: err?.message });
      Alert.alert('Update Failed', 'Could not update order status. Please try again.');
    } finally {
      setAdvancingIds((prev) => {
        const next = new Set(prev);
        next.delete(order._id);
        return next;
      });
    }
  }, []);

  // ── Pull-to-refresh ───────────────────────────────────────────────────────

  const handleRefresh = useCallback(() => {
    fetchOrders(true);
  }, [fetchOrders]);

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: WebOrder }) => (
      <WebOrderCard order={item} onAdvance={handleAdvance} advancing={advancingIds.has(item._id)} />
    ),
    [handleAdvance, advancingIds]
  );

  const keyExtractor = useCallback((item: WebOrder) => item._id, []);

  // ── Guard: no store configured ────────────────────────────────────────────

  if (!storeSlug && !isLoading) {
    return (
      <View style={[styles.centeredState, { paddingTop: insets.top }]}>
        <Ionicons name="globe-outline" size={48} color={Colors.text.tertiary} />
        <Text style={styles.emptyTitle}>No Store Selected</Text>
        <Text style={styles.emptySubtitle}>
          Select a store from the header to view REZ Now orders.
        </Text>
      </View>
    );
  }

  // ── Guard: loading ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={[styles.centeredState, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={styles.emptySubtitle}>Loading REZ Now orders...</Text>
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Screen sub-header */}
      <View style={styles.subHeader}>
        <View style={styles.subHeaderLeft}>
          <Ionicons name="globe" size={18} color={Colors.primary[500]} />
          <Text style={styles.subHeaderTitle}>REZ Now Web Orders</Text>
          {attentionCount > 0 && (
            <View style={styles.attentionBadge}>
              <Text style={styles.attentionBadgeText}>{attentionCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={handleRefresh}
          accessibilityRole="button"
          accessibilityLabel="Refresh orders"
        >
          <Ionicons
            name="refresh"
            size={20}
            color={refreshing ? Colors.text.tertiary : Colors.primary[500]}
          />
        </TouchableOpacity>
      </View>

      {/* Order list */}
      <FlatList
        data={orders}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, orders.length === 0 && styles.listContentEmpty]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary[500]}
            colors={[Colors.primary[500]]}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={56} color={Colors.success[500]} />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>No active REZ Now orders at the moment.</Text>
          </View>
        }
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[100] ?? '#F3F4F6',
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    backgroundColor: Colors.gray[100] ?? '#F3F4F6',
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light ?? '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  subHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  subHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  attentionBadge: {
    backgroundColor: Colors.error[500],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  attentionBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
  },
  refreshBtn: {
    padding: 6,
  },
  listContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  listContentEmpty: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text.tertiary ?? Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: 10,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.border.light ?? '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderLeft: {
    flex: 1,
    gap: 2,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  elapsed: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text.tertiary ?? Colors.text.secondary,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  cardDetails: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border.light ?? '#E5E7EB',
    paddingVertical: Spacing.xs,
    gap: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  itemsSummary: {
    gap: 2,
  },
  itemCount: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  itemNames: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  actionBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: Spacing.xs,
  },
  actionBtnDisabled: {
    opacity: 0.55,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});

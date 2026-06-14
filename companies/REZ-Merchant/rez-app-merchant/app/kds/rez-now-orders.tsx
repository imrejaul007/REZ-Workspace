/**
 * RezNowOrders — REZ Now web-order panel for the KDS screen.
 *
 * Displays pending web orders from /api/web-ordering/orders, polls every 30s
 * as a fallback, and listens to `web-order:status-update` socket events for
 * real-time pushes.  Merchants can advance each order through:
 *   pending → confirmed → preparing → ready
 * via PATCH /api/web-ordering/order/:orderNumber/status.
 *
 * This file is intentionally self-contained so kds/index.tsx stays readable.
 * It shares the existing socket connection via SocketContext.
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { logger } from '@/utils/logger';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/DesignTokens';
import { apiClient } from '@/services/api/client';
import { useSocket } from '@/contexts/SocketContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type WebOrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready';

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<WebOrderStatus, string> = {
  pending: 'PENDING',
  confirmed: 'CONFIRMED',
  preparing: 'PREPARING',
  ready: 'READY',
};

const STATUS_COLOR: Record<WebOrderStatus, string> = {
  pending: Colors.error[500],
  confirmed: Colors.primary[500],
  preparing: Colors.warning[500],
  ready: Colors.success[600],
};

const NEXT_STATUS: Partial<Record<WebOrderStatus, WebOrderStatus>> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
};

const NEXT_LABEL: Partial<Record<WebOrderStatus, string>> = {
  pending: 'CONFIRM ORDER',
  confirmed: 'START COOKING',
  preparing: 'MARK READY',
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

// ─── Sub-component: single order card ─────────────────────────────────────────

const WebOrderCard = React.memo(
  ({
    order,
    onAdvance,
    advancing,
  }: {
    order: WebOrder;
    onAdvance: (order: WebOrder) => void;
    advancing: boolean;
  }) => {
    const nextStatus = NEXT_STATUS[order.status];
    const orderTypeColor = ORDER_TYPE_COLOR[order.orderType] ?? Colors.gray[500];
    const orderTypeLabel = ORDER_TYPE_LABEL[order.orderType] ?? 'ORDER';

    return (
      <View style={[styles.card, { borderColor: STATUS_COLOR[order.status], borderLeftWidth: 4 }]}>
        {/* Card header */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderNumber}>WEB #{order.orderNumber}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: orderTypeColor }]}>
                <Text style={styles.badgeText}>{orderTypeLabel}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: STATUS_COLOR[order.status] }]}>
                <Text style={styles.badgeText}>{STATUS_LABEL[order.status]}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.totalAmount}>
            {'\u20B9'}
            {order.totalAmount.toFixed(2)}
          </Text>
        </View>

        {/* Customer + table */}
        <View style={styles.cardDetails}>
          <Text style={styles.detailText}>{order.customerName}</Text>
          {order.tableNumber ? (
            <Text style={styles.detailText}>TABLE {order.tableNumber}</Text>
          ) : null}
        </View>

        {/* Items */}
        <View style={styles.itemsList}>
          {order.items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemQty}>{item.quantity}x</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.notes ? <Text style={styles.itemNotes}>"{item.notes}"</Text> : null}
              </View>
              <Text style={styles.itemPrice}>
                {'\u20B9'}
                {(item.price * item.quantity).toFixed(0)}
              </Text>
            </View>
          ))}
        </View>

        {/* Action button — only show while the order is actionable */}
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
            accessibilityLabel={`${NEXT_LABEL[order.status]} for order ${order.orderNumber}`}
          >
            {advancing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.actionBtnText}>{NEXT_LABEL[order.status]}</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={[styles.actionBtn, { backgroundColor: Colors.success[600] }]}>
            <Text style={styles.actionBtnText}>READY FOR PICKUP</Text>
          </View>
        )}
      </View>
    );
  }
);

WebOrderCard.displayName = 'WebOrderCard';

// ─── Main exported component ───────────────────────────────────────────────────

interface RezNowOrdersProps {
  storeSlug: string | null;
}

export default function RezNowOrders({ storeSlug }: RezNowOrdersProps) {
  const [orders, setOrders] = useState<WebOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [advancingIds, setAdvancingIds] = useState<Set<string>>(new Set());
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { on, off } = useSocket();

  // ── Fetch web orders from the backend ───────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    if (!storeSlug) return;
    try {
      const res = await apiClient.get<unknown>(
        `web-ordering/orders?storeSlug=${storeSlug}&status=pending,confirmed,preparing&limit=20`
      );
      const raw: object[] = res?.data?.orders ?? (res as unknown as { orders?: object[] })?.orders ?? [];
      const normalized = raw.map(normalizeWebOrder);
      setOrders((prev) => {
        // Merge: server is authoritative for new orders; respect optimistic advances
        const existingById = new Map(prev.map((o) => [o._id, o]));
        return normalized.map((incoming: WebOrder) => {
          const local = existingById.get(incoming._id);
          if (!local) return incoming;
          // If local status is ahead of server (optimistic), keep local
          const STATUS_RANK: Record<WebOrderStatus, number> = {
            pending: 0,
            confirmed: 1,
            preparing: 2,
            ready: 3,
          };
          if (STATUS_RANK[local.status] > STATUS_RANK[incoming.status]) return local;
          return incoming;
        });
      });
    } catch (err) {
      logger.warn('[KDS:RezNow] Poll failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [storeSlug]);

  // ── Initial load + 30-second poll ───────────────────────────────────────────

  useEffect(() => {
    setIsLoading(true);
    fetchOrders();

    pollIntervalRef.current = setInterval(fetchOrders, 30000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [fetchOrders]);

  // ── Real-time socket listener ────────────────────────────────────────────────

  useEffect(() => {
    const handleStatusUpdate = (data) => {
      logger.debug('[KDS:RezNow] web-order:status-update', data);

      const orderId: string = data._id || data.id || data.orderId;
      const newStatus: WebOrderStatus = data.status;

      if (!orderId || !newStatus) return;

      setOrders((prev) => {
        const exists = prev.some((o) => o._id === orderId);
        if (!exists && newStatus !== 'ready') {
          // New order arriving via socket — add it if we have enough data
          if (data.orderNumber) {
            return [normalizeWebOrder(data), ...prev];
          }
          return prev;
        }

        // Filter out "ready" orders (they leave the KDS display)
        if (newStatus === 'ready') {
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

  // ── Advance order status ─────────────────────────────────────────────────────

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
      logger.debug(`[KDS:RezNow] ${order.orderNumber} → ${nextStatus}`);
    } catch (err) {
      // Revert on failure
      setOrders((prev) =>
        prev.map((o) => (o._id === order._id ? { ...o, status: order.status } : o))
      );
      logger.error('[KDS:RezNow] Status update failed:', err?.message);
      Alert.alert('Update Failed', 'Could not update web order status. Please try again.');
    } finally {
      setAdvancingIds((prev) => {
        const next = new Set(prev);
        next.delete(order._id);
        return next;
      });
    }
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────────

  if (!storeSlug) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="globe-outline" size={40} color={Colors.text.tertiary} />
        <Text style={styles.emptyText}>No store configured for REZ Now orders.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.emptyState}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={styles.emptyText}>Loading REZ Now orders...</Text>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="checkmark-circle" size={48} color={Colors.success[500]} />
        <Text style={styles.emptyText}>No active web orders</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {orders.map((order) => (
        <WebOrderCard
          key={order._id}
          order={order}
          onAdvance={handleAdvance}
          advancing={advancingIds.has(order._id)}
        />
      ))}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: 8,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
    // borderLeftWidth override is applied inline
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 4,
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
  totalAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  cardDetails: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border.light,
    paddingVertical: Spacing.xs,
    gap: 2,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  itemsList: {
    gap: Spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  itemQty: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
    minWidth: 28,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  itemNotes: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
    minWidth: 48,
    textAlign: 'right',
  },
  actionBtn: {
    paddingVertical: 11,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  actionBtnDisabled: {
    opacity: 0.6,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});

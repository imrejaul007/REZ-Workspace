import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { orderService, LiveOrder, OrderStatus } from '@/services/orderService';
import { showAlert } from '@/utils/alert';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';

// expo-haptics is available in package.json
let Haptics: {
  notificationAsync: (type) => Promise<void>;
  NotificationFeedbackType: { Success: unknown };
} | null = null;
try {
  Haptics = require('expo-haptics');
} catch {
  Haptics = null;
}

type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'dispatched'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

const STATUS_CONFIG: Partial<Record<OrderStatus, { label: string; bg: string; text: string }>> = {
  placed: { label: 'New Order', bg: '#FEF3C7', text: '#D97706' },
  confirmed: { label: 'Confirmed', bg: '#EFF6FF', text: '#3B82F6' },
  preparing: { label: 'Preparing', bg: '#F5F3FF', text: '#7C3AED' },
  ready: { label: 'Ready', bg: '#F0FDF4', text: '#16A34A' },
  dispatched: { label: 'Dispatched', bg: '#FFF7ED', text: '#EA580C' },
  out_for_delivery: { label: 'Out for Delivery', bg: '#FFF7ED', text: '#D97706' },
  delivered: { label: 'Delivered', bg: '#F3F4F6', text: '#6B7280' },
  cancelled: { label: 'Cancelled', bg: '#FEF2F2', text: '#DC2626' },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: '#F3F4F6', text: '#6B7280' };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

interface OrderDetailModalProps {
  order: LiveOrder | null;
  visible: boolean;
  onClose: () => void;
  onAcceptOrder: (id: string) => Promise<void>;
  onMarkReady: (id: string) => Promise<void>;
  acceptingOrder: boolean;
  markingReady: boolean;
}

function OrderDetailModal({
  order,
  visible,
  onClose,
  onAcceptOrder,
  onMarkReady,
  acceptingOrder,
  markingReady,
}: OrderDetailModalProps) {
  if (!order) return null;
  const canAccept = order.status === 'placed';
  const canMarkReady = order.status === 'confirmed' || order.status === 'preparing';
  const orderNumber = order.orderNumber || order.orderId?.slice(-6) || order._id?.slice(-6) || '';
  const customerName = order.customerName || order.customer?.name || 'Customer';
  const customerPhone = order.customerPhone || order.customer?.phone;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Order #{orderNumber.toUpperCase()}</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Ionicons name="close" size={22} color={Colors.light.textHeading} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>Customer</Text>
            <Text style={styles.modalValue}>{customerName}</Text>
            {customerPhone ? (
              <Text style={styles.modalSubValue}>{customerPhone}</Text>
            ) : null}
          </View>

          {order.specialInstructions ? (
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Special Instructions</Text>
              <View style={styles.instructionsBox}>
                <Text style={styles.instructionsText}>{order.specialInstructions}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>Items ({order.items.length})</Text>
            {order.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemName}>
                  {item.quantity}x {item.name}
                </Text>
                <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(0)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>₹{order.totalAmount.toFixed(0)}</Text>
            </View>
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>Status</Text>
            <StatusBadge status={order.status} />
          </View>
        </ScrollView>

        {(canAccept || canMarkReady) && (
          <View style={styles.modalFooter}>
            {canAccept && (
              <TouchableOpacity
                style={styles.acceptOrderBtn}
                onPress={() => onAcceptOrder(order._id)}
                disabled={acceptingOrder}
                activeOpacity={0.8}
              >
                {acceptingOrder ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done-circle" size={20} color="#fff" />
                    <Text style={styles.markReadyText}>Accept Order</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            {canMarkReady && (
              <TouchableOpacity
                style={[styles.markReadyBtn, canAccept && { marginTop: 10 }]}
                onPress={() => onMarkReady(order._id)}
                disabled={markingReady}
                activeOpacity={0.8}
              >
                {markingReady ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.markReadyText}>Mark Ready</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

export default function LiveOrdersScreen() {
  const router = useRouter();
  const { merchant } = useAuth();
  const merchantId = merchant?.id || '';
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LiveOrder | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [markingReady, setMarkingReady] = useState(false);
  const [acceptingOrder, setAcceptingOrder] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const prevOrderIds = useRef<Set<string>>(new Set());

  const fetchOrders = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      // Use orderService to fetch from real order service
      const fetched = await orderService.getActiveOrders(merchantId, 50);

      // Detect new orders for haptic feedback
      const newIds = fetched.map((o) => o._id);
      const hasNew = newIds.some((id) => !prevOrderIds.current.has(id));
      if (hasNew && prevOrderIds.current.size > 0 && Haptics) {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          // haptics unavailable — skip
        }
      }
      prevOrderIds.current = new Set(newIds);
      setOrders(fetched);
    } catch (error) {
      // silent — interval-based polling should not spam error alerts
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [merchantId]);

  useEffect(() => {
    fetchOrders();
    // Polling interval - shorter when WebSocket is disconnected
    const interval = setInterval(() => fetchOrders(), wsConnected ? 30000 : 5000);
    return () => clearInterval(interval);
  }, [fetchOrders, wsConnected]);

  // Connect to order service WebSocket for real-time updates
  useEffect(() => {
    const connectWebSocket = () => {
      orderService.connectWebSocket({
        merchantId,
        onConnect: () => {
          setWsConnected(true);
        },
        onDisconnect: () => {
          setWsConnected(false);
        },
        onNewOrder: (order) => {
          // Haptic feedback for incoming order
          if (Haptics) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch((e) => console.warn('[LiveOrders] Haptic feedback failed:', e));
          }
          showAlert('New Order', `Order #${order.orderId.slice(-6).toUpperCase()} received!`);
          // Add new order to the list
          setOrders((prev) => {
            // Avoid duplicates
            if (prev.some((o) => o._id === order._id)) {
              return prev.map((o) => (o._id === order._id ? order : o));
            }
            return [order, ...prev];
          });
        },
        onOrderUpdated: (order) => {
          setOrders((prev) =>
            prev.map((o) => (o._id === order._id ? order : o))
          );
          if (selectedOrder?._id === order._id) {
            setSelectedOrder(order);
          }
        },
        onOrderCancelled: (orderId) => {
          setOrders((prev) => prev.filter((o) => o._id !== orderId));
          if (selectedOrder?._id === orderId) {
            setSelectedOrder(null);
            setModalVisible(false);
          }
        },
        onOrderStatusChanged: (orderId, status) => {
          setOrders((prev) =>
            prev.map((o) => (o._id === orderId ? { ...o, status } : o))
          );
          if (selectedOrder?._id === orderId) {
            setSelectedOrder((prev) => (prev ? { ...prev, status } : prev));
          }
        },
        onError: (error) => {
          console.error('[LiveOrders] WebSocket error:', error);
        },
        maxReconnectAttempts: 5,
        reconnectInterval: 5000,
      });
    };

    connectWebSocket();

    return () => {
      orderService.disconnectWebSocket();
    };
  }, [merchantId]);

  const handleAcceptOrder = async (id: string) => {
    setAcceptingOrder(true);
    try {
      const updatedOrder = await orderService.acceptOrder(id, 'Order accepted by merchant');
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status: 'confirmed' as OrderStatus } : o))
      );
      if (selectedOrder?._id === id) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: 'confirmed' } : prev));
      }
      if (Haptics) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch((e) => console.warn('[LiveOrders] Haptic feedback failed:', e));
      }
    } catch (error) {
      showAlert('Error', error.message || 'Could not accept order. Please try again.');
    } finally {
      setAcceptingOrder(false);
    }
  };

  const handleMarkReady = async (id: string) => {
    setMarkingReady(true);
    try {
      const updatedOrder = await orderService.markOrderReady(id, 'Order ready for pickup');
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status: 'ready' as OrderStatus } : o))
      );
      if (selectedOrder?._id === id) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: 'ready' } : prev));
      }
    } catch (error) {
      showAlert('Error', error.message || 'Could not update order status. Please try again.');
    } finally {
      setMarkingReady(false);
    }
  };

  const openOrder = (order: LiveOrder) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: LiveOrder }) => {
    const canAccept = item.status === 'placed';
    const canMarkReady = item.status === 'confirmed' || item.status === 'preparing';
    const customerName = item.customerName || item.customer?.name || 'Customer';
    const orderNumber = item.orderNumber || item.orderId?.slice(-6) || item._id?.slice(-6) || '';

    return (
      <TouchableOpacity style={styles.card} onPress={() => openOrder(item)} activeOpacity={0.7}>
        <View style={styles.cardTop}>
          <Text style={styles.orderId}>#{orderNumber.toUpperCase()}</Text>
          <StatusBadge status={item.status} />
        </View>
        <Text style={styles.customerName}>{customerName}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.metaText}>
            {item.items.length} {item.items.length === 1 ? 'item' : 'items'}
          </Text>
          <Text style={styles.metaSep}>·</Text>
          <Text style={styles.metaAmount}>₹{item.totalAmount.toFixed(0)}</Text>
        </View>
        {canAccept && (
          <TouchableOpacity
            style={styles.inlineAcceptBtn}
            onPress={() => handleAcceptOrder(item._id)}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-done-circle-outline" size={16} color="#D97706" />
            <Text style={styles.inlineAcceptText}>Accept Order</Text>
          </TouchableOpacity>
        )}
        {canMarkReady && (
          <TouchableOpacity
            style={styles.inlineReadyBtn}
            onPress={() => handleMarkReady(item._id)}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#16A34A" />
            <Text style={styles.inlineReadyText}>Mark Ready</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1a3a52', '#2d5a7b']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Orders</Text>
        <View style={styles.liveIndicator}>
          <View style={[styles.liveDot, wsConnected ? styles.liveDotConnected : styles.liveDotDisconnected]} />
          <Text style={styles.liveText}>{wsConnected ? 'LIVE' : 'OFFLINE'}</Text>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2d5a7b" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, orders.length === 0 && styles.listEmpty]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders(true)} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={Colors.light.textMuted} />
              <Text style={styles.emptyText}>No active orders</Text>
            </View>
          }
        />
      )}

      <OrderDetailModal
        order={selectedOrder}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAcceptOrder={handleAcceptOrder}
        onMarkReady={handleMarkReady}
        acceptingOrder={acceptingOrder}
        markingReady={markingReady}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight ?? 40) + 10,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  liveDotConnected: {
    backgroundColor: '#4ADE80',
  },
  liveDotDisconnected: {
    backgroundColor: '#F87171',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  listEmpty: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.textMuted,
    fontWeight: '500',
  },

  // Order card
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 6,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.textHeading,
    letterSpacing: 0.5,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: Colors.light.textMuted,
  },
  metaSep: {
    fontSize: 13,
    color: Colors.light.textMuted,
  },
  metaAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  inlineAcceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  inlineAcceptText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  inlineReadyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  inlineReadyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  acceptOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D97706',
    borderRadius: 14,
    paddingVertical: 14,
  },

  // Status badge
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.card,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.light.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    gap: 20,
  },
  modalSection: {
    gap: 6,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  modalSubValue: {
    fontSize: 14,
    color: Colors.light.textMuted,
  },
  instructionsBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.backgroundTertiary,
  },
  itemName: {
    fontSize: 14,
    color: Colors.light.textHeading,
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  totalAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  modalFooter: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  markReadyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 14,
  },
  markReadyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

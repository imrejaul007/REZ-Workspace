// OrderTracker Component
// Real-time order tracking and management

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Order, OrderStatus } from '../types/api';

interface OrderTrackerProps {
  onOrderUpdate?: (orderId: string, status: OrderStatus) => void;
}

// Order status configuration
const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bgColor: string; step: number }> = {
  placed: { label: 'Placed', color: '#6366F1', bgColor: '#EEF2FF', step: 0 },
  confirmed: { label: 'Confirmed', color: '#8B5CF6', bgColor: '#F3E8FF', step: 1 },
  preparing: { label: 'Preparing', color: '#F59E0B', bgColor: '#FEF3C7', step: 2 },
  ready: { label: 'Ready', color: '#10B981', bgColor: '#D1FAE5', step: 3 },
  dispatched: { label: 'Dispatched', color: '#06B6D4', bgColor: '#CFFAFE', step: 4 },
  out_for_delivery: { label: 'Out for Delivery', color: '#3B82F6', bgColor: '#DBEAFE', step: 5 },
  delivered: { label: 'Delivered', color: '#10B981', bgColor: '#D1FAE5', step: 6 },
  cancelling: { label: 'Cancelling', color: '#F59E0B', bgColor: '#FEF3C7', step: -1 },
  cancelled: { label: 'Cancelled', color: '#EF4444', bgColor: '#FEE2E2', step: -1 },
  returned: { label: 'Returned', color: '#8B5CF6', bgColor: '#F3E8FF', step: -1 },
  refunded: { label: 'Refunded', color: '#6B7280', bgColor: '#F3F4F6', step: -1 },
  failed_delivery: { label: 'Failed Delivery', color: '#EF4444', bgColor: '#FEE2E2', step: -1 },
  return_requested: { label: 'Return Requested', color: '#F59E0B', bgColor: '#FEF3C7', step: -1 },
  return_rejected: { label: 'Return Rejected', color: '#EF4444', bgColor: '#FEE2E2', step: -1 },
};

// Mock orders for development
const MOCK_ORDERS: Order[] = [
  {
    id: 'order_001',
    orderNumber: 'ORD-2024-001',
    customer: {
      id: 'cust_001',
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      phone: '+91 98765 43210',
    },
    items: [
      { productId: 'prod_001', productName: 'Butter Chicken', quantity: 2, price: 250, total: 500 },
      { productId: 'prod_002', productName: 'Naan (4 pcs)', quantity: 2, price: 60, total: 120 },
    ],
    status: 'preparing',
    paymentStatus: 'completed',
    totals: {
      subtotal: 620,
      tax: 62,
      delivery: 0,
      discount: 62,
      cashback: 31,
      total: 620,
      platformFee: 31,
      merchantPayout: 589,
    },
    payment: { method: 'upi', status: 'completed', transactionId: 'TXN123456' },
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    notes: 'Extra spicy please',
  },
  {
    id: 'order_002',
    orderNumber: 'ORD-2024-002',
    customer: {
      id: 'cust_002',
      name: 'Priya Patel',
      email: 'priya@example.com',
      phone: '+91 98765 43211',
    },
    items: [
      { productId: 'prod_003', productName: 'Paneer Tikka', quantity: 1, price: 280, total: 280 },
      { productId: 'prod_004', productName: 'Garlic Naan', quantity: 2, price: 80, total: 160 },
      { productId: 'prod_005', productName: 'Lassi', quantity: 2, price: 80, total: 160 },
    ],
    status: 'confirmed',
    paymentStatus: 'completed',
    totals: {
      subtotal: 600,
      tax: 60,
      delivery: 40,
      discount: 0,
      cashback: 30,
      total: 640,
      platformFee: 32,
      merchantPayout: 608,
    },
    payment: { method: 'card', status: 'completed', transactionId: 'TXN123457' },
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
  {
    id: 'order_003',
    orderNumber: 'ORD-2024-003',
    customer: {
      id: 'cust_003',
      name: 'Amit Kumar',
      email: 'amit@example.com',
      phone: '+91 98765 43212',
    },
    items: [
      { productId: 'prod_006', productName: 'Biryani Full', quantity: 1, price: 350, total: 350 },
      { productId: 'prod_007', productName: 'Raita', quantity: 2, price: 50, total: 100 },
    ],
    status: 'ready',
    paymentStatus: 'completed',
    totals: {
      subtotal: 450,
      tax: 45,
      delivery: 30,
      discount: 45,
      cashback: 22,
      total: 450,
      platformFee: 22,
      merchantPayout: 428,
    },
    payment: { method: 'wallet', status: 'completed', transactionId: 'TXN123458' },
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: 'order_004',
    orderNumber: 'ORD-2024-004',
    customer: {
      id: 'cust_004',
      name: 'Sneha Reddy',
      email: 'sneha@example.com',
      phone: '+91 98765 43213',
    },
    items: [
      { productId: 'prod_008', productName: 'Masala Dosa', quantity: 2, price: 150, total: 300 },
      { productId: 'prod_009', productName: 'Coffee', quantity: 2, price: 80, total: 160 },
    ],
    status: 'placed',
    paymentStatus: 'pending',
    totals: {
      subtotal: 460,
      tax: 46,
      delivery: 0,
      discount: 0,
      cashback: 23,
      total: 506,
      platformFee: 25,
      merchantPayout: 481,
    },
    payment: { method: 'upi', status: 'pending' },
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: 'order_005',
    orderNumber: 'ORD-2024-005',
    customer: {
      id: 'cust_005',
      name: 'Vikram Singh',
      email: 'vikram@example.com',
      phone: '+91 98765 43214',
    },
    items: [
      { productId: 'prod_010', productName: 'Tandoori Chicken', quantity: 1, price: 380, total: 380 },
      { productId: 'prod_011', productName: 'Rumali Roti', quantity: 4, price: 30, total: 120 },
    ],
    status: 'delivered',
    paymentStatus: 'completed',
    totals: {
      subtotal: 500,
      tax: 50,
      delivery: 0,
      discount: 50,
      cashback: 25,
      total: 500,
      platformFee: 25,
      merchantPayout: 475,
    },
    payment: { method: 'card', status: 'completed', transactionId: 'TXN123459' },
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    deliveredAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
];

export function OrderTracker({ onOrderUpdate }: OrderTrackerProps): React.JSX.Element {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 500));
      setOrders(MOCK_ORDERS);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
  }, [fetchOrders]);

  const handleOrderPress = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    Alert.alert(
      'Update Order Status',
      `Change order status to "${ORDER_STATUS_CONFIG[newStatus].label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            // Simulate API call
            setOrders(prev =>
              prev.map(o =>
                o.id === orderId
                  ? { ...o, status: newStatus, updatedAt: new Date().toISOString() }
                  : o
              )
            );
            setShowDetailModal(false);
            onOrderUpdate?.(orderId, newStatus);
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getNextStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
    const statusOrder: OrderStatus[] = [
      'placed',
      'confirmed',
      'preparing',
      'ready',
      'dispatched',
      'out_for_delivery',
      'delivered',
    ];
    const currentIndex = statusOrder.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex >= statusOrder.length - 1) return [];
    return [statusOrder[currentIndex + 1]];
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const activeOrders = orders.filter(o =>
    ['placed', 'confirmed', 'preparing', 'ready', 'dispatched', 'out_for_delivery'].includes(o.status)
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Orders</Text>
          <Text style={styles.headerSubtitle}>{activeOrders.length} active orders</Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: '#6366F1' }]}>
          <Text style={styles.statValue}>{orders.filter(o => o.status === 'placed').length}</Text>
          <Text style={styles.statLabel}>New</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
          <Text style={styles.statValue}>{orders.filter(o => o.status === 'preparing').length}</Text>
          <Text style={styles.statLabel}>Preparing</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
          <Text style={styles.statValue}>{orders.filter(o => o.status === 'ready').length}</Text>
          <Text style={styles.statLabel}>Ready</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#3B82F6' }]}>
          <Text style={styles.statValue}>{orders.filter(o => o.status === 'out_for_delivery').length}</Text>
          <Text style={styles.statLabel}>Delivery</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by order # or customer..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterPill, filterStatus === 'all' && styles.filterPillActive]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[styles.filterPillText, filterStatus === 'all' && styles.filterPillTextActive]}>
            All ({orders.length})
          </Text>
        </TouchableOpacity>
        {(['placed', 'confirmed', 'preparing', 'ready', 'delivered'] as OrderStatus[]).map(status => {
          const count = orders.filter(o => o.status === status).length;
          if (count === 0) return null;
          return (
            <TouchableOpacity
              key={status}
              style={[styles.filterPill, filterStatus === status && styles.filterPillActive]}
              onPress={() => setFilterStatus(status)}
            >
              <Text style={[styles.filterPillText, filterStatus === status && styles.filterPillTextActive]}>
                {ORDER_STATUS_CONFIG[status].label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Order List */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptySubtitle}>
              {filterStatus === 'all' ? 'New orders will appear here' : 'No orders with this status'}
            </Text>
          </View>
        ) : (
          filteredOrders.map(order => {
            const statusConfig = ORDER_STATUS_CONFIG[order.status];
            const nextStatuses = getNextStatuses(order.status);
            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => handleOrderPress(order)}
                activeOpacity={0.7}
              >
                <View style={styles.orderCardHeader}>
                  <View>
                    <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                    <Text style={styles.orderCustomer}>{order.customer.name}</Text>
                  </View>
                  <View style={[styles.orderStatus, { backgroundColor: statusConfig.bgColor }]}>
                    <Text style={[styles.orderStatusText, { color: statusConfig.color }]}>
                      {statusConfig.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderItems}>
                  {order.items.slice(0, 3).map((item, index) => (
                    <Text key={index} style={styles.orderItem} numberOfLines={1}>
                      {item.quantity}x {item.productName}
                    </Text>
                  ))}
                  {order.items.length > 3 && (
                    <Text style={styles.orderMoreItems}>
                      +{order.items.length - 3} more items
                    </Text>
                  )}
                </View>

                <View style={styles.orderCardFooter}>
                  <Text style={styles.orderTotal}>{formatCurrency(order.totals?.total || 0)}</Text>
                  <Text style={styles.orderTime}>{formatTimeAgo(order.createdAt)}</Text>
                </View>

                {nextStatuses.length > 0 && order.status !== 'cancelling' && (
                  <TouchableOpacity
                    style={styles.quickActionButton}
                    onPress={() => handleStatusUpdate(order.id, nextStatuses[0])}
                  >
                    <Text style={styles.quickActionText}>
                      Mark as {ORDER_STATUS_CONFIG[nextStatuses[0]].label}
                    </Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Order Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <>
                {/* Customer Info */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Customer</Text>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{selectedOrder.customer.name}</Text>
                    <Text style={styles.customerContact}>{selectedOrder.customer.phone}</Text>
                  </View>
                </View>

                {/* Order Progress */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Order Progress</Text>
                  <View style={styles.progressTracker}>
                    {['placed', 'confirmed', 'preparing', 'ready', 'delivered'].map((status, index) => {
                      const isActive =
                        ['placed', 'confirmed', 'preparing', 'ready', 'delivered'].indexOf(
                          selectedOrder.status
                        ) >= index;
                      const isCurrent = selectedOrder.status === status;
                      const config = ORDER_STATUS_CONFIG[status as OrderStatus];
                      return (
                        <View key={status} style={styles.progressStep}>
                          <View
                            style={[
                              styles.progressDot,
                              {
                                backgroundColor: isActive ? config.color : '#E5E7EB',
                                borderColor: isActive ? config.color : '#E5E7EB',
                              },
                            ]}
                          >
                            {isCurrent && <View style={styles.progressDotInner} />}
                          </View>
                          <Text
                            style={[
                              styles.progressLabel,
                              { color: isActive ? config.color : '#9CA3AF' },
                            ]}
                          >
                            {config.label}
                          </Text>
                          {index < 4 && (
                            <View
                              style={[
                                styles.progressLine,
                                { backgroundColor: isActive ? config.color : '#E5E7EB' },
                              ]}
                            />
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Order Items */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Items</Text>
                  {selectedOrder.items.map((item, index) => (
                    <View key={index} style={styles.orderItemRow}>
                      <View style={styles.orderItemInfo}>
                        <Text style={styles.orderItemQuantity}>{item.quantity}x</Text>
                        <Text style={styles.orderItemName}>{item.productName}</Text>
                      </View>
                      <Text style={styles.orderItemPrice}>{formatCurrency(item.total || 0)}</Text>
                    </View>
                  ))}
                </View>

                {/* Order Summary */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Summary</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(selectedOrder.totals?.subtotal || 0)}
                    </Text>
                  </View>
                  {selectedOrder.totals?.tax !== undefined && selectedOrder.totals.tax > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Tax</Text>
                      <Text style={styles.summaryValue}>
                        {formatCurrency(selectedOrder.totals?.tax || 0)}
                      </Text>
                    </View>
                  )}
                  {selectedOrder.totals?.delivery !== undefined && selectedOrder.totals.delivery > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Delivery</Text>
                      <Text style={styles.summaryValue}>
                        {formatCurrency(selectedOrder.totals?.delivery || 0)}
                      </Text>
                    </View>
                  )}
                  {selectedOrder.totals?.discount !== undefined && selectedOrder.totals.discount > 0 && (
                    <View style={[styles.summaryRow, styles.discountRow]}>
                      <Text style={[styles.summaryLabel, styles.discountLabel]}>Discount</Text>
                      <Text style={styles.discountValue}>
                        -{formatCurrency(selectedOrder.totals?.discount || 0)}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.summaryRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>
                      {formatCurrency(selectedOrder.totals?.total || 0)}
                    </Text>
                  </View>
                </View>

                {/* Payment Info */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Payment</Text>
                  <View style={styles.paymentInfo}>
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Method</Text>
                      <Text style={styles.paymentValue}>{selectedOrder.payment?.method?.toUpperCase()}</Text>
                    </View>
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Status</Text>
                      <View
                        style={[
                          styles.paymentStatus,
                          {
                            backgroundColor:
                              selectedOrder.paymentStatus === 'completed' ? '#D1FAE5' : '#FEF3C7',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.paymentStatusText,
                            {
                              color:
                                selectedOrder.paymentStatus === 'completed' ? '#10B981' : '#F59E0B',
                            },
                          ]}
                        >
                          {selectedOrder.paymentStatus}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Actions */}
                {getNextStatuses(selectedOrder.status).length > 0 && (
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.primaryActionButton}
                      onPress={() =>
                        handleStatusUpdate(selectedOrder.id, getNextStatuses(selectedOrder.status)[0])
                      }
                    >
                      <Text style={styles.primaryActionButtonText}>
                        Mark as {ORDER_STATUS_CONFIG[getNextStatuses(selectedOrder.status)[0]].label}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterContainer: {
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterPillActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterPillText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  orderCustomer: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  orderStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  orderStatusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  orderMoreItems: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  orderTime: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  quickActionButton: {
    marginTop: 12,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '500',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  customerInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  customerContact: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  progressTracker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  progressDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  progressLabel: {
    fontSize: 10,
    marginTop: 6,
    textAlign: 'center',
  },
  progressLine: {
    position: 'absolute',
    top: 12,
    left: '60%',
    right: '-40%',
    height: 2,
    zIndex: -1,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  orderItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderItemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    width: 30,
  },
  orderItemName: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1F2937',
  },
  discountRow: {},
  discountLabel: {
    color: '#10B981',
  },
  discountValue: {
    color: '#10B981',
    fontWeight: '600',
  },
  totalRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  paymentInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  paymentStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  modalActions: {
    marginTop: 8,
  },
  primaryActionButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrderTracker;

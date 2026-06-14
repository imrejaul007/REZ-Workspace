/**
 * Kitchen Display System (KDS) Mobile App
 *
 * Shows:
 * - Active orders
 * - Order queue
 * - Preparation status
 * - Completion tracking
 * - Real-time WebSocket updates
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Platform, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { socketManager } from '@/services/websocketManager';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';

interface OrderItem {
  name: string;
  qty: number;
}

interface KitchenOrder {
  id: string;
  roomNumber: string;
  orderType: 'room_service' | 'restaurant';
  items: OrderItem[];
  priority: 'normal' | 'rush';
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  timePlaced: Date;
  estimatedReady: Date;
  notes?: string;
}

// API response type
interface ApiResponse {
  data: KitchenOrder[];
  success: boolean;
  message?: string;
}

export default function KitchenScreen() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'preparing' | 'ready'>('all');
  const [isConnected, setIsConnected] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);

  // Get auth state and secure token accessor
  const { isAuthenticated, isLoading: authLoading, getToken, getStoreId } = useAuth();
  const merchantId = useAuthStore(state => state.merchantId);

  // Load store ID from secure storage on mount
  useEffect(() => {
    const loadStoreId = async () => {
      try {
        const id = await getStoreId();
        setStoreId(id);
      } catch (err) {
        console.error('Failed to load store ID:', err);
        setError('No store selected. Please select a store first.');
      }
    };
    loadStoreId();
  }, [getStoreId]);

  // Helper to get auth token from secure storage
  const getAuthToken = async (): Promise<string> => {
    try {
      return await getToken();
    } catch {
      throw new Error('Not authenticated');
    }
  };

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    try {
      const token = await getAuthToken(); // Get token from auth context
      const response = await fetch('/api/v1/merchant/orders?status=preparing,ready&limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      setOrders(data.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and poll every 30 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Play notification sound for new orders
  const playNewOrderSound = useCallback(() => {
    try {
      // Use a simple beep or vibration as fallback
      if (Platform.OS === 'web') {
        const audio = new Audio('/sounds/new-order.mp3');
        audio.play().catch(() => {
          // Fallback: create a simple beep using Web Audio API
          const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        });
      }
    } catch {
      // Silently fail if audio not supported
    }
  }, []);

  // WebSocket connection and event handling
  useEffect(() => {
    // Skip if store ID not loaded yet
    if (!storeId || !merchantId) {
      return;
    }

    // Connect to WebSocket with merchant ID
    let token: string | undefined;
    getAuthToken()
      .then(authToken => {
        token = authToken;
        return socketManager.connect(merchantId!, authToken);
      })
      .catch(() => {
        // Connect without token if not authenticated
        socketManager.connect(merchantId!);
      })
      .then(() => {
        setIsConnected(socketManager.isConnected());
        // Join kitchen room for this store
        socketManager.joinKitchen(storeId);
      });

    // Listen for connection status
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    // Subscribe to socket events
    const socket = socketManager.getSocket();
    if (socket) {
      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
    }

    // Listen for connection callbacks
    const unsubConnect = socketManager.onConnect(handleConnect);
    const unsubDisconnect = socketManager.onDisconnect(handleDisconnect);

    // Listen for new orders
    const handleNewOrder = (order: KitchenOrder) => {
      setOrders(prev => {
        // Avoid duplicates
        if (prev.some(o => o.id === order.id)) {
          return prev;
        }
        return [order, ...prev];
      });
      // Play notification sound
      playNewOrderSound();
      // Show alert for new order
      Alert.alert(
        'New Order',
        `Order #${order.id} - Room ${order.roomNumber}`,
        [{ text: 'OK' }]
      );
    };

    // Listen for order updates
    const handleOrderUpdated = (updatedOrder: KitchenOrder) => {
      setOrders(prev => prev.map(o =>
        o.id === updatedOrder.id ? updatedOrder : o
      ));
    };

    // Listen for order completed (remove from display)
    const handleOrderCompleted = (orderId: string) => {
      setOrders(prev => prev.filter(o => o.id !== orderId));
    };

    // Subscribe to events
    const unsubNewOrder = socketManager.onNewOrder(handleNewOrder as (order: unknown) => void);
    const unsubOrderUpdated = socketManager.onOrderUpdated(handleOrderUpdated as (order: unknown) => void);
    const unsubOrderCompleted = socketManager.onOrderCompleted(handleOrderCompleted);

    // Cleanup on unmount
    return () => {
      socketManager.leaveKitchen(storeId);
      if (socket) {
        socket.disconnect();
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
      }
      unsubNewOrder();
      unsubOrderUpdated();
      unsubOrderCompleted();
      unsubConnect();
      unsubDisconnect();
    };
  }, [storeId, merchantId, playNewOrderSound, getAuthToken]);

  // Emit status update to server when local state changes
  const updateStatus = useCallback((orderId: string, status: KitchenOrder['status']) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status } : o
    ));
    // Notify server via WebSocket
    socketManager.updateOrderStatus(orderId, status, storeId);
  }, [storeId]);

  const filteredOrders = orders.filter(o => {
    if (filter === 'all') return true;
    return o.status === filter;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const getTimeColor = (timePlaced: Date) => {
    const mins = (Date.now() - timePlaced.getTime()) / 60000;
    if (mins > 15) return '#E74C3C';
    if (mins > 10) return '#F39C12';
    return '#27AE60';
  };

  const renderOrder = ({ item: order }: { item: KitchenOrder }) => {
    const minsAgo = Math.floor((Date.now() - order.timePlaced.getTime()) / 60000);

    return (
      <View style={[styles.orderCard, order.priority === 'rush' && styles.rushOrder]}>
        <View style={styles.orderHeader}>
          <View style={styles.roomInfo}>
            <Text style={styles.roomNumber}>Room {order.roomNumber}</Text>
            <View style={[styles.priorityBadge, order.priority === 'rush' && styles.rushBadge]}>
              <Text style={styles.priorityText}>
                {order.priority === 'rush' ? 'RUSH' : 'Normal'}
              </Text>
            </View>
            <View style={styles.orderTypeBadge}>
              <Text style={styles.orderTypeText}>
                {order.orderType === 'room_service' ? 'Room Service' : 'Restaurant'}
              </Text>
            </View>
          </View>
          <View style={[styles.timeBadge, { backgroundColor: getTimeColor(order.timePlaced) }]}>
            <Text style={styles.timeText}>{minsAgo}m ago</Text>
          </View>
        </View>

        <View style={styles.itemsList}>
          {order.items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.qty}>{item.qty}x</Text>
              <Text style={styles.itemName}>{item.name}</Text>
            </View>
          ))}
        </View>

        {order.notes && (
          <View style={styles.notes}>
            <Ionicons name="warning" size={16} color="#F39C12" />
            <Text style={styles.notesText}>{order.notes}</Text>
          </View>
        )}

        <View style={styles.actions}>
          {order.status === 'pending' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.startBtn]}
              onPress={() => updateStatus(order.id, 'preparing')}
            >
              <Text style={styles.btnText}>Start</Text>
            </TouchableOpacity>
          )}
          {order.status === 'preparing' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.readyBtn]}
              onPress={() => updateStatus(order.id, 'ready')}
            >
              <Text style={styles.btnText}>Ready</Text>
            </TouchableOpacity>
          )}
          {order.status === 'ready' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.deliveredBtn]}
              onPress={() => updateStatus(order.id, 'delivered')}
            >
              <Text style={styles.btnText}>Delivered</Text>
            </TouchableOpacity>
          )}
          {order.status === 'delivered' && (
            <View style={styles.deliveredBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#27AE60" />
              <Text style={styles.deliveredText}>Delivered</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Connection Status Indicator */}
      <View style={[styles.connectionBar, isConnected ? styles.connectedBar : styles.disconnectedBar]}>
        <View style={[styles.connectionDot, isConnected ? styles.connectedDot : styles.disconnectedDot]} />
        <Text style={styles.connectionText}>
          {isConnected ? 'Live' : 'Offline'}
        </Text>
      </View>

      {/* Stats Header */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{orders.filter(o => o.status === 'pending').length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{orders.filter(o => o.status === 'preparing').length}</Text>
          <Text style={styles.statLabel}>Preparing</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{orders.filter(o => o.status === 'ready').length}</Text>
          <Text style={styles.statLabel}>Ready</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filters}>
        {(['all', 'pending', 'preparing', 'ready'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={item => item.id}
        renderItem={renderOrder}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {loading ? (
              <>
                <Ionicons name="hourglass-outline" size={64} color="#555" />
                <Text style={styles.emptyText}>Loading orders...</Text>
              </>
            ) : error ? (
              <>
                <Ionicons name="alert-circle-outline" size={64} color="#E74C3C" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchOrders}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Ionicons name="restaurant-outline" size={64} color="#555" />
                <Text style={styles.emptyText}>No orders</Text>
              </>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  connectionBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 6, paddingHorizontal: 16 },
  connectedBar: { backgroundColor: '#1a3d1a' },
  disconnectedBar: { backgroundColor: '#3d1a1a' },
  connectionDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  connectedDot: { backgroundColor: '#27AE60' },
  disconnectedDot: { backgroundColor: '#E74C3C' },
  connectionText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  stats: { flexDirection: 'row', backgroundColor: '#2d2d2d', padding: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 12, color: '#888' },
  filters: { flexDirection: 'row', padding: 8, backgroundColor: '#2d2d2d' },
  filterTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  filterTabActive: { backgroundColor: '#E07C24' },
  filterText: { color: '#888', fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  list: { padding: 16 },
  orderCard: { backgroundColor: '#2d2d2d', borderRadius: 12, padding: 16, marginBottom: 12 },
  rushOrder: { borderLeftWidth: 4, borderLeftColor: '#E74C3C' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  roomInfo: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', flex: 1 },
  roomNumber: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  priorityBadge: { backgroundColor: '#27AE60', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  rushBadge: { backgroundColor: '#E74C3C' },
  priorityText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  orderTypeBadge: { backgroundColor: '#3498DB', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  orderTypeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  timeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  timeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  itemsList: { borderTopWidth: 1, borderTopColor: '#444', paddingTop: 12 },
  itemRow: { flexDirection: 'row', marginBottom: 8 },
  qty: { width: 30, color: '#E07C24', fontWeight: 'bold' },
  itemName: { color: '#fff', fontSize: 16 },
  notes: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3d3d3d', padding: 8, borderRadius: 8, marginTop: 8 },
  notesText: { color: '#F39C12', marginLeft: 8 },
  actions: { flexDirection: 'row', marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  startBtn: { backgroundColor: '#27AE60' },
  readyBtn: { backgroundColor: '#F39C12' },
  deliveredBtn: { backgroundColor: '#3498DB' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  deliveredBadge: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  deliveredText: { color: '#27AE60', fontWeight: 'bold', marginLeft: 8 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
  emptyText: { color: '#555', fontSize: 18, marginTop: 16 },
  errorText: { color: '#E74C3C', fontSize: 16, marginTop: 16, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { marginTop: 16, backgroundColor: '#E07C24', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

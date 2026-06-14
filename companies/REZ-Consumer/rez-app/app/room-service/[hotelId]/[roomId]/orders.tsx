/**
 * My Orders Screen
 * Route: /room-service/[hotelId]/[roomId]/orders
 *
 * Shows guest's current and past orders
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyOrdersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ hotelId: string; roomId: string }>();

  // Mock orders data
  const [orders] = useState([
    {
      id: 'ORD001',
      type: 'food',
      items: [{ name: 'Continental Breakfast', qty: 1, price: 550 }],
      status: 'preparing',
      total: 550,
      time: '10:30 AM',
      eta: '10 mins',
    },
    {
      id: 'ORD002',
      type: 'laundry',
      items: [{ name: 'Wash & Fold (3 items)', qty: 1, price: 450 }],
      status: 'completed',
      total: 450,
      time: '9:00 AM',
      eta: null,
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'preparing': return '#F59E0B';
      case 'ready': return '#10B981';
      case 'delivered': return '#5D8C5A';
      case 'completed': return '#888';
      default: return '#888';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'preparing': return 'time-outline';
      case 'ready': return 'checkmark-circle';
      case 'delivered': return 'checkmark-done';
      case 'completed': return 'checkmark';
      default: return 'ellipse';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#4A90D9', '#357ABD']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        {orders.map(order => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View style={styles.orderId}>
                <Text style={styles.orderIdText}>#{order.id}</Text>
                <Text style={styles.orderTime}>{order.time}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                <Ionicons name={getStatusIcon(order.status) as unknown} size={14} color={getStatusColor(order.status)} />
                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.orderItems}>
              {order.items.map((item, idx) => (
                <View key={idx} style={styles.orderItem}>
                  <Text style={styles.itemName}>{item.qty}x {item.name}</Text>
                  <Text style={styles.itemPrice}>₹{item.price}</Text>
                </View>
              ))}
            </View>

            <View style={styles.orderFooter}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{order.total}</Text>
              {order.eta && (
                <View style={styles.etaBadge}>
                  <Ionicons name="time-outline" size={14} color="#F59E0B" />
                  <Text style={styles.etaText}>ETA: {order.eta}</Text>
                </View>
              )}
            </View>

            {order.status === 'preparing' && (
              <View style={styles.trackSection}>
                <View style={styles.trackStep}>
                  <View style={[styles.trackDot, styles.trackDotActive]} />
                  <Text style={styles.trackLabel}>Order Placed</Text>
                </View>
                <View style={styles.trackLine}>
                  <View style={[styles.trackLineFill, { width: '50%' }]} />
                </View>
                <View style={styles.trackStep}>
                  <View style={[styles.trackDot, styles.trackDotActive]} />
                  <Text style={styles.trackLabel}>Preparing</Text>
                </View>
                <View style={styles.trackLine}>
                  <View style={[styles.trackLineFill, { width: '0%' }]} />
                </View>
                <View style={styles.trackStep}>
                  <View style={styles.trackDot} />
                  <Text style={styles.trackLabel}>Ready</Text>
                </View>
              </View>
            )}
          </View>
        ))}

        {orders.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptyText}>Your orders will appear here</Text>
            <TouchableOpacity style={styles.orderNowBtn} onPress={() => router.back()}>
              <Text style={styles.orderNowText}>Order Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center' },
  content: { flex: 1, padding: 16 },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: {},
  orderIdText: { fontSize: 16, fontWeight: '700', color: '#333' },
  orderTime: { fontSize: 12, color: '#888', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  orderItems: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 16 },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemName: { fontSize: 14, color: '#333' },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#333' },
  orderFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  totalLabel: { fontSize: 14, color: '#666' },
  totalValue: { flex: 1, fontSize: 18, fontWeight: '700', color: '#333', marginLeft: 8 },
  etaBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  etaText: { fontSize: 12, fontWeight: '600', color: '#F59E0B', marginLeft: 4 },
  trackSection: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  trackStep: { alignItems: 'center' },
  trackDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#E0E0E0', marginBottom: 4 },
  trackDotActive: { backgroundColor: '#F59E0B' },
  trackLine: { flex: 1, height: 2, backgroundColor: '#E0E0E0', marginHorizontal: 4, marginBottom: 20 },
  trackLineFill: { height: '100%', backgroundColor: '#F59E0B' },
  trackLabel: { fontSize: 10, color: '#666' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#888', marginTop: 8 },
  orderNowBtn: { backgroundColor: '#4A90D9', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25, marginTop: 24 },
  orderNowText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

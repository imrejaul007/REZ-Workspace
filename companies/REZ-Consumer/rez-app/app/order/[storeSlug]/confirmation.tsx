// @ts-nocheck
/**
 * Web QR Ordering — Order Confirmation & Live Status
 *
 * Shown after payment is verified. Polls the order status every 15s
 * and animates through: confirmed → preparing → ready → completed
 *
 * Route params: { storeSlug, orderNumber }
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import Button from '@/components/ui/Button';
import { getWebOrder, WebOrderStatus } from '@/services/webOrderingApi';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_STEPS: WebOrderStatus['status'][] = ['confirmed', 'preparing', 'ready', 'completed'];

const STATUS_INFO: Record<string, { label: string; icon: string; color: string; bg: string; msg: string }> = {
  pending_payment: {
    label: 'Awaiting Payment',
    icon: 'time-outline',
    color: '#D97706',
    bg: '#FEF3C7',
    msg: 'Waiting for payment confirmation…',
  },
  confirmed: {
    label: 'Order Confirmed',
    icon: 'checkmark-circle-outline',
    color: '#1a3a52',
    bg: '#F5F3FF',
    msg: 'Your order has been received by the kitchen!',
  },
  preparing: {
    label: 'Being Prepared',
    icon: 'flame-outline',
    color: '#2563EB',
    bg: '#EFF6FF',
    msg: 'The kitchen is working on your order.',
  },
  ready: {
    label: 'Ready to Serve',
    icon: 'bag-check-outline',
    color: '#059669',
    bg: '#ECFDF5',
    msg: '🎉 Your order is ready! A server will bring it shortly.',
  },
  completed: {
    label: 'Served',
    icon: 'happy-outline',
    color: '#16A34A',
    bg: '#F0FDF4',
    msg: 'Enjoy your meal! Thank you for ordering with REZ.',
  },
  cancelled: {
    label: 'Cancelled',
    icon: 'close-circle-outline',
    color: '#DC2626',
    bg: '#FEF2F2',
    msg: 'This order has been cancelled.',
  },
};

// ─── Step indicator ───────────────────────────────────────────────────────────

function StatusTracker({ currentStatus }: { currentStatus: WebOrderStatus['status'] }) {
  const currentIdx = STATUS_STEPS.indexOf(currentStatus);

  return (
    <View style={trackerStyles.container}>
      {STATUS_STEPS.map((step, idx) => {
        const done = currentIdx >= idx;
        const active = currentIdx === idx;
        const info = STATUS_INFO[step];
        return (
          <View key={step} style={trackerStyles.step}>
            <View
              style={[
                trackerStyles.dot,
                done ? { backgroundColor: '#1a3a52' } : { backgroundColor: '#E5E7EB' },
                active && trackerStyles.dotActive,
              ]}
            >
              {done && <Ionicons name={active ? 'ellipse' : 'checkmark'} size={active ? 8 : 12} color="#fff" />}
            </View>
            {idx < STATUS_STEPS.length - 1 && (
              <View style={[trackerStyles.line, done && idx < currentIdx ? { backgroundColor: '#1a3a52' } : null]} />
            )}
            <Text style={[trackerStyles.label, active && trackerStyles.labelActive]}>{info.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const trackerStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', paddingVertical: 8 },
  step: { alignItems: 'center', flex: 1 },
  dot: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  dotActive: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1a3a52',
    shadowColor: '#1a3a52',
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  line: {
    position: 'absolute',
    top: 12,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: '#E5E7EB',
    zIndex: -1,
  },
  label: { fontSize: 9, color: '#9CA3AF', textAlign: 'center', fontWeight: '500' },
  labelActive: { color: '#1a3a52', fontWeight: '700' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ConfirmationScreen() {
  const router = useRouter();
  const { storeSlug, orderNumber } = useLocalSearchParams<{ storeSlug?: string; orderNumber?: string }>();

  const [order, setOrder] = useState<WebOrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // CA-CMC-043 FIX: Add max poll count to prevent indefinite polling
  const pollCountRef = useRef(0);
  const MAX_POLLS = 40; // Stop after 40 polls * 15s = 10 minutes

  const fetchOrder = useCallback(async () => {
    if (!orderNumber) return;
    try {
      // LOW-09 FIX: Check poll count BEFORE increment to prevent off-by-one
      if (pollCountRef.current >= MAX_POLLS) {
        if (pollRef.current) clearInterval(pollRef.current);
        if (isMountedRef.current) {
          setError('Order status check timeout. Please contact support if not resolved.');
        }
        return;
      }
      pollCountRef.current += 1;

      const data = await getWebOrder(orderNumber);
      if (!isMountedRef.current) return;
      setOrder(data);
      // Stop polling when terminal status reached
      const TERMINAL_STATUSES = ['completed', 'cancelled', 'failed', 'delivered'];
      if (TERMINAL_STATUSES.includes(data.status as string)) {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch (e) {
      if (isMountedRef.current) setError(e.message);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    // CA-CMC-043 FIX: Reset poll count on mount
    pollCountRef.current = 0;
    fetchOrder();
    pollRef.current = setInterval(fetchOrder, 15_000); // Poll every 15s
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchOrder]);

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1a3a52" />
          <Text style={styles.loadingText}>Loading order…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={52} color="#EF4444" />
          <Text style={styles.errorTitle}>Order not found</Text>
          <Text style={styles.errorSub}>{error}</Text>
          {storeSlug ? (
            <TouchableOpacity onPress={() => router.replace(`/order/${storeSlug}`)}>
              <Text style={styles.backLink}>← Back to menu</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
              <Text style={styles.backLink}>← Go home</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const statusConf = STATUS_INFO[order.status] ?? STATUS_INFO.confirmed;
  const isTerminal = order.status === 'completed' || order.status === 'cancelled';
  const isReady = order.status === 'ready';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={['#1a3a52', '#1a3a52']} style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Order #{order.orderNumber}</Text>
          <Text style={styles.headerSub}>{order.storeName}</Text>
        </View>
        {!isTerminal && (
          <View style={styles.liveDot}>
            <View style={styles.liveDotPulse} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status card */}
        <Animated.View entering={ZoomIn.springify()} style={[styles.statusCard, { backgroundColor: statusConf.bg }]}>
          <View style={[styles.statusIconBox, { backgroundColor: statusConf.color + '22' }]}>
            <Ionicons name={statusConf.icon as keyof typeof Ionicons.glyphMap} size={36} color={statusConf.color} />
          </View>
          <Text style={[styles.statusLabel, { color: statusConf.color }]}>{statusConf.label}</Text>
          <Text style={styles.statusMsg}>{statusConf.msg}</Text>
        </Animated.View>

        {/* Progress tracker */}
        {order.status !== 'cancelled' && !['pending_payment', 'paid'].includes(order.status) && (
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.card}>
            <Text style={styles.sectionTitle}>Order Progress</Text>
            <StatusTracker currentStatus={order.status} />
          </Animated.View>
        )}

        {/* Table info */}
        {order.tableNumber && (
          <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.tableCard}>
            <Ionicons name="restaurant" size={18} color="#1a3a52" />
            <Text style={styles.tableText}>Table {order.tableNumber}</Text>
          </Animated.View>
        )}

        {/* Order details */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.card}>
          <Text style={styles.sectionTitle}>Your Order</Text>
          {order.items.map((item, idx) => (
            <View key={`${item.name}-${idx}`} style={styles.itemRow}>
              <View style={styles.itemQty}>
                <Text style={styles.itemQtyText}>{item.quantity}×</Text>
              </View>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(0)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.itemRow}>
            <Text style={[styles.itemName, { color: '#6B7280', flex: 1 }]}>Subtotal</Text>
            <Text style={styles.itemPrice}>₹{order.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.itemRow}>
            <Text style={[styles.itemName, { color: '#6B7280', flex: 1 }]}>GST</Text>
            <Text style={styles.itemPrice}>₹{order.taxes.toFixed(2)}</Text>
          </View>
          <View style={[styles.itemRow, { marginTop: 4 }]}>
            <Text style={[styles.itemName, { fontWeight: '800', fontSize: 15, flex: 1 }]}>Total Paid</Text>
            <Text style={[styles.itemPrice, { fontWeight: '800', fontSize: 16, color: '#1a3a52' }]}>
              ₹{order.total.toFixed(2)}
            </Text>
          </View>
        </Animated.View>

        {/* Call to action */}
        <Animated.View entering={FadeInDown.delay(280).springify()}>
          {isReady && (
            <View style={styles.readyCTA}>
              <Ionicons name="notifications" size={20} color="#059669" />
              <Text style={styles.readyCTAText}>Your server has been notified. No need to call!</Text>
            </View>
          )}

          {isTerminal && order.status === 'completed' && storeSlug && (
            <TouchableOpacity
              style={styles.orderAgainBtn}
              onPress={() =>
                router.replace(`/order/${storeSlug}${order.tableNumber ? `?table=${order.tableNumber}` : ''}`)
              }
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </Animated.View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  loadingText: { fontSize: 14, color: '#6B7280', marginTop: 8 },
  errorTitle: { fontSize: 17, fontWeight: '700', color: '#374151' },
  errorSub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  backLink: { fontSize: 14, color: '#1a3a52', fontWeight: '600', marginTop: 8 },

  header: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  liveDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveDotPulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80' },
  liveText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  content: { padding: 16, gap: 14 },

  statusCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  statusIconBox: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  statusLabel: { fontSize: 19, fontWeight: '800' },
  statusMsg: { fontSize: 13, color: '#374151', textAlign: 'center', lineHeight: 20 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  tableCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  tableText: { fontSize: 14, fontWeight: '700', color: '#1a3a52' },

  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  itemQty: {
    width: 32,
    height: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemQtyText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  itemName: { flex: 1, fontSize: 13, color: '#374151' },
  itemPrice: { fontSize: 13, fontWeight: '600', color: '#111827' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 8 },

  readyCTA: {
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  readyCTAText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#065F46', lineHeight: 18 },

  orderAgainBtn: {
    backgroundColor: '#1a3a52',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  orderAgainText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

/**
 * Web Order Detail Screen
 *
 * Shows full detail for a single WebOrder including:
 *  - Tip amount (gold badge)
 *  - Bill splits with per-person amounts and paid/unpaid status
 *  - Group order indicator + member count (derived from billSplits)
 *  - Table number
 *
 * Route: /orders/web-order/:orderNumber
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '@/utils/alert';
import { apiClient } from '@/services/api/client';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import {
  WebOrder,
  WebOrderStatus,
  BillSplit,
  WEB_ORDER_STATUS_COLORS,
  WEB_ORDER_STATUS_LABELS,
} from '@/hooks/useWebOrders';

// ─── Small components ─────────────────────────────────────────────────────────

const TipBadge = ({ amount, percentage }: { amount: number; percentage?: number }) => (
  <View style={styles.tipBadge}>
    <Ionicons name="star" size={14} color="#B8860B" />
    <ThemedText style={styles.tipBadgeText}>
      Tip ₹{amount.toFixed(2)}
      {percentage ? ` (${percentage}%)` : ''}
    </ThemedText>
  </View>
);

const BillSplitRow = ({ split, index }: { split: BillSplit; index: number }) => (
  <View style={styles.splitRow}>
    <View style={styles.splitLeft}>
      <View style={[styles.splitAvatar, { backgroundColor: split.paid ? '#E8F5E9' : '#FFF3E0' }]}>
        <ThemedText style={[styles.splitAvatarText, { color: split.paid ? '#388E3C' : '#E65100' }]}>
          {(split.name || `P${index + 1}`)[0].toUpperCase()}
        </ThemedText>
      </View>
      <View>
        <ThemedText style={styles.splitName}>{split.name || `Person ${index + 1}`}</ThemedText>
        {split.paidAt && (
          <ThemedText style={styles.splitPaidAt}>
            Paid{' '}
            {new Date(split.paidAt).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </ThemedText>
        )}
      </View>
    </View>
    <View style={styles.splitRight}>
      <ThemedText style={styles.splitAmount}>₹{split.amount.toFixed(2)}</ThemedText>
      <View
        style={[styles.splitStatusBadge, { backgroundColor: split.paid ? '#4CAF50' : '#FF9800' }]}
      >
        <ThemedText style={styles.splitStatusText}>{split.paid ? 'PAID' : 'UNPAID'}</ThemedText>
      </View>
    </View>
  </View>
);

// ─── Main screen ──────────────────────────────────────────────────────────────

const WEB_ORDER_NEXT_ACTIONS: Record<string, { label: string; nextStatus: string; color: string }> =
  {
    confirmed: { label: 'Start Preparing', nextStatus: 'preparing', color: '#F59E0B' },
    preparing: { label: 'Mark Ready', nextStatus: 'ready', color: '#10B981' },
    pending_payment: { label: 'Confirm Order', nextStatus: 'confirmed', color: '#3B82F6' },
  };

export default function WebOrderDetailScreen() {
  const { orderNumber } = useLocalSearchParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<WebOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!orderNumber) return;

    (async () => {
      try {
        const response = await apiClient.get(`merchant/web-orders/${orderNumber}`);
        if (response.success && response.data) {
          setOrder(response.data);
        } else {
          showAlert('Error', 'Order not found');
          router.back();
        }
      } catch {
        showAlert('Error', 'Failed to load order');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [orderNumber]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!order) return;
    setUpdatingStatus(true);
    try {
      const response = await apiClient.patch(`merchant/web-orders/${orderNumber}/status`, {
        status: newStatus,
      });
      if (response.success) {
        setOrder((prev) => (prev ? { ...prev, status: newStatus as WebOrderStatus } : prev));
        showAlert('Success', `Order marked as ${newStatus.replace(/_/g, ' ')}`);
      } else {
        showAlert('Error', (response as unknown as { message?: string }).message || 'Failed to update status');
      }
    } catch (err) {
      showAlert('Error', err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <ThemedText style={styles.loadingText}>Loading order…</ThemedText>
      </ThemedView>
    );
  }

  if (!order) return null;

  const statusColor = WEB_ORDER_STATUS_COLORS[order.status] ?? '#9E9E9E';
  const statusLabel = WEB_ORDER_STATUS_LABELS[order.status] ?? order.status;
  const hasTip = (order.tipAmount ?? 0) > 0;
  const hasSplits = Array.isArray(order.billSplits) && order.billSplits.length > 0;
  const isGroupOrder = hasSplits && (order.billSplits?.length ?? 0) > 1;
  const paidSplits = hasSplits ? (order.billSplits?.filter((s) => s.paid).length ?? 0) : 0;
  const displayTotal = order.totalWithTip ?? order.total;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Web Order #{order.orderNumber}</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      {/* Status + summary card */}
      <View style={styles.card}>
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <ThemedText style={styles.statusText}>{statusLabel}</ThemedText>
          </View>
          {isGroupOrder && (
            <View style={styles.groupBadge}>
              <Ionicons name="people" size={14} color="#5C6BC0" />
              <ThemedText style={styles.groupBadgeText}>
                Group · {order.billSplits?.length} people
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.summaryRow}>
          <ThemedText style={styles.summaryLabel}>
            {new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </ThemedText>
          <ThemedText style={styles.totalAmount}>₹{displayTotal.toFixed(2)}</ThemedText>
        </View>

        {hasTip && <TipBadge amount={order.tipAmount!} percentage={order.tipPercentage} />}
      </View>

      {/* Table + channel info */}
      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Order Details</ThemedText>
        <View style={styles.infoGrid}>
          {order.tableNumber ? (
            <View style={styles.infoItem}>
              <Ionicons name="restaurant-outline" size={18} color={Colors.light.tint} />
              <View>
                <ThemedText style={styles.infoLabel}>Table</ThemedText>
                <ThemedText style={styles.infoValue}>{order.tableNumber}</ThemedText>
              </View>
            </View>
          ) : null}
          <View style={styles.infoItem}>
            <Ionicons name="globe-outline" size={18} color={Colors.light.tint} />
            <View>
              <ThemedText style={styles.infoLabel}>Channel</ThemedText>
              <ThemedText style={styles.infoValue}>
                {(order.channel ?? 'web_qr').replace(/_/g, ' ').toUpperCase()}
              </ThemedText>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="card-outline" size={18} color={Colors.light.tint} />
            <View>
              <ThemedText style={styles.infoLabel}>Payment</ThemedText>
              <ThemedText style={styles.infoValue}>{order.paymentStatus.toUpperCase()}</ThemedText>
            </View>
          </View>
        </View>
      </View>

      {/* Customer */}
      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Customer</ThemedText>
        <View style={styles.customerRow}>
          <View style={styles.customerAvatar}>
            <ThemedText style={styles.customerInitial}>
              {(order.customerName || order.customerPhone || '?')[0].toUpperCase()}
            </ThemedText>
          </View>
          <View style={styles.customerInfo}>
            {order.customerName ? (
              <ThemedText style={styles.customerName}>{order.customerName}</ThemedText>
            ) : null}
            {order.customerPhone ? (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${order.customerPhone}`)}>
                <ThemedText style={styles.customerPhone}>{order.customerPhone}</ThemedText>
              </TouchableOpacity>
            ) : null}
          </View>
          {order.customerPhone ? (
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => Linking.openURL(`tel:${order.customerPhone}`)}
            >
              <Ionicons name="call" size={20} color="#4CAF50" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Items */}
      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>
          {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
        </ThemedText>
        {order.items.map((item, i) => (
          <View key={`${item.menuItemId}-${i}`} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <ThemedText style={styles.itemName}>{item.name}</ThemedText>
              {item.customisation ? (
                <ThemedText style={styles.itemCustomisation}>{item.customisation}</ThemedText>
              ) : null}
              {item.category ? (
                <ThemedText style={styles.itemCategory}>{item.category}</ThemedText>
              ) : null}
            </View>
            <View style={styles.itemPricing}>
              <ThemedText style={styles.itemQty}>×{item.quantity}</ThemedText>
              <ThemedText style={styles.itemPrice}>
                ₹{(item.price * item.quantity).toFixed(2)}
              </ThemedText>
            </View>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsSection}>
          {order.subtotal !== undefined && (
            <View style={styles.totalRow}>
              <ThemedText style={styles.totalLabel}>Subtotal</ThemedText>
              <ThemedText style={styles.totalValue}>₹{order.subtotal.toFixed(2)}</ThemedText>
            </View>
          )}
          {(order.taxes ?? 0) > 0 && (
            <View style={styles.totalRow}>
              <ThemedText style={styles.totalLabel}>Tax</ThemedText>
              <ThemedText style={styles.totalValue}>₹{(order.taxes ?? 0).toFixed(2)}</ThemedText>
            </View>
          )}
          <View style={styles.totalRow}>
            <ThemedText style={styles.totalLabel}>Total</ThemedText>
            <ThemedText style={styles.totalValue}>₹{order.total.toFixed(2)}</ThemedText>
          </View>
          {hasTip && (
            <View style={[styles.totalRow, styles.tipRow]}>
              <View style={styles.tipLabelRow}>
                <Ionicons name="star" size={13} color="#B8860B" />
                <ThemedText style={styles.tipLabel}>
                  Tip{order.tipPercentage ? ` (${order.tipPercentage}%)` : ''}
                </ThemedText>
              </View>
              <ThemedText style={styles.tipValue}>₹{(order.tipAmount ?? 0).toFixed(2)}</ThemedText>
            </View>
          )}
          {hasTip && (
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <ThemedText style={styles.grandTotalLabel}>Total with Tip</ThemedText>
              <ThemedText style={styles.grandTotalValue}>
                ₹{(order.totalWithTip ?? order.total).toFixed(2)}
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      {/* Bill Splits */}
      {hasSplits && (
        <View style={styles.card}>
          <View style={styles.splitHeader}>
            <ThemedText style={styles.cardTitle}>Bill Split</ThemedText>
            <ThemedText style={styles.splitProgress}>
              {paidSplits}/{order.billSplits?.length ?? 0} paid
            </ThemedText>
          </View>
          {(order.billSplits ?? []).map((split, i) => (
            <BillSplitRow key={i} split={split} index={i} />
          ))}
        </View>
      )}

      {/* Special Instructions */}
      {order.specialInstructions ? (
        <View style={styles.card}>
          <ThemedText style={styles.cardTitle}>Special Instructions</ThemedText>
          <View style={styles.instructionsBox}>
            <ThemedText style={styles.instructionsText}>{order.specialInstructions}</ThemedText>
          </View>
        </View>
      ) : null}

      {/* Status Actions */}
      {WEB_ORDER_NEXT_ACTIONS[order.status] ? (
        <View style={[styles.card, { paddingTop: 12 }]}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: WEB_ORDER_NEXT_ACTIONS[order.status].color },
            ]}
            onPress={() => handleUpdateStatus(WEB_ORDER_NEXT_ACTIONS[order.status].nextStatus)}
            disabled={updatingStatus}
          >
            {updatingStatus ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <ThemedText style={styles.actionBtnText}>
                  {WEB_ORDER_NEXT_ACTIONS[order.status].label}
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.backgroundSecondary },
  content: { paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: Colors.light.textSecondary },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: { padding: 8 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: Colors.light.text,
  },
  headerSpacer: { width: 40 },

  card: {
    backgroundColor: Colors.light.background,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: Colors.light.text, marginBottom: 12 },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#E8EAF6',
    borderRadius: 20,
  },
  groupBadgeText: { fontSize: 12, fontWeight: '600', color: '#5C6BC0' },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: { fontSize: 13, color: Colors.light.textSecondary },
  totalAmount: { fontSize: 22, fontWeight: '700', color: Colors.light.text },

  tipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD54F',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  tipBadgeText: { fontSize: 13, fontWeight: '700', color: '#B8860B' },

  infoGrid: { gap: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: { fontSize: 14, fontWeight: '600', color: Colors.light.text, marginTop: 2 },

  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerInitial: { fontSize: 18, fontWeight: '700', color: '#2196F3' },
  customerInfo: { flex: 1, gap: 3 },
  customerName: { fontSize: 16, fontWeight: '600', color: Colors.light.text },
  customerPhone: { fontSize: 14, color: '#2196F3' },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  itemInfo: { flex: 1, marginRight: 12, gap: 2 },
  itemName: { fontSize: 15, fontWeight: '500', color: Colors.light.text },
  itemCustomisation: { fontSize: 12, color: Colors.light.textSecondary, fontStyle: 'italic' },
  itemCategory: { fontSize: 11, color: Colors.light.textSecondary },
  itemPricing: { alignItems: 'flex-end', gap: 3 },
  itemQty: { fontSize: 13, color: Colors.light.textSecondary },
  itemPrice: { fontSize: 15, fontWeight: '600', color: Colors.light.text },

  totalsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 8,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 14, color: Colors.light.textSecondary },
  totalValue: { fontSize: 14, color: Colors.light.text },
  tipRow: { alignItems: 'center' },
  tipLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tipLabel: { fontSize: 14, color: '#B8860B', fontWeight: '600' },
  tipValue: { fontSize: 14, color: '#B8860B', fontWeight: '700' },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 8,
    marginTop: 4,
  },
  grandTotalLabel: { fontSize: 16, fontWeight: '700', color: Colors.light.text },
  grandTotalValue: { fontSize: 16, fontWeight: '700', color: Colors.light.text },

  splitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  splitProgress: { fontSize: 13, fontWeight: '600', color: Colors.light.textSecondary },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  splitLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  splitAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splitAvatarText: { fontSize: 15, fontWeight: '700' },
  splitName: { fontSize: 14, fontWeight: '500', color: Colors.light.text },
  splitPaidAt: { fontSize: 11, color: Colors.light.textSecondary },
  splitRight: { alignItems: 'flex-end', gap: 4 },
  splitAmount: { fontSize: 15, fontWeight: '700', color: Colors.light.text },
  splitStatusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  splitStatusText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },

  instructionsBox: {
    backgroundColor: Colors.light.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
  },
  instructionsText: { fontSize: 14, color: Colors.light.text, lineHeight: 20 },

  bottomPadding: { height: 24 },
});

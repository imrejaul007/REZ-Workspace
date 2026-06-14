import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/Colors';
import { Colors as BrandColors, Spacing, Shadows, BorderRadius } from '@/constants/DesignTokens';
import {
  Card,
  Heading2,
  Heading3,
  BodyText,
  Caption,
  Badge,
  Button,
} from '@/components/ui/DesignSystemComponents';
import type { Order, OrderStatus } from '@/types/api';
import { ordersService } from '@/services/api/orders';
import { showAlert } from '@/utils/alert';
import { useStore } from '@/contexts/StoreContext';
import { logger } from '@/utils/logger';

const statusColors: Record<string, string> = {
  placed: BrandColors.warning[500],
  confirmed: BrandColors.primary[500],
  preparing: BrandColors.warning[600],
  ready: BrandColors.success[500],
  dispatched: BrandColors.primary[600],
  out_for_delivery: BrandColors.primary[400],
  delivered: BrandColors.success[600],
  cancelling: BrandColors.warning[500],
  cancelled: BrandColors.error[500],
  returned: BrandColors.warning[700],
  refunded: BrandColors.gray[500],
};

const statusLabels: Record<string, string> = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  dispatched: 'Dispatched',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelling: 'Cancelling',
  cancelled: 'Cancelled',
  returned: 'Returned',
  refunded: 'Refunded',
};

// Canonical status transitions — must match backend orderStateMachine.ts
const STATUS_TRANSITIONS: Record<string, string[]> = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['dispatched', 'cancelled'],
  dispatched: ['out_for_delivery', 'delivered', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: ['returned', 'refunded'],
  cancelling: ['cancelled', 'placed', 'confirmed', 'preparing', 'ready'],
  cancelled: ['refunded'],
  returned: ['refunded'],
  refunded: [],
};

const paymentMethodLabels: Record<string, string> = {
  razorpay: 'Razorpay',
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  bank_transfer: 'Bank Transfer',
  digital_wallet: 'Digital Wallet',
  cash: 'Cash on Delivery',
  cod: 'Cash on Delivery',
  upi: 'UPI',
  wallet: 'Wallet',
};

const formatCurrency = (amount: number): string => {
  return `₹${(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getItemTotal = (item): number => {
  return item.total ?? item.subtotal ?? item.totalPrice ?? item.price * item.quantity;
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeStore } = useStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await ordersService.getOrderById(id);
      // G-MA-C05 / G-MA-C15 FIX: Assert store ownership before exposing PII.
      // Backend enforces auth, but this is a defense-in-depth client-side guard.
      if (
        activeStore &&
        (data.merchantId !== activeStore.merchantId ||
          (data.store?._id && data.store._id !== activeStore._id))
      ) {
        setError('Order not found.');
        setOrder(null);
        if (__DEV__) console.warn('[OrderDetail] IDOR guard: order.storeId mismatch');
        return;
      }
      setOrder(data);
    } catch (e) {
      setError(e.message || 'Failed to load order details.');
    } finally {
      setLoading(false);
    }
  }, [id, activeStore]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order) return;
    setUpdatingStatus(true);
    try {
      const updated = await ordersService.updateOrderStatus(order.id, {
        status: newStatus,
        notifyCustomer: true,
      });
      setOrder(updated);
      showAlert(
        'Status Updated',
        `Order #${order.orderNumber} is now ${statusLabels[newStatus] || newStatus}.`
      );
    } catch (e) {
      showAlert('Update Failed', e.message || 'Could not update order status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={BrandColors.primary[500]} />
          <BodyText style={{ marginTop: 12, color: BrandColors.text.secondary }}>
            Loading order...
          </BodyText>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={64} color={BrandColors.error[400]} />
          <Heading3 style={{ marginTop: 12 }}>Failed to Load Order</Heading3>
          <BodyText
            style={{
              color: BrandColors.text.secondary,
              textAlign: 'center',
              marginTop: 8,
              paddingHorizontal: 32,
            }}
          >
            {error || 'Order not found.'}
          </BodyText>
          <Button title="Try Again" onPress={fetchOrder} style={{ marginTop: 20 }} />
        </View>
      </SafeAreaView>
    );
  }

  const orderId = order.id || (order as unknown as { _id?: string })._id;
  const currentStatus = (order.status || '').toLowerCase();
  const nextStatuses = STATUS_TRANSITIONS[currentStatus] || [];
  const statusColor = statusColors[currentStatus as OrderStatus] || BrandColors.primary[500];
  const totals = (order.totals || {}) as Record<string, unknown>;
  const pricing = (order.pricing || {}) as Record<string, unknown>;
  const subtotal = totals.subtotal ?? pricing.subtotal ?? pricing.totalAmount ?? 0;
  const tax = totals.tax ?? pricing.tax ?? pricing.taxAmount ?? 0;
  const delivery = totals.delivery ?? pricing.delivery ?? pricing.shippingAmount ?? 0;
  const discount = totals.discount ?? pricing.discount ?? pricing.discountAmount ?? 0;
  const total = totals.total ?? pricing.totalAmount ?? 0;
  const paymentMethod = order.payment?.method || '';
  const paymentMethodLabel =
    paymentMethodLabels[paymentMethod.toLowerCase()] || paymentMethod || 'N/A';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Header Card */}
        <Card style={styles.headerCard} variant="elevated">
          <View style={styles.orderHeaderRow}>
            <View style={styles.orderNumberSection}>
              <BodyText style={styles.orderNumberLabel}>ORDER</BodyText>
              <Heading2 style={styles.orderNumber}>#{order.orderNumber || 'N/A'}</Heading2>
            </View>
            <View style={[styles.statusBadgeLarge, { backgroundColor: `${statusColor}15` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {(statusLabels[currentStatus] || order.status || '').replace(/_/g, ' ')}
              </Text>
            </View>
          </View>

          <View style={styles.headerDivider} />

          <View style={styles.orderMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color={BrandColors.text.tertiary} />
              <Caption style={styles.metaLabel}>Placed</Caption>
              <BodyText style={styles.metaValue}>{formatDate(order.createdAt)}</BodyText>
            </View>
            {order.delivery?.method && (
              <View style={styles.metaItem}>
                <Ionicons
                  name={
                    order.delivery.method === 'delivery'
                      ? 'bicycle'
                      : order.delivery.method === 'dine_in'
                        ? 'restaurant'
                        : 'bag-handle'
                  }
                  size={16}
                  color={BrandColors.text.tertiary}
                />
                <Caption style={styles.metaLabel}>Type</Caption>
                <BodyText style={[styles.metaValue, { textTransform: 'capitalize' }]}>
                  {order.delivery.method.replace(/_/g, ' ')}
                </BodyText>
              </View>
            )}
            {order.payment?.method && (
              <View style={styles.metaItem}>
                <Ionicons
                  name={
                    paymentMethod === 'cod' || paymentMethod === 'cash'
                      ? 'cash'
                      : paymentMethod === 'upi'
                        ? 'phone-portrait'
                        : 'card'
                  }
                  size={16}
                  color={BrandColors.text.tertiary}
                />
                <Caption style={styles.metaLabel}>Payment</Caption>
                <BodyText style={styles.metaValue}>{paymentMethodLabel}</BodyText>
              </View>
            )}
          </View>
        </Card>

        {/* Customer Card */}
        <Card style={styles.sectionCard} variant="elevated">
          <Heading3 style={styles.sectionTitle}>Customer</Heading3>
          <View style={styles.customerRow}>
            <View style={[styles.customerAvatar, { backgroundColor: BrandColors.primary[50] }]}>
              <Text style={[styles.customerInitial, { color: BrandColors.primary[500] }]}>
                {(order.customer?.name || '?')[0]?.toUpperCase()}
              </Text>
            </View>
            <View style={styles.customerInfo}>
              <BodyText style={styles.customerName}>
                {order.customer?.name || 'Unknown Customer'}
              </BodyText>
              {order.customer?.phone && (
                <View style={styles.customerContactRow}>
                  <Ionicons name="call-outline" size={14} color={BrandColors.text.secondary} />
                  <Caption style={styles.customerContact}>{order.customer.phone}</Caption>
                </View>
              )}
              {order.customer?.email && (
                <View style={styles.customerContactRow}>
                  <Ionicons name="mail-outline" size={14} color={BrandColors.text.secondary} />
                  <Caption style={styles.customerContact}>{order.customer.email}</Caption>
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Items Card */}
        <Card style={styles.sectionCard} variant="elevated">
          <Heading3 style={styles.sectionTitle}>Items ({order.items?.length ?? 0})</Heading3>
          {order.items && order.items.length > 0 ? (
            order.items.map((item, index) => {
              const itemTotal = getItemTotal(item);
              const itemName = item.productName || item.name || 'Unknown Item';
              return (
                <View
                  key={`${item.id || item._id || index}-${index}`}
                  style={[styles.itemRow, index < order.items.length - 1 && styles.itemRowBorder]}
                >
                  <View style={styles.itemLeft}>
                    <BodyText style={styles.itemName}>{itemName}</BodyText>
                    {(item.notes || item.specialInstructions) && (
                      <Caption style={styles.itemNotes}>
                        {item.notes || item.specialInstructions}
                      </Caption>
                    )}
                    {item.customizations && item.customizations.length > 0 && (
                      <Caption style={styles.itemNotes}>{item.customizations.join(', ')}</Caption>
                    )}
                  </View>
                  <View style={styles.itemRight}>
                    <Caption style={styles.itemQty}>x{item.quantity}</Caption>
                    <BodyText style={styles.itemPrice}>{formatCurrency(itemTotal)}</BodyText>
                  </View>
                </View>
              );
            })
          ) : (
            <BodyText style={styles.emptyText}>No items in this order.</BodyText>
          )}
        </Card>

        {/* Totals Card */}
        <Card style={styles.sectionCard} variant="elevated">
          <Heading3 style={styles.sectionTitle}>Bill Summary</Heading3>

          <View style={styles.totalsTable}>
            <View style={styles.totalRow}>
              <BodyText style={styles.totalLabel}>Subtotal</BodyText>
              <BodyText style={styles.totalValue}>{formatCurrency(subtotal)}</BodyText>
            </View>
            {tax > 0 && (
              <View style={styles.totalRow}>
                <BodyText style={styles.totalLabel}>Tax</BodyText>
                <BodyText style={styles.totalValue}>{formatCurrency(tax)}</BodyText>
              </View>
            )}
            {delivery > 0 && (
              <View style={styles.totalRow}>
                <BodyText style={styles.totalLabel}>Delivery</BodyText>
                <BodyText style={styles.totalValue}>{formatCurrency(delivery)}</BodyText>
              </View>
            )}
            {discount > 0 && (
              <View style={styles.totalRow}>
                <BodyText style={[styles.totalLabel, { color: BrandColors.success[600] }]}>
                  Discount
                </BodyText>
                <BodyText style={[styles.totalValue, { color: BrandColors.success[600] }]}>
                  -{formatCurrency(discount)}
                </BodyText>
              </View>
            )}
            {totals.cashback > 0 && (
              <View style={styles.totalRow}>
                <BodyText style={styles.totalLabel}>Cashback</BodyText>
                <BodyText style={[styles.totalValue, { color: BrandColors.success[600] }]}>
                  +{formatCurrency(totals.cashback)}
                </BodyText>
              </View>
            )}

            <View style={styles.totalDivider} />

            <View style={styles.grandTotalRow}>
              <Heading3 style={styles.grandTotalLabel}>Total</Heading3>
              <Heading2 style={styles.grandTotalValue}>{formatCurrency(total)}</Heading2>
            </View>

            {totals.paidAmount !== undefined && totals.paidAmount > 0 && (
              <View style={styles.totalRow}>
                <BodyText style={[styles.totalLabel, { color: BrandColors.success[600] }]}>
                  Paid Amount
                </BodyText>
                <BodyText style={[styles.totalValue, { color: BrandColors.success[600] }]}>
                  {formatCurrency(totals.paidAmount)}
                </BodyText>
              </View>
            )}
            {totals.refundAmount !== undefined && totals.refundAmount > 0 && (
              <View style={styles.totalRow}>
                <BodyText style={[styles.totalLabel, { color: BrandColors.error[500] }]}>
                  Refunded
                </BodyText>
                <BodyText style={[styles.totalValue, { color: BrandColors.error[500] }]}>
                  {formatCurrency(totals.refundAmount)}
                </BodyText>
              </View>
            )}
          </View>
        </Card>

        {/* Delivery Address Card (if available) */}
        {order.delivery?.address && (
          <Card style={styles.sectionCard} variant="elevated">
            <Heading3 style={styles.sectionTitle}>Delivery Address</Heading3>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={18} color={BrandColors.primary[500]} />
              <BodyText style={styles.addressText}>
                {[
                  order.delivery.address.addressLine1 || order.delivery.address.street,
                  order.delivery.address.city,
                  order.delivery.address.state,
                  order.delivery.address.pincode || order.delivery.address.zipCode,
                ]
                  .filter(Boolean)
                  .join(', ') || 'No address provided'}
              </BodyText>
            </View>
            {order.delivery.instructions && (
              <View style={styles.addressRow}>
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color={BrandColors.text.secondary}
                />
                <Caption style={styles.addressText}>{order.delivery.instructions}</Caption>
              </View>
            )}
          </Card>
        )}

        {/* Notes Card */}
        {(order.notes || order.specialInstructions) && (
          <Card style={styles.sectionCard} variant="elevated">
            <Heading3 style={styles.sectionTitle}>Notes</Heading3>
            <BodyText style={styles.notesText}>{order.notes || order.specialInstructions}</BodyText>
          </Card>
        )}

        {/* Action Buttons */}
        {nextStatuses.length > 0 && (
          <Card style={styles.actionsCard} variant="elevated">
            <Heading3 style={styles.sectionTitle}>Actions</Heading3>
            <Caption style={styles.currentStatusLabel}>
              Current: {(statusLabels[currentStatus] || currentStatus).replace(/_/g, ' ')}
            </Caption>
            <View style={styles.actionsGrid}>
              {nextStatuses.map((nextStatus) => {
                const nextColor =
                  statusColors[nextStatus as OrderStatus] || BrandColors.primary[500];
                const isDestructive = nextStatus === 'cancelled';
                return (
                  <TouchableOpacity
                    key={nextStatus}
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: isDestructive
                          ? `${BrandColors.error[500]}15`
                          : `${nextColor}15`,
                        borderColor: isDestructive ? BrandColors.error[500] : nextColor,
                      },
                    ]}
                    onPress={() => handleStatusUpdate(nextStatus as OrderStatus)}
                    disabled={updatingStatus}
                    activeOpacity={0.7}
                  >
                    {updatingStatus ? (
                      <ActivityIndicator size="small" color={nextColor} />
                    ) : (
                      <>
                        <View
                          style={[
                            styles.actionDot,
                            { backgroundColor: isDestructive ? BrandColors.error[500] : nextColor },
                          ]}
                        />
                        <Text
                          style={[
                            styles.actionButtonText,
                            { color: isDestructive ? BrandColors.error[500] : nextColor },
                          ]}
                        >
                          {(statusLabels[nextStatus] || nextStatus).replace(/_/g, ' ')}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={isDestructive ? BrandColors.error[500] : nextColor}
                        />
                      </>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        )}

        {/* Spacer for bottom safe area */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.gray[50],
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  headerCard: {
    gap: 0,
    overflow: 'hidden',
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.lg,
  },
  orderNumberSection: {
    gap: 4,
  },
  orderNumberLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: BrandColors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  orderNumber: {
    color: BrandColors.text.primary,
    fontWeight: '800',
    fontSize: 26,
  },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontWeight: '700',
    fontSize: 13,
    textTransform: 'capitalize',
  },
  headerDivider: {
    height: 1,
    backgroundColor: BrandColors.border.light,
    marginHorizontal: Spacing.lg,
  },
  orderMeta: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  metaItem: {
    alignItems: 'flex-start',
    gap: 4,
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: BrandColors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.text.primary,
  },
  sectionCard: {
    gap: Spacing.md,
  },
  sectionTitle: {
    color: BrandColors.text.primary,
    marginBottom: Spacing.xs,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  customerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: BrandColors.primary[100],
  },
  customerInitial: {
    fontSize: 22,
    fontWeight: '700',
  },
  customerInfo: {
    flex: 1,
    gap: 4,
  },
  customerName: {
    fontWeight: '700',
    fontSize: 16,
    color: BrandColors.text.primary,
  },
  customerContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customerContact: {
    color: BrandColors.text.secondary,
    fontSize: 13,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border.light,
  },
  itemLeft: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontWeight: '600',
    fontSize: 15,
    color: BrandColors.text.primary,
  },
  itemNotes: {
    color: BrandColors.text.secondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  itemQty: {
    color: BrandColors.text.tertiary,
    fontSize: 12,
    fontWeight: '600',
  },
  itemPrice: {
    fontWeight: '700',
    fontSize: 15,
    color: BrandColors.text.primary,
  },
  emptyText: {
    color: BrandColors.text.secondary,
    fontStyle: 'italic',
  },
  totalsTable: {
    gap: Spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: BrandColors.text.secondary,
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.text.primary,
  },
  totalDivider: {
    height: 1,
    backgroundColor: BrandColors.border.light,
    marginVertical: Spacing.sm,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: {
    color: BrandColors.text.primary,
    fontWeight: '800',
  },
  grandTotalValue: {
    color: BrandColors.primary[700],
    fontWeight: '800',
    fontSize: 22,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: BrandColors.text.primary,
    lineHeight: 20,
  },
  notesText: {
    fontSize: 14,
    color: BrandColors.text.secondary,
    lineHeight: 20,
  },
  actionsCard: {
    gap: Spacing.md,
  },
  currentStatusLabel: {
    color: BrandColors.text.secondary,
    fontSize: 12,
    marginTop: -Spacing.xs,
  },
  actionsGrid: {
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 10,
  },
  actionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionButtonText: {
    flex: 1,
    fontWeight: '700',
    fontSize: 15,
    textTransform: 'capitalize',
  },
});

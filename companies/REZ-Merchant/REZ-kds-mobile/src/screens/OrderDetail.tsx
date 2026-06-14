/**
 * KDS Mobile - OrderDetail Screen
 * Detailed view of a single order
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  KDSOrder,
  OrderItem,
  ItemStatus,
  OrderStatus,
  OrderPriority,
} from '../types';
import { useKDSStore } from '../store/kdsStore';
import { useOrderTimer } from '../hooks/useOrders';
import { kdsApi } from '../services/api';
import { kdsPrinter } from '../services/printer';
import { kdsNotifications } from '../services/notifications';
import {
  formatCurrency,
  formatDateTime,
  getPriorityColor,
  getStatusColor,
  getPriorityLabel,
  getStatusLabel,
  getItemStatusLabel,
  getStationLabel,
  canBumpOrder,
  getNextBumpStatus,
} from '../utils/helpers';
import { STATION_COLORS } from '../utils/constants';

type RootStackParamList = {
  Kitchen: undefined;
  OrderDetail: { orderId: string };
  Settings: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'OrderDetail'>;
type OrderDetailRouteProp = RouteProp<RootStackParamList, 'OrderDetail'>;

const OrderDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<OrderDetailRouteProp>();
  const { orderId } = route.params;

  const { orders, updateOrder, setSelectedOrder } = useKDSStore();

  // Find order
  const order = useMemo(() => {
    return orders.find((o) => o.id === orderId) || null;
  }, [orders, orderId]);

  // Timer
  const { formattedTime, timerColor, elapsedSeconds, isWarning, isCritical } =
    useOrderTimer(order || { id: '', orderNumber: '', displayNumber: '', status: OrderStatus.PENDING, priority: OrderPriority.NORMAL, items: [], customer: { id: '', name: '', orderCount: 0 }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), station: 'all', source: 'pos', paymentStatus: 'pending', totalAmount: 0, subtotal: 0, tax: 0, discount: 0, isTakeaway: false, isPreOrder: false });

  // Local state for note input
  const [noteInput, setNoteInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Update selected order in store
  useEffect(() => {
    if (order) {
      setSelectedOrder(order);
    }
    return () => setSelectedOrder(null);
  }, [order, setSelectedOrder]);

  // Handle bump
  const handleBump = useCallback(async () => {
    if (!order) return;

    const nextStatus = getNextBumpStatus(order.status);
    if (!nextStatus) return;

    setIsLoading(true);
    try {
      const updatedOrder = await kdsApi.updateOrderStatus(order.id, nextStatus);
      updateOrder(order.id, updatedOrder);
      await kdsNotifications.announceOrderBumped(order.displayNumber);

      if (nextStatus === OrderStatus.COMPLETED) {
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update order status.');
    } finally {
      setIsLoading(false);
    }
  }, [order, updateOrder, navigation]);

  // Handle item toggle
  const handleItemToggle = useCallback(
    async (itemId: string) => {
      if (!order) return;

      const item = order.items.find((i) => i.id === itemId);
      if (!item) return;

      const newStatus =
        item.status === ItemStatus.DONE ? ItemStatus.PENDING : ItemStatus.DONE;

      setIsLoading(true);
      try {
        const updatedOrder = await kdsApi.updateItemStatus(order.id, itemId, newStatus as unknown as OrderStatus);
        updateOrder(order.id, updatedOrder);
      } catch (error) {
        Alert.alert('Error', 'Failed to update item status.');
      } finally {
        setIsLoading(false);
      }
    },
    [order, updateOrder]
  );

  // Handle add note
  const handleAddNote = useCallback(async () => {
    if (!order || !noteInput.trim()) return;

    setIsLoading(true);
    try {
      const updatedOrder = await kdsApi.addOrderNote(order.id, noteInput.trim());
      updateOrder(order.id, updatedOrder);
      setNoteInput('');
      Alert.alert('Success', 'Note added successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to add note.');
    } finally {
      setIsLoading(false);
    }
  }, [order, noteInput, updateOrder]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (!order) return;

    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const updatedOrder = await kdsApi.cancelOrder(order.id, 'Cancelled by KDS');
              updateOrder(order.id, updatedOrder);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel order.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  }, [order, updateOrder, navigation]);

  // Handle reprint
  const handleReprint = useCallback(async () => {
    if (!order) return;

    try {
      await kdsPrinter.queuePrintJob(order, 'reprint');
      Alert.alert('Success', 'Ticket sent to printer.');
    } catch (error) {
      Alert.alert('Error', 'Failed to print ticket.');
    }
  }, [order]);

  // Handle recall
  const handleRecall = useCallback(async () => {
    if (!order) return;

    setIsLoading(true);
    try {
      const updatedOrder = await kdsApi.recallOrder(order.id);
      updateOrder(order.id, updatedOrder);
      Alert.alert('Success', 'Order recalled successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to recall order.');
    } finally {
      setIsLoading(false);
    }
  }, [order, updateOrder]);

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Order not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const priorityColor = getPriorityColor(order.priority);
  const statusColor = getStatusColor(order.status);
  const nextStatus = getNextBumpStatus(order.status);
  const canBump = canBumpOrder(order.status);
  const isCompleted = order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.headerButtonText}>BACK</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.orderNumber}>#{order.displayNumber}</Text>
          <View style={[styles.timerBadge, { borderColor: timerColor }]}>
            <Text style={[styles.timerText, { color: timerColor }]}>
              {formattedTime}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleReprint}>
            <Text style={styles.headerButtonText}>PRINT</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Order Info */}
        <View style={styles.infoSection}>
          {/* Priority & Status */}
          <View style={styles.infoRow}>
            <View style={[styles.badge, { backgroundColor: priorityColor }]}>
              <Text style={styles.badgeText}>
                {getPriorityLabel(order.priority)}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: statusColor }]}>
              <Text style={styles.badgeText}>
                {getStatusLabel(order.status)}
              </Text>
            </View>
            {order.isTakeaway && (
              <View style={[styles.badge, { backgroundColor: '#2196F3' }]}>
                <Text style={styles.badgeText}>TAKEAWAY</Text>
              </View>
            )}
            {order.isPreOrder && (
              <View style={[styles.badge, { backgroundColor: '#9C27B0' }]}>
                <Text style={styles.badgeText}>PRE-ORDER</Text>
              </View>
            )}
          </View>

          {/* Station */}
          <View style={styles.infoRow}>
            <View
              style={[
                styles.stationBadge,
                {
                  backgroundColor:
                    STATION_COLORS[order.station as keyof typeof STATION_COLORS] ||
                    '#607D8B',
                },
              ]}
            >
              <Text style={styles.stationBadgeText}>
                {Array.isArray(order.station)
                  ? order.station.map((s) => getStationLabel(s)).join(', ')
                  : getStationLabel(order.station)}
              </Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Source</Text>
              <Text style={styles.detailValue}>{order.source.toUpperCase()}</Text>
            </View>
            {order.tableNumber && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Table</Text>
                <Text style={styles.detailValue}>{order.tableNumber}</Text>
              </View>
            )}
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Placed</Text>
              <Text style={styles.detailValue}>
                {formatDateTime(order.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Info */}
        {order.customer && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CUSTOMER</Text>
            <View style={styles.customerCard}>
              <Text style={styles.customerName}>{order.customer.name}</Text>
              {order.customer.loyaltyTier && (
                <View style={styles.loyaltyBadge}>
                  <Text style={styles.loyaltyText}>
                    {order.customer.loyaltyTier.toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.orderCount}>
                {order.customer.orderCount} orders
              </Text>
            </View>
          </View>
        )}

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ITEMS ({order.items.length})</Text>
          <View style={styles.itemsList}>
            {order.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemCard,
                  item.status === ItemStatus.DONE && styles.itemCardDone,
                ]}
                onPress={() => handleItemToggle(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.itemHeader}>
                  <View style={styles.itemInfo}>
                    <Text
                      style={[
                        styles.itemName,
                        item.status === ItemStatus.DONE && styles.itemNameDone,
                      ]}
                    >
                      {item.quantity}x {item.name}
                    </Text>
                    {item.customizations && item.customizations.length > 0 && (
                      <Text style={styles.itemCustomizations}>
                        {item.customizations.join(', ')}
                      </Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.itemStatus,
                      {
                        backgroundColor:
                          item.status === ItemStatus.DONE
                            ? '#4CAF50'
                            : '#3a3a4e',
                      },
                    ]}
                  >
                    <Text style={styles.itemStatusText}>
                      {getItemStatusLabel(item.status)}
                    </Text>
                  </View>
                </View>
                {item.notes && (
                  <View style={styles.itemNotes}>
                    <Text style={styles.itemNotesText}>Note: {item.notes}</Text>
                  </View>
                )}
                {item.modifiers && item.modifiers.length > 0 && (
                  <View style={styles.itemModifiers}>
                    {item.modifiers.map((mod) => (
                      <Text key={mod.id} style={styles.modifierText}>
                        {mod.type === 'add' ? '+' : mod.type === 'remove' ? '-' : '~'}{' '}
                        {mod.name}
                      </Text>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Special Instructions */}
        {order.specialInstructions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SPECIAL INSTRUCTIONS</Text>
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsText}>
                {order.specialInstructions}
              </Text>
            </View>
          </View>
        )}

        {/* Add Note */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ADD NOTE</Text>
          <View style={styles.noteInputContainer}>
            <TextInput
              style={styles.noteInput}
              value={noteInput}
              onChangeText={setNoteInput}
              placeholder="Enter note..."
              placeholderTextColor="#666666"
              multiline
            />
            <TouchableOpacity
              style={[
                styles.addNoteButton,
                !noteInput.trim() && styles.addNoteButtonDisabled,
              ]}
              onPress={handleAddNote}
              disabled={!noteInput.trim() || isLoading}
            >
              <Text style={styles.addNoteButtonText}>ADD</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes History */}
        {order.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NOTES</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{order.notes}</Text>
            </View>
          </View>
        )}

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUMMARY</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(order.subtotal)}
              </Text>
            </View>
            {order.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                  -{formatCurrency(order.discount)}
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(order.tax)}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(order.totalAmount)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payment</Text>
              <Text style={styles.summaryValue}>
                {order.paymentStatus.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Spacer for bottom buttons */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        {isCompleted ? (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.recallButton]}
              onPress={handleRecall}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>RECALL ORDER</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>CANCEL</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {canBump && nextStatus && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.bumpButton,
                  { backgroundColor: statusColor },
                ]}
                onPress={handleBump}
                disabled={isLoading}
              >
                <Text style={styles.actionButtonText}>
                  {nextStatus === OrderStatus.ACKNOWLEDGED
                    ? 'ACKNOWLEDGE'
                    : nextStatus === OrderStatus.IN_PROGRESS
                    ? 'START COOKING'
                    : nextStatus === OrderStatus.READY
                    ? 'MARK READY'
                    : 'BUMP'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>CANCEL ORDER</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121220',
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  notFoundText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  backButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#2a2a3e',
    borderRadius: 6,
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerCenter: {
    alignItems: 'center',
    gap: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  orderNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  timerBadge: {
    borderWidth: 2,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  infoSection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  stationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  detailItem: {},
  detailLabel: {
    color: '#666666',
    fontSize: 11,
    marginBottom: 2,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#888888',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  customerCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  loyaltyBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  loyaltyText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  orderCount: {
    color: '#888888',
    fontSize: 12,
  },
  itemsList: {
    gap: 8,
  },
  itemCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3a3a4e',
  },
  itemCardDone: {
    opacity: 0.6,
    borderLeftColor: '#4CAF50',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  itemNameDone: {
    textDecorationLine: 'line-through',
    color: '#888888',
  },
  itemCustomizations: {
    color: '#888888',
    fontSize: 13,
    marginTop: 4,
  },
  itemStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  itemStatusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemNotes: {
    backgroundColor: '#2a2a3e',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  itemNotesText: {
    color: '#FFC107',
    fontSize: 12,
    fontStyle: 'italic',
  },
  itemModifiers: {
    marginTop: 8,
    gap: 4,
  },
  modifierText: {
    color: '#9C27B0',
    fontSize: 12,
  },
  instructionsCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  instructionsText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  noteInputContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
  },
  noteInput: {
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  addNoteButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  addNoteButtonDisabled: {
    backgroundColor: '#3a3a4e',
  },
  addNoteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  notesCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
  },
  notesText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  summaryCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#888888',
    fontSize: 14,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#3a3a4e',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bumpButton: {
    backgroundColor: '#2196F3',
  },
  recallButton: {
    backgroundColor: '#607D8B',
  },
  cancelButton: {
    backgroundColor: '#3a3a4e',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default OrderDetailScreen;

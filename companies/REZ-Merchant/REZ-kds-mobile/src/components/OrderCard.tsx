/**
 * KDS Mobile - OrderCard Component
 * Displays individual order cards in the kitchen queue
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  KDSOrder,
  OrderItem,
  ItemStatus,
  OrderPriority,
  OrderStatus,
} from '../types';
import { useOrderTimer } from '../hooks/useOrders';
import {
  formatCurrency,
  getPriorityColor,
  getStatusColor,
  getStationColor,
  getPriorityLabel,
  getStatusLabel,
  getStationLabel,
  getOrderSummary,
} from '../utils/helpers';
import { PRIORITY_COLORS, STATUS_COLORS, STATION_COLORS } from '../utils/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Animation constants
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface OrderCardProps {
  order: KDSOrder;
  onPress: (order: KDSOrder) => void;
  onBump: (orderId: string) => void;
  onRecall?: (orderId: string) => void;
  showPrice?: boolean;
  compact?: boolean;
  index?: number;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onPress,
  onBump,
  onRecall,
  showPrice = false,
  compact = false,
  index = 0,
}) => {
  const {
    elapsedSeconds,
    formattedTime,
    timerColor,
    isWarning,
    isCritical,
    isUrgent,
  } = useOrderTimer(order);

  // Animation values
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Calculate animation delay based on index
  const animationDelay = index * 50;

  // Trigger entrance animation
  React.useEffect(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 100 });
    opacity.value = withTiming(1, { duration: 300 });
  }, []);

  // Swipe gesture for bump
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow swipe in one direction based on status
      if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) {
        translateX.value = event.translationX;
      } else if (event.translationX < 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (event.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 200 });
        runOnJS(onBump)(order.id);
      } else {
        translateX.value = withSpring(0);
      }
    });

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const backgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      translateX.value,
      [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
      ['#4CAF50', 'transparent', '#F44336']
    );
    return { backgroundColor };
  });

  // Priority indicator
  const priorityColor = getPriorityColor(order.priority);
  const statusColor = getStatusColor(order.status);

  // Order summary
  const itemSummary = useMemo(() => {
    const summary = getOrderSummary(
      order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
      }))
    );
    return summary;
  }, [order.items]);

  // Completed items count
  const completedItems = useMemo(() => {
    return order.items.filter((item) => item.status === ItemStatus.DONE).length;
  }, [order.items]);

  const totalItems = order.items.length;

  // Source icon/label
  const sourceLabel = order.source.toUpperCase();

  // Handle card press
  const handlePress = useCallback(() => {
    scale.value = withSpring(0.98, { damping: 15 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 15 });
    }, 100);
    onPress(order);
  }, [order, onPress, scale]);

  // Handle bump
  const handleBump = useCallback(() => {
    translateX.value = withTiming(-SCREEN_WIDTH, { duration: 200 });
    onBump(order.id);
  }, [order.id, onBump, translateX]);

  // Get station label
  const stationLabel = useMemo(() => {
    if (Array.isArray(order.station)) {
      return order.station.map((s) => getStationLabel(s)).join(', ');
    }
    return getStationLabel(order.station);
  }, [order.station]);

  return (
    <View style={styles.container}>
      {/* Background action indicator */}
      <Animated.View style={[styles.actionBackground, backgroundStyle]}>
        <Text style={styles.actionText}>
          {order.status === OrderStatus.COMPLETED ? 'RECALL' : 'BUMP'}
        </Text>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle}>
          <Pressable
            onPress={handlePress}
            style={[
              styles.card,
              compact && styles.cardCompact,
              isCritical && styles.cardCritical,
              isUrgent && styles.cardUrgent,
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View
                  style={[styles.priorityBadge, { backgroundColor: priorityColor }]}
                >
                  <Text style={styles.priorityText}>
                    {getPriorityLabel(order.priority)}
                  </Text>
                </View>
                <View style={[styles.sourceBadge]}>
                  <Text style={styles.sourceText}>{sourceLabel}</Text>
                </View>
              </View>
              <View style={[styles.timer, { borderColor: timerColor }]}>
                <Text style={[styles.timerText, { color: timerColor }]}>
                  {formattedTime}
                </Text>
              </View>
            </View>

            {/* Order Number */}
            <View style={styles.orderNumberContainer}>
              <Text style={styles.orderNumber}>#{order.displayNumber}</Text>
              {order.tableNumber && (
                <Text style={styles.tableNumber}>T{order.tableNumber}</Text>
              )}
              {order.isTakeaway && (
                <View style={styles.takeawayBadge}>
                  <Text style={styles.takeawayText}>TAKEAWAY</Text>
                </View>
              )}
            </View>

            {/* Station */}
            <View style={styles.stationContainer}>
              <View
                style={[
                  styles.stationBadge,
                  { backgroundColor: STATION_COLORS[order.station as keyof typeof STATION_COLORS] || STATION_COLORS.all },
                ]}
              >
                <Text style={styles.stationText}>{stationLabel}</Text>
              </View>
            </View>

            {/* Items */}
            <View style={styles.itemsContainer}>
              {order.items.slice(0, compact ? 3 : 5).map((item, idx) => (
                <View
                  key={item.id}
                  style={[
                    styles.itemRow,
                    item.status === ItemStatus.DONE && styles.itemDone,
                  ]}
                >
                  <View style={styles.itemLeft}>
                    <Text
                      style={[
                        styles.itemQuantity,
                        item.status === ItemStatus.DONE && styles.itemTextDone,
                      ]}
                    >
                      {item.quantity}x
                    </Text>
                    <Text
                      style={[
                        styles.itemName,
                        item.status === ItemStatus.DONE && styles.itemTextDone,
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                  </View>
                  {item.notes && (
                    <Text style={styles.itemNote} numberOfLines={1}>
                      {item.notes}
                    </Text>
                  )}
                </View>
              ))}
              {order.items.length > (compact ? 3 : 5) && (
                <Text style={styles.moreItems}>
                  +{order.items.length - (compact ? 3 : 5)} more items
                </Text>
              )}
            </View>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(completedItems / totalItems) * 100}%`,
                      backgroundColor: statusColor,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {completedItems}/{totalItems}
              </Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.footerLeft}>
                {order.customer?.name && (
                  <Text style={styles.customerName} numberOfLines={1}>
                    {order.customer.name}
                  </Text>
                )}
              </View>
              <View style={styles.footerRight}>
                {showPrice && (
                  <Text style={styles.price}>
                    {formatCurrency(order.totalAmount)}
                  </Text>
                )}
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                  <Text style={styles.statusText}>
                    {getStatusLabel(order.status)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Bump button */}
            {order.status !== OrderStatus.COMPLETED &&
              order.status !== OrderStatus.CANCELLED && (
                <TouchableOpacity
                  style={[styles.bumpButton, { backgroundColor: statusColor }]}
                  onPress={handleBump}
                  activeOpacity={0.8}
                >
                  <Text style={styles.bumpButtonText}>BUMP</Text>
                </TouchableOpacity>
              )}

            {/* Recall button */}
            {(order.status === OrderStatus.COMPLETED ||
              order.status === OrderStatus.CANCELLED) &&
              onRecall && (
                <TouchableOpacity
                  style={[styles.recallButton]}
                  onPress={() => onRecall(order.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.recallButtonText}>RECALL</Text>
                </TouchableOpacity>
              )}
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 8,
    position: 'relative',
  },
  actionBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
    padding: 12,
    minWidth: 260,
    maxWidth: 300,
    borderWidth: 2,
    borderColor: '#2A2A3E',
  },
  cardCompact: {
    padding: 10,
    minWidth: 220,
  },
  cardCritical: {
    borderColor: '#FF9800',
    borderWidth: 3,
  },
  cardUrgent: {
    borderColor: '#F44336',
    borderWidth: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    gap: 6,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sourceBadge: {
    backgroundColor: '#3A3A4E',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sourceText: {
    color: '#AAAAAA',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timer: {
    borderWidth: 2,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  timerText: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  orderNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  orderNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tableNumber: {
    fontSize: 16,
    color: '#FF9800',
    fontWeight: 'bold',
  },
  takeawayBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  takeawayText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  stationContainer: {
    marginBottom: 8,
  },
  stationBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemsContainer: {
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
  },
  itemDone: {
    opacity: 0.5,
  },
  itemLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  itemQuantity: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 6,
    minWidth: 30,
  },
  itemName: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  itemTextDone: {
    textDecorationLine: 'line-through',
  },
  itemNote: {
    color: '#FFC107',
    fontSize: 11,
    fontStyle: 'italic',
    marginLeft: 8,
  },
  moreItems: {
    color: '#888888',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#3A3A4E',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    color: '#888888',
    fontSize: 12,
    minWidth: 30,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flex: 1,
  },
  customerName: {
    color: '#AAAAAA',
    fontSize: 12,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  bumpButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  bumpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recallButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#607D8B',
  },
  recallButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OrderCard;

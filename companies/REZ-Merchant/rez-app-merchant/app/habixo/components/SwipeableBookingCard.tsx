// Habixo Swipeable Booking Card Component
// Swipe actions for confirming/declining bookings
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder } from 'react-native';
import { useRef } from 'react';

// Types
export interface SwipeableBookingCardProps {
  id: string;
  guestName: string;
  guestAvatar?: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  amount: number;
  status: 'pending' | 'upcoming' | 'confirmed' | 'completed' | 'cancelled';
  paymentStatus: 'paid' | 'pending' | 'refunded';
  onConfirm?: (id: string) => void;
  onDecline?: (id: string) => void;
  onPress?: (id: string) => void;
  children?: React.ReactNode;
}

const ACTION_WIDTH = 80;
const SWIPE_THRESHOLD = ACTION_WIDTH * 0.4;

const STATUS_COLORS = {
  pending: { bg: '#fef3c7', text: '#92400e' },
  upcoming: { bg: '#dbeafe', text: '#1e40af' },
  confirmed: { bg: '#dcfce7', text: '#166534' },
  completed: { bg: '#f3f4f6', text: '#6b7280' },
  cancelled: { bg: '#fee2e2', text: '#991b1b' },
};

export function SwipeableBookingCard({
  id,
  guestName,
  guestAvatar,
  propertyName,
  checkIn,
  checkOut,
  amount,
  status,
  paymentStatus,
  onConfirm,
  onDecline,
  onPress,
  children,
}: SwipeableBookingCardProps) {
  const pan = useRef(new Animated.Value(0)).current;
  const isSwipedOpen = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        // Limit swipe range
        const maxSwipe = ACTION_WIDTH * 2;
        const clampedValue = Math.max(-maxSwipe, Math.min(0, gestureState.dx));
        pan.setValue(clampedValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Swipe left - show actions
          Animated.spring(pan, {
            toValue: -ACTION_WIDTH * 2,
            useNativeDriver: true,
            friction: 8,
          }).start();
          isSwipedOpen.current = true;
        } else if (gestureState.dx > SWIPE_THRESHOLD) {
          // Swipe right - hide actions
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
          isSwipedOpen.current = false;
        } else {
          // Snap back
          Animated.spring(pan, {
            toValue: isSwipedOpen.current ? -ACTION_WIDTH * 2 : 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const handleConfirm = () => {
    onConfirm?.(id);
    Animated.spring(pan, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
    isSwipedOpen.current = false;
  };

  const handleDecline = () => {
    onDecline?.(id);
    Animated.spring(pan, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
    isSwipedOpen.current = false;
  };

  const handlePress = () => {
    if (isSwipedOpen.current) {
      Animated.spring(pan, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();
      isSwipedOpen.current = false;
    } else {
      onPress?.(id);
    }
  };

  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.pending;

  return (
    <View style={styles.container}>
      {/* Background actions */}
      <View style={styles.actionsContainer}>
        {/* Decline action (right side) */}
        <TouchableOpacity
          style={[styles.action, styles.declineAction]}
          onPress={handleDecline}
        >
          <Text style={styles.actionIcon}>❌</Text>
          <Text style={styles.actionText}>Decline</Text>
        </TouchableOpacity>

        {/* Confirm action (left side) */}
        <TouchableOpacity
          style={[styles.action, styles.confirmAction]}
          onPress={handleConfirm}
        >
          <Text style={styles.actionIcon}>✅</Text>
          <Text style={styles.actionText}>Confirm</Text>
        </TouchableOpacity>
      </View>

      {/* Card content */}
      <Animated.View
        style={[styles.card, { transform: [{ translateX: pan }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.cardTouchable}
          onPress={handlePress}
          activeOpacity={0.9}
        >
          {/* Status badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusText, { color: statusColor.text }]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.guestInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {guestName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.guestName}>{guestName}</Text>
                  <Text style={styles.propertyName} numberOfLines={1}>
                    {propertyName}
                  </Text>
                </View>
              </View>
              <View style={styles.amountContainer}>
                <Text style={styles.amount}>₹{amount.toLocaleString()}</Text>
                <Text style={styles.paymentStatus}>
                  {paymentStatus === 'paid' ? '✓ Paid' : '⏳ Pending'}
                </Text>
              </View>
            </View>

            <View style={styles.dateRow}>
              <Text style={styles.dateText}>
                📅 {checkIn} → {checkOut}
              </Text>
            </View>

            {/* Pending actions hint */}
            {status === 'pending' && (
              <View style={styles.hintContainer}>
                <Text style={styles.hintText}>
                  ← Swipe to confirm or decline →
                </Text>
              </View>
            )}

            {/* Children for additional content */}
            {children}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// Quick Action Buttons (alternative to swipe)
export function QuickActionButtons({
  onConfirm,
  onDecline,
  onMessage,
  onCall,
}: {
  onConfirm?: () => void;
  onDecline?: () => void;
  onMessage?: () => void;
  onCall?: () => void;
}) {
  return (
    <View style={styles.quickActions}>
      {onConfirm && (
        <TouchableOpacity style={styles.quickActionButton} onPress={onConfirm}>
          <Text style={styles.quickActionIcon}>✅</Text>
          <Text style={styles.quickActionText}>Accept</Text>
        </TouchableOpacity>
      )}
      {onDecline && (
        <TouchableOpacity
          style={[styles.quickActionButton, styles.declineButton]}
          onPress={onDecline}
        >
          <Text style={styles.quickActionIcon}>❌</Text>
          <Text style={styles.quickActionText}>Decline</Text>
        </TouchableOpacity>
      )}
      {onMessage && (
        <TouchableOpacity style={styles.quickActionButton} onPress={onMessage}>
          <Text style={styles.quickActionIcon}>💬</Text>
          <Text style={styles.quickActionText}>Message</Text>
        </TouchableOpacity>
      )}
      {onCall && (
        <TouchableOpacity style={styles.quickActionButton} onPress={onCall}>
          <Text style={styles.quickActionIcon}>📞</Text>
          <Text style={styles.quickActionText}>Call</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  action: {
    width: ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmAction: {
    backgroundColor: '#10b981',
  },
  declineAction: {
    backgroundColor: '#ef4444',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTouchable: {
    padding: 16,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingRight: 80, // Space for status badge
  },
  guestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  guestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  propertyName: {
    fontSize: 13,
    color: '#6b7280',
    maxWidth: 180,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  paymentStatus: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  dateRow: {
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 13,
    color: '#374151',
  },
  hintContainer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  hintText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  // Quick action buttons
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  declineButton: {
    backgroundColor: '#fee2e2',
  },
  quickActionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
});

export default SwipeableBookingCard;

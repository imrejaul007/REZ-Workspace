import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useGo, GoCartItem } from '@/components/go/GoContext';
import { SavingsMeter } from '@/components/go/SavingsMeter';

export default function CartScreen() {
  const router = useRouter();
  const {
    activeSession,
    cartSummary,
    updateQuantity,
    removeItem,
    cancelSession,
  } = useGo();

  if (!activeSession) {
    return (
      <>
        <Stack.Screen options={{ title: 'Cart' }} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No active shopping session</Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => router.push('/go')}
          >
            <Text style={styles.startButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  const handleQuantityChange = (item: GoCartItem, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      Alert.alert(
        'Remove Item',
        `Remove ${item.name} from cart?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => removeItem(item.productId) },
        ]
      );
    } else {
      updateQuantity(item.productId, newQty);
    }
  };

  const handleRemove = (item: GoCartItem) => {
    Alert.alert(
      'Remove Item',
      `Remove ${item.name} from cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeItem(item.productId) },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Shopping',
      'Are you sure you want to cancel this shopping session? All items will be removed.',
      [
        { text: 'Keep Shopping', style: 'cancel' },
        {
          text: 'Cancel Session',
          style: 'destructive',
          onPress: async () => {
            await cancelSession();
            router.replace('/go');
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: GoCartItem }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemBarcode}>{item.barcode}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.itemPrice}>₹{item.price}</Text>
          {item.mrp && item.mrp > item.price && (
            <Text style={styles.mrpPrice}>₹{item.mrp}</Text>
          )}
          {item.cashbackPercent > 0 && (
            <View style={styles.cashbackBadge}>
              <Text style={styles.cashbackText}>+{item.cashbackPercent}% cashback</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.quantityControls}>
        <TouchableOpacity
          style={styles.qtyButton}
          onPress={() => handleQuantityChange(item, -1)}
        >
          <Text style={styles.qtyButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.qtyValue}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.qtyButton}
          onPress={() => handleQuantityChange(item, 1)}
        >
          <Text style={styles.qtyButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.itemTotal}>₹{(item.price * item.quantity).toFixed(2)}</Text>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: activeSession.storeName,
          headerRight: () => (
            <TouchableOpacity onPress={handleCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        {/* Savings Meter */}
        {cartSummary && cartSummary.totalSaved > 0 && (
          <SavingsMeter
            saved={cartSummary.totalSaved}
            cashback={cartSummary.cashbackEarned}
            compact
          />
        )}

        {/* Cart Items */}
        <FlatList
          data={activeSession.items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Text style={styles.emptyListText}>Your cart is empty</Text>
              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => router.push('/go/scan')}
              >
                <Text style={styles.scanButtonText}>Start Scanning</Text>
              </TouchableOpacity>
            </View>
          }
        />

        {/* Summary */}
        {activeSession.items.length > 0 && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items ({cartSummary?.itemCount})</Text>
              <Text style={styles.summaryValue}>{cartSummary?.itemCount || 0}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{cartSummary?.subtotal?.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (18% GST)</Text>
              <Text style={styles.summaryValue}>₹{cartSummary?.tax?.toFixed(2)}</Text>
            </View>
            {cartSummary && cartSummary.cashbackEarned > 0 && (
              <View style={[styles.summaryRow, styles.cashbackRow]}>
                <Text style={styles.cashbackLabel}>+ Cashback</Text>
                <Text style={styles.cashbackValue}>₹{cartSummary.cashbackEarned.toFixed(2)}</Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{cartSummary?.total?.toFixed(2)}</Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() => router.push('/go/checkout')}
            >
              <Text style={styles.checkoutButtonText}>Proceed to Pay</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  cancelText: {
    color: '#EF4444',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemBarcode: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  mrpPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  cashbackBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cashbackText: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '600',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
    marginRight: 12,
  },
  qtyButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#22C55E',
  },
  qtyValue: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 12,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    minWidth: 70,
    textAlign: 'right',
  },
  emptyList: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyListText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  scanButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 16,
    paddingBottom: 32,
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
  cashbackRow: {
    backgroundColor: '#FEF3C7',
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  cashbackLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  cashbackValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  checkoutButton: {
    backgroundColor: '#22C55E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  checkoutButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

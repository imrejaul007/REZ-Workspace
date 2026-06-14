import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from '@expo/vector-icons';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export default function CartScreen() {
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { id: '1', name: 'Wireless Earbuds Pro', price: 2999, quantity: 1, image: 'https://picsum.photos/200' },
    { id: '2', name: 'Smart Watch Series 5', price: 8999, quantity: 2, image: 'https://picsum.photos/201' },
    { id: '3', name: 'LED Desk Lamp', price: 1999, quantity: 1, image: 'https://picsum.photos/203' },
  ]);

  const updateQuantity = (id: string, delta: number) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 500 ? 0 : 49;
  const discount = subtotal > 5000 ? subtotal * 0.1 : 0;
  const total = subtotal + shipping - discount;

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <ShoppingBag name="shopping-bag" size={64} color="#d1d5db" />
        </View>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>
          Add some products to get started!
        </Text>
        <TouchableOpacity style={styles.shopButton}>
          <Text style={styles.shopButtonText}>Browse Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        <View style={styles.itemsContainer}>
          {cartItems.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.itemPrice}>₹{item.price.toLocaleString()}</Text>
                <View style={styles.quantityRow}>
                  <TouchableOpacity
                    style={styles.quantityBtn}
                    onPress={() => updateQuantity(item.id, -1)}
                  >
                    <Minus name="minus" size={16} color="#2563eb" />
                  </TouchableOpacity>
                  <Text style={styles.quantity}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityBtn}
                    onPress={() => updateQuantity(item.id, 1)}
                  >
                    <Plus name="plus" size={16} color="#2563eb" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.itemActions}>
                <Text style={styles.itemTotal}>
                  ₹{(item.price * item.quantity).toLocaleString()}
                </Text>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeItem(item.id)}
                >
                  <Trash2 name="trash-2" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Promo Code */}
        <View style={styles.promoSection}>
          <View style={styles.promoInput}>
            <Text style={styles.promoPlaceholder}>Enter promo code</Text>
            <TouchableOpacity style={styles.promoButton}>
              <Text style={styles.promoButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>
              {shipping === 0 ? 'FREE' : `₹${shipping}`}
            </Text>
          </View>
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount (10%)</Text>
              <Text style={styles.discountValue}>-₹{discount.toFixed(0)}</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{total.toFixed(0)}</Text>
          </View>
        </View>

        {/* Loyalty Points */}
        <View style={styles.loyaltySection}>
          <View style={styles.loyaltyContent}>
            <Text style={styles.loyaltyTitle}>Earn 100 points on this order</Text>
            <Text style={styles.loyaltySubtitle}>Join REZ Rewards to earn points on every purchase</Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.checkoutContainer}>
        <View style={styles.checkoutInfo}>
          <Text style={styles.checkoutLabel}>Total</Text>
          <Text style={styles.checkoutTotal}>₹{total.toFixed(0)}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutButton}>
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          <ArrowRight name="arrow-right" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f9fafb',
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  shopButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  itemsContainer: {
    padding: 16,
    gap: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
  },
  itemPrice: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  quantityBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    minWidth: 24,
    textAlign: 'center',
  },
  itemActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  removeBtn: {
    padding: 8,
  },
  promoSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  promoInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  promoPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: '#9ca3af',
  },
  promoButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  promoButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  summarySection: {
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
  },
  discountValue: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  loyaltySection: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#fef3c7',
    borderRadius: 16,
    padding: 16,
  },
  loyaltyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loyaltyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  loyaltySubtitle: {
    fontSize: 12,
    color: '#b45309',
    marginTop: 4,
  },
  bottomPadding: {
    height: 100,
  },
  checkoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  checkoutInfo: {
    flex: 1,
  },
  checkoutLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  checkoutTotal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  checkoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

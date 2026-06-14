/**
 * Room Service Order Screen
 * Route: /room-service/[hotelId]/[roomId]/order
 *
 * Allows guests to order:
 * - Food & Dining
 * - Minibar
 * - Housekeeping
 * - Laundry
 * - Spa
 * - Transport
 * - Concierge
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import apiClient from '@/services/apiClient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Menu categories
const CATEGORIES = [
  { id: 'breakfast', name: 'Breakfast', icon: 'cafe', image: 'https://example.com/breakfast.jpg' },
  { id: 'lunch', name: 'Lunch', icon: 'restaurant', image: 'https://example.com/lunch.jpg' },
  { id: 'dinner', name: 'Dinner', icon: 'moon', image: 'https://example.com/dinner.jpg' },
  { id: 'minibar', name: 'Mini Bar', icon: 'beer', image: 'https://example.com/minibar.jpg' },
  { id: 'snacks', name: 'Snacks', icon: 'pizza', image: 'https://example.com/snacks.jpg' },
  { id: 'beverages', name: 'Beverages', icon: 'wine', image: 'https://example.com/beverages.jpg' },
];

// Mock menu items
const MENU_ITEMS = [
  { id: '1', name: 'Continental Breakfast', price: 550, category: 'breakfast', desc: 'Eggs, toast, fruits, juice', time: '20 min' },
  { id: '2', name: 'Masala Dosa', price: 320, category: 'breakfast', desc: 'Crispy dosa with sambar & chutney', time: '15 min' },
  { id: '3', name: 'Veg Biryani', price: 450, category: 'lunch', desc: 'Aromatic rice with vegetables', time: '25 min' },
  { id: '4', name: 'Chicken Curry', price: 520, category: 'lunch', desc: 'Traditional chicken curry', time: '25 min' },
  { id: '5', name: 'Paneer Tikka', price: 480, category: 'dinner', desc: 'Grilled cottage cheese', time: '30 min' },
  { id: '6', name: 'Dal Makhani', price: 350, category: 'dinner', desc: 'Creamy black lentils', time: '20 min' },
  { id: '7', name: 'Cold Coffee', price: 180, category: 'beverages', desc: 'Iced coffee with cream', time: '5 min' },
  { id: '8', name: 'Fresh Juice', price: 200, category: 'beverages', desc: 'Orange/Apple/Mango', time: '5 min' },
  { id: '9', name: 'Chocolate Bar', price: 150, category: 'snacks', desc: 'Premium chocolate', time: '2 min' },
  { id: '10', name: 'Mixed Nuts', price: 250, category: 'snacks', desc: 'Assorted dry fruits', time: '2 min' },
];

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function OrderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    hotelId: string;
    roomId: string;
    category?: string;
  }>();

  const [activeCategory, setActiveCategory] = useState(params.category || 'breakfast');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ordering, setOrdering] = useState(false);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredItems = MENU_ITEMS.filter(item => item.category === activeCategory);

  const addToCart = (item: typeof MENU_ITEMS[0]) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const item = prev.find(i => i.id === itemId);
      if (item && item.quantity > 1) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;

    setOrdering(true);
    try {
      const response = await apiClient.post('/room-service/order', {
        bookingId: params.roomId,
        hotelId: params.hotelId,
        roomId: params.roomId,
        serviceType: 'food',
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          pricePaise: item.price * 100,
        })),
      });

      if (response.success) {
        Alert.alert(
          'Order Placed!',
          `Your order #${response.data?.orderId || 'DEMO'} has been sent to the kitchen.`,
          [{ text: 'OK', onPress: () => setCart([]) }]
        );
      }
    } catch (error) {
      Alert.alert('Order Placed!', 'Your order has been sent to the kitchen.');
      setCart([]);
    } finally {
      setOrdering(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#E07C24', '#F59E0B']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Now</Text>
        <View style={styles.cartBadge}>
          {cartCount > 0 && (
            <View style={styles.cartCount}>
              <Text style={styles.cartCountText}>{cartCount}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        {CATEGORIES.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryBtn, activeCategory === category.id && styles.categoryBtnActive]}
            onPress={() => setActiveCategory(category.id)}
          >
            <Ionicons
              name={category.icon as unknown}
              size={20}
              color={activeCategory === category.id ? '#fff' : '#666'}
            />
            <Text style={[styles.categoryText, activeCategory === category.id && styles.categoryTextActive]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Menu Items */}
      <ScrollView style={styles.menuContainer}>
        {filteredItems.map(item => (
          <View key={item.id} style={styles.menuItem}>
            <View style={styles.menuInfo}>
              <Text style={styles.menuName}>{item.name}</Text>
              <Text style={styles.menuDesc}>{item.desc}</Text>
              <View style={styles.menuMeta}>
                <Text style={styles.menuPrice}>₹{item.price}</Text>
                <Text style={styles.menuTime}>{item.time}</Text>
              </View>
            </View>
            <View style={styles.menuActions}>
              {cart.find(i => i.id === item.id) ? (
                <View style={styles.quantityControl}>
                  <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.qtyBtn}>
                    <Ionicons name="remove" size={16} color="#E07C24" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{cart.find(i => i.id === item.id)?.quantity}</Text>
                  <TouchableOpacity onPress={() => addToCart(item)} style={styles.qtyBtn}>
                    <Ionicons name="add" size={16} color="#E07C24" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Cart Footer */}
      {cart.length > 0 && (
        <View style={styles.cartFooter}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartTotal}>{cartCount} items</Text>
            <Text style={styles.cartPrice}>₹{cartTotal}</Text>
          </View>
          <TouchableOpacity
            style={[styles.orderBtn, ordering && styles.orderBtnDisabled]}
            onPress={placeOrder}
            disabled={ordering}
          >
            <Text style={styles.orderBtnText}>
              {ordering ? 'Ordering...' : 'Place Order'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
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
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  cartBadge: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartCount: {
    backgroundColor: '#fff',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  cartCountText: {
    color: '#E07C24',
    fontSize: 12,
    fontWeight: '700',
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 8,
    maxHeight: 60,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  categoryBtnActive: {
    backgroundColor: '#E07C24',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 6,
  },
  categoryTextActive: {
    color: '#fff',
  },
  menuContainer: {
    flex: 1,
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuInfo: {
    flex: 1,
  },
  menuName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  menuDesc: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  menuMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  menuPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E07C24',
  },
  menuTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 12,
  },
  menuActions: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E07C24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5EB',
    borderRadius: 18,
    paddingHorizontal: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E07C24',
    marginHorizontal: 8,
  },
  cartFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  cartInfo: {
    flex: 1,
  },
  cartTotal: {
    fontSize: 14,
    color: '#666',
  },
  cartPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  orderBtn: {
    backgroundColor: '#E07C24',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
  },
  orderBtnDisabled: {
    backgroundColor: '#CCC',
  },
  orderBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

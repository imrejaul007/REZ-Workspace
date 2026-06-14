// @ts-nocheck
/**
 * Web QR Ordering — Menu & Cart
 *
 * Entry point when customer scans a QR code at a table.
 * Deep link: rezapp://order/<storeSlug>?table=<tableNumber>
 *
 * Shows: store header, scrollable menu by category, floating cart bar.
 * Cart state is kept in local state and passed via router params to checkout.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  FlatList,
  Image,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import Button from '@/components/ui/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, SlideInUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchWebStore, WebMenuItem, WebMenuCategory, WebStoreData, CartItem } from '@/services/webOrderingApi';
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import { colors as themeColors } from '@/constants/theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
}

function cartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
}

function cartCount(cart: CartItem[]): number {
  return cart.reduce((sum, c) => sum + c.quantity, 0);
}

// ─── Veg/Non-Veg indicator ───────────────────────────────────────────────────

function VegDot({ isVeg }: { isVeg: boolean }) {
  return (
    <View style={[styles.vegDot, { borderColor: isVeg ? themeColors.successScale[600] : themeColors.errorScale[600] }]}>
      <View
        style={[
          styles.vegDotInner,
          { backgroundColor: isVeg ? themeColors.successScale[600] : themeColors.errorScale[600] },
        ]}
      />
    </View>
  );
}

// ─── Quantity stepper ────────────────────────────────────────────────────────

function QuantityStepper({
  quantity,
  onIncrease,
  onDecrease,
}: {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Button
        style={styles.stepperBtn}
        onPress={onDecrease}
        label=""
        variant="secondary"
      >
        <Ionicons name="remove" size={16} color={themeColors.brand.purple} />
      </Button>
      <Text style={styles.stepperCount}>{quantity}</Text>
      <Button
        style={styles.stepperBtn}
        onPress={onIncrease}
        label=""
        variant="secondary"
      >
        <Ionicons name="add" size={16} color={themeColors.brand.purple} />
      </Button>
    </View>
  );
}

// ─── Menu Item Card ───────────────────────────────────────────────────────────

function MenuItemCard({
  item,
  quantity,
  onAdd,
  onIncrease,
  onDecrease,
}: {
  item: WebMenuItem;
  quantity: number;
  onAdd: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
}) {
  const unavailable = item.is86d;

  return (
    <Animated.View
      entering={FadeInDown.springify()}
      style={[styles.itemCard, unavailable ? styles.itemCardUnavailable : null]}
    >
      {/* Left: info */}
      <View style={{ flex: 1 }}>
        <View style={styles.itemTopRow}>
          <VegDot isVeg={item.isVeg} />
          {item.spicyLevel > 0 && (
            <View style={styles.spicyBadge as unknown}>{'🌶'.repeat(Math.min(item.spicyLevel, 3))}</View>
          )}
        </View>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.name}
        </Text>
        {item.description ? (
          <Text style={styles.itemDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        <View style={styles.itemPriceRow}>
          <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
          {item.originalPrice && item.originalPrice > item.price && (
            <Text style={styles.itemOriginalPrice}>{formatCurrency(item.originalPrice)}</Text>
          )}
        </View>
        {item.preparationTime && (
          <View style={styles.prepTimeRow}>
            <Ionicons name="time-outline" size={11} color="#9CA3AF" />
            <Text style={styles.prepTimeText}>{item.preparationTime}</Text>
          </View>
        )}
      </View>

      {/* Right: image + add/stepper */}
      <View style={styles.itemRight}>
        {item.image ? (
          <View style={{ backgroundColor: '#F3F4F6' }}>
            <Image source={{ uri: item.image }} style={styles.itemImage} />
          </View>
        ) : (
          <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
            <Ionicons name="fast-food-outline" size={26} color="#D1D5DB" />
          </View>
        )}

        {unavailable ? (
          <View style={styles.unavailableChip}>
            <Text style={styles.unavailableText}>Unavailable</Text>
          </View>
        ) : quantity === 0 ? (
          <Button
            style={styles.addBtn}
            onPress={onAdd}
            label="ADD"
            variant="primary"
            textStyle={styles.addBtnText}
          >
            <Ionicons name="add" size={14} color={themeColors.brand.purple} />
          </Button>
        ) : (
          <QuantityStepper quantity={quantity} onIncrease={onIncrease} onDecrease={onDecrease} />
        )}
      </View>
    </Animated.View>
  );
}

// ─── Category section ─────────────────────────────────────────────────────────

function CategorySection({
  category,
  cart,
  onAdd,
  onIncrease,
  onDecrease,
}: {
  category: WebMenuCategory;
  cart: CartItem[];
  onAdd: (item: WebMenuItem) => void;
  onIncrease: (item: WebMenuItem) => void;
  onDecrease: (item: WebMenuItem) => void;
}) {
  const availableItems = (category.items ?? []).filter((i) => !i.is86d);
  const unavailableItems = (category.items ?? []).filter((i) => i.is86d);

  return (
    <View style={styles.categorySection}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryName}>{category.name}</Text>
        <Text style={styles.categoryCount}>{availableItems.length} items</Text>
      </View>
      {category.description ? <Text style={styles.categoryDesc}>{category.description}</Text> : null}
      {category.items.map((item) => {
        const cartEntry = cart.find((c) => c.item.id === item.id);
        return (
          <MenuItemCard
            key={item.id}
            item={item}
            quantity={cartEntry?.quantity ?? 0}
            onAdd={() => onAdd(item)}
            onIncrease={() => onIncrease(item)}
            onDecrease={() => onDecrease(item)}
          />
        );
      })}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

function WebOrderMenuScreen() {
  const router = useRouter();
  const { storeSlug, table } = useLocalSearchParams<unknown>();

  const [storeData, setStoreData] = useState<WebStoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!storeSlug) {
      setError('Invalid store link');
      setLoading(false);
      return;
    }
    fetchWebStore(storeSlug, table as string | undefined)
      .then((data) => {
        if (isMountedRef.current) setStoreData(data);
      })
      .catch((e) => {
        if (isMountedRef.current) setError(e.message);
      })
      .finally(() => {
        if (isMountedRef.current) setLoading(false);
      });
  }, [storeSlug, table]);

  const handleAdd = useCallback((item: WebMenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) return prev.map((c) => (c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      return [...prev, { item, quantity: 1 }];
    });
  }, []);

  const handleIncrease = useCallback((item: WebMenuItem) => {
    setCart((prev) => prev.map((c) => (c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)));
  }, []);

  const handleDecrease = useCallback((item: WebMenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter((c) => c.item.id !== item.id);
      return prev.map((c) => (c.item.id === item.id ? { ...c, quantity: c.quantity - 1 } : c));
    });
  }, []);

  const handleCheckout = useCallback(async () => {
    if (!cart.length) return;
    // Persist cart and store to AsyncStorage to avoid URL length limits with
    // large carts or long customisation strings (P3-12).
    const slug = storeSlug as string;
    await AsyncStorage.setItem(`web_order_cart_${slug}`, JSON.stringify(cart));
    await AsyncStorage.setItem(`web_order_store_${slug}`, JSON.stringify(storeData?.store));
    router.push({
      pathname: '/order/[storeSlug]/checkout',
      params: {
        storeSlug: slug,
        table: table || '',
      },
    });
  }, [cart, router, storeSlug, table, storeData]);

  // Filter categories by search
  const filteredCategories =
    storeData?.menu?.categories
      .map((cat) => ({
        ...cat,
        items: searchQuery
          ? cat.items.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
          : cat.items,
      }))
      .filter((cat) => cat.items.length > 0) ?? [];

  const total = cartTotal(cart);
  const count = cartCount(cart);
  const gstPercent = storeData?.store.gstPercent ?? 5;
  const taxes = Math.round((total * gstPercent) / 100);

  if (loading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color={themeColors.brand.purple} />
        <Text style={styles.loadingText}>Loading menu…</Text>
      </View>
    );
  }

  if (error || !storeData) {
    return (
      <View style={styles.centerScreen}>
        <Ionicons name="alert-circle-outline" size={52} color={themeColors.errorScale[600]} />
        <Text style={styles.errorTitle}>Couldn't load menu</Text>
        <Text style={styles.errorSub}>{error ?? 'Store not found'}</Text>
      </View>
    );
  }

  const { store } = storeData;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Store header */}
      <LinearGradient colors={[themeColors.brand.purple, themeColors.brand.purpleSoft]} style={styles.header}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.storeName} numberOfLines={1}>
            {store.name}
          </Text>
          {table ? (
            <View style={styles.tableBadge}>
              <Ionicons name="restaurant-outline" size={12} color="#FCD34D" />
              <Text style={styles.tableText}>Table {table}</Text>
            </View>
          ) : (
            <Text style={styles.storeAddress} numberOfLines={1}>
              {store.address}
            </Text>
          )}
        </View>
        {store.logo && <Image source={{ uri: store.logo }} style={styles.storeLogo} />}
      </LinearGradient>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search menu…"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <Button onPress={() => setSearchQuery('')} label="" variant="secondary" style={styles.clearSearchBtn}>
            <Ionicons name="close-circle" size={16} color="#9CA3AF" />
          </Button>
        )}
      </View>

      {/* Menu */}
      {!storeData.menu ? (
        <View style={styles.centerScreen}>
          <Ionicons name="restaurant-outline" size={52} color="#D1D5DB" />
          <Text style={styles.errorTitle}>Menu not available</Text>
          <Text style={styles.errorSub}>Ask staff to scan your order</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.menuContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filteredCategories.map((cat) => (
            <CategorySection
              key={cat.id}
              category={cat}
              cart={cart}
              onAdd={handleAdd}
              onIncrease={handleIncrease}
              onDecrease={handleDecrease}
            />
          ))}
          {filteredCategories.length === 0 && (
            <View style={styles.emptySearch}>
              <Text style={styles.emptySearchText}>No items match "{searchQuery}"</Text>
            </View>
          )}
          {/* Bottom padding for cart bar */}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Floating cart bar */}
      {count > 0 && (
        <Animated.View entering={SlideInUp.springify()} style={styles.cartBar} pointerEvents="box-none">
          <View style={styles.cartBarLeft}>
            <View style={styles.cartCountBadge}>
              <Text style={styles.cartCountText}>{count}</Text>
            </View>
            <View>
              <Text style={styles.cartItemsLabel}>
                {count} item{count !== 1 ? 's' : ''} added
              </Text>
              <Text style={styles.cartTaxNote}>+{formatCurrency(taxes)} GST</Text>
            </View>
          </View>
          <Button
            style={styles.cartCheckoutBtn}
            onPress={handleCheckout}
            label={`${formatCurrency(total + taxes)} View Cart →`}
            variant="primary"
            textStyle={styles.cartCheckoutText}
          >
            <Text style={styles.cartCheckoutArrow}>View Cart →</Text>
          </Button>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

export default withErrorBoundary(WebOrderMenuScreen, 'WebOrderMenuScreen');

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  loadingText: { fontSize: 14, color: '#6B7280', marginTop: 8 },
  errorTitle: { fontSize: 17, fontWeight: '700', color: '#374151', textAlign: 'center' },
  errorSub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  storeName: { fontSize: 17, fontWeight: '700', color: '#fff' },
  storeAddress: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  tableBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  tableText: { fontSize: 12, fontWeight: '600', color: '#FCD34D' },
  storeLogo: { width: 40, height: 40, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    margin: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  clearSearchBtn: { backgroundColor: 'transparent', padding: 4 },

  // Menu
  menuContent: { paddingHorizontal: 12 },
  categorySection: { marginBottom: 16 },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  categoryName: { fontSize: 16, fontWeight: '800', color: '#111827' },
  categoryCount: { fontSize: 11, color: '#9CA3AF' },
  categoryDesc: { fontSize: 12, color: '#6B7280', marginBottom: 6, paddingHorizontal: 4 },

  // Item card
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  itemCardUnavailable: { opacity: 0.55 },
  itemTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  vegDot: { width: 14, height: 14, borderRadius: 2, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  vegDotInner: { width: 7, height: 7, borderRadius: 3.5 },
  spicyBadge: { fontSize: 11 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#111827', lineHeight: 19 },
  itemDesc: { fontSize: 11, color: '#6B7280', marginTop: 2, lineHeight: 15 },
  itemPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 6 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: '#111827' },
  itemOriginalPrice: { fontSize: 11, color: '#9CA3AF', textDecorationLine: 'line-through' },
  prepTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  prepTimeText: { fontSize: 12, color: '#9CA3AF' }, // min readable font size
  itemRight: { width: 90, alignItems: 'center', gap: 8 },
  itemImage: { width: 86, height: 86, borderRadius: 10 },
  itemImagePlaceholder: { backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
  addBtn: {
    borderWidth: 1.5,
    borderColor: '#1a3a52',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    justifyContent: 'center',
  },
  addBtnText: { fontSize: 12, fontWeight: '700', color: '#1a3a52' },
  unavailableChip: { backgroundColor: '#FEE2E2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  unavailableText: { fontSize: 11, fontWeight: '600', color: '#DC2626' }, // min readable font size
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#1a3a52',
  },
  stepperBtn: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  stepperCount: { minWidth: 22, textAlign: 'center', fontSize: 13, fontWeight: '700', color: '#1a3a52' },

  // Empty search
  emptySearch: { alignItems: 'center', paddingTop: 40 },
  emptySearchText: { fontSize: 14, color: '#9CA3AF' },

  // Cart bar
  cartBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a3a52',
    borderRadius: 16,
    padding: 12,
    minHeight: 60,
    shadowColor: '#1a3a52',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  cartBarLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  cartCountBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartCountText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  cartItemsLabel: { fontSize: 13, fontWeight: '700', color: '#fff' },
  cartTaxNote: { fontSize: 12, color: 'rgba(255,255,255,0.7)' }, // min readable font size
  cartCheckoutBtn: { alignItems: 'flex-end' },
  cartCheckoutText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  cartCheckoutArrow: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
});

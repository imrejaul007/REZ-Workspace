/**
 * POS Main Screen — Product grid with cart and charge flow.
 */

import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import {
  platformAlertSimple,
  platformAlert,
  platformAlertDestructive,
} from '@/utils/platformAlert';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Colors as DesignColors, Shadows, Spacing, BorderRadius } from '@/constants/DesignTokens';
import { usePOSCart, calcBillGST, calcLineGST, formatCurrency } from '@/hooks/usePOSCart';
import { useAuth } from '@/contexts/AuthContext';
import ProductCard from '@/components/pos/ProductCard';
import CartRow from '@/components/pos/CartRow';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// ─── Main Screen ───────────────────────────────────────────────────

export default function POSIndexScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const { token } = useAuth();
  const cartState = usePOSCart();
  const {
    activeStore,
    products,
    loadingProducts,
    productError,
    search,
    setSearch,
    cart,
    showCart,
    setShowCart,
    charging,
    showBarcodeScanner,
    setShowBarcodeScanner,
    webBarcodeInput,
    setWebBarcodeInput,
    qtyModalVisible,
    setQtyModalVisible,
    qtyModalProduct,
    setQtyModalProduct,
    qtyInputValue,
    setQtyInputValue,
    customItemModalVisible,
    setCustomItemModalVisible,
    customItemName,
    setCustomItemName,
    customItemPrice,
    setCustomItemPrice,
    coinRedemptionAmount,
    setCoinRedemptionAmount,
    coinDiscountApplied,
    coinRedemptionConfirmed,
    consumerIdForCoins,
    setConsumerIdForCoins,
    customerMode,
    setCustomerMode,
    customerId,
    setCustomerId,
    customerPhone,
    setCustomerPhone,
    splitModalVisible,
    setSplitModalVisible,
    splitWays,
    setSplitWays,
    confirmedSplitCount,
    setConfirmedSplitCount,
    tableNumber,
    setTableNumber,
    tableModalVisible,
    setTableModalVisible,
    upsellModalVisible,
    upsellSuggestions,
    setUpsellSuggestions,
    cartTotal,
    cartCount,
    perPersonAmount,
    filteredProducts,
    addToCart,
    addToCartDirect,
    setItemQty,
    promptQty,
    handleQtyModalConfirm,
    handleAddCustomItem,
    handleOpenBarcodeScanner,
    handleBarcodeScanned,
    handleApplyCoinRedemption,
    handleRemoveCoinRedemption,
    handleCharge,
    handleUpsellAdd,
    handleUpsellDismiss,
    handlePrintKOT,
    clearCart,
    setCart,
    idempotencyKeyRef,
    modifierProduct,
    setModifierProduct,
    selectedModifiers,
    setSelectedModifiers,
    upsellModalVisibleState,
    setUpsellModalVisible,
    isOffline,
    syncStatus,
  } = cartState;

  // Customer search state
  const [customerSearchModalVisible, setCustomerSearchModalVisible] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<unknown[]>([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);

  // Stock tracking state
  const [productStocks, setProductStocks] = useState<Record<string, number>>({});
  const stockCheckCache = useRef<Record<string, number>>({});

  // Check product stock from API
  const checkProductStock = async (productId: string): Promise<number> => {
    // Return cached value if available
    if (stockCheckCache.current[productId] !== undefined) {
      return stockCheckCache.current[productId];
    }
    try {
      const authToken = token || '';
      const response = await fetch(`/api/v1/merchant/products/${productId}/stock`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!response.ok) {
        return 999; // Allow if API fails
      }
      const data = await response.json();
      const stock = data.stock ?? 999;
      stockCheckCache.current[productId] = stock;
      return stock;
    } catch {
      return 999; // Allow if API fails
    }
  };

  // Handle add item with stock validation
  const handleAddItem = async (item: { id: string; name: string }) => {
    const stock = await checkProductStock(item.id);

    // Update local stock cache for UI
    setProductStocks(prev => ({ ...prev, [item.id]: stock }));

    if (stock === 0) {
      platformAlertSimple('Out of Stock', `${item.name} is out of stock`);
      return;
    }

    addToCart(item as unknown);
  };

  // Customer search API
  const searchCustomers = async (query: string) => {
    if (!query || query.length < 3) {
      setCustomerSearchResults([]);
      return;
    }
    setCustomerSearchLoading(true);
    try {
      const authToken = token || '';
      const response = await fetch(
        `/api/v1/merchant/customers/search?q=${encodeURIComponent(query)}&limit=10`,
        {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      );
      const data = await response.json();
      setCustomerSearchResults(data.data || []);
    } catch (error) {
      console.error('Customer search failed:', error);
      setCustomerSearchResults([]);
    } finally {
      setCustomerSearchLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearchQuery.length >= 3) {
        searchCustomers(customerSearchQuery);
      } else {
        setCustomerSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearchQuery]);

  // ── renderProduct ───────────────────────────────────────────────
  // Wraps ProductCard so the parent FlatList re-renders only when
  // cart contents actually change (avoiding per-item spurious re-renders).
  const renderProduct = useCallback(
    ({ item, index }: { item: (typeof filteredProducts)[0]; index: number }) => {
      const qty = cart.find((c) => c.productId === item.id)?.quantity ?? 0;
      // Merge API stock with local cache
      const productWithStock = {
        ...item,
        stock: productStocks[item.id] ?? item.stock,
      };
      return (
        <Animated.View entering={FadeInDown.delay(Math.min(index * 40, 400)).springify()}>
          <ProductCard
            product={productWithStock}
            cartQty={qty}
            onAdd={() => handleAddItem(item)}
            onLongPress={() => {
              if (Platform.OS !== 'web') promptQty(item);
              else handleAddItem(item);
            }}
          />
        </Animated.View>
      );
    },
    [cart, addToCart, promptQty, productStocks, handleAddItem]
  );

  return (
    <View style={styles.container}>
      {/* Offline Banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={14} color="#fff" />
          <Text style={styles.offlineBannerText}>
            Offline — bills will sync when connection returns
            {syncStatus.pendingActions > 0 ? ` · ${syncStatus.pendingActions} queued` : ''}
          </Text>
        </View>
      )}

      {/* Search Bar */}
      <Animated.View entering={FadeInDown.delay(50)} style={styles.searchBar}>
        <Ionicons name="search" size={18} color={DesignColors.text.tertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={DesignColors.text.tertiary}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={DesignColors.text.tertiary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleOpenBarcodeScanner}
          style={styles.scanButton}
          accessibilityLabel="Scan barcode"
          accessibilityRole="button"
        >
          <Ionicons name="barcode" size={18} color="#7C3AED" />
        </TouchableOpacity>
      </Animated.View>

      {/* Quick Bill Button */}
      <Animated.View entering={FadeInDown.delay(80)} style={styles.quickBillRow}>
        <TouchableOpacity
          style={styles.quickBillButton}
          onPress={() => router.push('/pos/quick-bill')}
          activeOpacity={0.8}
        >
          <Ionicons name="flash" size={18} color="#7C3AED" />
          <Text style={styles.quickBillText}>Quick Bill</Text>
        </TouchableOpacity>
        {/* C-01: Custom Item Button */}
        <TouchableOpacity
          style={styles.offlineButton}
          onPress={() => setCustomItemModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={18} color={DesignColors.text.secondary} />
          <Text style={styles.offlineButtonText}>Custom Item</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.offlineButton}
          onPress={() => router.push('/pos/offline')}
          activeOpacity={0.8}
        >
          <Ionicons name="cloud-offline-outline" size={18} color={DesignColors.text.secondary} />
          <Text style={styles.offlineButtonText}>Offline Mode</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.offlineButton}
          onPress={() => router.push('/pos/recent-orders')}
          activeOpacity={0.8}
        >
          <Ionicons name="time-outline" size={18} color={DesignColors.text.secondary} />
          <Text style={styles.offlineButtonText}>Recent Orders</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Product Grid */}
      {loadingProducts ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : (
        <>
          {productError && (
            <View
              style={{ backgroundColor: '#FEE2E2', padding: 12, borderRadius: 8, marginBottom: 12 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="warning" size={18} color="#DC2626" />
                <Text style={{ color: '#DC2626', fontSize: 14 }}>{productError}</Text>
              </View>
            </View>
          )}
          <FlatList
            data={filteredProducts}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons
                  name={!activeStore?._id ? 'storefront-outline' : 'cube-outline'}
                  size={56}
                  color={DesignColors.gray[300]}
                />
                <Text style={styles.emptyTitle}>
                  {!activeStore?._id
                    ? 'No store selected'
                    : search
                      ? 'No products found'
                      : 'No products yet'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {!activeStore?._id
                    ? 'Select or create a store to start selling'
                    : search
                      ? 'Try a different search term'
                      : 'Add products in the Products section'}
                </Text>
              </View>
            }
          />
        </>
      )}

      {/* Cart Summary Bar */}
      {cartCount > 0 && (
        <Animated.View entering={FadeInUp.springify()} style={styles.cartBar}>
          <TouchableOpacity
            style={styles.cartBarInner}
            onPress={() => setShowCart(!showCart)}
            activeOpacity={0.9}
          >
            <View style={styles.cartInfo}>
              <View style={styles.cartCountBadge}>
                <Text style={styles.cartCountText}>{cartCount}</Text>
              </View>
              <Text style={styles.cartLabel}>{showCart ? 'Hide Cart' : 'View Cart'}</Text>
            </View>
            <Text style={styles.cartTotal}>{formatCurrency(cartTotal)}</Text>
          </TouchableOpacity>

          {/* Cart Items (expandable) */}
          {showCart && (
            <View style={styles.cartExpanded}>
              <ScrollView style={styles.cartScrollView} nestedScrollEnabled>
                {cart.map((item) => (
                  <CartRow
                    key={item.cartId}
                    item={item}
                    onIncrement={async () => {
                      const stock = await checkProductStock(item.productId);
                      setProductStocks(prev => ({ ...prev, [item.productId]: stock }));
                      if (stock === 0) {
                        platformAlertSimple('Out of Stock', `${item.name} is out of stock`);
                        return;
                      }
                      if (item.quantity >= stock) {
                        platformAlertSimple('Low Stock', `Only ${stock} available for ${item.name}`);
                        return;
                      }
                      setItemQty(item.cartId!, item.quantity + 1);
                    }}
                    onDecrement={() => setItemQty(item.cartId!, item.quantity - 1)}
                    onRemove={() => setItemQty(item.cartId!, 0)}
                  />
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.clearCartButton}
                onPress={() => {
                  platformAlertDestructive(
                    'Clear Cart?',
                    'Remove all items from cart?',
                    () => {
                      setCart([]);
                      setCustomerMode('none');
                      setCustomerId(null);
                      setCustomerPhone(null);
                      setShowCart(false);
                      // Manual clear also invalidates any pending idempotency
                      // key — the next charge starts a brand-new transaction.
                      idempotencyKeyRef.current = null;
                    },
                    'Clear'
                  );
                }}
              >
                <Text style={styles.clearCartText}>Clear Cart</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Table Selector */}
          {cartCount > 0 && (
            <TouchableOpacity
              style={styles.splitButton}
              onPress={() => setTableModalVisible(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="grid-outline" size={16} color="#7C3AED" />
              <Text style={styles.splitButtonText}>
                {tableNumber ? `Table ${tableNumber}` : 'Table'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Print KOT */}
          {cartCount > 0 && (
            <TouchableOpacity
              style={styles.splitButton}
              onPress={handlePrintKOT}
              activeOpacity={0.85}
            >
              <Ionicons name="print-outline" size={16} color="#7C3AED" />
              <Text style={styles.splitButtonText}>KOT</Text>
            </TouchableOpacity>
          )}

          {/* C-02: Split Bill Button */}
          {cartCount > 0 && (
            <TouchableOpacity
              style={styles.splitButton}
              onPress={() => setSplitModalVisible(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="git-compare" size={16} color="#7C3AED" />
              <Text style={styles.splitButtonText}>Split Bill</Text>
            </TouchableOpacity>
          )}

          {/* GST Breakdown */}
          {(() => {
            const gstInfo = calcBillGST(cart);
            const hasGST = gstInfo.totalGST > 0;
            return (
              <View style={styles.gstBreakdown}>
                <View style={styles.gstRow}>
                  <Text style={styles.gstLabel}>Subtotal</Text>
                  <Text style={styles.gstValue}>
                    {formatCurrency(hasGST ? gstInfo.subtotal : gstInfo.grandTotal)}
                  </Text>
                </View>
                {hasGST && (
                  <>
                    <View style={styles.gstRow}>
                      <Text style={styles.gstLabel}>CGST</Text>
                      <Text style={styles.gstValue}>{formatCurrency(gstInfo.cgst)}</Text>
                    </View>
                    <View style={styles.gstRow}>
                      <Text style={styles.gstLabel}>SGST</Text>
                      <Text style={styles.gstValue}>{formatCurrency(gstInfo.sgst)}</Text>
                    </View>
                  </>
                )}
                <View style={[styles.gstRow, styles.gstTotalRow]}>
                  <Text style={styles.gstTotalLabel}>Total</Text>
                  <Text style={styles.gstTotalValue}>{formatCurrency(gstInfo.grandTotal)}</Text>
                </View>
              </View>
            );
          })()}

          {/* Coin Redemption Section */}
          <View style={styles.coinRedemptionSection}>
            <View style={styles.coinRedemptionHeader}>
              <Ionicons name="logo-bitcoin" size={16} color="#F59E0B" />
              <Text style={styles.coinRedemptionTitle}>Consumer Coin Redemption</Text>
            </View>
            {coinRedemptionConfirmed ? (
              <View style={styles.coinAppliedRow}>
                <View style={styles.coinAppliedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  <Text style={styles.coinAppliedText}>
                    {formatCurrency(coinDiscountApplied)} discount applied (REZ coins)
                  </Text>
                </View>
                <TouchableOpacity onPress={handleRemoveCoinRedemption}>
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.coinInputRow}>
                <TextInput
                  style={styles.coinInput}
                  placeholder="Enter redemption amount (₹)"
                  placeholderTextColor={DesignColors.text.tertiary}
                  keyboardType="decimal-pad"
                  value={coinRedemptionAmount}
                  onChangeText={setCoinRedemptionAmount}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={styles.coinApplyButton}
                  onPress={handleApplyCoinRedemption}
                  disabled={!coinRedemptionAmount}
                >
                  <Text style={styles.coinApplyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Final Total with coin discount */}
          {coinDiscountApplied > 0 &&
            (() => {
              const gstInfo = calcBillGST(cart);
              const finalTotal = Math.max(0, gstInfo.grandTotal - coinDiscountApplied);
              return (
                <View style={styles.coinFinalRow}>
                  <View style={styles.gstRow}>
                    <Text style={styles.gstLabel}>Coin Discount</Text>
                    <Text style={[styles.gstValue, { color: '#059669' }]}>
                      -{formatCurrency(coinDiscountApplied)}
                    </Text>
                  </View>
                  <View style={[styles.gstRow, styles.gstTotalRow]}>
                    <Text style={styles.gstTotalLabel}>Final Payable</Text>
                    <Text style={styles.gstTotalValue}>{formatCurrency(finalTotal)}</Text>
                  </View>
                </View>
              );
            })()}

          {/* Customer Selection Row — CRM capture gate */}
          <View style={styles.customerRow}>
            <TouchableOpacity
              style={[styles.customerBtn, customerMode === 'walk-in' && styles.customerBtnActive]}
              onPress={() => {
                setCustomerMode('walk-in');
                setCustomerId(null);
                setCustomerPhone(null);
              }}
            >
              <Ionicons
                name="walk-outline"
                size={16}
                color={customerMode === 'walk-in' ? '#fff' : '#6366f1'}
              />
              <Text
                style={[
                  styles.customerBtnText,
                  customerMode === 'walk-in' && styles.customerBtnTextActive,
                ]}
              >
                Walk-in
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.customerBtn, customerMode === 'selected' && styles.customerBtnActive]}
              onPress={() => {
                setCustomerSearchQuery('');
                setCustomerSearchResults([]);
                setCustomerSearchModalVisible(true);
              }}
            >
              <Ionicons
                name="person-outline"
                size={16}
                color={customerMode === 'selected' ? '#fff' : '#6366f1'}
              />
              <Text
                style={[
                  styles.customerBtnText,
                  customerMode === 'selected' && styles.customerBtnTextActive,
                ]}
              >
                {customerMode === 'selected' ? 'Customer Selected' : 'Select Customer'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Charge Button */}
          <TouchableOpacity
            style={[styles.chargeButton, charging && styles.chargeButtonDisabled]}
            onPress={handleCharge}
            disabled={charging}
            activeOpacity={0.85}
          >
            {charging ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="card" size={20} color="white" />
                <Text style={styles.chargeButtonText}>
                  Charge{' '}
                  {formatCurrency(Math.max(0, calcBillGST(cart).grandTotal - coinDiscountApplied))}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Quantity Modal — cross-platform replacement for Alert.prompt */}
      <Modal
        visible={qtyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQtyModalVisible(false)}
      >
        <View style={styles.qtyModalOverlay}>
          <View style={styles.qtyModalBox}>
            <Text style={styles.qtyModalTitle}>
              Set quantity{qtyModalProduct ? ` for ${qtyModalProduct.name}` : ''}
            </Text>
            <TextInput
              style={styles.qtyModalInput}
              value={qtyInputValue}
              onChangeText={setQtyInputValue}
              keyboardType="number-pad"
              autoFocus
              selectTextOnFocus
              accessibilityLabel="Quantity input"
            />
            <View style={styles.qtyModalButtons}>
              <TouchableOpacity
                style={[styles.qtyModalBtn, styles.qtyModalBtnCancel]}
                onPress={() => {
                  setQtyModalVisible(false);
                  setQtyModalProduct(null);
                }}
              >
                <Text style={styles.qtyModalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.qtyModalBtn, styles.qtyModalBtnConfirm]}
                onPress={handleQtyModalConfirm}
              >
                <Text style={styles.qtyModalBtnConfirmText}>Set</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* C-01: Custom Item Modal */}
      <Modal
        visible={customItemModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomItemModalVisible(false)}
      >
        <View style={styles.qtyModalOverlay}>
          <View style={styles.qtyModalBox}>
            <Text style={styles.qtyModalTitle}>Add Custom Item</Text>
            <TextInput
              style={styles.qtyModalInput}
              placeholder="Item name"
              placeholderTextColor={DesignColors.text.tertiary}
              value={customItemName}
              onChangeText={setCustomItemName}
              autoFocus
            />
            <TextInput
              style={styles.qtyModalInput}
              placeholder="Price (₹)"
              placeholderTextColor={DesignColors.text.tertiary}
              keyboardType="decimal-pad"
              value={customItemPrice}
              onChangeText={setCustomItemPrice}
              returnKeyType="done"
            />
            <View style={styles.qtyModalButtons}>
              <TouchableOpacity
                style={[styles.qtyModalBtn, styles.qtyModalBtnCancel]}
                onPress={() => {
                  setCustomItemModalVisible(false);
                  setCustomItemName('');
                  setCustomItemPrice('');
                }}
              >
                <Text style={styles.qtyModalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.qtyModalBtn, styles.qtyModalBtnConfirm]}
                onPress={handleAddCustomItem}
              >
                <Text style={styles.qtyModalBtnConfirmText}>Add to Bill</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Table Selection Modal */}
      <Modal
        visible={tableModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTableModalVisible(false)}
      >
        <View style={styles.qtyModalOverlay}>
          <View style={[styles.qtyModalBox, { maxHeight: 420 }]}>
            <Text style={styles.qtyModalTitle}>Select Table</Text>
            <ScrollView
              contentContainerStyle={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
                paddingVertical: 8,
              }}
            >
              {['', ...Array.from({ length: 20 }, (_, i) => String(i + 1))].map((t) => (
                <TouchableOpacity
                  key={t || 'none'}
                  style={[styles.tableBtn, tableNumber === t && styles.tableBtnActive]}
                  onPress={() => {
                    setTableNumber(t);
                    setTableModalVisible(false);
                  }}
                >
                  <Text
                    style={[styles.tableBtnText, tableNumber === t && styles.tableBtnTextActive]}
                  >
                    {t || 'No Table'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Upsell Suggestions Modal */}
      <Modal
        visible={upsellModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleUpsellDismiss}
      >
        <View style={styles.qtyModalOverlay}>
          <View style={[styles.qtyModalBox, { maxHeight: '75%', paddingHorizontal: 0 }]}>
            <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
              <Text style={[styles.qtyModalTitle, { textAlign: 'left' }]}>Customers also add</Text>
              <Text style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>
                Add these to increase the bill
              </Text>
            </View>
            {upsellSuggestions.map((s) => (
              <View
                key={s.ruleId}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderTopWidth: 1,
                  borderTopColor: '#f3f4f6',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', fontSize: 15, color: '#111' }}>{s.name}</Text>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}
                  >
                    {s.discountPercent ? (
                      <>
                        <Text style={{ color: '#7C3AED', fontWeight: '700', fontSize: 14 }}>
                          ₹{s.finalPrice}
                        </Text>
                        <Text
                          style={{
                            color: '#9ca3af',
                            fontSize: 12,
                            textDecorationLine: 'line-through',
                          }}
                        >
                          ₹{s.price}
                        </Text>
                        <View
                          style={{
                            backgroundColor: '#fef3c7',
                            borderRadius: 4,
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                          }}
                        >
                          <Text style={{ color: '#d97706', fontSize: 11, fontWeight: '600' }}>
                            {s.discountPercent}% off
                          </Text>
                        </View>
                      </>
                    ) : (
                      <Text style={{ color: '#374151', fontWeight: '600', fontSize: 14 }}>
                        ₹{s.finalPrice}
                      </Text>
                    )}
                  </View>
                  <Text style={{ color: '#6b7280', fontSize: 11, marginTop: 2 }}>
                    {s.badgeText}
                  </Text>
                </View>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#7C3AED',
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                  }}
                  onPress={() => handleUpsellAdd(s)}
                >
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>+ Add</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={{
                margin: 16,
                padding: 14,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#e5e7eb',
                alignItems: 'center',
              }}
              onPress={handleUpsellDismiss}
            >
              <Text style={{ color: '#374151', fontWeight: '600', fontSize: 15 }}>
                No thanks, proceed to payment
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* C-02: Bill Split Modal */}
      <Modal
        visible={splitModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSplitModalVisible(false)}
      >
        <View style={styles.qtyModalOverlay}>
          <View style={styles.qtyModalBox}>
            <Text style={styles.qtyModalTitle}>Split Bill</Text>
            <View style={styles.splitOptions}>
              {[2, 3, 4, 5].map((ways) => (
                <TouchableOpacity
                  key={ways}
                  style={[styles.splitOption, splitWays === ways && styles.splitOptionActive]}
                  onPress={() => setSplitWays(ways)}
                >
                  <Text
                    style={[
                      styles.splitOptionText,
                      splitWays === ways && styles.splitOptionTextActive,
                    ]}
                  >
                    Split {ways}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.qtyModalInput, { marginTop: 12 }]}
              placeholder="Or enter custom number"
              placeholderTextColor={DesignColors.text.tertiary}
              keyboardType="number-pad"
              value={splitWays > 5 ? String(splitWays) : ''}
              onChangeText={(val) => {
                const num = parseInt(val, 10);
                if (!isNaN(num) && num > 0) setSplitWays(num);
              }}
            />
            <View style={styles.splitSummary}>
              <Text style={styles.splitSummaryLabel}>Per Person:</Text>
              <Text style={styles.splitSummaryAmount}>{formatCurrency(perPersonAmount)}</Text>
            </View>
            <View style={styles.qtyModalButtons}>
              <TouchableOpacity
                style={[styles.qtyModalBtn, styles.qtyModalBtnCancel]}
                onPress={() => setSplitModalVisible(false)}
              >
                <Text style={styles.qtyModalBtnCancelText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.qtyModalBtn, styles.qtyModalBtnConfirm]}
                onPress={() => {
                  setConfirmedSplitCount(splitWays);
                  platformAlertSimple(
                    'Bill Split',
                    `Amount split into ${splitWays} equal parts of ${formatCurrency(perPersonAmount)} each`
                  );
                  setSplitModalVisible(false);
                }}
              >
                <Text style={styles.qtyModalBtnConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modifier Selection Modal */}
      <Modal
        visible={!!modifierProduct}
        transparent
        animationType="slide"
        onRequestClose={() => setModifierProduct(null)}
      >
        <View style={styles.qtyModalOverlay}>
          <View style={[styles.qtyModalBox, { maxHeight: '85%' }]}>
            <Text style={styles.qtyModalTitle}>{modifierProduct?.name}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {modifierProduct?.modifiers?.map((mod) => (
                <View key={mod.name} style={{ marginBottom: 16 }}>
                  <Text style={{ fontWeight: '700', fontSize: 14, color: '#111', marginBottom: 8 }}>
                    {mod.name}
                    {mod.required ? ' *' : ''}
                  </Text>
                  {mod.options.map((opt) => {
                    const isSelected = (selectedModifiers[mod.name] || []).includes(opt.label);
                    return (
                      <TouchableOpacity
                        key={opt.label}
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          marginBottom: 6,
                          borderRadius: 8,
                          borderWidth: 1.5,
                          borderColor: isSelected ? '#7C3AED' : '#e5e7eb',
                          backgroundColor: isSelected ? '#f5f3ff' : '#fff',
                        }}
                        onPress={() => {
                          setSelectedModifiers((prev) => {
                            const current = prev[mod.name] || [];
                            if (mod.multiSelect) {
                              return {
                                ...prev,
                                [mod.name]: isSelected
                                  ? current.filter((l) => l !== opt.label)
                                  : [...current, opt.label],
                              };
                            }
                            return { ...prev, [mod.name]: isSelected ? [] : [opt.label] };
                          });
                        }}
                      >
                        <Text style={{ fontSize: 14, color: '#111' }}>{opt.label}</Text>
                        <Text
                          style={{ fontSize: 14, color: opt.price > 0 ? '#7C3AED' : '#6b7280' }}
                        >
                          {opt.price > 0 ? `+${formatCurrency(opt.price)}` : 'Free'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
            <View style={styles.qtyModalButtons}>
              <TouchableOpacity
                style={[styles.qtyModalBtn, styles.qtyModalBtnCancel]}
                onPress={() => {
                  setModifierProduct(null);
                  setSelectedModifiers({});
                }}
              >
                <Text style={styles.qtyModalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.qtyModalBtn, styles.qtyModalBtnConfirm]}
                onPress={() => {
                  if (!modifierProduct) return;
                  // Validate required modifiers
                  const missing = modifierProduct.modifiers?.filter(
                    (m) => m.required && !((selectedModifiers[m.name]?.length ?? 0) > 0)
                  );
                  if (missing && missing.length > 0) {
                    platformAlertSimple(
                      'Required',
                      `Please select: ${missing.map((m) => m.name).join(', ')}`
                    );
                    return;
                  }
                  // Build flat modifiers list for cart
                  const chosenModifiers: Array<{ name: string; price: number }> = [];
                  modifierProduct.modifiers?.forEach((mod) => {
                    const selected = selectedModifiers[mod.name] || [];
                    selected.forEach((label) => {
                      const opt = mod.options.find((o) => o.label === label);
                      if (opt) chosenModifiers.push({ name: label, price: opt.price });
                    });
                  });
                  addToCartDirect(modifierProduct, chosenModifiers);
                  setModifierProduct(null);
                  setSelectedModifiers({});
                }}
              >
                <Text style={styles.qtyModalBtnConfirmText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Barcode Scanner Modal */}
      <Modal
        visible={showBarcodeScanner}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowBarcodeScanner(false)}
      >
        <View style={styles.cameraContainer}>
          {Platform.OS === 'web' ? (
            // Web: camera not available — show manual barcode/QR entry
            <View style={styles.cameraPlaceholder}>
              <Ionicons name="barcode-outline" size={48} color={DesignColors.gray[400]} />
              <Text style={styles.cameraPlaceholderText}>Camera not available on web</Text>
              <Text style={[styles.cameraPlaceholderText, { fontSize: 13, marginTop: 4 }]}>
                Enter barcode or QR code manually:
              </Text>
              <TextInput
                style={{
                  marginTop: 12,
                  borderWidth: 1,
                  borderColor: DesignColors.gray[300],
                  borderRadius: 8,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  width: 260,
                  fontSize: 15,
                  backgroundColor: 'white',
                  color: '#111',
                }}
                placeholder="Barcode / QR code value"
                value={webBarcodeInput}
                onChangeText={setWebBarcodeInput}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (webBarcodeInput.trim()) {
                    handleBarcodeScanned({ data: webBarcodeInput.trim() });
                  }
                }}
              />
              <TouchableOpacity
                style={{
                  marginTop: 12,
                  backgroundColor: '#7C3AED',
                  paddingHorizontal: 28,
                  paddingVertical: 10,
                  borderRadius: 8,
                }}
                onPress={() => {
                  if (webBarcodeInput.trim()) {
                    handleBarcodeScanned({ data: webBarcodeInput.trim() });
                  }
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Submit</Text>
              </TouchableOpacity>
            </View>
          ) : permission?.granted ? (
            <CameraView
              style={styles.camera}
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: [
                  'qr',
                  'code128',
                  'code39',
                  'ean13',
                  'ean8',
                  'upc_a',
                  'upc_e',
                  'itf14',
                ],
              }}
            />
          ) : (
            <View style={styles.cameraPlaceholder}>
              <Ionicons name="camera-outline" size={48} color={DesignColors.gray[400]} />
              <Text style={styles.cameraPlaceholderText}>Camera permission required</Text>
            </View>
          )}
          <View style={styles.cameraOverlay}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <TouchableOpacity
              style={styles.closeScanButton}
              onPress={() => setShowBarcodeScanner(false)}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Customer Search Modal */}
      <Modal
        visible={customerSearchModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCustomerSearchModalVisible(false)}
      >
        <View style={styles.customerSearchOverlay}>
          <View style={styles.customerSearchBox}>
            <View style={styles.customerSearchHeader}>
              <Text style={styles.customerSearchTitle}>Search Customer</Text>
              <TouchableOpacity onPress={() => setCustomerSearchModalVisible(false)}>
                <Ionicons name="close" size={24} color={DesignColors.text.secondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.customerSearchInputRow}>
              <Ionicons name="search" size={18} color={DesignColors.text.tertiary} />
              <TextInput
                style={styles.customerSearchInput}
                placeholder="Search by name or phone..."
                placeholderTextColor={DesignColors.text.tertiary}
                value={customerSearchQuery}
                onChangeText={setCustomerSearchQuery}
                autoFocus
                returnKeyType="search"
              />
              {customerSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setCustomerSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={DesignColors.text.tertiary} />
                </TouchableOpacity>
              )}
            </View>
            {customerSearchLoading && (
              <View style={styles.customerSearchLoading}>
                <ActivityIndicator size="small" color="#7C3AED" />
                <Text style={styles.customerSearchLoadingText}>Searching...</Text>
              </View>
            )}
            <ScrollView
              style={styles.customerSearchResults}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {customerSearchResults.length === 0 && customerSearchQuery.length >= 3 && !customerSearchLoading && (
                <View style={styles.customerSearchEmpty}>
                  <Ionicons name="person-outline" size={32} color={DesignColors.gray[400]} />
                  <Text style={styles.customerSearchEmptyText}>No customers found</Text>
                </View>
              )}
              {customerSearchResults.map((customer) => (
                <TouchableOpacity
                  key={customer.id}
                  style={styles.customerSearchResultItem}
                  onPress={() => {
                    setCustomerMode('selected');
                    setCustomerId(customer.id);
                    setCustomerPhone(customer.phone || '');
                    setConsumerIdForCoins(customer.consumerId || null);
                    setCustomerSearchModalVisible(false);
                  }}
                >
                  <View style={styles.customerSearchResultInfo}>
                    <Text style={styles.customerSearchResultName}>{customer.name || 'Unknown'}</Text>
                    <Text style={styles.customerSearchResultPhone}>{customer.phone || 'No phone'}</Text>
                    {customer.email && (
                      <Text style={styles.customerSearchResultEmail}>{customer.email}</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={DesignColors.gray[400]} />
                </TouchableOpacity>
              ))}
              {customerSearchResults.length === 0 && customerSearchQuery.length < 3 && (
                <View style={styles.customerSearchHint}>
                  <Text style={styles.customerSearchHintText}>Enter at least 3 characters to search</Text>
                </View>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.customerSearchWalkInBtn}
              onPress={() => {
                setCustomerMode('walk-in');
                setCustomerId(null);
                setCustomerPhone(null);
                setCustomerSearchModalVisible(false);
              }}
            >
              <Text style={styles.customerSearchWalkInText}>Continue as Walk-in Customer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignColors.gray[50],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    ...Shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: DesignColors.text.primary,
  },
  scanButton: {
    padding: 4,
  },
  quickBillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap', // allow buttons to wrap to next row on narrow screens (iPhone 390px)
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  quickBillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    borderWidth: 1.5,
    borderColor: '#7C3AED',
  },
  quickBillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  offlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: DesignColors.border.default,
  },
  offlineButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: DesignColors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: DesignColors.text.secondary,
  },
  gridContent: {
    paddingHorizontal: 8,
    paddingBottom: 200,
  },
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: 'white',
    borderRadius: 14,
    overflow: 'hidden',
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: DesignColors.border.light,
  },
  productCardInner: {
    padding: 0,
  },
  productImageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
    backgroundColor: DesignColors.gray[100],
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
  },
  cartBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 11,
  },
  productInfo: {
    padding: 10,
    gap: 2,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: DesignColors.text.primary,
    lineHeight: 17,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7C3AED',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DesignColors.text.primary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: DesignColors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  // Cart Bar
  cartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...Shadows.xl,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  cartBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: DesignColors.border.light,
  },
  cartInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartCountBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 13,
  },
  cartLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: DesignColors.text.primary,
  },
  cartTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#7C3AED',
  },
  cartExpanded: {
    maxHeight: 220,
    borderBottomWidth: 1,
    borderBottomColor: DesignColors.border.light,
  },
  cartScrollView: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: DesignColors.border.light,
  },
  cartRowInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignColors.text.primary,
  },
  cartItemPrice: {
    fontSize: 13,
    color: DesignColors.text.secondary,
    marginTop: 2,
  },
  cartRowControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: DesignColors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 15,
    fontWeight: '700',
    color: DesignColors.text.primary,
    minWidth: 22,
    textAlign: 'center',
  },
  clearCartButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  clearCartText: {
    fontSize: 13,
    color: DesignColors.error[500],
    fontWeight: '600',
  },
  customerRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 8,
  },
  customerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#6366f1',
    backgroundColor: 'transparent',
  },
  customerBtnActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  customerBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366f1',
  },
  customerBtnTextActive: {
    color: '#fff',
  },
  chargeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    ...Shadows.md,
  },
  chargeButtonDisabled: {
    opacity: 0.6,
  },
  chargeButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  cameraPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    gap: 12,
  },
  cameraPlaceholderText: {
    fontSize: 16,
    color: DesignColors.gray[400],
    fontWeight: '600',
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderColor: '#7C3AED',
    borderWidth: 2,
    borderRadius: 12,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#7C3AED',
    borderWidth: 3,
  },
  cornerTL: { top: -6, left: -6, borderBottomWidth: 0, borderRightWidth: 0 },
  cornerTR: { top: -6, right: -6, borderBottomWidth: 0, borderLeftWidth: 0 },
  cornerBL: { bottom: -6, left: -6, borderTopWidth: 0, borderRightWidth: 0 },
  cornerBR: { bottom: -6, right: -6, borderTopWidth: 0, borderLeftWidth: 0 },
  closeScanButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Quantity modal styles
  qtyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  qtyModalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    ...Shadows.md,
  },
  qtyModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DesignColors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  qtyModalInput: {
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 20,
    fontWeight: '700',
    color: DesignColors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  qtyModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  qtyModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  qtyModalBtnCancel: {
    backgroundColor: DesignColors.gray[100],
  },
  qtyModalBtnConfirm: {
    backgroundColor: '#7C3AED',
  },
  qtyModalBtnCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: DesignColors.text.secondary,
  },
  qtyModalBtnConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  // C-01/C-02: Custom Item & Split Bill styles
  splitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    borderWidth: 1.5,
    borderColor: '#7C3AED',
  },
  splitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ef4444',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  offlineBannerText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    flex: 1,
  },
  tableBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 70,
    alignItems: 'center',
  },
  tableBtnActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  tableBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  tableBtnTextActive: {
    color: '#fff',
  },
  splitOptions: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 16,
    flexWrap: 'wrap',
  },
  splitOption: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: DesignColors.border.light,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  splitOptionActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  splitOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignColors.text.secondary,
  },
  splitOptionTextActive: {
    color: '#D97706',
  },
  splitSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: DesignColors.gray[100],
    marginTop: 12,
  },
  splitSummaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignColors.text.primary,
  },
  splitSummaryAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7C3AED',
  },
  // GST Breakdown styles
  gstBreakdown: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
    marginTop: 8,
    marginHorizontal: 16,
    gap: 4,
  },
  gstRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  gstLabel: { fontSize: 13, color: '#6B7280' },
  gstValue: { fontSize: 13, color: '#374151' },
  gstTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 6,
    marginTop: 4,
  },
  gstTotalLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  gstTotalValue: { fontSize: 15, fontWeight: '800', color: '#111827' },

  // Coin Redemption
  coinRedemptionSection: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  coinRedemptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  coinRedemptionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  coinInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coinInput: {
    flex: 1,
    height: 38,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    fontSize: 14,
    color: DesignColors.text.primary,
  },
  coinApplyButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  coinApplyButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  coinAppliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coinAppliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  coinAppliedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  coinFinalRow: {
    marginTop: 4,
    marginBottom: 4,
    backgroundColor: '#F0FFF4',
    borderRadius: 8,
    padding: 10,
  },
  // Customer Search Modal styles
  customerSearchOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  customerSearchBox: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    ...Shadows.xl,
  },
  customerSearchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: DesignColors.border.light,
  },
  customerSearchTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DesignColors.text.primary,
  },
  customerSearchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignColors.gray[50],
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 10,
  },
  customerSearchInput: {
    flex: 1,
    fontSize: 15,
    color: DesignColors.text.primary,
  },
  customerSearchLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  customerSearchLoadingText: {
    fontSize: 13,
    color: DesignColors.text.secondary,
  },
  customerSearchResults: {
    maxHeight: 300,
    paddingHorizontal: 20,
  },
  customerSearchEmpty: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  customerSearchEmptyText: {
    fontSize: 14,
    color: DesignColors.text.secondary,
  },
  customerSearchHint: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  customerSearchHintText: {
    fontSize: 13,
    color: DesignColors.text.tertiary,
  },
  customerSearchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: DesignColors.border.light,
  },
  customerSearchResultInfo: {
    flex: 1,
  },
  customerSearchResultName: {
    fontSize: 15,
    fontWeight: '600',
    color: DesignColors.text.primary,
  },
  customerSearchResultPhone: {
    fontSize: 13,
    color: DesignColors.text.secondary,
    marginTop: 2,
  },
  customerSearchResultEmail: {
    fontSize: 12,
    color: DesignColors.text.tertiary,
    marginTop: 2,
  },
  customerSearchWalkInBtn: {
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: DesignColors.border.default,
    alignItems: 'center',
  },
  customerSearchWalkInText: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignColors.text.secondary,
  },
});

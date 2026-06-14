// @ts-nocheck
/**
 * REZ Consumer App - Shop Screen with Express Checkout
 * Features: Express checkout, currency selector, loyalty points, fraud indicator
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  expressCheckoutService,
  fraudPreventionService,
  multiCurrencyService,
  loyaltyService,
  ExpressCheckoutItem,
  ExpressCheckoutSession,
  SupportedCurrency,
  LoyaltyBalanceResponse,
  FraudCheckResponse,
} from '../services/newServices';
import { logger } from '@/utils/logger';

// =============================================================================
// Type Definitions
// =============================================================================

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: string;
  inStock: boolean;
  rating: number;
  reviewCount: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface ShopScreenProps {
  customerId: string;
  onNavigateToCart?: () => void;
  onCheckoutComplete?: (orderId: string) => void;
}

// =============================================================================
// Currency Selector Component
// =============================================================================

interface CurrencySelectorProps {
  selectedCurrency: SupportedCurrency;
  onSelect: (currency: SupportedCurrency) => void;
  onClose: () => void;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedCurrency,
  onSelect,
  onClose,
}) => {
  const [currencies, setCurrencies] = useState<SupportedCurrency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrencies();
  }, []);

  const loadCurrencies = async () => {
    try {
      const supported = await multiCurrencyService.getSupportedCurrencies();
      setCurrencies(supported);
    } catch (error) {
      logger.error('Failed to load currencies:', error);
      // Fallback to common currencies
      setCurrencies([
        { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', decimalPlaces: 2, minAmount: 1, maxAmount: 1000000 },
        { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', decimalPlaces: 2, minAmount: 0.01, maxAmount: 100000 },
        { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', decimalPlaces: 2, minAmount: 0.01, maxAmount: 100000 },
        { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', decimalPlaces: 2, minAmount: 0.01, maxAmount: 100000 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderCurrencyItem = ({ item }: { item: SupportedCurrency }) => (
    <TouchableOpacity
      style={[
        styles.currencyItem,
        selectedCurrency.code === item.code && styles.currencyItemSelected,
      ]}
      onPress={() => {
        onSelect(item);
        onClose();
      }}
    >
      <Text style={styles.currencyFlag}>{item.flag}</Text>
      <View style={styles.currencyInfo}>
        <Text style={styles.currencyCode}>{item.code}</Text>
        <Text style={styles.currencyName}>{item.name}</Text>
      </View>
      {selectedCurrency.code === item.code && (
        <Text style={styles.checkmark}>✓</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#6366F1" style={styles.loader} />
          ) : (
            <FlatList
              data={currencies}
              renderItem={renderCurrencyItem}
              keyExtractor={(item) => item.code}
              contentContainerStyle={styles.currencyList}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

// =============================================================================
// Loyalty Points Display Component
// =============================================================================

interface LoyaltyPointsDisplayProps {
  loyaltyInfo: LoyaltyBalanceResponse | null;
  onRefresh: () => void;
  loading: boolean;
}

const LoyaltyPointsDisplay: React.FC<LoyaltyPointsDisplayProps> = ({
  loyaltyInfo,
  onRefresh,
  loading,
}) => {
  const formatPoints = (points: number): string => {
    return points.toLocaleString();
  };

  if (loading) {
    return (
      <View style={styles.loyaltyCard}>
        <ActivityIndicator size="small" color="#6366F1" />
      </View>
    );
  }

  if (!loyaltyInfo) {
    return (
      <TouchableOpacity style={styles.loyaltyCard} onPress={onRefresh}>
        <Text style={styles.loyaltyCardText}>Tap to load loyalty points</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.loyaltyCard} onPress={onRefresh}>
      <View style={styles.loyaltyHeader}>
        <View style={styles.loyaltyBadge}>
          <Text style={styles.loyaltyBadgeText}>{loyaltyInfo.tier.name}</Text>
        </View>
        <Text style={styles.loyaltyPointsValue}>
          {formatPoints(loyaltyInfo.points)} pts
        </Text>
      </View>
      <View style={styles.loyaltyProgress}>
        <View style={styles.loyaltyProgressBar}>
          <View
            style={[
              styles.loyaltyProgressFill,
              { width: `${loyaltyInfo.tierProgress.percentage}%` },
            ]}
          />
        </View>
        <Text style={styles.loyaltyProgressText}>
          {formatPoints(loyaltyInfo.tierProgress.current)} / {formatPoints(loyaltyInfo.tierProgress.required)} to next tier
        </Text>
      </View>
      <Text style={styles.loyaltyValue}>
        Worth ₹{loyaltyInfo.pointsValue.toFixed(2)}
      </Text>
    </TouchableOpacity>
  );
};

// =============================================================================
// Fraud Risk Indicator Component
// =============================================================================

interface FraudRiskIndicatorProps {
  riskLevel: FraudCheckResponse['riskLevel'] | null;
  loading: boolean;
}

const FraudRiskIndicator: React.FC<FraudRiskIndicatorProps> = ({
  riskLevel,
  loading,
}) => {
  const getRiskConfig = () => {
    switch (riskLevel) {
      case 'low':
        return { color: '#10B981', label: 'Low Risk', icon: '✓' };
      case 'medium':
        return { color: '#F59E0B', label: 'Medium Risk', icon: '!' };
      case 'high':
        return { color: '#EF4444', label: 'High Risk', icon: '⚠' };
      case 'critical':
        return { color: '#DC2626', label: 'Critical Risk', icon: '✕' };
      default:
        return { color: '#6B7280', label: 'Checking...', icon: '?' };
    }
  };

  const config = getRiskConfig();

  return (
    <View style={[styles.fraudIndicator, { borderColor: config.color }]}>
      <View style={[styles.fraudDot, { backgroundColor: config.color }]} />
      <Text style={[styles.fraudLabel, { color: config.color }]}>
        {config.icon} {config.label}
      </Text>
      {loading && <ActivityIndicator size="small" color={config.color} style={{ marginLeft: 8 }} />}
    </View>
  );
};

// =============================================================================
// Express Checkout Button Component
// =============================================================================

interface ExpressCheckoutButtonProps {
  onPress: () => void;
  disabled: boolean;
  loading: boolean;
}

const ExpressCheckoutButton: React.FC<ExpressCheckoutButtonProps> = ({
  onPress,
  disabled,
  loading,
}) => {
  return (
    <TouchableOpacity
      style={[styles.expressCheckoutButton, disabled && styles.expressCheckoutDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          <View style={styles.expressCheckoutIcon}>
            <Text style={styles.expressCheckoutIconText}>⚡</Text>
          </View>
          <View style={styles.expressCheckoutText}>
            <Text style={styles.expressCheckoutTitle}>Express Checkout</Text>
            <Text style={styles.expressCheckoutSubtitle}>Pay in 1 tap with UPI</Text>
          </View>
          <Text style={styles.expressCheckoutArrow}>→</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

// =============================================================================
// Product Card Component
// =============================================================================

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onExpressCheckout: (product: Product) => void;
  currency: SupportedCurrency;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onExpressCheckout,
  currency,
}) => {
  const formatPrice = (price: number): string => {
    const converted = currency.code === 'INR' ? price : price * 83; // Approximate
    return `${currency.symbol}${converted.toFixed(currency.decimalPlaces)}`;
  };

  return (
    <View style={styles.productCard}>
      <Image
        source={{ uri: product.imageUrl || 'https://via.placeholder.com/150' }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.productDescription} numberOfLines={1}>
          {product.description}
        </Text>
        <View style={styles.productPriceRow}>
          <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
          {product.originalPrice && (
            <Text style={styles.productOriginalPrice}>
              {formatPrice(product.originalPrice)}
            </Text>
          )}
        </View>
        <View style={styles.productRating}>
          <Text style={styles.productRatingStar}>★</Text>
          <Text style={styles.productRatingText}>
            {product.rating} ({product.reviewCount})
          </Text>
        </View>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={() => onAddToCart(product)}
        >
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickBuyButton}
          onPress={() => onExpressCheckout(product)}
        >
          <Text style={styles.quickBuyText}>⚡ Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// =============================================================================
// Main Shop Screen Component
// =============================================================================

const ShopScreen: React.FC<ShopScreenProps> = ({
  customerId,
  onNavigateToCart,
  onCheckoutComplete,
}) => {
  // State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>({
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    flag: '🇮🇳',
    decimalPlaces: 2,
    minAmount: 1,
    maxAmount: 1000000,
  });
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [loyaltyInfo, setLoyaltyInfo] = useState<LoyaltyBalanceResponse | null>(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [expressLoading, setExpressLoading] = useState(false);
  const [fraudRisk, setFraudRisk] = useState<FraudCheckResponse['riskLevel'] | null>(null);
  const [fraudLoading, setFraudLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Load data on mount
  useEffect(() => {
    loadProducts();
    loadLoyaltyInfo();
  }, [customerId]);

  // Load products (mock data for demo)
  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      // Simulate API call - replace with actual API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockProducts: Product[] = [
        {
          id: '1',
          name: 'Premium Wireless Headphones',
          description: 'High-quality audio with noise cancellation',
          price: 4999,
          originalPrice: 7999,
          imageUrl: 'https://via.placeholder.com/150',
          category: 'Electronics',
          inStock: true,
          rating: 4.5,
          reviewCount: 1234,
        },
        {
          id: '2',
          name: 'Smart Watch Pro',
          description: 'Advanced health tracking and notifications',
          price: 9999,
          originalPrice: 14999,
          imageUrl: 'https://via.placeholder.com/150',
          category: 'Electronics',
          inStock: true,
          rating: 4.7,
          reviewCount: 856,
        },
        {
          id: '3',
          name: 'Portable Bluetooth Speaker',
          description: '360° sound with 24-hour battery life',
          price: 2499,
          originalPrice: 3999,
          imageUrl: 'https://via.placeholder.com/150',
          category: 'Electronics',
          inStock: true,
          rating: 4.3,
          reviewCount: 567,
        },
      ];

      setProducts(mockProducts);
    } catch (error) {
      logger.error('Failed to load products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Load loyalty info
  const loadLoyaltyInfo = async () => {
    if (!customerId) return;

    setLoyaltyLoading(true);
    try {
      const info = await loyaltyService.getBalance(customerId);
      setLoyaltyInfo(info);
    } catch (error) {
      logger.error('Failed to load loyalty info:', error);
    } finally {
      setLoyaltyLoading(false);
    }
  };

  // Check fraud risk for COD
  const checkFraudRisk = useCallback(async (items: ExpressCheckoutItem[]) => {
    if (items.length === 0) return;

    const amount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Only check for COD orders
    setFraudLoading(true);
    try {
      const risk = await fraudPreventionService.checkCodRisk(customerId, amount, items);
      setFraudRisk(risk.riskLevel);

      if (risk.isHighRisk) {
        Alert.alert(
          'High Risk Order',
          `This order has been flagged as ${risk.riskLevel} risk. ${risk.recommendation}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      logger.error('Fraud check failed:', error);
    } finally {
      setFraudLoading(false);
    }
  }, [customerId]);

  // Add item to cart
  const handleAddToCart = useCallback((product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);

      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...prevCart, { ...product, quantity: 1 }];
    });

    Alert.alert('Added to Cart', `${product.name} has been added to your cart.`);
  }, []);

  // Express checkout for single product
  const handleExpressCheckout = useCallback(
    async (product: Product) => {
      const items: ExpressCheckoutItem[] = [
        {
          productId: product.id,
          quantity: 1,
          price: product.price,
          name: product.name,
          imageUrl: product.imageUrl,
        },
      ];

      await executeExpressCheckout(items);
    },
    [customerId, selectedCurrency]
  );

  // Execute express checkout
  const executeExpressCheckout = async (items: ExpressCheckoutItem[]) => {
    setExpressLoading(true);

    try {
      // Step 1: Create express checkout session
      const session = await expressCheckoutService.createSession({
        items,
        customerId,
        paymentMethod: 'upi',
        currency: selectedCurrency.code,
      });

      // Step 2: Start polling for status
      const completedSession = await expressCheckoutService.pollSessionStatus(
        session.sessionId,
        2000,
        30
      );

      if (completedSession.status === 'completed') {
        Alert.alert(
          'Order Placed!',
          `Your order has been confirmed. Order ID: ${completedSession.id}`,
          [
            {
              text: 'View Order',
              onPress: () => onCheckoutComplete?.(completedSession.id),
            },
          ]
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Checkout failed';
      Alert.alert('Checkout Failed', message);
    } finally {
      setExpressLoading(false);
    }
  };

  // Cart total
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Render
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shop</Text>
        <TouchableOpacity
          style={styles.currencyButton}
          onPress={() => setShowCurrencySelector(true)}
        >
          <Text style={styles.currencyButtonText}>
            {selectedCurrency.flag} {selectedCurrency.code}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loyalty Points */}
      <LoyaltyPointsDisplay
        loyaltyInfo={loyaltyInfo}
        onRefresh={loadLoyaltyInfo}
        loading={loyaltyLoading}
      />

      {/* Express Checkout (when cart has items) */}
      {cart.length > 0 && (
        <View style={styles.cartSection}>
          <FraudRiskIndicator riskLevel={fraudRisk} loading={fraudLoading} />

          <ExpressCheckoutButton
            onPress={() => {
              checkFraudRisk(
                cart.map((item) => ({
                  productId: item.id,
                  quantity: item.quantity,
                  price: item.price,
                  name: item.name,
                  imageUrl: item.imageUrl,
                }))
              );
              executeExpressCheckout(
                cart.map((item) => ({
                  productId: item.id,
                  quantity: item.quantity,
                  price: item.price,
                  name: item.name,
                  imageUrl: item.imageUrl,
                }))
              );
            }}
            disabled={false}
            loading={expressLoading}
          />

          <TouchableOpacity style={styles.viewCartButton} onPress={onNavigateToCart}>
            <Text style={styles.viewCartText}>
              View Cart ({cartItemCount} items) - {selectedCurrency.symbol}
              {cartTotal.toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Products Grid */}
      {loadingProducts ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onAddToCart={handleAddToCart}
              onExpressCheckout={handleExpressCheckout}
              currency={selectedCurrency}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.productsList}
          numColumns={2}
          columnWrapperStyle={styles.productsRow}
        />
      )}

      {/* Currency Selector Modal */}
      <CurrencySelector
        selectedCurrency={selectedCurrency}
        onSelect={setSelectedCurrency}
        onClose={() => setShowCurrencySelector(false)}
      />
    </SafeAreaView>
  );
};

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  currencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  currencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },

  // Loyalty Card
  loyaltyCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  loyaltyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  loyaltyBadge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  loyaltyBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  loyaltyPointsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  loyaltyProgress: {
    marginBottom: 8,
  },
  loyaltyProgressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  loyaltyProgressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 3,
  },
  loyaltyProgressText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  loyaltyValue: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  loyaltyCardText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
  },

  // Cart Section
  cartSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  // Fraud Indicator
  fraudIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  fraudDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  fraudLabel: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Express Checkout Button
  expressCheckoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  expressCheckoutDisabled: {
    backgroundColor: '#9CA3AF',
  },
  expressCheckoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expressCheckoutIconText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  expressCheckoutText: {
    flex: 1,
  },
  expressCheckoutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  expressCheckoutSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  expressCheckoutArrow: {
    fontSize: 20,
    color: '#FFFFFF',
  },

  // View Cart Button
  viewCartButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewCartText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    padding: 40,
  },

  // Products List
  productsList: {
    padding: 16,
  },
  productsRow: {
    justifyContent: 'space-between',
  },

  // Product Card
  productCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F3F4F6',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  productOriginalPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  productRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productRatingStar: {
    fontSize: 12,
    color: '#F59E0B',
    marginRight: 4,
  },
  productRatingText: {
    fontSize: 12,
    color: '#6B7280',
  },
  productActions: {
    padding: 12,
    paddingTop: 0,
  },
  addToCartButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  addToCartText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  quickBuyButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  quickBuyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6B7280',
    lineHeight: 24,
  },
  currencyList: {
    padding: 16,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
  },
  currencyItemSelected: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  currencyFlag: {
    fontSize: 28,
    marginRight: 12,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  currencyName: {
    fontSize: 12,
    color: '#6B7280',
  },
  checkmark: {
    fontSize: 18,
    color: '#6366F1',
    fontWeight: 'bold',
  },
});

export default ShopScreen;

import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, StatusBar, Platform, Pressable, FlatList, StyleProp, ViewStyle } from 'react-native';
import { FlashList, ContentStyle } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { platformAlertSimple } from '@/utils/platformAlert';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'; // ✅ supports 'edges'

import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import CartHeader from '@/components/cart/CartHeader';
import SlidingTabs from '@/components/cart/SlidingTabs';
import CartItem from '@/components/cart/CartItem';
import LockedItem from '@/components/cart/LockedItem';
import PriceSection from '@/components/cart/PriceSection';
import CartValidation from '@/components/cart/CartValidation';
import StockWarningBanner from '@/components/cart/StockWarningBanner';
import CardOffersSection from '@/components/cart/CardOffersSection';
import { ThemedText } from '@/components/ThemedText';
import { CartItem as CartItemType, LockedProduct, LOCK_CONFIG } from '@/types/cart';
// BUG-076 FIX: Import production cart utilities from cartUtils (not mockCartData).
// mockCartData.ts also contains test fixtures; mixing production helpers with mock data
// made it unclear what was safe to ship. cartUtils.ts contains only production utilities.
import { getItemCount, getLockedItemCount, updateLockedProductTimers } from '@/utils/cartUtils';
import { useCartValidation } from '@/hooks/useCartValidation';
import { useCartStore, CartStoreState, CartItemWithQuantity } from '@/stores/cartStore';
import { useTotalBalance, useWalletLoading, useIsAuthenticated } from '@/stores';
import CachedImage from '@/components/ui/CachedImage';
import cartApi from '@/services/cartApi';
import { CartItemSkeleton } from '@/components/common/SkeletonLoader';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { BRAND } from '@/constants/brand';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';
import { isSmallDevice } from '@/utils/responsive';
import { Discount } from '@/services/discountsApi';
import { logger } from '@/utils/logger';

// Helper function to format time slot for display
const formatTimeSlot = (start: string, end?: string): string => {
  const formatTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const formattedStart = formatTime(start);
  if (end) {
    const formattedEnd = formatTime(end);
    return `${formattedStart} - ${formattedEnd}`;
  }
  return formattedStart;
};

// BUG-062: Discriminated union that captures the extended fields stored on cart items
// by CartContext (which comes through useCartStore). These fields are not declared on
// the base CartItemType, which is why the original code used `as unknown as ExtendedCartItem`.
interface ExtendedCartItem extends CartItemType {
  itemType?: 'product' | 'service' | 'event';
  productId?: string;
  discount?: number;
  variant?: { id?: string; name?: string; attributes?: Record<string, string> };
  store?: { id?: string; name?: string; slug?: string };
  metadata?: Record<string, unknown>;
  serviceBookingDetails?: {
    bookingDate?: Date | string | null;
    timeSlot?: { start: string; end: string } | null;
    duration?: number;
    serviceType?: string;
    customerNotes?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
  } | null;
}

// Extended cart item with formatted display fields for service bookings
interface DisplayServiceItem extends ExtendedCartItem {
  bookingDateFormatted?: string;
  bookingTimeFormatted?: string;
}

// API Response types
interface LockedItemsResponse {
  success: boolean;
  data?: {
    lockedItems: LockedItemData[];
  };
  message?: string;
  error?: string;
}

interface LockedItemData {
  _id?: string;
  product?: {
    _id?: string;
    name?: string;
    images?: ({ url?: string } | string)[];
  };
  lockedAt?: string;
  expiresAt?: string;
  quantity?: number;
  lockedPrice?: number;
  originalPrice?: number;
  variant?: unknown;
  store?: { name?: string };
  notes?: string;
  lockedFee?: number;
  lockedFeePercentage?: number;
  paymentMethod?: string;
  lockPaymentStatus?: string;
  isPaidLock?: boolean;
}

interface CardOffer {
  id: string;
  code?: string;
  discount?: number;
  type?: string;
  [key: string]: unknown;
}

/** Type guard: narrows a CartItemType to ExtendedCartItem */
function asExtendedCartItem(item: CartItemType): ExtendedCartItem {
  return item as ExtendedCartItem;
}

function CartPage() {
  const isMounted = useIsMounted();
  const router = useRouter();
  const params = useLocalSearchParams<{ offerRedemptionCode?: string }>();
  const insets = useSafeAreaInsets();
  const cartState = useCartStore((s: CartStoreState) => s.state);
  const cartActions = useCartStore((s: CartStoreState) => s.actions);
  const totalBalance = useTotalBalance();
  const walletLoading = useWalletLoading();
  const isAuthenticated = useIsAuthenticated();
  const [activeTab, setActiveTab] = useState<'products' | 'service' | 'lockedproduct'>('products');
  const [lockedProducts, setLockedProducts] = useState<LockedProduct[]>([]);

  // Cart validation state
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showWarningBanner, setShowWarningBanner] = useState(true);

  // Use cart validation hook
  const {
    validationState,
    hasInvalidItems,
    canCheckout,
    invalidItemCount,
    warningCount,
    errorCount,
    validateCart,
    clearValidation,
    removeInvalidItems,
  } = useCartValidation({
    autoValidate: false, // Manual validation before checkout
    validationInterval: 0, // Disable periodic validation on cart page
    showToastNotifications: false, // We'll handle notifications via modal
  });

  // Use real cart items from CartContext - separate products and services
  const productItems: CartItemWithQuantity[] = useMemo(() => {
    return (cartState.items ?? [])
      .filter((item: CartItemWithQuantity) => asExtendedCartItem(item).itemType !== 'service') // Only non-service items
      .map((item: CartItemWithQuantity) => {
        const ext = asExtendedCartItem(item);
        // Preserve metadata for event items
        const metadata = (ext.metadata as Record<string, unknown>) || {};
        const isEvent = metadata.eventType === 'event';

        return {
          ...item,
          id: item.id,
          productId: ext.productId || item.id,
          name: item.name,
          image: item.image || '',
          price: item.discountedPrice || item.originalPrice || 0,
          originalPrice: item.originalPrice,
          cashback: isEvent ? '0' : `Upto 12% cash back`,
          quantity: item.quantity,
          discount: ext.discount,
          variant: ext.variant,
          store: ext.store,
          category: 'products' as const,
          itemType: ext.itemType || 'product',
          metadata: isEvent ? metadata : undefined,
          isEvent: isEvent,
          selected: item.selected ?? true,
          addedAt: item.addedAt ?? new Date().toISOString(),
        };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartState.items, cartState.isLoading, cartState.error]);

  // Service items from cart
  const serviceItems: CartItemWithQuantity[] = useMemo(() => {
    return (cartState.items ?? [])
      .filter((item: CartItemWithQuantity) => asExtendedCartItem(item).itemType === 'service')
      .map((item: CartItemWithQuantity) => {
        const ext = asExtendedCartItem(item);
        const bookingDetails = ext.serviceBookingDetails || {};
        const bookingDate = bookingDetails.bookingDate ? new Date(bookingDetails.bookingDate as string | Date) : null;

        return {
          ...item,
          id: item.id,
          productId: ext.productId || item.id,
          name: item.name,
          image: item.image || '',
          price: item.discountedPrice || item.originalPrice || 0,
          originalPrice: item.originalPrice,
          cashback: '0',
          quantity: item.quantity,
          discount: ext.discount,
          variant: ext.variant,
          store: ext.store,
          category: 'service' as const,
          itemType: 'service' as const,
          selected: item.selected ?? true,
          addedAt: item.addedAt ?? new Date().toISOString(),
          // Service booking details
          serviceBookingDetails: {
            bookingDate: bookingDate,
            timeSlot: bookingDetails.timeSlot ?? null,
            duration: bookingDetails.duration ?? 0,
            serviceType: bookingDetails.serviceType ?? '',
            customerNotes: bookingDetails.customerNotes,
            customerName: bookingDetails.customerName,
            customerPhone: bookingDetails.customerPhone,
          },
          // Formatted display values
          bookingDateFormatted: bookingDate
            ? bookingDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            : '',
          bookingTimeFormatted: bookingDetails.timeSlot?.start
            ? formatTimeSlot(bookingDetails.timeSlot.start, bookingDetails.timeSlot.end)
            : '',
        };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartState.items, cartState.isLoading, cartState.error]);

  const currentItems = useMemo(() => {
    if (activeTab === 'products') return productItems;
    if (activeTab === 'service') return serviceItems;
    if (activeTab === 'lockedproduct') return lockedProducts;
    return [];
  }, [activeTab, productItems, serviceItems, lockedProducts]);

  const allItems = useMemo(() => [...productItems, ...serviceItems], [productItems, serviceItems]);

  // BUG FIX #7: Cart total recalculation from scratch to prevent drift
  const overallTotal = useMemo(() => {
    // ✅ FIX: Recalculate total from scratch instead of relying on cartState.totalPrice
    // This prevents incremental modifications from drifting over time
    const recalculatedCartTotal = productItems.reduce((sum: number, item: CartItemWithQuantity) => {
      const price = typeof item.price === 'number' ? item.price : 0;
      const qty = typeof item.quantity === 'number' ? item.quantity : 0;
      return sum + price * qty;
    }, 0);

    const serviceTotal = serviceItems.reduce((sum: number, item: CartItemWithQuantity) => {
      const price = typeof item.price === 'number' ? item.price : 0;
      const qty = typeof item.quantity === 'number' ? item.quantity : 0;
      return sum + price * qty;
    }, 0);

    // CA-CMC-018 FIX: Removed deprecated calculateLockedTotal() which always returned 0.
    // Locked item totals must come from backend API response, not calculated client-side.
    const lockedTotal = 0; // Always 0 — use API totals instead

    return recalculatedCartTotal + serviceTotal + lockedTotal;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productItems, serviceItems, lockedProducts]);

  // Memoize FlashList contentContainerStyle outside JSX to avoid Rules of Hooks violation
  const listContentContainerStyle = useMemo(
    () => {
      // BUG-092 FIX: On Android with gesture navigation the system reports insets.bottom = 0
      // even when a translucent nav bar is present. Clamp to a minimum of 16 so the last
      // cart item is never hidden behind the navigation gesture zone.
      const safeBottom = Platform.OS === 'android' ? Math.max(insets.bottom, 16) : insets.bottom;
      const baseStyle = {
        paddingHorizontal: isSmallDevice ? 12 : 16,
        paddingTop: 16,
        paddingBottom: safeBottom + (currentItems.length < 3 ? 80 : 120),
      };
      if (currentItems.length === 0) {
        return [baseStyle, styles.emptyListContent];
      }
      return baseStyle;
    },
    // BUG-047 FIX: Added isSmallDevice to dependency array — it affects paddingHorizontal
    // but was missing, so the style would not update if device size classification changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentItems.length, insets.bottom, isSmallDevice],
  );

  const overallItemCount = useMemo(() => {
    // ✅ FIX: Add type checking for item count calculation
    const cartCount =
      typeof cartState.totalItems === 'number' && !isNaN(cartState.totalItems) ? cartState.totalItems : 0;
    const lockedCount = typeof getLockedItemCount === 'function' ? getLockedItemCount(lockedProducts) : 0;

    return cartCount + lockedCount;
  }, [cartState.totalItems, lockedProducts]);

  // Function to load locked items
  const loadLockedItems = useCallback(async () => {
    try {
      const response = (await cartApi.getLockedItems()) as LockedItemsResponse;
      if (response.success && response.data?.lockedItems) {
        const formattedLockedItems = response.data.lockedItems
          .map((item: LockedItemData) => {
            const productId = item.product?._id;

            // CA-CMC-004 FIX: Validate dates before converting. If invalid, reject the item.
            let lockedAt: Date;
            let expiresAt: Date;
            try {
              if (!item.lockedAt || typeof item.lockedAt !== 'string') {
                logger.warn(`Invalid lockedAt for item ${item._id}:`, { itemId: item._id, lockedAt: item.lockedAt });
                return null; // Skip malformed items
              }
              if (!item.expiresAt || typeof item.expiresAt !== 'string') {
                logger.warn(`Invalid expiresAt for item ${item._id}:`, { itemId: item._id, expiresAt: item.expiresAt });
                return null;
              }
              lockedAt = new Date(item.lockedAt);
              expiresAt = new Date(item.expiresAt);

              // Validate dates are valid and not at epoch
              if (isNaN(lockedAt.getTime()) || isNaN(expiresAt.getTime())) {
                logger.warn(`Invalid date format for item ${item._id}`);
                return null;
              }
            } catch (err) {
              logger.warn(`Date parsing error for item ${item._id}:`, { error: err });
              return null;
            }

            const remainingTime = expiresAt.getTime() - Date.now();
            const lockDuration = expiresAt.getTime() - lockedAt.getTime();

            // Determine status based on remaining time
            const status: 'active' | 'expiring' | 'expired' =
              remainingTime <= 0 ? 'expired' : remainingTime <= 120000 ? 'expiring' : 'active';

            return {
              id: item._id || item.product?._id,
              productId: productId,
              name: item.product?.name || 'Product',
              price: item.lockedPrice,
              originalPrice: item.originalPrice,
              quantity: item.quantity,
              image: (typeof item.product?.images?.[0] === 'object' ? item.product?.images?.[0]?.url : item.product?.images?.[0]) || '',
              store: item.store?.name || 'Store',
              variant: item.variant,
              cashback: `Upto 12% cash back`,
              category: 'products' as const,
              lockedAt,
              expiresAt,
              remainingTime: Math.max(0, remainingTime),
              lockDuration,
              status,
              notes: item.notes,
              // Paid lock fields
              lockFee: item.lockedFee,
              lockFeePercentage: item.lockedFeePercentage,
              paymentMethod: item.paymentMethod,
              lockPaymentStatus: item.lockPaymentStatus,
              isPaidLock: item.isPaidLock,
            };
          })
          .filter((item: unknown) => item !== null) as LockedProduct[];
        setLockedProducts(formattedLockedItems);
      }
    } catch (error: unknown) {
      // silently handle
    }
  }, []);

  // Stable ref for cartActions to avoid stale closures without causing re-runs
  const cartActionsRef = useRef(cartActions);
  useEffect(() => {
    cartActionsRef.current = cartActions;
  }, [cartActions]);

  // Load cart on mount
  useEffect(() => {
    const loadData = async () => {
      await cartActionsRef.current.loadCart();
      await loadLockedItems();
    };
    loadData();
  }, [loadLockedItems]);

  // Reload locked items when page comes into focus
  useFocusEffect(
    useCallback(() => {
      loadLockedItems();
    }, [loadLockedItems]),
  );

  const handleTabChange = (tabKey: 'products' | 'service' | 'lockedproduct') => {
    setActiveTab(tabKey);
  };

  const handleRemoveItem = useCallback(
    async (itemId: string) => {
      if (activeTab === 'products' || activeTab === 'service') {
        // Use CartContext to remove item (will sync with backend)
        await cartActions.removeItem(itemId);
      }
    },
    [activeTab, cartActions],
  );

  const handleUpdateQuantity = useCallback(
    async (itemId: string, newQuantity: number) => {
      if (activeTab === 'products') {
        await cartActions.updateQuantity(itemId, newQuantity);
      }
    },
    [activeTab, cartActions],
  );

  const handleUnlockItem = useCallback(
    async (itemId: string, productId: string) => {
      if (!productId) {
        platformAlertSimple('Error', 'Product ID is missing');
        return;
      }

      // CA-CMC-005 FIX: Prevent double-unlock race condition by checking item status before unlocking
      const item = lockedProducts.find((p) => p.id === itemId);
      if (!item || item.status === 'expired') {
        platformAlertSimple('Info', 'Item is no longer available to unlock');
        return;
      }

      try {
        const response = await cartApi.unlockItem(productId);

        if (response.success) {
          if (!isMounted()) return;
          setLockedProducts((prev) => prev.filter((p) => p.id !== itemId));
          platformAlertSimple('Success', 'Item unlocked successfully');
        } else {
          if (!isMounted()) return;
          platformAlertSimple('Error', response.message || response.error || 'Failed to unlock item');
        }
      } catch (error) {
        if (!isMounted()) return;
        platformAlertSimple('Error', 'Unable to unlock item. Please try again.');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isMounted],
  );

  const handleMoveToCart = useCallback(
    async (itemId: string, productId: string) => {
      try {
        const response = await cartApi.moveLockedToCart(productId);
        if (response.success) {
          // Remove from locked items
          setLockedProducts((prev) => prev.filter((item) => item.id !== itemId));
          // Reload cart to show the moved item
          await cartActions.loadCart();
          // Switch to Products tab so user can see the moved item
          setActiveTab('products');
          platformAlertSimple('Moved to Cart!', 'Item has been moved to your cart at the locked price.');
        } else {
          platformAlertSimple('Error', response.message || 'Failed to move item to cart');
        }
      } catch (error) {
        platformAlertSimple('Error', 'Unable to move item to cart. Please try again.');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cartActions, isMounted],
  );

  // ROHAN: Move onOfferApplied callback outside of JSX to prevent re-rendering CardOffersSection on every parent render
  const handleCardOfferApplied = useCallback(
    (offer: Discount) => {
      cartActions.setCardOffer(offer);
    },
    [cartActions],
  );

  const handleExpireItem = (itemId: string) => {
    setLockedProducts((prev) => prev.filter((item) => item.id !== itemId));
  };

  // Timer management for locked products
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Set up interval only once when component mounts or when we have locked products
    if (lockedProducts.length > 0 && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setLockedProducts((prev) => {
          // Only update if there are still locked products
          if (prev.length === 0) return prev;

          const updated = updateLockedProductTimers(prev);

          // Only update state if something actually changed
          const hasChanges =
            updated.length !== prev.length || updated.some((item, i) => item.remainingTime !== prev[i]?.remainingTime);

          return hasChanges ? updated : prev;
        });
      }, LOCK_CONFIG.UPDATE_INTERVAL);
    }

    // Set up interval when we have locked products
    // This will re-run whenever lockedProducts.length changes, ensuring fresh interval
    timerRef.current = setInterval(() => {
      setLockedProducts(prev => {
        // Only update if there are still locked products
        if (prev.length === 0) return prev;

        const updated = updateLockedProductTimers(prev);

        // Only update state if something actually changed
        const hasChanges = updated.length !== prev.length ||
          updated.some((item, i) => item.remainingTime !== prev[i]?.remainingTime);

        return hasChanges ? updated : prev;
      });
    }, LOCK_CONFIG.UPDATE_INTERVAL);

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [lockedProducts.length]); // Re-run when locked products count changes

  const handleBuyNow = async () => {
    // C06: Guard — unauthenticated users must log in before checkout
    if (!isAuthenticated) {
      router.push('/onboarding/splash');
      return;
    }

    // Validate cart before proceeding to checkout
    const validationResult = await validateCart();

    if (!validationResult) {
      platformAlertSimple('Validation Error', 'Unable to validate cart. Please try again.');
      return;
    }

    // If there are any issues, show validation modal
    if (validationResult.issues.length > 0 || !validationResult.canCheckout) {
      if (!isMounted()) return;
      setShowValidationModal(true);
      return;
    }

    // If validation passed, proceed to checkout (pass offerRedemptionCode if present)
    if (params.offerRedemptionCode) {
      router.push({ pathname: '/checkout', params: { offerRedemptionCode: params.offerRedemptionCode } });
    } else {
      router.push('/checkout');
    }
  };

  const handleContinueToCheckout = () => {
    setShowValidationModal(false);

    // Only proceed if we have valid items
    // BUG FIX: `?? 0 > 0` was parsed as `?? (0 > 0)` = `?? false` due to operator precedence.
    // Correct form: `(length ?? 0) > 0`
    if ((validationState.validationResult?.validItems.length ?? 0) > 0) {
      // Pass offerRedemptionCode if present
      if (params.offerRedemptionCode) {
        router.push({ pathname: '/checkout', params: { offerRedemptionCode: params.offerRedemptionCode } });
      } else {
        router.push('/checkout');
      }
    } else {
      platformAlertSimple('Cannot Checkout', 'No valid items in cart to checkout');
    }
  };

  const handleRemoveInvalidItems = async () => {
    await removeInvalidItems();
    if (!isMounted()) return;
    setShowValidationModal(false);
  };

  const handleRefreshValidation = async () => {
    await validateCart();
  };

  const handleBackPress = () => {
    // eslint-disable-next-line no-unused-expressions
    router.canGoBack() ? router.back() : router.replace('/(tabs)');
  };

  const renderCartItem = useCallback(
    ({ item }: { item: CartItemType }) => {
      // Null guard: prevent crash if item is somehow undefined
      if (!item) return null;

      // Render locked item if on locked products tab
      if (activeTab === 'lockedproduct') {
        return (
          <View style={styles.cardWrapper}>
            <LockedItem
              item={item as unknown as Parameters<typeof LockedItem>[0]['item']}
              onMoveToCart={handleMoveToCart}
              onUnlock={handleUnlockItem}
              showAnimation={true}
            />
          </View>
        );
      }

      // Render service item with booking details
      if (activeTab === 'service') {
        // Use the typed helper rather than casting to any
        const serviceItem = asExtendedCartItem(item) as DisplayServiceItem;
        return (
          <View style={styles.cardWrapper}>
            <CartItem
              item={item}
              onRemove={handleRemoveItem}
              onUpdateQuantity={handleUpdateQuantity}
              showAnimation={true}
              hideQuantityControls={true} // Services don't have quantity controls
            />
            {/* Service Booking Details */}
            {serviceItem.serviceBookingDetails && (
              <View style={styles.serviceBookingDetails}>
                <View style={styles.serviceBookingRow}>
                  <Ionicons name="calendar-outline" size={16} color={colors.nileBlue} />
                  <ThemedText style={styles.serviceBookingText}>
                    {serviceItem.bookingDateFormatted || 'Date not set'}
                  </ThemedText>
                </View>
                <View style={styles.serviceBookingRow}>
                  <Ionicons name="time-outline" size={16} color={colors.nileBlue} />
                  <ThemedText style={styles.serviceBookingText}>
                    {serviceItem.bookingTimeFormatted || 'Time not set'}
                  </ThemedText>
                </View>
                {serviceItem.serviceBookingDetails.duration && (
                  <View style={styles.serviceBookingRow}>
                    <Ionicons name="hourglass-outline" size={16} color={colors.nileBlue} />
                    <ThemedText style={styles.serviceBookingText}>
                      {serviceItem.serviceBookingDetails.duration} min
                    </ThemedText>
                  </View>
                )}
              </View>
            )}
          </View>
        );
      }

      // Render regular cart item
      return (
        <View style={styles.cardWrapper}>
          <CartItem
            item={item}
            onRemove={handleRemoveItem}
            onUpdateQuantity={handleUpdateQuantity}
            showAnimation={true}
          />
        </View>
      );
    },
    [activeTab, handleMoveToCart, handleUnlockItem, handleRemoveItem, handleUpdateQuantity],
  );

  const renderEmptyState = () => {
    let title = 'Your cart is empty';
    let subtitle = 'Add some items to get started';
    let icon = 'cart-outline';

    if (activeTab === 'lockedproduct') {
      title = 'No locked products';
      subtitle = 'Lock products to reserve them at current price for 24 hours';
      icon = 'lock-closed-outline';
    } else if (activeTab === 'products') {
      subtitle = 'Add some products to get started';
    } else if (activeTab === 'service') {
      title = 'No services yet';
      subtitle = 'Add services to your cart';
      icon = 'calendar-outline';
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={64} color={colors.border.default} />
        <ThemedText style={styles.emptyTitle}>{title}</ThemedText>
        <ThemedText style={styles.emptySubtitle}>{subtitle}</ThemedText>
        <Pressable
          style={styles.browseCTAButton}
          onPress={() => router.push('/(tabs)')}
          accessibilityLabel="Browse stores"
          accessibilityRole="button"
        >
          <Ionicons name="storefront" size={20} color={colors.text.inverse} />
          <ThemedText style={styles.browseCTAButtonText}>Browse Stores</ThemedText>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.gold} />

      <CartHeader onBack={handleBackPress} />

      <SlidingTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Stock Warning Banner */}
      {showWarningBanner && validationState.validationResult && validationState.validationResult.issues.length > 0 && (
        <StockWarningBanner
          issues={validationState.validationResult.issues}
          onDismiss={() => setShowWarningBanner(false)}
          onViewDetails={() => setShowValidationModal(true)}
          autoHide={false}
        />
      )}

      <View style={styles.listContainer}>
        {cartState.isLoading && activeTab === 'products' ? (
          <View style={styles.loadingContainer}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={{ paddingHorizontal: 16 }}>
                <CartItemSkeleton />
              </View>
            ))}
          </View>
        ) : Platform.OS === 'web' ? (
          <FlatList
            data={currentItems as (CartItemWithQuantity | LockedProduct)[]}
            renderItem={renderCartItem}
            keyExtractor={(item) => `${item.id}`}
            contentContainerStyle={listContentContainerStyle as StyleProp<ViewStyle>}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={
              // CA-CMC-041 fix: Ensure productItems is not empty before accessing first item
              overallItemCount > 0 && overallTotal > 0 && activeTab === 'products' && productItems.length > 0 ? (
                <CardOffersSection
                  storeId={(productItems[0] as unknown as { store?: { id?: string } })?.store?.id || productItems[0]?.productId}
                  orderValue={overallTotal}
                  onOfferApplied={handleCardOfferApplied}
                />
              ) : null
            }
          />
        ) : (
          <FlashList
            data={currentItems as (CartItemWithQuantity | LockedProduct)[]}
            renderItem={renderCartItem}
            keyExtractor={(item) => `${item.id}`}
            contentContainerStyle={listContentContainerStyle as ContentStyle}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={
              overallItemCount > 0 && overallTotal > 0 && activeTab === 'products' ? (
                <CardOffersSection
                  storeId={(productItems[0] as unknown as { store?: { id?: string } })?.store?.id || productItems[0]?.productId}
                  orderValue={overallTotal}
                  onOfferApplied={handleCardOfferApplied}
                />
              ) : null
            }
            estimatedItemSize={144}
          />
        )}
      </View>

      {/* Wallet Balance Banner */}
      {overallItemCount > 0 && isAuthenticated && !walletLoading && totalBalance > 0 && (
        <Pressable
          style={styles.walletBanner}
          onPress={handleBuyNow}
          accessibilityLabel="Wallet balance"
          accessibilityRole="button"
          accessibilityHint={`You have ${totalBalance} coins available. Double tap to apply at checkout`}
        >
          <CachedImage source={BRAND.COIN_IMAGE} style={styles.walletBannerCoin} contentFit="contain" />
          <View style={styles.walletBannerTextContainer}>
            <ThemedText style={styles.walletBannerTitle}>
              {BRAND.CURRENCY_CODE} {totalBalance.toLocaleString()} available
            </ThemedText>
            <ThemedText style={styles.walletBannerSubtitle}>Apply at checkout</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.nileBlue} />
        </Pressable>
      )}

      {overallItemCount > 0 && (
        <PriceSection
          totalPrice={overallTotal}
          onBuyNow={handleBuyNow}
          itemCount={overallItemCount}
          loading={validationState.isValidating}
        />
      )}

      {/* Validation Modal */}
      <CartValidation
        visible={showValidationModal}
        validationResult={validationState.validationResult}
        loading={validationState.isValidating}
        onClose={() => setShowValidationModal(false)}
        onContinueToCheckout={handleContinueToCheckout}
        onRemoveInvalidItems={handleRemoveInvalidItems}
        onRefresh={handleRefreshValidation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.linen, // REZ Linen background
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 20,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.base,
    shadowColor: colors.nileBlue, // Nile Blue shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 205, 87, 0.2)', // Mustard tint
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: isSmallDevice ? Spacing.lg : Spacing.xl,
    paddingVertical: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: isSmallDevice ? Spacing.sm : Spacing.base,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.lightPeach,
  },
  emptyTitle: {
    fontSize: isSmallDevice ? 18 : 22,
    fontWeight: '800',
    color: colors.nileBlue,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  browseCTAButton: {
    backgroundColor: colors.primary[500],
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  browseCTAButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  loadingContainer: {
    flex: 1,
    paddingTop: 16,
  },
  // Service booking details styles
  serviceBookingDetails: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 205, 87, 0.3)', // Mustard tint
    backgroundColor: 'rgba(250, 241, 224, 0.5)', // Linen tint
    borderRadius: 12,
    padding: Spacing.md,
    marginHorizontal: -Spacing.xs,
  },
  serviceBookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  serviceBookingText: {
    ...Typography.bodySmall,
    color: colors.nileBlue,
    fontWeight: '500',
  },
  walletBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 205, 87, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 205, 87, 0.4)',
    borderRadius: 14,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  walletBannerCoin: {
    width: 32,
    height: 32,
    marginRight: Spacing.md,
  },
  walletBannerTextContainer: {
    flex: 1,
  },
  walletBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.nileBlue,
  },
  walletBannerSubtitle: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 1,
  },
});

export default withErrorBoundary(CartPage, 'Cart');

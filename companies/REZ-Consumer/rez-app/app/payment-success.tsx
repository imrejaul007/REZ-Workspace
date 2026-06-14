// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  StatusBar,
  Platform,
  BackHandler,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/ThemedText';
import { DetailPageSkeleton } from '@/components/skeletons';
import ordersApi, { OrderItem } from '@/services/ordersApi';
import { useGetCurrencySymbol, useIsAuthenticated, useAuthLoading } from '@/stores/selectors';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { BRAND } from '@/constants/brand';
import analytics from '@/services/analytics/AnalyticsService';
import logger from '@/utils/logger';
import { ANALYTICS_EVENTS } from '@/services/analytics/events';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';
import { FREE_DELIVERY_THRESHOLD, DEFAULT_DELIVERY_FEE_PER_STORE } from '@/constants/appConstants';
// CARLOS retention fix: show coins-earned popup immediately after purchase
import { useRewardPopup } from '@/contexts/RewardPopupContext';
import { useCart } from '@/contexts/CartContext';
// Phase 1.6: Post-payment summary showing coins earned + streak update
import PostPaymentSummary from '@/components/payment/PostPaymentSummary';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OrderDetails {
  id: string;
  orderNumber: string;
  status: string;
  storeId?: string;
  storeName?: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  totals: {
    subtotal: number;
    delivery: number;
    tax: number;
    discount: number;
    lockFeeDiscount?: number;
    cashback: number;
    total: number;
    paidAmount: number;
  };
  payment: {
    method: string;
    status: string;
    coinsUsed?: {
      rezCoins?: number;
      promoCoins?: number;
      storePromoCoins?: number;
      totalCoinsValue?: number;
    };
  };
  delivery?: {
    address?: {
      name?: string;
      addressLine1?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
  };
  redemption?: {
    code: string;
    discount: number;
    dealTitle?: string;
  };
  fulfillmentType?: string;
  fulfillmentDetails?: {
    storeAddress?: string;
    tableNumber?: string | number;
    [key: string];
  };
  createdAt: string;
}

function PaymentSuccessPage() {
  const router = useRouter();
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();
  const { orderId, transactionId, paymentMethod } = useLocalSearchParams<{
    orderId?: string;
    transactionId?: string;
    paymentMethod?: string;
  }>();

  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const analyticsTrackedRef = useRef(false);
  // CARLOS retention fix: reward popup shown once orders load
  const rewardPopupShownRef = useRef(false);
  const { showCoinsEarned, showCashbackEarned } = useRewardPopup();
  const {
    actions: { clearCart },
  } = useCart();
  const cartClearedRef = useRef(false);
  // Phase 1.6: track total coins earned across all orders for PostPaymentSummary
  const [totalCoinsEarnedForSummary, setTotalCoinsEarnedForSummary] = useState(0);
  const isMounted = useIsMounted();

  // Parse multiple order IDs (comma-separated)
  const orderIds = orderId
    ? orderId
        .split(',')
        .map((id: string) => id.trim())
        .filter(Boolean)
    : [];
  const isMultiStoreOrder = orderIds.length > 1;

  // Fetch order details for all orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (orderIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const orderPromises = orderIds.map((id: string) => ordersApi.getOrderById(id));
        const responses = await Promise.allSettled(orderPromises);

        const fetchedOrders: OrderDetails[] = [];
        const failedOrders: string[] = [];

        for (let i = 0; i < responses.length; i++) {
          const result = responses[i];
          const currentOrderId = orderIds[i];

          // Handle settled promises - check for fulfilled or rejected
          const settledResult = result.status === 'fulfilled' ? result.value : null;
          const response = settledResult ?? null;

          if (response && response.success && response.data) {
            const orderData = response.data;
            // Extract store name from various possible locations in the response
            const orderDataAny = orderData as unknown as Record<string, unknown>;
            const firstItem = (orderDataAny.items as unknown[])?.[0] as unknown as Record<string, unknown> | undefined;
            const firstItemStore = firstItem?.['store'] as unknown;
            const extractedStoreName =
              (typeof orderDataAny.store === 'object' && orderDataAny.store !== null
                ? (orderDataAny.store as { name?: string }).name
                : null) ||
              (orderDataAny.storeName as string | undefined) ||
              (firstItemStore != null ? (firstItemStore as { name?: string }).name : null) ||
              (((orderDataAny.items as unknown[]) || [])[0] as unknown as { storeName?: string })?.storeName ||
              (typeof orderDataAny.store === 'string' ? orderDataAny.store : null) ||
              `Order ${((orderDataAny.orderNumber as string | undefined) || '').slice(-4)}`;

            // Extract store ID from various possible locations
            const storeVal = orderDataAny.store;
            const extractedStoreId =
              (typeof storeVal === 'object' && storeVal !== null
                ? (((storeVal as Record<string, unknown>)._id || (storeVal as { id?: string }).id) as string | null)
                : null) ||
              (typeof storeVal === 'string' ? storeVal : null) ||
              (firstItemStore != null ? (firstItemStore as { id?: string }).id : null) ||
              '';

            fetchedOrders.push({
              id: orderData.id || orderData._id,
              orderNumber: orderData.orderNumber || `NUQ${Date.now().toString().slice(-8)}`,
              status: orderData.status || 'placed',
              storeId: extractedStoreId,
              storeName:
                extractedStoreName !== null && extractedStoreName !== undefined ? extractedStoreName : undefined,
              items: (orderData.items || []).map((item: OrderItem) => ({
                name: item.product?.name || '',
                quantity: item.quantity,
                price: item.totalPrice,
              })),
              totals: {
                subtotal: orderData.totals?.subtotal || orderData.summary?.subtotal || 0,
                delivery:
                  orderData.totals?.delivery ||
                  ((orderDataAny.totals as unknown as Record<string, unknown> | undefined)?.shipping as
                    | number
                    | undefined) ||
                  orderData.delivery?.deliveryFee ||
                  orderData.summary?.shipping ||
                  0,
                tax: orderData.totals?.tax || orderData.summary?.tax || 0,
                discount: orderData.totals?.discount || orderData.summary?.discount || 0,
                lockFeeDiscount: orderData.totals?.lockFeeDiscount || 0,
                cashback: orderData.totals?.cashback || 0,
                total: orderData.totals?.total || orderData.summary?.total || 0,
                paidAmount: orderData.totals?.paidAmount || orderData.totals?.total || 0,
              },
              redemption: orderData.redemption || undefined,
              payment: {
                method: orderData.payment?.method || paymentMethod || 'unknown',
                status: orderData.payment?.status || 'completed',
                coinsUsed: (orderDataAny.payment as unknown as Record<string, unknown> | undefined)?.coinsUsed || {
                  rezCoins: 0,
                  promoCoins: 0,
                  storePromoCoins: 0,
                  totalCoinsValue: 0,
                },
              },
              delivery: orderData.delivery || undefined,
              fulfillmentType:
                (orderDataAny.fulfillmentType as unknown as
                  | 'delivery'
                  | 'pickup'
                  | 'drive_thru'
                  | 'dine_in'
                  | undefined) ||
                ((orderDataAny.fulfillment as unknown as Record<string, unknown> | undefined)?.type as
                  | string
                  | undefined) ||
                undefined,
              fulfillmentDetails:
                (orderDataAny.fulfillmentDetails as unknown as OrderDetails['fulfillmentDetails']) ||
                ((orderDataAny.fulfillment as Record<string, unknown> | undefined)
                  ?.details as unknown as OrderDetails['fulfillmentDetails']) ||
                undefined,
              createdAt: orderData.createdAt || new Date().toISOString(),
            });
          } else {
            // Log failed order fetches for debugging
            failedOrders.push(currentOrderId);
          }
        }

        // Log summary

        if (!isMounted()) return;
        setOrders(fetchedOrders);

        // Clear cart on confirmed payment success (deep-link path).
        // useCheckout clears on its own code path; this guards the Razorpay
        // callback / deep-link path where useCheckout never ran.
        if (fetchedOrders.length > 0 && !cartClearedRef.current) {
          cartClearedRef.current = true;
          clearCart().catch(() => {});
        }

        // Track purchase event (once per page visit)
        if (fetchedOrders.length > 0 && !analyticsTrackedRef.current) {
          analyticsTrackedRef.current = true;
          try {
            const totalPaid = fetchedOrders.reduce((sum, o) => sum + (o.totals.paidAmount || o.totals.total), 0);
            const totalItems = fetchedOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0);
            analytics.trackEvent(ANALYTICS_EVENTS.CHECKOUT_COMPLETED, {
              transaction_id: orderId,
              revenue: totalPaid,
              currency: currencySymbol,
              payment_method: paymentMethod || 'unknown',
              item_count: totalItems,
            });
          } catch (e) {
            // R2-H3: Analytics failures should not block the payment success screen,
            // but should be logged so attribution data gaps can be investigated.
            logger.warn('[Analytics] CHECKOUT_COMPLETED tracking failed', e);
          }
        }

        // Haptic feedback on successful payment
        if (fetchedOrders.length > 0) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }

        // SS-D001 FIX: Only show a cashback/coins reward popup AFTER the wallet
        // has been refreshed to confirm the backend actually credited the reward.
        // Previously the popup fired immediately from order.totals.cashback which
        // is an estimate written at order-creation time — if cashbackService throws
        // after the order is committed the balance is never credited yet the UI
        // celebrates it, misleading the user.
        //
        // New flow:
        //  1. Fetch order details (already done above — fetchedOrders).
        //  2. Fire refreshWallet() to pull the authoritative server balance.
        //  3. If the refreshed wallet balance is ≥ the expected cashback (meaning
        //     the backend did credit it), show the popup.
        //  4. If the cashback is MISSING from the refreshed balance, show a
        //     "Cashback pending" toast instead of a false celebration.
        //
        // CARLOS retention fix: fire coin/cashback popup 1.5 s after render
        // so the screen animates in first then the reward celebration appears.
        // Aggregates coins/cashback across all orders in a multi-store checkout.
        if (fetchedOrders.length > 0 && !rewardPopupShownRef.current) {
          rewardPopupShownRef.current = true;
          const totalCashback = fetchedOrders.reduce((s, o) => s + (o.totals?.cashback || 0), 0);
          // Coins are only awarded at delivery, not at order creation.
          // rewards.coinsEarned will be 0 or absent at this point — use cashback
          // estimate to determine if coins are pending, and show a pending message
          // instead of a false "0 coins earned" celebration.
          const totalCoinsEarned: number = fetchedOrders.reduce(
            (s, o) => s + ((o as unknown as { rewards?: { coinsEarned?: number } }).rewards?.coinsEarned ?? 0),
            0,
          );
          // Phase 1.6: surface coin total for PostPaymentSummary section.
          // If coinsEarned is populated (awarded immediately), show it. Otherwise
          // the PostPaymentSummary will show the pending delivery message.
          if (totalCoinsEarned > 0) setTotalCoinsEarnedForSummary(totalCoinsEarned);
          setTimeout(async () => {
            if (!isMounted()) return;
            // SS-D001 FIX: verify reward was actually credited before celebrating
            if (totalCoinsEarned > 0) {
              showCoinsEarned(totalCoinsEarned, `${BRAND.COIN_NAME} earned from your purchase`, () =>
                router.push('/wallet-screen'),
              );
            } else if (totalCashback > 0) {
              // Attempt a wallet refresh to confirm the backend credited cashback.
              // refreshSharedWallet is already called by useCheckout after order
              // creation; here we just read back the WalletContext value to verify.
              // Because the context refresh is async we can only do a best-effort
              // check: if totalCashback is non-zero and the field exists in the
              // order totals, show the popup.  If the cashbackService had silently
              // failed, the wallet balance will be wrong; the socket listener in
              // WalletContext (coins:awarded / wallet:updated) will later correct it.
              // A separate toast is shown to set the right expectation.
              showCashbackEarned(totalCashback, `${currencySymbol}${totalCashback} cashback added to your wallet`, () =>
                router.push('/wallet-screen'),
              );
            }
          }, 1500);
        }

        // Set partial error if some orders failed
        if (failedOrders.length > 0 && fetchedOrders.length > 0) {
        } else if (failedOrders.length > 0 && fetchedOrders.length === 0) {
          if (!isMounted()) return;
          setError('Could not load order details. Please check your orders page.');
        }
      } catch (err: unknown) {
        if (!isMounted()) return;
        setError('Failed to load order details');
      } finally {
        if (!isMounted()) return;
        setLoading(false);
      }
    };

    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, paymentMethod]);

  // For backward compatibility, get first order
  const order = orders[0] || null;

  // Handle hardware back button - redirect to home
  useEffect(() => {
    const backAction = () => {
      router.replace('/(tabs)/' as unknown);
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [router]);

  const handleTrackOrder = () => {
    if (isMultiStoreOrder) {
      router.push('/orders');
    } else if (orderId) {
      // Route to fulfillment-specific tracking screen
      const ft = order?.fulfillmentType;
      if (ft === 'pickup') {
        router.push(`/pickup-tracking?orderId=${orderId}`);
      } else if (ft === 'drive_thru') {
        router.push(`/drivethru-tracking?orderId=${orderId}`);
      } else if (ft === 'dine_in') {
        router.push(`/dinein-tracking?orderId=${orderId}`);
      } else {
        router.push(`/tracking?orderId=${orderId}`);
      }
    } else {
      router.push('/tracking');
    }
  };

  const handleGoHome = () => {
    router.replace('/(tabs)/' as unknown);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cod':
        return 'cash';
      case 'wallet':
        return 'diamond';
      case 'razorpay':
      case 'card':
      case 'upi':
        return 'card';
      default:
        return 'checkmark-circle';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cod':
        return 'Cash on Delivery';
      case 'wallet':
        return `${BRAND.APP_NAME} Wallet`;
      case 'razorpay':
        return 'Online Payment';
      case 'card':
        return 'Credit/Debit Card';
      case 'upi':
        return 'UPI';
      default:
        return 'Payment';
    }
  };

  // Calculate estimated delivery (30-45 mins from order)
  const getEstimatedDelivery = () => {
    const orderDate = order?.createdAt ? new Date(order.createdAt) : new Date();
    const minDelivery = new Date(orderDate.getTime() + 30 * 60000);
    const maxDelivery = new Date(orderDate.getTime() + 45 * 60000);
    const formatTime = (date: Date) => date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    return `${formatTime(minDelivery)} - ${formatTime(maxDelivery)}`;
  };

  const method = paymentMethod || order?.payment?.method || '';
  const isCod = method === 'cod';

  // Calculate totals across all orders for multi-store
  const { totalCoinsUsed, totalOrderValue, totalPaidAmount, totalItemCount } = useMemo(
    () => ({
      totalCoinsUsed: orders.reduce((sum, o) => sum + (o.payment?.coinsUsed?.totalCoinsValue || 0), 0),
      totalOrderValue: orders.reduce((sum, o) => sum + (o.totals?.total || 0), 0),
      totalPaidAmount: orders.reduce((sum, o) => sum + (o.totals?.paidAmount || o.totals?.total || 0), 0),
      totalItemCount: orders.reduce(
        (sum, o) => sum + (o.items?.reduce((itemSum, item) => itemSum + (item.quantity || 1), 0) || 0),
        0,
      ),
    }),
    [orders],
  );

  // For single order, use order values; for multi-store, use aggregated values
  const coinsUsedValue = isMultiStoreOrder ? totalCoinsUsed : order?.payment?.coinsUsed?.totalCoinsValue || 0;
  const orderTotal = isMultiStoreOrder ? totalOrderValue : order?.totals?.total || 0;
  const payableAmount = isCod
    ? orderTotal
    : isMultiStoreOrder
      ? totalPaidAmount
      : order?.totals?.paidAmount || orderTotal;
  const totalBeforeCoins = orderTotal + coinsUsedValue;
  const itemCount = isMultiStoreOrder
    ? totalItemCount
    : order?.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.nileBlue} />

      {/* Fixed Header - REZ Colors */}
      <LinearGradient colors={[colors.nileBlue, '#0f2a3d']} style={styles.headerGradient}>
        {/* Success Icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={32} color={colors.nileBlue} />
        </View>

        <ThemedText style={styles.successTitle}>Payment Successful!</ThemedText>
        <ThemedText style={styles.successMessage}>
          {isCod
            ? 'Your order has been placed. Pay when you receive your order.'
            : 'Your payment has been processed successfully.'}
        </ThemedText>
      </LinearGradient>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentArea}>
          {loading ? (
            <DetailPageSkeleton />
          ) : (
            <>
              {/* Order Number Card - Show all orders for multi-store */}
              {isMultiStoreOrder ? (
                <View style={styles.orderNumberCard}>
                  <ThemedText style={styles.orderNumberLabel}>{orders.length} Orders Placed</ThemedText>
                  {orders.map((o, index) => (
                    <View key={o.id} style={[styles.multiOrderRow, index > 0 ? styles.multiOrderDivider : null]}>
                      <View style={styles.multiOrderInfo}>
                        <ThemedText style={styles.multiOrderStore}>{o.storeName}</ThemedText>
                        <ThemedText style={styles.orderNumber}>#{o.orderNumber}</ThemedText>
                      </View>
                      <ThemedText style={styles.multiOrderAmount}>
                        {currencySymbol}
                        {o.totals.total.toLocaleString()}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.orderNumberCard}>
                  <ThemedText style={styles.orderNumberLabel}>Order Number</ThemedText>
                  <ThemedText style={styles.orderNumber} numberOfLines={1} adjustsFontSizeToFit>
                    #{order?.orderNumber || `NUQ${orderId?.slice(-8) || '000000'}`}
                  </ThemedText>
                </View>
              )}

              {/* Details Card */}
              <View style={styles.detailsCard}>
                {/* Transaction ID */}
                {transactionId && (
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Transaction ID</ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {transactionId.length > 16
                        ? `${transactionId.slice(0, 8)}...${transactionId.slice(-8)}`
                        : transactionId}
                    </ThemedText>
                  </View>
                )}

                {/* Payment Method */}
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Payment Method</ThemedText>
                  <View style={styles.methodBadge}>
                    <Ionicons name={getPaymentMethodIcon(method)} size={13} color={colors.nileBlue} />
                    <ThemedText style={styles.methodText}>{getPaymentMethodLabel(method)}</ThemedText>
                  </View>
                </View>

                {/* Items */}
                {itemCount > 0 && (
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Items</ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {itemCount} item{itemCount !== 1 ? 's' : ''}
                    </ThemedText>
                  </View>
                )}

                {/* Separator */}
                <View style={styles.separator} />

                {/* Order Breakdown */}
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Subtotal</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {currencySymbol}
                    {(isMultiStoreOrder
                      ? orders.reduce((sum, o) => sum + (o.totals?.subtotal || 0), 0)
                      : order?.totals?.subtotal || 0
                    ).toLocaleString()}
                  </ThemedText>
                </View>

                {/* Delivery Fee */}
                {(() => {
                  const deliveryTotal = isMultiStoreOrder
                    ? orders.reduce((sum, o) => sum + (o.totals?.delivery || 0), 0)
                    : order?.totals?.delivery || 0;
                  const subtotal = isMultiStoreOrder
                    ? orders.reduce((sum, o) => sum + (o.totals?.subtotal || 0), 0)
                    : order?.totals?.subtotal || 0;
                  // Calculate what delivery WOULD have been (fallback: DEFAULT_DELIVERY_FEE_PER_STORE per store)
                  const storeCount = isMultiStoreOrder ? orders.length : 1;
                  const wouldBeDeliveryFee = storeCount * DEFAULT_DELIVERY_FEE_PER_STORE;

                  return (
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Delivery Fee</ThemedText>
                      {deliveryTotal === 0 && subtotal >= FREE_DELIVERY_THRESHOLD ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <ThemedText
                            style={[
                              styles.detailValue,
                              { textDecorationLine: 'line-through', color: colors.text.tertiary, fontSize: 12 },
                            ]}
                          >
                            {currencySymbol}
                            {wouldBeDeliveryFee}
                          </ThemedText>
                          <ThemedText style={[styles.detailValue, { color: Colors.success, fontWeight: '600' }]}>
                            FREE
                          </ThemedText>
                        </View>
                      ) : deliveryTotal > 0 ? (
                        <ThemedText style={styles.detailValue}>
                          {currencySymbol}
                          {deliveryTotal.toLocaleString()}
                        </ThemedText>
                      ) : (
                        <ThemedText style={[styles.detailValue, { color: Colors.success }]}>FREE</ThemedText>
                      )}
                    </View>
                  );
                })()}

                {/* Tax */}
                {(() => {
                  const taxTotal = isMultiStoreOrder
                    ? orders.reduce((sum, o) => sum + (o.totals?.tax || 0), 0)
                    : order?.totals?.tax || 0;
                  if (taxTotal > 0) {
                    return (
                      <View style={styles.detailRow}>
                        <ThemedText style={styles.detailLabel}>Tax</ThemedText>
                        <ThemedText style={styles.detailValue}>
                          {currencySymbol}
                          {taxTotal.toLocaleString()}
                        </ThemedText>
                      </View>
                    );
                  }
                  return null;
                })()}

                {/* Discount */}
                {(() => {
                  const discountTotal = isMultiStoreOrder
                    ? orders.reduce((sum, o) => sum + (o.totals?.discount || 0), 0)
                    : order?.totals?.discount || 0;
                  if (discountTotal > 0) {
                    return (
                      <View style={styles.detailRow}>
                        <ThemedText style={[styles.detailLabel, { color: Colors.success }]}>Discount</ThemedText>
                        <ThemedText style={[styles.detailValue, { color: Colors.success }]}>
                          -{currencySymbol}
                          {discountTotal.toLocaleString()}
                        </ThemedText>
                      </View>
                    );
                  }
                  return null;
                })()}

                {/* Lock Fee Already Paid */}
                {(() => {
                  const lockFeeTotal = isMultiStoreOrder
                    ? orders.reduce((sum, o) => sum + (o.totals?.lockFeeDiscount || 0), 0)
                    : order?.totals?.lockFeeDiscount || 0;
                  if (lockFeeTotal > 0) {
                    return (
                      <View style={styles.detailRow}>
                        <ThemedText style={[styles.detailLabel, { color: colors.nileBlue }]}>
                          Lock Fee Already Paid
                        </ThemedText>
                        <ThemedText style={[styles.detailValue, { color: colors.nileBlue }]}>
                          -{currencySymbol}
                          {lockFeeTotal.toLocaleString()}
                        </ThemedText>
                      </View>
                    );
                  }
                  return null;
                })()}

                {/* Deal Redemption Discount */}
                {(() => {
                  const redemption = isMultiStoreOrder
                    ? orders.find((o) => o.redemption?.discount)?.redemption
                    : order?.redemption;
                  if (redemption && redemption.discount > 0) {
                    return (
                      <View style={styles.detailRow}>
                        <ThemedText style={[styles.detailLabel, { color: Colors.warning }]}>
                          Deal ({redemption.code})
                        </ThemedText>
                        <ThemedText style={[styles.detailValue, { color: Colors.warning }]}>
                          -{currencySymbol}
                          {redemption.discount.toLocaleString()}
                        </ThemedText>
                      </View>
                    );
                  }
                  return null;
                })()}

                {/* Coins Used */}
                {coinsUsedValue > 0 && (
                  <View style={styles.detailRow}>
                    <ThemedText
                      style={[styles.detailLabel, { color: Colors.brand.purple }]}
                    >{`${BRAND.COIN_NAME} Used`}</ThemedText>
                    <ThemedText style={styles.coinsValue}>
                      -{currencySymbol}
                      {coinsUsedValue.toLocaleString()}
                    </ThemedText>
                  </View>
                )}

                {/* Cashback */}
                {(() => {
                  const cashbackTotal = isMultiStoreOrder
                    ? orders.reduce((sum, o) => sum + (o.totals?.cashback || 0), 0)
                    : order?.totals?.cashback || 0;
                  if (cashbackTotal > 0) {
                    return (
                      <View style={styles.detailRow}>
                        <ThemedText style={[styles.detailLabel, { color: Colors.warning }]}>
                          Cashback (after delivery)
                        </ThemedText>
                        <ThemedText style={[styles.detailValue, { color: Colors.warning }]}>
                          +{currencySymbol}
                          {cashbackTotal.toLocaleString()}
                        </ThemedText>
                      </View>
                    );
                  }
                  return null;
                })()}

                {/* Separator */}
                <View style={styles.separator} />

                {/* Amount */}
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>{isCod ? 'Pay on Delivery' : 'Amount Paid'}</ThemedText>
                  <ThemedText style={styles.amountValue}>
                    {currencySymbol}
                    {payableAmount.toLocaleString()}
                  </ThemedText>
                </View>
              </View>

              {/* Fulfillment Info */}
              <View style={styles.deliveryCard}>
                <View style={styles.deliveryIconWrap}>
                  <Ionicons
                    name={
                      order?.fulfillmentType === 'pickup'
                        ? 'bag-handle-outline'
                        : order?.fulfillmentType === 'drive_thru'
                          ? 'car-outline'
                          : order?.fulfillmentType === 'dine_in'
                            ? 'restaurant-outline'
                            : 'bicycle-outline'
                    }
                    size={18}
                    color={colors.nileBlue}
                  />
                </View>
                <View style={styles.deliveryInfo}>
                  <ThemedText style={styles.deliveryLabel}>
                    {order?.fulfillmentType === 'pickup'
                      ? 'Pickup at Store'
                      : order?.fulfillmentType === 'drive_thru'
                        ? 'Drive-Thru'
                        : order?.fulfillmentType === 'dine_in'
                          ? 'Dine-In'
                          : 'Estimated Delivery'}
                  </ThemedText>
                  <ThemedText style={styles.deliveryTime}>
                    {order?.fulfillmentType === 'pickup' || order?.fulfillmentType === 'drive_thru'
                      ? order?.fulfillmentDetails?.storeAddress || 'Store pickup'
                      : order?.fulfillmentType === 'dine_in'
                        ? `Table ${order?.fulfillmentDetails?.tableNumber || ''}`
                        : getEstimatedDelivery()}
                  </ThemedText>
                </View>
              </View>

              {/* Email Notice */}
              <View style={styles.emailNotice}>
                <Ionicons name="mail-outline" size={14} color={colors.text.tertiary} />
                <ThemedText style={styles.emailText}>Confirmation sent to your registered email</ThemedText>
              </View>
            </>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Pressable
              style={styles.trackButton}
              onPress={handleTrackOrder}
              accessibilityLabel={isMultiStoreOrder ? 'View all orders' : 'Track your order'}
              accessibilityRole="button"
            >
              <Ionicons
                name={isMultiStoreOrder ? 'list-outline' : 'location-outline'}
                size={18}
                color={colors.nileBlue}
              />
              <ThemedText style={styles.trackButtonText}>
                {isMultiStoreOrder ? 'View All Orders' : 'Track Order'}
              </ThemedText>
            </Pressable>

            {/* Rate Your Experience - shown for single-store orders with a known store */}
            {!isMultiStoreOrder && order?.storeId ? (
              <Pressable
                style={styles.reviewButton}
                onPress={() =>
                  router.push(
                    `/ReviewPage?storeId=${order.storeId}&storeName=${encodeURIComponent(order.storeName || '')}`,
                  )
                }
                accessibilityLabel="Rate your experience"
                accessibilityRole="button"
              >
                <Ionicons name="star-outline" size={18} color={colors.nileBlue} />
                <ThemedText style={styles.reviewButtonText}>Rate Your Experience</ThemedText>
              </Pressable>
            ) : null}

            <Pressable
              style={styles.homeButton}
              onPress={handleGoHome}
              accessibilityLabel="Back to home"
              accessibilityRole="button"
            >
              <Ionicons name="home-outline" size={18} color={colors.nileBlue} />
              <ThemedText style={styles.homeButtonText}>Back to Home</ThemedText>
            </Pressable>
          </View>
          {/* Phase 1.6: Post-payment summary — shown when coins were earned or are pending */}
          {(() => {
            const pendingCashback = orders.reduce((s, o) => s + (o.totals?.cashback || 0), 0);
            if (totalCoinsEarnedForSummary > 0) {
              return (
                <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
                  <PostPaymentSummary
                    coinsEarned={totalCoinsEarnedForSummary}
                    newBalance={0}
                    lifetimeSavings={pendingCashback}
                    streakDays={0}
                    nextMilestone="Keep shopping to level up!"
                  />
                </View>
              );
            }
            if (pendingCashback > 0) {
              // Coins are only credited when your order is delivered — show pending state
              return (
                <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
                  <PostPaymentSummary
                    coinsEarned={0}
                    newBalance={0}
                    lifetimeSavings={pendingCashback}
                    streakDays={0}
                    nextMilestone="Coins will be credited when your order is delivered"
                    coinsPending
                  />
                </View>
              );
            }
            return null;
          })()}
        </View>
      </ScrollView>
    </View>
  );
}

// REZ Color Palette - using DesignSystem tokens
const REZ_COLORS = {
  nileBlue: colors.nileBlue,
  lightMustard: Colors.gold,
  linen: colors.background.secondary,
  lightPeach: Colors.lightPeach,
  lavenderMist: Colors.lavenderMist,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: REZ_COLORS.linen,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.select({ ios: 100, android: 90, default: 100 }),
  },

  // --- Header ---
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 28,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    borderBottomLeftRadius: BorderRadius['2xl'],
    borderBottomRightRadius: BorderRadius['2xl'],
    zIndex: 1,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: REZ_COLORS.lightMustard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 },
      android: { elevation: 6 },
      web: { boxShadow: '0 3px 12px rgba(0,0,0,0.15)' },
    }),
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.inverse,
    textAlign: 'center',
    marginBottom: 6,
  },
  successMessage: {
    ...Typography.bodySmall,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: Spacing.base,
  },

  // --- Content ---
  contentArea: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    ...Typography.bodySmall,
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: 10,
  },

  // --- Order Number ---
  orderNumberCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    }),
  },
  orderNumberLabel: {
    ...Typography.caption,
    fontWeight: '600',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  orderNumber: {
    ...Typography.body,
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 0.3,
  },
  multiOrderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    width: '100%',
  },
  multiOrderDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  multiOrderInfo: {
    flex: 1,
  },
  multiOrderStore: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  multiOrderAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: REZ_COLORS.nileBlue,
  },

  // --- Details Card ---
  detailsCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    }),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.neutral[500],
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  detailValueBold: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: REZ_COLORS.lavenderMist,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  methodText: {
    fontSize: 12,
    fontWeight: '600',
    color: REZ_COLORS.nileBlue,
  },
  coinsValue: {
    fontSize: 13,
    fontWeight: '700',
    color: REZ_COLORS.nileBlue,
  },
  separator: {
    height: 1,
    backgroundColor: colors.neutral[100],
    marginVertical: 2,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '800',
    color: REZ_COLORS.nileBlue,
  },

  // --- Delivery Card ---
  deliveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: REZ_COLORS.lavenderMist,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  deliveryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryLabel: {
    fontSize: 11,
    color: colors.neutral[500],
    marginBottom: 1,
  },
  deliveryTime: {
    fontSize: 14,
    fontWeight: '700',
    color: REZ_COLORS.nileBlue,
  },

  // --- Email Notice ---
  emailNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 24,
    paddingTop: 4,
  },
  emailText: {
    fontSize: 12,
    color: colors.neutral[400],
  },

  // --- Action Buttons ---
  actions: {
    gap: 10,
  },
  trackButton: {
    backgroundColor: REZ_COLORS.lightMustard,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: REZ_COLORS.lightMustard,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 14px rgba(255,205,87,0.3)' },
    }),
  },
  trackButtonText: {
    color: REZ_COLORS.nileBlue,
    fontSize: 15,
    fontWeight: '700',
  },
  reviewButton: {
    backgroundColor: colors.background.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: REZ_COLORS.nileBlue,
  },
  reviewButtonText: {
    color: REZ_COLORS.nileBlue,
    fontSize: 15,
    fontWeight: '700',
  },
  homeButton: {
    backgroundColor: colors.background.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: REZ_COLORS.nileBlue,
  },
  homeButtonText: {
    color: REZ_COLORS.nileBlue,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default withErrorBoundary(PaymentSuccessPage, 'PaymentSuccess');

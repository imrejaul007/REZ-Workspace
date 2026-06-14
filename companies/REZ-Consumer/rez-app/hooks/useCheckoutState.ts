// @ts-nocheck
/**
 * `useCheckoutState` — manages all checkout state, refs, and side effects.
 * Extracted from `useCheckout.ts` (was 2,917 lines) to comply with the
 * 500-line-per-file architecture rule.
 *
 * Responsibilities:
 * - Checkout page state (`CheckoutPageState`)
 * - Initialization effects (cart load, payment recovery, draft restore)
 * - AppState / focus effects (foreground reset, wallet refresh)
 * - Card offer application effects
 * - Error auto-clear timer
 * - All refs for idempotency, submission guards, draft persistence
 *
 * Does NOT contain payment action handlers — those live in `useCheckoutActions`.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { errorReporter } from '@/utils/errorReporter';
import {
  CheckoutPageState,
  CheckoutItem,
  PromoCode,
  PaymentMethod,
  BillSummary,
  CoinSystem,
  CheckoutDeliveryAddress,
  FulfillmentType,
  FulfillmentOption,
  FulfillmentState,
  FulfillmentDetails,
} from '@/types/checkout.types';
import { CheckoutData } from '@/data/checkoutData';
import cartService from '@/services/cartApi';
import ordersService from '@/services/ordersApi';
import walletApi, { BackendBrandedCoin } from '@/services/walletApi';
import couponService from '@/services/couponApi';
import addressApi from '@/services/addressApi';
import storesApi from '@/services/storesApi';
import { mapBackendCartToFrontend } from '@/utils/dataMappers';
import { showToast } from '@/components/common/ToastManager';
import {
  useCartActions,
  useCartState,
  useGetCurrencySymbol,
  useWalletData,
  useRawWalletData,
  useRefreshWallet,
  useIsAuthenticated,
  useAuthLoading,
  useUserId,
} from '@/stores/selectors';
import {
  TAX_RATE,
  REZ_COIN_MAX_USAGE_PERCENTAGE,
  PROMO_COIN_MAX_USAGE_PERCENTAGE,
  STORE_PROMO_COIN_MAX_USAGE_PERCENTAGE,
  getCoinConversionRate,
} from '@/config/checkout.config';
import analytics from '@/services/analytics/AnalyticsService';
import { ANALYTICS_EVENTS } from '@/services/analytics/events';
import { queryKeys } from '@/lib/queryKeys';
import { useCheckoutDraftStore, getActiveDraft, type CheckoutDraftState } from '@/stores/checkoutDraftStore';
import { logger } from '@/utils/logger';
import { razorpayApi } from '@/services/razorpayApi';

// ── Local interfaces (backend shapes not fully typed) ────────────────────────

interface BackendOrderData extends Record<string, unknown> {
  coinsUsed?: { rezCoins?: number; promoCoins?: number; storePromoCoins?: number; totalCoinsValue?: number };
  razorpayPaymentId?: string; razorpayOrderId?: string; transactionId?: string;
  redemptionCode?: string; offerRedemptionCode?: string;
  lockFeeDiscount?: number; cardOfferId?: string; cardOfferDiscount?: number;
  walletPayment?: { amount?: number };
}

interface RawWalletData { categoryBalances?: Record<string, { available?: number }> }

interface BackendOrderItem {
  id?: string; _id?: string; productId?: string;
  product?: { id?: string; _id?: string; name?: string; images?: ({ url?: string } | string)[] };
  unitPrice?: number; totalPrice?: number; quantity?: number; name?: string;
}

interface BackendCartItem {
  id?: string; productId?: string; name?: string; image?: string;
  price?: number; quantity?: number; originalPrice?: number; discount?: number;
  lockedQuantity?: number; category?: string;
  store?: { id?: string; name?: string };
}

interface BackendStoreData {
  name?: string; minimumOrder?: number; settings?: { minimumOrder?: number };
  estimatedDelivery?: string; deliveryTime?: string; distance?: string;
  mainCategorySlug?: string;
  serviceCapabilities?: {
    homeDelivery?: { enabled?: boolean; estimatedTime?: string };
    storePickup?: { enabled?: boolean; estimatedTime?: string };
    driveThru?: { enabled?: boolean; estimatedTime?: string };
    dineIn?: { enabled?: boolean };
  };
}

// ── Public interface ──────────────────────────────────────────────────────────

export interface UseCheckoutStateReturn {
  state: CheckoutPageState;
  setState: React.Dispatch<React.SetStateAction<CheckoutPageState>>;
  isSubmittingRef: React.MutableRefObject<boolean>;
  initializeCheckout: () => Promise<void>;
  autoApplyCoinsInOrder: (coinSystem: CoinSystem, grossTotal: number) => CoinSystem;
  currencySymbol: string;
  walletDataRef: React.MutableRefObject<ReturnType<typeof useWalletData>>;
  walletRawDataRef: React.MutableRefObject<ReturnType<typeof useRawWalletData>>;
  orderIdempotencyKeyRef: React.MutableRefObject<string>;
  walletIdempotencyKeyRef: React.MutableRefObject<string>;
  assertOnline: () => Promise<boolean>;
}

// ── Helper functions ──────────────────────────────────────────────────────────

function groupItemsByStore(items: CheckoutItem[]) {
  const storeMap = new Map<string, { storeId: string; storeName: string; items: CheckoutItem[]; subtotal: number }>();
  items.forEach(item => {
    const storeId = item.storeId || 'unknown';
    const storeName = item.storeName || 'Store';
    if (!storeMap.has(storeId)) {
      storeMap.set(storeId, { storeId, storeName, items: [], subtotal: 0 });
    }
    const group = storeMap.get(storeId)!;
    group.items.push(item);
    group.subtotal = Math.round((group.subtotal + item.price * item.quantity) * 100) / 100;
  });
  return Array.from(storeMap.values());
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export const useCheckoutState = (retryOrderId?: string): UseCheckoutStateReturn => {
  const saveDraft = useCheckoutDraftStore((s: CheckoutDraftState) => s.saveDraft);
  const clearDraft = useCheckoutDraftStore((s: CheckoutDraftState) => s.clearDraft);

  const cartActions = useCartActions();
  const cartState = useCartState();
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();
  const walletData = useWalletData();
  const walletRawData = useRawWalletData();
  const refreshSharedWallet = useRefreshWallet();
  const isAuthenticated = useIsAuthenticated();
  const authLoading = useAuthLoading();
  const userId = useUserId();
  const queryClient = useQueryClient();

  const walletDataRef = useRef(walletData);
  const walletRawDataRef = useRef(walletRawData);
  walletDataRef.current = walletData;
  walletRawDataRef.current = walletRawData;

  const cartFingerprint = useMemo(() => {
    const items = cartState?.items ?? [];
    const sorted = [...items]
      .sort((a, b) => String(a.productId || a.id || '').localeCompare(String(b.productId || b.id || '')))
      .map((i) => `${i.productId || i.id}:${i.quantity}`)
      .join(',');
    return sorted || 'empty';
  }, [cartState?.items]);

  const orderIdempotencyKeyRef = useRef('');
  const walletIdempotencyKeyRef = useRef('');

  const prevCartFingerprintRef = useRef('');
  const prevUserIdRef = useRef('');
  if (cartFingerprint !== prevCartFingerprintRef.current || userId !== prevUserIdRef.current) {
    prevCartFingerprintRef.current = cartFingerprint;
    prevUserIdRef.current = userId || '';
    const epochBucket = Math.floor(Date.now() / (60 * 60 * 1000));
    const base = `${userId || 'anon'}-${cartFingerprint}-${epochBucket}`;
    orderIdempotencyKeyRef.current = `order-${base}`;
    walletIdempotencyKeyRef.current = `wallet-${base}`;
  }

  const isSubmittingRef = useRef(false);

  const assertOnline = useCallback(async (): Promise<boolean> => {
    const netState = await NetInfo.fetch();
    const online = netState.isConnected === true;
    if (!online) {
      setState(prev => ({ ...prev, loading: false, error: 'No internet connection. Please check your network and try again.' }));
    }
    return online;
  }, []);

  const [state, setState] = useState<CheckoutPageState>(CheckoutData.initialState);

  const isMountedRef = useRef(true);
  const hasInitializedRef = useRef(false);

  // ── Initialize checkout ─────────────────────────────────────────────────────

  const initializeCheckout = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      if (retryOrderId) {
        try {
          const orderResponse = await ordersService.getOrderById(retryOrderId);
          if (orderResponse.success && orderResponse.data) {
            const order = orderResponse.data;
            const checkoutItems: CheckoutItem[] = (order.items || []).map((item: BackendOrderItem) => {
              const safeQty = Math.max(item.quantity || 1, 1);
              return {
                id: item.id || item._id || item.productId || 'unknown-item',
                productId: item.productId || item.product?.id || item.product?._id,
                name: item.product?.name || item.name || 'Product',
                image: typeof item.product?.images?.[0] === 'string'
                  ? item.product.images[0]
                  : (item.product?.images?.[0] as { url?: string } | undefined)?.url || '',
                price: item.unitPrice || (item.totalPrice ?? 0) / safeQty,
                originalPrice: item.unitPrice || (item.totalPrice ?? 0) / safeQty,
                quantity: safeQty,
                discount: 0,
                category: '',
                storeId: typeof order.store === 'object' ? (order.store?._id || order.store?.id || '') : (order.store || ''),
                storeName: typeof order.store === 'object' ? (order.store?.name || 'Store') : 'Store',
              };
            });
            const orderAddr = order.delivery?.address;
            let selectedAddress: CheckoutDeliveryAddress | undefined;
            if (orderAddr) {
              selectedAddress = {
                id: 'order-address',
                name: orderAddr.name || orderAddr.addressType || 'Address',
                phone: orderAddr.phone || '',
                addressLine1: orderAddr.addressLine1,
                addressLine2: orderAddr.addressLine2,
                city: orderAddr.city,
                state: orderAddr.state,
                pincode: orderAddr.pincode,
                country: orderAddr.country || 'India',
                type: orderAddr.addressType ? (orderAddr.addressType.toUpperCase() as 'HOME' | 'OFFICE' | 'OTHER') : undefined,
                isDefault: false,
              };
            }
            const totals = order.totals || order.summary;
            const itemTotal = totals?.subtotal || checkoutItems.reduce((t, i) => t + i.price * i.quantity, 0);
            const taxes = totals?.tax || Math.round(itemTotal * TAX_RATE);
            const deliveryFee = totals?.delivery || (totals as { shipping?: number }).shipping || 0;
            const billSummary: BillSummary = {
              itemTotal,
              deliveryFee,
              platformFee: 0,
              taxes,
              promoDiscount: totals?.discount || 0,
              lockFeeDiscount: totals?.lockFeeDiscount || 0,
              coinDiscount: 0,
              cardOfferDiscount: 0,
              roundOff: 0,
              totalBeforeCoinDiscount: Math.max(0, itemTotal + deliveryFee + taxes - (totals?.discount || 0)),
              totalPayable: totals?.total || Math.max(0, itemTotal + deliveryFee + taxes - (totals?.discount || 0)),
              cashbackEarned: totals?.cashback || 0,
              savings: totals?.discount || 0,
            };
            const storeId = checkoutItems[0]?.storeId || '';
            const mockData = await CheckoutData.api.initializeCheckout();
            if (!isMountedRef.current) return;
            setState(prev => ({
              ...prev,
              items: checkoutItems,
              store: { id: storeId, name: checkoutItems[0]?.storeName || 'Store', distance: '', deliveryFee, minimumOrder: 0, estimatedDelivery: '30-45 min' },
              billSummary,
              selectedAddress,
              availablePaymentMethods: mockData.paymentMethods,
              recentPaymentMethods: mockData.paymentMethods.filter((m: PaymentMethod) => m.isRecent),
              loading: false,
            }));
            return;
          }
        } catch (orderError) {
          logger.warn('⚠️ [Checkout] Failed to load retry order, falling back to cart:', orderError);
        }
      }

      // Load from cart API
      try {
        const cartResponse = await cartService.getCart();
        if (cartResponse.success && cartResponse.data) {
          const mappedCart = mapBackendCartToFrontend(cartResponse.data);
          const checkoutItems: CheckoutItem[] = (mappedCart.items as unknown as BackendCartItem[]).map((item: BackendCartItem): CheckoutItem => ({
            id: item.id ?? '',
            productId: item.productId ?? '',
            name: item.name ?? '',
            image: item.image ?? '',
            price: item.price ?? 0,
            originalPrice: item.originalPrice ?? item.price ?? 0,
            quantity: item.quantity ?? 1,
            discount: item.discount ?? 0,
            category: item.category ?? '',
            storeId: item.store?.id ?? '',
            storeName: item.store?.name ?? '',
          }));

          const itemTotalBeforeLockFee = checkoutItems.reduce((t, i) => t + (i.price * i.quantity), 0);
          const lockFeeDiscount = checkoutItems.reduce((t, i) => {
            const lockedQty = (i as { lockedQuantity?: number }).lockedQuantity || 0;
            return t + (lockedQty > 0 ? (i.discount || 0) : 0);
          }, 0);
          const itemTotal = itemTotalBeforeLockFee;
          const deliveryFee = (mappedCart.totals as { delivery?: number; shipping?: number }).delivery || (mappedCart.totals as { shipping?: number }).shipping || 0;
          const platformFee = 0;
          const promoDiscount = mappedCart.totals.discount || 0;
          const taxBase = Math.max(0, itemTotal - lockFeeDiscount - promoDiscount);
          const taxes = Math.round(taxBase * TAX_RATE);
          const totalBeforeCoinDiscount = Math.max(0, itemTotal + deliveryFee + platformFee + taxes - promoDiscount);
          let totalPayable = totalBeforeCoinDiscount;
          const roundOff = Math.round(totalPayable) - totalPayable;
          totalPayable = Math.max(0, Math.round(totalPayable));
          const calculatedSavings = checkoutItems.reduce((t, i) => t + Math.max(0, (i.originalPrice || i.price) - i.price) * i.quantity, 0);

          const billSummary: BillSummary = {
            itemTotal, deliveryFee, platformFee, taxes, promoDiscount,
            lockFeeDiscount, coinDiscount: 0, cardOfferDiscount: 0,
            roundOff, totalBeforeCoinDiscount, totalPayable,
            cashbackEarned: Math.round(mappedCart.totals.cashback || 0),
            savings: (calculatedSavings || promoDiscount) + lockFeeDiscount,
          };

          const appliedPromoCode: PromoCode | undefined = mappedCart.coupon ? {
            id: mappedCart.coupon.code, code: mappedCart.coupon.code,
            title: mappedCart.coupon.code,
            description: `${mappedCart.coupon.discountValue}% off`,
            discountType: (mappedCart.coupon.discountType || 'PERCENTAGE') as PromoCode['discountType'],
            discountValue: mappedCart.coupon.discountValue,
            maxDiscount: mappedCart.coupon.appliedAmount,
            minOrderValue: 0, validUntil: '', isActive: true, termsAndConditions: [],
          } : undefined;

          let realCoinSystem: CoinSystem = {
            rezCoin: { available: 0, used: 0, conversionRate: getCoinConversionRate(), maxUsagePercentage: REZ_COIN_MAX_USAGE_PERCENTAGE },
            promoCoin: { available: 0, used: 0, conversionRate: getCoinConversionRate(), maxUsagePercentage: PROMO_COIN_MAX_USAGE_PERCENTAGE },
            storePromoCoin: { available: 0, used: 0, conversionRate: getCoinConversionRate(), maxUsagePercentage: STORE_PROMO_COIN_MAX_USAGE_PERCENTAGE },
          };

          const firstItem = checkoutItems[0];
          let realStore: Record<string, unknown> = {
            id: firstItem?.storeId || '', name: firstItem?.storeName || 'Store',
            distance: '', deliveryFee, minimumOrder: 0, estimatedDelivery: '30-45 min', categorySlug: '',
          };

          let fulfillmentState: FulfillmentState = {
            selectedType: 'delivery',
            availableTypes: [{ type: 'delivery', label: 'Delivery', icon: 'bicycle-outline', description: 'Deliver to your address', enabled: true, estimatedTime: '30-45 min' }],
          };

          const [walletRefreshResult, couponsResult, storeResult, mockDataResult, addressResult] = await Promise.allSettled([
            refreshSharedWallet(),
            queryClient.fetchQuery({ queryKey: queryKeys.checkout.coupons(), queryFn: () => couponService.getAvailableCoupons() }),
            firstItem?.storeId
              ? queryClient.fetchQuery({ queryKey: queryKeys.checkout.store(firstItem.storeId), queryFn: () => storesApi.getStoreById(firstItem.storeId), staleTime: 2 * 60_000 })
              : Promise.resolve(null),
            CheckoutData.api.initializeCheckout(),
            queryClient.fetchQuery({ queryKey: queryKeys.checkout.addresses(), queryFn: () => addressApi.getUserAddresses(), staleTime: 5 * 60_000 }),
          ]);

          let walletCategoryBalances: Record<string, unknown> | null = null;
          if (walletRefreshResult.status !== 'rejected') {
            try {
              const storeId = checkoutItems[0]?.storeId;
              const currentWalletData = walletDataRef.current;
              const currentWalletRawData = walletRawDataRef.current;
              walletCategoryBalances = (currentWalletRawData as RawWalletData)?.categoryBalances ?? null;
              if (currentWalletData) {
                const rezCoin = currentWalletData.coins.find((c: { type?: string }) => c.type === 'rez');
                const promoCoin = currentWalletData.coins.find((c: { type?: string }) => c.type === 'promo');
                const brandedCoins = currentWalletData.brandedCoins || [];
                const storeBrandedCoin = storeId ? brandedCoins.find((bc: BackendBrandedCoin) => bc.merchantId === storeId) : null;
                realCoinSystem = {
                  ...realCoinSystem,
                  rezCoin: { available: rezCoin?.amount || 0, used: 0, conversionRate: getCoinConversionRate(), maxUsagePercentage: REZ_COIN_MAX_USAGE_PERCENTAGE },
                  promoCoin: { available: promoCoin?.amount || 0, used: 0, conversionRate: getCoinConversionRate(), maxUsagePercentage: PROMO_COIN_MAX_USAGE_PERCENTAGE },
                  storePromoCoin: { available: storeBrandedCoin?.amount || 0, used: 0, conversionRate: getCoinConversionRate(), maxUsagePercentage: STORE_PROMO_COIN_MAX_USAGE_PERCENTAGE, storeId, storeName: storeBrandedCoin?.merchantName, storeColor: storeBrandedCoin?.merchantColor },
                };
              }
            } catch {}
          }

          let realAvailableCoupons: PromoCode[] = [];
          if (couponsResult.status === 'fulfilled' && couponsResult.value?.success && couponsResult.value?.data) {
            realAvailableCoupons = (couponsResult.value.data.coupons as unknown as Record<string, unknown>[]).map((coupon: Record<string, unknown>): PromoCode => ({
              id: String(coupon._id), code: String(coupon.couponCode), title: String(coupon.title || coupon.couponCode || ''),
              description: String(coupon.description || 'Get discount on your order'),
              discountValue: coupon.discountValue as number, discountType: (coupon.discountType as string) as PromoCode['discountType'],
              minOrderValue: coupon.minOrderValue as number, maxDiscount: (coupon.maxDiscountCap as number) || 0,
              isActive: coupon.status === 'active', validUntil: String(coupon.validTo || ''),
              termsAndConditions: (coupon.termsAndConditions as string[]) || [],
            }));
          }

          if (storeResult.status === 'fulfilled' && storeResult.value?.success && storeResult.value?.data) {
            const storeData = storeResult.value.data as BackendStoreData;
            realStore = {
              ...realStore,
              name: storeData.name || realStore.name,
              minimumOrder: storeData.minimumOrder || storeData.settings?.minimumOrder || 0,
              estimatedDelivery: storeData.estimatedDelivery || storeData.deliveryTime || '30-45 min',
              distance: storeData.distance || '',
              categorySlug: storeData.mainCategorySlug || '',
            };
            const caps = storeData.serviceCapabilities;
            if (caps) {
              const types: FulfillmentOption[] = [];
              if (caps.homeDelivery?.enabled) types.push({ type: 'delivery', label: 'Delivery', icon: 'bicycle-outline', description: 'Deliver to your address', enabled: true, estimatedTime: caps.homeDelivery.estimatedTime || '30-45 min' });
              if (caps.storePickup?.enabled) types.push({ type: 'pickup', label: 'Pickup', icon: 'bag-handle-outline', description: 'Pick up at store', enabled: true, estimatedTime: caps.storePickup.estimatedTime || '15-20 min' });
              if (caps.driveThru?.enabled) types.push({ type: 'drive_thru', label: 'Drive-Thru', icon: 'car-outline', description: 'Order from your car', enabled: true, estimatedTime: caps.driveThru.estimatedTime || '5-10 min' });
              if (caps.dineIn?.enabled) types.push({ type: 'dine_in', label: 'Dine-In', icon: 'restaurant-outline', description: 'Eat at the restaurant', enabled: true });
              if (types.length > 0) fulfillmentState = { selectedType: types[0].type, availableTypes: types };
            }
          }

          if (realStore?.categorySlug && walletCategoryBalances) {
            const catBal = (walletCategoryBalances as Record<string, { available?: number }>)[realStore.categorySlug as string];
            if (catBal && catBal.available && catBal.available > 0) {
              realCoinSystem.rezCoin.available = catBal.available;
            }
          }

          const mockData = mockDataResult.status === 'fulfilled' ? mockDataResult.value : await CheckoutData.api.initializeCheckout();

          let userAddresses: CheckoutDeliveryAddress[] = [];
          let defaultAddress: CheckoutDeliveryAddress | undefined;
          if (addressResult.status === 'fulfilled' && addressResult.value?.success && addressResult.value?.data) {
            const addressResponse = addressResult.value;
            userAddresses = (addressResponse.data as unknown as Record<string, unknown>[] ?? []).map((addr: Record<string, unknown>): CheckoutDeliveryAddress => ({
              id: String((addr.id || addr._id) ?? ''), name: String(addr.title || addr.type || 'Address'), phone: String(addr.phone || ''),
              addressLine1: String(addr.addressLine1 ?? ''), addressLine2: String(addr.addressLine2 ?? ''),
              city: String(addr.city ?? ''), state: String(addr.state ?? ''),
              pincode: String(addr.postalCode || (addr.pincode ?? '')), country: String(addr.country || 'India'),
              type: addr.type as CheckoutDeliveryAddress['type'], isDefault: Boolean(addr.isDefault), instructions: String(addr.instructions ?? ''),
            }));
            let lastUsedAddress: CheckoutDeliveryAddress | undefined;
            try {
              const recentOrder = await ordersService.getOrders({ page: 1, limit: 1, status: 'delivered' });
              const lastAddr = recentOrder.data?.orders?.[0]?.delivery?.address;
              if (lastAddr) {
                lastUsedAddress = userAddresses.find(addr => addr.addressLine1 === lastAddr.addressLine1 && addr.pincode === lastAddr.pincode);
              }
            } catch (err: unknown) {
              errorReporter.captureError(err instanceof Error ? err : new Error('Failed to fetch recent order'), { context: 'useCheckout.loadAddresses' }, 'info');
            }
            defaultAddress = lastUsedAddress || userAddresses.find(addr => addr.isDefault) || userAddresses[0];
            const activeDraft = getActiveDraft();
            if (activeDraft?.selectedAddressId) {
              const draftAddr = userAddresses.find(a => a.id === activeDraft.selectedAddressId);
              if (draftAddr) defaultAddress = draftAddr;
            }
          }

          let adjustedBillSummary = billSummary;
          if (fulfillmentState.selectedType !== 'delivery') {
            adjustedBillSummary = {
              ...billSummary, deliveryFee: 0,
              totalBeforeCoinDiscount: billSummary.totalBeforeCoinDiscount - billSummary.deliveryFee,
              totalPayable: Math.max(0, billSummary.totalPayable - billSummary.deliveryFee),
            };
          }

          const autoAppliedCoinSystem = autoApplyCoinsInOrder(realCoinSystem, adjustedBillSummary.totalPayable);
          const autoAppliedBillSummary = CheckoutData.helpers.calculateBillSummary(checkoutItems, realStore as unknown as Parameters<typeof CheckoutData.helpers.calculateBillSummary>[1], appliedPromoCode, { rez: autoAppliedCoinSystem.rezCoin.used, promo: autoAppliedCoinSystem.promoCoin.used });

          if (!isMountedRef.current) return;
          setState(prev => ({
            ...prev,
            items: checkoutItems,
            store: realStore as unknown as CheckoutPageState['store'],
            fulfillment: fulfillmentState,
            billSummary: autoAppliedBillSummary,
            selectedAddress: defaultAddress,
            availableAddresses: userAddresses,
            appliedPromoCode,
            availablePromoCodes: realAvailableCoupons,
            coinSystem: autoAppliedCoinSystem,
            availablePaymentMethods: mockData.paymentMethods,
            recentPaymentMethods: mockData.paymentMethods.filter((m: PaymentMethod) => m.isRecent),
            showAddressSection: fulfillmentState.selectedType === 'delivery',
            loading: false,
          }));

          try { analytics.trackEvent(ANALYTICS_EVENTS.CHECKOUT_STARTED, { item_count: checkoutItems.length, cart_value: adjustedBillSummary.itemTotal, store_id: realStore.id as string }); } catch {}
          return;
        }
      } catch (apiError) {
        logger.warn('⚠️ [Checkout] Failed to load checkout data from API, using fallback:', apiError);
      }

      // Fallback to mock data + real wallet
      let realCoinSystem: CoinSystem = {
        rezCoin: { available: 0, used: 0, conversionRate: getCoinConversionRate(), maxUsagePercentage: REZ_COIN_MAX_USAGE_PERCENTAGE },
        promoCoin: { available: 0, used: 0, conversionRate: getCoinConversionRate(), maxUsagePercentage: PROMO_COIN_MAX_USAGE_PERCENTAGE },
        storePromoCoin: { available: 0, used: 0, conversionRate: getCoinConversionRate(), maxUsagePercentage: STORE_PROMO_COIN_MAX_USAGE_PERCENTAGE },
      };
      try {
        const currentWalletData = walletDataRef.current;
        const currentWalletRawData = walletRawDataRef.current;
        if (currentWalletData) {
          const rezCoin = currentWalletData.coins.find((c: { type?: string }) => c.type === 'rez');
          const promoCoin = currentWalletData.coins.find((c: { type?: string }) => c.type === 'promo');
          const fallbackCatBalances = (currentWalletRawData as RawWalletData)?.categoryBalances;
          const fallbackCatSlug = (state.store as unknown as Record<string, string>)?.categorySlug;
          const fallbackCatBal = fallbackCatSlug && fallbackCatBalances ? fallbackCatBalances[fallbackCatSlug] : null;
          const fallbackRezAvailable = fallbackCatBal?.available ?? (rezCoin?.amount || 0);
          realCoinSystem = {
            ...realCoinSystem,
            rezCoin: { available: fallbackRezAvailable, used: 0, conversionRate: getCoinConversionRate(), maxUsagePercentage: REZ_COIN_MAX_USAGE_PERCENTAGE },
            promoCoin: { available: promoCoin?.amount || 0, used: 0, conversionRate: getCoinConversionRate(), maxUsagePercentage: PROMO_COIN_MAX_USAGE_PERCENTAGE },
          };
        }
      } catch {}

      const [fallbackCouponsResult, fallbackMockResult] = await Promise.allSettled([
        queryClient.fetchQuery({ queryKey: queryKeys.checkout.coupons(), queryFn: () => couponService.getAvailableCoupons() }),
        CheckoutData.api.initializeCheckout(),
      ]);

      let realAvailableCoupons: PromoCode[] = [];
      if (fallbackCouponsResult.status === 'fulfilled' && fallbackCouponsResult.value?.success && fallbackCouponsResult.value?.data) {
        realAvailableCoupons = (fallbackCouponsResult.value.data.coupons as unknown as Record<string, unknown>[]).map((coupon: Record<string, unknown>): PromoCode => ({
          id: String(coupon._id), code: String(coupon.couponCode), title: String(coupon.title || coupon.couponCode || ''),
          description: String(coupon.description || 'Get discount on your order'),
          discountValue: coupon.discountValue as number, discountType: (coupon.discountType as string) as PromoCode['discountType'],
          minOrderValue: coupon.minOrderValue as number, maxDiscount: (coupon.maxDiscountCap as number) || 0,
          isActive: coupon.status === 'active', validUntil: String(coupon.validTo || ''),
          termsAndConditions: (coupon.termsAndConditions as string[]) || [],
        }));
      }

      const data = fallbackMockResult.status === 'fulfilled' ? fallbackMockResult.value : await CheckoutData.api.initializeCheckout();
      const fallbackAutoCoins = autoApplyCoinsInOrder(realCoinSystem, data.billSummary?.totalPayable ?? 0);

      if (!isMountedRef.current) return;
      setState(prev => ({
        ...prev,
        items: data.items,
        store: data.store,
        billSummary: data.billSummary,
        availablePromoCodes: realAvailableCoupons,
        coinSystem: fallbackAutoCoins,
        availablePaymentMethods: data.paymentMethods,
        recentPaymentMethods: data.paymentMethods.filter((m: PaymentMethod) => m.isRecent),
        loading: false,
      }));
    } catch (_error) {
      if (!isMountedRef.current) return;
      setState(prev => ({ ...prev, loading: false, error: 'Failed to initialize checkout' }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryOrderId]);

  // ── Effects ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    isMountedRef.current = true;
    if (authLoading || !isAuthenticated) return;
    initializeCheckout().then(() => { if (isMountedRef.current) { hasInitializedRef.current = true; } }).catch((err) => { logger.error('[useCheckout] initializeCheckout failed', err as Error); });
    return () => { isMountedRef.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated]);

  // AppState: reset processing step on foreground
  useEffect(() => {
    const appStateRef = { current: AppState.currentState as AppStateStatus };
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      if (prev.match(/inactive|background/) && nextState === 'active' && isMountedRef.current) {
        setState(s => {
          if (s.currentStep === 'processing') {
            isSubmittingRef.current = false;
            return { ...s, currentStep: 'checkout', loading: false };
          }
          return s;
        });
      }
    });
    return () => subscription.remove();
  }, []);

  // Payment recovery on mount
  const hasAttemptedRecoveryRef = useRef(false);
  useEffect(() => {
    if (hasAttemptedRecoveryRef.current) return;
    if (authLoading || !isAuthenticated) return;
    const draft = getActiveDraft();
    if (!draft) return;
    const hasRazorpayPending = !!(draft.razorpayPaymentId && !draft.orderCreated);
    const hasWalletPending = !!(draft.walletPaymentPending && draft.walletTransactionId && !draft.orderCreated);
    if (!hasRazorpayPending && !hasWalletPending) return;
    hasAttemptedRecoveryRef.current = true;
    logger.info('[Checkout] Detected pending payment recovery:', { razorpay: hasRazorpayPending ? draft.razorpayPaymentId : null, wallet: hasWalletPending ? draft.walletTransactionId : null });
    (async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        if (hasRazorpayPending && draft.razorpayPaymentId && draft.razorpayOrderId) {
          const verifyResponse = await razorpayApi.verifyPayment({ razorpayOrderId: draft.razorpayOrderId, razorpayPaymentId: draft.razorpayPaymentId, razorpaySignature: draft.razorpaySignature || '' });
          if (verifyResponse.success && verifyResponse.data?.orderId) {
            logger.info('[Checkout] Razorpay payment recovered, orderId:', verifyResponse.data.orderId);
            clearDraft();
            showToast({ message: 'Your previous payment was recovered successfully!', type: 'success' });
            // Navigation is handled by consumers of this hook
            return;
          }
          clearDraft();
          showToast({ message: 'We found a previous payment that wasn\'t completed. If you were charged, please contact support with payment ID: ' + draft.razorpayPaymentId, type: 'error' });
        } else if (hasWalletPending && draft.walletTransactionId) {
          clearDraft();
          showToast({ message: 'A previous wallet payment was not completed. If your balance was deducted, please contact support with transaction ID: ' + draft.walletTransactionId, type: 'error' });
        }
      } catch (err) {
        logger.error('[Checkout] Payment recovery failed:', err as Error);
        clearDraft();
      } finally {
        if (isMountedRef.current) setState(prev => ({ ...prev, loading: false }));
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated]);

  // Refresh wallet on focus
  useFocusEffect(useCallback(() => {
    if (!hasInitializedRef.current) return;
    refreshSharedWallet().catch(() => {});
  }, [refreshSharedWallet]));

  // Auto-apply card offer from cart
  const cardOfferAppliedRef = useRef(false);
  useEffect(() => {
    if (!state.loading && cartState.appliedCardOffer && !state.appliedCardOffer && !cardOfferAppliedRef.current) {
      cardOfferAppliedRef.current = true;
      const offer = cartState.appliedCardOffer;
      setState(prev => {
        const orderTotal = prev.billSummary?.totalPayable || 0;
        let discountAmount = 0;
        if (offer.type === 'percentage') {
          discountAmount = Math.round((orderTotal * offer.value) / 100);
          if (offer.maxDiscountAmount && discountAmount > offer.maxDiscountAmount) discountAmount = offer.maxDiscountAmount;
        } else {
          discountAmount = offer.value || 0;
        }
        const newBillSummary = { ...prev.billSummary, cardOfferDiscount: discountAmount, totalPayable: Math.max(0, prev.billSummary.totalPayable - discountAmount) };
        logger.info('💳 [Checkout] Applied card offer from cart:', { offer, discountAmount });
        return { ...prev, appliedCardOffer: offer, billSummary: newBillSummary };
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartState.appliedCardOffer, state.appliedCardOffer]);

  // Auto-clear errors after 3s
  useEffect(() => {
    if (!state.error) return;
    const timer = setTimeout(() => setState(prev => ({ ...prev, error: null })), 3000);
    return () => clearTimeout(timer);
  }, [state.error]);

  // ── Coin helper ─────────────────────────────────────────────────────────────

  function autoApplyCoinsInOrder(coinSystem: CoinSystem, grossTotal: number): CoinSystem {
    if (grossTotal <= 0) return coinSystem;
    const promoAvailable = coinSystem.promoCoin.available;
    const storePromoAvailable = coinSystem.storePromoCoin?.available ?? 0;
    const rezAvailable = coinSystem.rezCoin.available;
    const maxPromo = Math.floor(grossTotal * (coinSystem.promoCoin.maxUsagePercentage / 100));
    const promoToUse = Math.min(promoAvailable, maxPromo, grossTotal);
    let remaining = grossTotal - promoToUse;
    const maxStorePromo = Math.floor(remaining * (coinSystem.storePromoCoin?.maxUsagePercentage ?? STORE_PROMO_COIN_MAX_USAGE_PERCENTAGE) / 100);
    const storePromoToUse = Math.min(storePromoAvailable, maxStorePromo, remaining);
    remaining -= storePromoToUse;
    const rezToUse = Math.min(rezAvailable, remaining);
    return {
      ...coinSystem,
      promoCoin: { ...coinSystem.promoCoin, used: promoToUse },
      storePromoCoin: { ...coinSystem.storePromoCoin, used: storePromoToUse },
      rezCoin: { ...coinSystem.rezCoin, used: rezToUse },
    };
  }

  return {
    state,
    setState,
    isSubmittingRef,
    initializeCheckout,
    autoApplyCoinsInOrder,
    currencySymbol,
    walletDataRef,
    walletRawDataRef,
    orderIdempotencyKeyRef,
    walletIdempotencyKeyRef,
    assertOnline,
  };
};

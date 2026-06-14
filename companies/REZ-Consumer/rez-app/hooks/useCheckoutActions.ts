/**
 * `useCheckoutActions` — all checkout action handlers.
 * Extracted from `useCheckout.ts` (was 2,917 lines) to comply with the
 * 500-line-per-file architecture rule.
 *
 * All `useCallback` handlers that write to checkout state live here.
 * Pure state helpers (updateBillSummary) are also included.
 *
 * Responsibilities:
 * - Promo code apply/remove
 * - Coin toggle and custom amount
 * - Payment method selection
 * - Fulfillment type/details
 * - Address selection
 * - Payment processing (wallet, COD, Razorpay)
 * - Navigation handlers
 * - Card offer apply/remove
 *
 * NOTE: State and refs are passed as parameters to avoid circular deps
 * with `useCheckoutState`. The `useCheckout` wrapper composes both.
 */
import { useCallback, Dispatch, SetStateAction } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CheckoutPageState, PromoCode, PaymentMethod, FulfillmentType, FulfillmentDetails, CheckoutDeliveryAddress } from '@/types/checkout.types';
import { CheckoutData } from '@/data/checkoutData';
import cartService from '@/services/cartApi';
import ordersService from '@/services/ordersApi';
import walletApi from '@/services/walletApi';
import couponService from '@/services/couponApi';
import { mapFrontendCheckoutToBackendOrder } from '@/utils/dataMappers';
import { showToast } from '@/components/common/ToastManager';
import { useCartActions } from '@/stores/selectors';
import { TAX_RATE } from '@/config/checkout.config';
import analyticsService from '@/services/analyticsService';
import discountsApi from '@/services/discountsApi';
import { createRazorpayPayment } from '@/services/razorpayApi';
import { logger } from '@/utils/logger';

// ── Recovery helpers ────────────────────────────────────────────────────────────

/** CD-CRIT-03 & CD-CRIT-06 FIX: Persist Razorpay payment data so order creation can be
 * recovered if the app is killed after payment capture but before order confirmation.
 * Key survives app restart unlike in-memory state. */
interface RazorpayRecoveryData {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  transactionId: string;
  amount: number;
  timestamp: number;
}
const RAZORPAY_RECOVERY_KEY = '@checkout:razorpay_recovery';

async function persistRazorpayRecoveryData(data: RazorpayRecoveryData): Promise<void> {
  try {
    await AsyncStorage.setItem(RAZORPAY_RECOVERY_KEY, JSON.stringify(data));
  } catch (e) {
    logger.error('[Recovery] Failed to persist Razorpay recovery data', e as Error);
  }
}
async function clearRazorpayRecoveryData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RAZORPAY_RECOVERY_KEY);
  } catch (e) {
    logger.error('[Recovery] Failed to clear Razorpay recovery data', e as Error);
  }
}
async function getRazorpayRecoveryData(): Promise<RazorpayRecoveryData | null> {
  try {
    const raw = await AsyncStorage.getItem(RAZORPAY_RECOVERY_KEY);
    return raw ? (JSON.parse(raw) as RazorpayRecoveryData) : null;
  } catch {
    return null;
  }
}

/** Check and attempt recovery on page mount — exported so checkout page can call this on mount. */
export async function checkRazorpayRecoveryOnLaunch(): Promise<{ orderId: string; recovered: boolean } | null> {
  const recovery = await getRazorpayRecoveryData();
  if (!recovery) return null;
  // Only try recovery if the data is less than 30 minutes old
  if (Date.now() - recovery.timestamp > 30 * 60 * 1000) {
    await clearRazorpayRecoveryData();
    return null;
  }
  // Poll server up to 3 times checking for an existing order
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/orders/by-payment/${recovery.razorpayPaymentId}`);
      if (resp.ok) {
        const data = await resp.json() as { id?: string; _id?: string };
        const orderId = (data.id || data._id) as string;
        await clearRazorpayRecoveryData();
        return { orderId, recovered: true };
      }
    } catch {}
  }
  return null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function groupItemsByStore(items: CheckoutPageState['items']) {
  const storeMap = new Map<string, { storeId: string; storeName: string; items: typeof items; subtotal: number }>();
  items.forEach(item => {
    const storeId = item.storeId || 'unknown';
    const storeName = item.storeName || 'Store';
    if (!storeMap.has(storeId)) storeMap.set(storeId, { storeId, storeName, items: [], subtotal: 0 });
    const g = storeMap.get(storeId)!;
    g.items.push(item);
    g.subtotal = Math.round((g.subtotal + item.price * item.quantity) * 100) / 100;
  });
  return Array.from(storeMap.values());
}

function distributeCoinsProportionally(
  totalCoins: { rezCoins: number; promoCoins: number; storePromoCoins: number },
  storeGroups: ReturnType<typeof groupItemsByStore>,
  totalSubtotal: number,
) {
  const distribution = new Map<string, { rezCoins: number; promoCoins: number; storePromoCoins: number }>();
  storeGroups.forEach(group => {
    const proportion = totalSubtotal > 0 ? group.subtotal / totalSubtotal : 0;
    distribution.set(group.storeId, {
      rezCoins: Math.floor(totalCoins.rezCoins * proportion),
      promoCoins: Math.floor(totalCoins.promoCoins * proportion),
      storePromoCoins: 0,
    });
  });
  return distribution;
}

// ── Parameter types ────────────────────────────────────────────────────────────

export interface CheckoutActionsParams {
  state: CheckoutPageState;
  setState: Dispatch<SetStateAction<CheckoutPageState>>;
  isSubmittingRef: React.MutableRefObject<boolean>;
  currencySymbol: string;
  orderIdempotencyKeyRef: React.MutableRefObject<string>;
  walletIdempotencyKeyRef: React.MutableRefObject<string>;
  assertOnline: () => Promise<boolean>;
  clearDraft: () => void;
  refreshSharedWallet: () => Promise<unknown>;
}

// ── Return type ───────────────────────────────────────────────────────────────

export interface UseCheckoutActionsReturn {
  updateBillSummary: () => void;
  applyPromoCode: (code: PromoCode) => Promise<{ success: boolean; message: string; discount?: number }>;
  removePromoCode: () => void;
  toggleRezCoin: (enabled: boolean) => void;
  togglePromoCoin: (enabled: boolean) => void;
  toggleStorePromoCoin: (enabled: boolean) => void;
  handleCustomCoinAmount: (coinType: 'rez' | 'promo' | 'storePromo', amount: number) => void;
  selectPaymentMethod: (method: PaymentMethod) => void;
  proceedToPayment: () => Promise<void>;
  navigateToOtherPaymentMethods: () => void;
  applyCardOffer: (offer: {
    _id: string; name: string; type: 'percentage' | 'fixed'; value: number;
    maxDiscountAmount?: number; minOrderValue: number; cardType?: 'credit' | 'debit' | 'all';
    bankNames?: string[]; cardBins?: string[];
  }) => void;
  removeCardOffer: () => void;
  setFulfillmentType: (type: FulfillmentType) => void;
  setFulfillmentDetails: (details: Partial<FulfillmentDetails>) => void;
  selectAddress: (address: CheckoutDeliveryAddress) => void;
  handleAddressSelect: (address: CheckoutDeliveryAddress) => void;
  handleProceedToPayment: () => void;
  handleBackNavigation: () => void;
  processPayment: () => Promise<void>;
  handleWalletPayment: (coinValuesOverride?: {
    rezCoins: number; promoCoins: number; storePromoCoins: number;
    redemptionCode?: string; offerRedemptionCode?: string;
  }) => Promise<void>;
  handleCODPayment: (coinValuesOverride?: {
    rezCoins: number; promoCoins: number; storePromoCoins: number;
    redemptionCode?: string; offerRedemptionCode?: string;
  }) => Promise<void>;
  handleRazorpayPayment: (
    userInfo?: { name?: string; email?: string; phone?: string },
    coinValuesOverride?: { rezCoins: number; promoCoins: number; storePromoCoins: number; redemptionCode?: string; offerRedemptionCode?: string },
  ) => Promise<void>;
  handlePromoCodeApply: (code: string) => Promise<{ success: boolean; message: string }>;
  handleCoinToggle: (coinType: 'rez' | 'promo' | 'storePromo', enabled: boolean) => void;
  handlePaymentMethodSelect: (method: PaymentMethod) => void;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export const useCheckoutActions = (params: CheckoutActionsParams): UseCheckoutActionsReturn => {
  const { state, setState, isSubmittingRef, currencySymbol, orderIdempotencyKeyRef, walletIdempotencyKeyRef, assertOnline, clearDraft, refreshSharedWallet } = params;

  const cartActions = useCartActions();

  // ── Pure state helpers ────────────────────────────────────────────────────

  const updateBillSummary = useCallback(() => {
    const coinUsage = { rez: state.coinSystem.rezCoin.used, promo: state.coinSystem.promoCoin.used };
    const newBillSummary = CheckoutData.helpers.calculateBillSummary(state.items, state.store, state.appliedPromoCode, coinUsage);
    setState(prev => ({ ...prev, billSummary: newBillSummary }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.items, state.store, state.appliedPromoCode, state.coinSystem]);

  // ── Promo codes ───────────────────────────────────────────────────────────

  const applyPromoCode = useCallback(async (code: PromoCode): Promise<{ success: boolean; message: string; discount?: number }> => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const cartData = {
        items: state.items.map(item => {
          const cartItem: Record<string, unknown> = { product: item.productId || item.id, quantity: item.quantity, price: item.price };
          if (item.category?.trim()) cartItem.category = item.category;
          if (item.storeId?.trim()) cartItem.store = item.storeId;
          return cartItem;
        }),
        subtotal: state.items.reduce((t, i) => t + (i.price * i.quantity), 0),
      };
      const response = await couponService.validateCoupon(code.code, cartData as unknown as Parameters<typeof couponService.validateCoupon>[1]);
      if (response.success && response.data) {
        const coinUsage = { rez: state.coinSystem.rezCoin.used, promo: state.coinSystem.promoCoin.used };
        const newBillSummary = CheckoutData.helpers.calculateBillSummary(state.items, state.store, code, coinUsage);
        const discountAmount = (response.data as { discount?: number }).discount ?? 0;
        newBillSummary.promoDiscount = discountAmount;
        newBillSummary.savings = (newBillSummary.savings || 0) + discountAmount;
        const totalAfterDiscount = (newBillSummary.itemTotal + newBillSummary.platformFee + newBillSummary.deliveryFee + newBillSummary.taxes) - (newBillSummary.lockFeeDiscount || 0) - discountAmount - coinUsage.rez - coinUsage.promo;
        newBillSummary.totalPayable = Math.max(0, Math.round(totalAfterDiscount));
        setState(prev => ({ ...prev, appliedPromoCode: code, billSummary: newBillSummary, loading: false, showPromoCodeSection: false, error: null }));
        return { success: true, message: `${code.code} applied! You save ${currencySymbol}${discountAmount}`, discount: discountAmount };
      } else {
        const errorMsg = (response.message as string) || 'Invalid coupon code';
        setState(prev => ({ ...prev, loading: false, error: errorMsg }));
        return { success: false, message: errorMsg };
      }
    } catch (error) {
      logger.error('💳 [Checkout] Coupon validation error:', error as Error);
      setState(prev => ({ ...prev, loading: false, error: 'Failed to validate coupon' }));
      return { success: false, message: 'Failed to validate coupon' };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.items, state.store, state.coinSystem]);

  const removePromoCode = useCallback(() => {
    setState(prev => {
      const coinUsage = { rez: prev.coinSystem.rezCoin.used, promo: prev.coinSystem.promoCoin.used };
      const newBillSummary = CheckoutData.helpers.calculateBillSummary(prev.items, prev.store, undefined, coinUsage);
      return { ...prev, appliedPromoCode: undefined, billSummary: newBillSummary, error: null };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Coins ─────────────────────────────────────────────────────────────────

  const toggleRezCoin = useCallback((enabled: boolean) => {
    setState(prev => {
      if (enabled && prev.coinSystem.rezCoin.available === 0) return prev;
      if (!enabled) {
        const newCoinSystem = { ...prev.coinSystem, rezCoin: { ...prev.coinSystem.rezCoin, used: 0 }, promoCoin: { ...prev.coinSystem.promoCoin, used: 0 }, storePromoCoin: { ...prev.coinSystem.storePromoCoin, used: 0 } };
        const newBillSummary = CheckoutData.helpers.calculateBillSummary(prev.items, prev.store, prev.appliedPromoCode, { rez: 0, promo: 0 });
        return { ...prev, coinSystem: newCoinSystem, billSummary: newBillSummary };
      }
      const itemTotal = prev.items.reduce((t, i) => t + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);
      const taxes = Math.round(itemTotal * TAX_RATE) || 0;
      const deliveryFee = Number(prev.store.deliveryFee) || 0;
      const promoDiscount = prev.appliedPromoCode ? (prev.appliedPromoCode.discountType === 'FIXED' ? Number(prev.appliedPromoCode.discountValue) || 0 : Math.min(Math.round((itemTotal * (Number(prev.appliedPromoCode.discountValue) || 0)) / 100), Number(prev.appliedPromoCode.maxDiscount) ?? Infinity)) : 0;
      const subtotalBeforeCoins = Math.max(0, itemTotal + deliveryFee + taxes - promoDiscount);
      const promoAvailable = Number(prev.coinSystem.promoCoin.available) || 0;
      const maxPromoUsage = Math.floor(subtotalBeforeCoins * (prev.coinSystem.promoCoin.maxUsagePercentage || 20) / 100);
      const promoToUse = Math.min(promoAvailable, maxPromoUsage, subtotalBeforeCoins);
      const rezToUse = Math.min(Number(prev.coinSystem.rezCoin.available) || 0, Math.max(0, subtotalBeforeCoins - promoToUse));
      const newCoinSystem = { ...prev.coinSystem, rezCoin: { ...prev.coinSystem.rezCoin, used: rezToUse }, promoCoin: { ...prev.coinSystem.promoCoin, used: promoToUse } };
      const newBillSummary = CheckoutData.helpers.calculateBillSummary(prev.items, prev.store, prev.appliedPromoCode, { rez: rezToUse, promo: promoToUse });
      return { ...prev, coinSystem: newCoinSystem, billSummary: newBillSummary };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePromoCoin = useCallback((enabled: boolean) => {
    setState(prev => {
      if (enabled && prev.coinSystem.promoCoin.available === 0) return prev;
      const itemTotal = prev.items.reduce((t, i) => t + (i.price * i.quantity), 0);
      const taxes = Math.round(itemTotal * TAX_RATE);
      const promoDiscount = prev.appliedPromoCode ? (prev.appliedPromoCode.discountType === 'FIXED' ? prev.appliedPromoCode.discountValue : Math.min(Math.round((itemTotal * prev.appliedPromoCode.discountValue) / 100), prev.appliedPromoCode.maxDiscount ?? Infinity)) : 0;
      const subtotalAfterRezCoins = itemTotal + prev.store.deliveryFee + taxes - promoDiscount - prev.coinSystem.rezCoin.used;
      const subtotalBeforeCoins = itemTotal + prev.store.deliveryFee + taxes - promoDiscount;
      const maxPromoUsage = Math.floor(subtotalBeforeCoins * prev.coinSystem.promoCoin.maxUsagePercentage / 100);
      const coinsToUse = enabled ? Math.min(prev.coinSystem.promoCoin.available, maxPromoUsage, subtotalAfterRezCoins) : 0;
      const newCoinSystem = { ...prev.coinSystem, promoCoin: { ...prev.coinSystem.promoCoin, used: coinsToUse } };
      const newBillSummary = CheckoutData.helpers.calculateBillSummary(prev.items, prev.store, prev.appliedPromoCode, { rez: prev.coinSystem.rezCoin.used, promo: coinsToUse });
      return { ...prev, coinSystem: newCoinSystem, billSummary: newBillSummary };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleStorePromoCoin = useCallback((enabled: boolean) => {
    setState(prev => {
      if (enabled && prev.coinSystem.storePromoCoin.available === 0) return prev;
      const itemTotal = prev.items.reduce((t, i) => t + (i.price * i.quantity), 0);
      const taxes = Math.round(itemTotal * TAX_RATE);
      const promoDiscount = prev.appliedPromoCode ? (prev.appliedPromoCode.discountType === 'FIXED' ? prev.appliedPromoCode.discountValue : Math.min(Math.round((itemTotal * prev.appliedPromoCode.discountValue) / 100), prev.appliedPromoCode.maxDiscount ?? Infinity)) : 0;
      const subtotalAfterOtherCoins = itemTotal + prev.store.deliveryFee + taxes - promoDiscount - prev.coinSystem.rezCoin.used - prev.coinSystem.promoCoin.used;
      const maxStorePromoUsage = Math.floor(subtotalAfterOtherCoins * prev.coinSystem.storePromoCoin.maxUsagePercentage / 100);
      const coinsToUse = enabled ? Math.min(prev.coinSystem.storePromoCoin.available, maxStorePromoUsage, subtotalAfterOtherCoins) : 0;
      const newCoinSystem = { ...prev.coinSystem, storePromoCoin: { ...prev.coinSystem.storePromoCoin, used: coinsToUse } };
      const newBillSummary = CheckoutData.helpers.calculateBillSummary(prev.items, prev.store, prev.appliedPromoCode, { rez: prev.coinSystem.rezCoin.used, promo: prev.coinSystem.promoCoin.used, storePromo: coinsToUse });
      return { ...prev, coinSystem: newCoinSystem, billSummary: newBillSummary };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCustomCoinAmount = useCallback((coinType: 'rez' | 'promo' | 'storePromo', amount: number) => {
    setState(prev => {
      const coinSystem = prev.coinSystem;
      const isRezCoin = coinType === 'rez';
      const isStorePromo = coinType === 'storePromo';
      const coin = isRezCoin ? coinSystem.rezCoin : (isStorePromo ? coinSystem.storePromoCoin : coinSystem.promoCoin);
      if (amount <= 0 || amount > coin.available) return prev;
      const itemTotal = prev.items.reduce((t, i) => t + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);
      const taxes = Math.round(itemTotal * TAX_RATE) || 0;
      const deliveryFee = Number(prev.store.deliveryFee) || 0;
      const promoDiscount = prev.appliedPromoCode ? (prev.appliedPromoCode.discountType === 'FIXED' ? Number(prev.appliedPromoCode.discountValue) || 0 : Math.min(Math.round((itemTotal * (Number(prev.appliedPromoCode.discountValue) || 0)) / 100), Number(prev.appliedPromoCode.maxDiscount) ?? Infinity)) : 0;
      let totalBeforeCoinDiscount = Math.max(0, itemTotal + deliveryFee + taxes - promoDiscount);
      if (!isRezCoin) {
        totalBeforeCoinDiscount -= coinSystem.rezCoin.used;
        if (isStorePromo) totalBeforeCoinDiscount -= coinSystem.promoCoin.used;
        totalBeforeCoinDiscount = Math.floor(totalBeforeCoinDiscount * coin.maxUsagePercentage / 100);
      } else {
        const percentageCap = Math.floor(totalBeforeCoinDiscount * coin.maxUsagePercentage / 100);
        totalBeforeCoinDiscount = Math.min(totalBeforeCoinDiscount, percentageCap);
      }
      const finalAmount = Math.min(amount, totalBeforeCoinDiscount, coin.available);
      const newCoinSystem = { ...coinSystem, [isRezCoin ? 'rezCoin' : (isStorePromo ? 'storePromoCoin' : 'promoCoin')]: { ...coin, used: finalAmount } };
      const coinUsage = { rez: isRezCoin ? finalAmount : coinSystem.rezCoin.used, promo: (isRezCoin || isStorePromo) ? coinSystem.promoCoin.used : finalAmount, storePromo: isStorePromo ? finalAmount : (coinSystem.storePromoCoin?.used || 0) };
      const newBillSummary = CheckoutData.helpers.calculateBillSummary(prev.items, prev.store, prev.appliedPromoCode, coinUsage);
      return { ...prev, coinSystem: newCoinSystem, billSummary: newBillSummary };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Payment methods ───────────────────────────────────────────────────────

  const selectPaymentMethod = useCallback((method: PaymentMethod) => {
    const { useCheckoutDraftStore } = require('@/stores/checkoutDraftStore');
    const saveDraft = useCheckoutDraftStore.getState().saveDraft;
    setState(prev => ({ ...prev, selectedPaymentMethod: method }));
    saveDraft({ paymentMethod: method.id });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const proceedToPayment = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, currentStep: 'payment_methods' }));
    router.push('/payment-methods');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigateToOtherPaymentMethods = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: 'payment_methods' }));
    router.push('/payment-methods');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Card offers ────────────────────────────────────────────────────────────

  const applyCardOffer = useCallback((offer: {
    _id: string; name: string; type: 'percentage' | 'fixed'; value: number;
    maxDiscountAmount?: number; minOrderValue: number; cardType?: 'credit' | 'debit' | 'all';
    bankNames?: string[]; cardBins?: string[];
  }) => {
    setState(prev => {
      const orderTotal = prev.billSummary?.totalPayable || 0;
      let discountAmount = offer.type === 'percentage' ? Math.round((orderTotal * offer.value) / 100) : offer.value;
      if (offer.maxDiscountAmount && discountAmount > offer.maxDiscountAmount) discountAmount = offer.maxDiscountAmount;
      const newBillSummary = { ...prev.billSummary, cardOfferDiscount: discountAmount, totalPayable: Math.max(0, prev.billSummary.totalPayable - discountAmount + prev.billSummary.cardOfferDiscount) };
      return { ...prev, appliedCardOffer: { _id: offer._id, name: offer.name, type: offer.type, value: offer.value, maxDiscountAmount: offer.maxDiscountAmount, minOrderValue: offer.minOrderValue, cardType: offer.cardType, bankNames: offer.bankNames, cardBins: offer.cardBins }, billSummary: newBillSummary };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeCardOffer = useCallback(() => {
    setState(prev => {
      if (!prev.appliedCardOffer) return prev;
      const newBillSummary = { ...prev.billSummary, totalPayable: prev.billSummary.totalPayable + prev.billSummary.cardOfferDiscount, cardOfferDiscount: 0 };
      return { ...prev, appliedCardOffer: undefined, billSummary: newBillSummary };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fulfillment ────────────────────────────────────────────────────────────

  const setFulfillmentType = useCallback((type: FulfillmentType) => {
    setState(prev => {
      const isDelivery = type === 'delivery';
      const oldDeliveryFee = prev.billSummary.deliveryFee;
      const baseDeliveryFee = prev.store.deliveryFee || 0;
      const newDeliveryFee = isDelivery ? baseDeliveryFee : 0;
      const feeDiff = newDeliveryFee - oldDeliveryFee;
      const newBill: typeof prev.billSummary = { ...prev.billSummary, deliveryFee: newDeliveryFee, totalBeforeCoinDiscount: Math.max(0, prev.billSummary.totalBeforeCoinDiscount + feeDiff), totalPayable: Math.max(0, prev.billSummary.totalPayable + feeDiff) };
      try { analyticsService.trackFulfillmentTypeSelected({ fulfillmentType: type, storeId: prev.store.id, cartValue: prev.billSummary.itemTotal, previousType: prev.fulfillment.selectedType }); } catch {}
      return { ...prev, fulfillment: { ...prev.fulfillment, selectedType: type }, billSummary: newBill, showAddressSection: isDelivery };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFulfillmentDetails = useCallback((details: Partial<FulfillmentDetails>) => {
    setState(prev => ({ ...prev, fulfillment: { ...prev.fulfillment, ...details } }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Address ───────────────────────────────────────────────────────────────

  const selectAddress = useCallback((address: CheckoutDeliveryAddress) => {
    const { useCheckoutDraftStore } = require('@/stores/checkoutDraftStore');
    const saveDraft = useCheckoutDraftStore.getState().saveDraft;
    setState(prev => ({ ...prev, selectedAddress: address, showAddressSection: false }));
    saveDraft({ selectedAddressId: address.id });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddressSelect = useCallback((address: CheckoutDeliveryAddress) => { selectAddress(address); }, [selectAddress]);

  const handleProceedToPayment = useCallback(() => {
    if (state.fulfillment.selectedType === 'delivery' && !state.selectedAddress) {
      showToast({ message: 'Please select a delivery address', type: 'error' });
      setState(prev => ({ ...prev, showAddressSection: true })); return;
    }
    proceedToPayment();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proceedToPayment, state.selectedAddress, state.fulfillment.selectedType]);

  const handleBackNavigation = useCallback(() => {
    if (state.currentStep === 'payment_methods') {
      setState(prev => ({ ...prev, currentStep: 'checkout' }));
      router.back();
    } else { router.back(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentStep]);

  // ── Payment processing ────────────────────────────────────────────────────

  const processPayment = useCallback(async () => {
    if (!state.selectedPaymentMethod) { setState(prev => ({ ...prev, error: 'Please select a payment method' })); return; }
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setState(prev => ({ ...prev, loading: true, currentStep: 'processing' }));
    try {
      if (state.fulfillment.selectedType === 'delivery' && !state.selectedAddress) {
        setState(prev => ({ ...prev, loading: false, error: 'Please select a delivery address' })); isSubmittingRef.current = false; return;
      }
      const orderData = mapFrontendCheckoutToBackendOrder({
        deliveryAddress: state.selectedAddress ? { name: state.selectedAddress.name, phone: state.selectedAddress.phone, addressLine1: state.selectedAddress.addressLine1, addressLine2: state.selectedAddress.addressLine2, city: state.selectedAddress.city, state: state.selectedAddress.state, pincode: state.selectedAddress.pincode, country: state.selectedAddress.country || 'India' } : { name: 'Customer', phone: '', addressLine1: '', city: '', state: '', pincode: '' },
        paymentMethod: state.selectedPaymentMethod.id,
        specialInstructions: state.selectedAddress?.instructions || '',
        couponCode: state.appliedPromoCode?.code,
        fulfillmentType: state.fulfillment.selectedType,
        fulfillmentDetails: { tableNumber: state.fulfillment.tableNumber, vehicleInfo: state.fulfillment.vehicleInfo, pickupInstructions: state.fulfillment.pickupInstructions },
      });
      (orderData as unknown as Record<string, unknown>).coinsUsed = { rezCoins: state.coinSystem.rezCoin.used || 0, promoCoins: state.coinSystem.promoCoin.used || 0, storePromoCoins: state.coinSystem.storePromoCoin.used || 0, totalCoinsValue: (state.coinSystem.rezCoin.used || 0) + (state.coinSystem.promoCoin.used || 0) + (state.coinSystem.storePromoCoin.used || 0) };
      // SECURITY NOTE: The server computes the authoritative order total from cart contents.
      // Client-side billSummary is for display only — do not trust it for payment capture.
      const response = await ordersService.createOrder(orderData as unknown as Parameters<typeof ordersService.createOrder>[0], orderIdempotencyKeyRef.current || undefined);
      if (response.success && response.data) {
        try { await cartService.clearCart(); await cartActions.clearCart(); } catch {}
        const orderId = (response.data as { id?: string; _id?: string }).id || (response.data as { _id?: string })._id || '';
        try { analyticsService.trackFulfillmentOrderPlaced({ fulfillmentType: state.fulfillment.selectedType, storeId: state.store.id, orderId, cartValue: state.billSummary.itemTotal, paymentMethod: state.selectedPaymentMethod?.id || '' }); } catch {}
        refreshSharedWallet().catch(() => {});
        clearDraft();
        setState(prev => ({ ...prev, currentStep: 'success', loading: false }));
        router.replace(`/payment-success?orderId=${orderId}`);
      } else {
        setState(prev => ({ ...prev, loading: false, error: (response.error as string) || 'Order creation failed', currentStep: 'payment_methods' }));
      }
    } catch (error) {
      logger.error('💳 [Checkout] Order creation failed:', error as Error);
      setState(prev => ({ ...prev, loading: false, error: error instanceof Error ? error.message : 'Failed to create order', currentStep: 'payment_methods' }));
    } finally { isSubmittingRef.current = false; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedPaymentMethod, state.billSummary, state.items, state.store, state.appliedPromoCode, state.fulfillment, state.selectedAddress, state.coinSystem]);

  const handleWalletPayment = useCallback(async (coinValuesOverride?: {
    rezCoins: number; promoCoins: number; storePromoCoins: number; redemptionCode?: string; offerRedemptionCode?: string;
  }) => {
    const totalPayable = state.billSummary.totalPayable;
    const totalAvailableBalance = state.coinSystem.rezCoin.available + state.coinSystem.promoCoin.available;
    if (totalPayable > 0 && totalAvailableBalance < totalPayable) { setState(prev => ({ ...prev, error: `Insufficient balance. You need ${totalPayable - totalAvailableBalance} more RC to complete this purchase.` })); return; }
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    if (!(await assertOnline())) { isSubmittingRef.current = false; return; }
    setState(prev => ({ ...prev, loading: true, currentStep: 'processing' }));
    try {
      if (state.fulfillment.selectedType === 'delivery' && !state.selectedAddress) { setState(prev => ({ ...prev, loading: false, error: 'Please select a delivery address', currentStep: 'checkout' })); isSubmittingRef.current = false; return; }
      const orderData = mapFrontendCheckoutToBackendOrder({
        deliveryAddress: state.selectedAddress ? { name: state.selectedAddress.name, phone: state.selectedAddress.phone, addressLine1: state.selectedAddress.addressLine1, addressLine2: state.selectedAddress.addressLine2, city: state.selectedAddress.city, state: state.selectedAddress.state, pincode: state.selectedAddress.pincode, country: state.selectedAddress.country || 'India' } : { name: 'Customer', phone: '', addressLine1: '', city: '', state: '', pincode: '' },
        paymentMethod: 'wallet', specialInstructions: state.selectedAddress?.instructions || '',
        couponCode: state.appliedPromoCode?.code, fulfillmentType: state.fulfillment.selectedType,
        fulfillmentDetails: { tableNumber: state.fulfillment.tableNumber, vehicleInfo: state.fulfillment.vehicleInfo, pickupInstructions: state.fulfillment.pickupInstructions },
      });
      if (coinValuesOverride?.redemptionCode) (orderData as unknown as Record<string, unknown>).redemptionCode = coinValuesOverride.redemptionCode;
      if (coinValuesOverride?.offerRedemptionCode) (orderData as unknown as Record<string, unknown>).offerRedemptionCode = coinValuesOverride.offerRedemptionCode;
      if (state.billSummary?.lockFeeDiscount && state.billSummary.lockFeeDiscount > 0) (orderData as unknown as Record<string, unknown>).lockFeeDiscount = state.billSummary.lockFeeDiscount;
      const rezCoinsValue = coinValuesOverride ? Number(coinValuesOverride.rezCoins) || 0 : Number(state.coinSystem.rezCoin.used) || 0;
      const promoCoinsValue = coinValuesOverride ? Number(coinValuesOverride.promoCoins) || 0 : Number(state.coinSystem.promoCoin.used) || 0;
      const storePromoCoinsValue = coinValuesOverride ? Number(coinValuesOverride.storePromoCoins) || 0 : Number(state.coinSystem.storePromoCoin.used) || 0;
      (orderData as unknown as Record<string, unknown>).coinsUsed = { rezCoins: rezCoinsValue, promoCoins: promoCoinsValue, storePromoCoins: storePromoCoinsValue, totalCoinsValue: rezCoinsValue + promoCoinsValue + storePromoCoinsValue };
      (orderData as unknown as Record<string, unknown>).walletPayment = { amount: totalPayable };
      const orderResponse = await ordersService.createOrder(orderData as unknown as Parameters<typeof ordersService.createOrder>[0], orderIdempotencyKeyRef.current);
      if (!orderResponse.success || !orderResponse.data) { setState(prev => ({ ...prev, loading: false, error: (orderResponse.error as string) || 'Checkout failed. Please try again.', currentStep: 'checkout' })); isSubmittingRef.current = false; return; }
      let transactionId: string | undefined = (orderResponse.data as { walletPaymentResult?: { transactionId?: string } }).walletPaymentResult?.transactionId;
      if (!transactionId) {
        const walletResponse = await walletApi.processPayment({ amount: totalPayable, orderId: (orderResponse.data as { id?: string }).id || (orderResponse.data as { _id?: string })._id || '', storeId: state.store.id, storeName: state.store.name, description: `Purchase of ${state.items.length} item(s) from ${state.store.name}`, items: state.items.map(i => ({ productId: i.id, name: i.name, quantity: i.quantity, price: i.price })) }, walletIdempotencyKeyRef.current);
        if (!walletResponse.success || !walletResponse.data) { setState(prev => ({ ...prev, loading: false, error: (walletResponse.error as string) || 'Wallet payment failed', currentStep: 'checkout' })); isSubmittingRef.current = false; return; }
        transactionId = walletResponse.data.transaction.transactionId;
      }
      try { await cartService.clearCart(); await cartActions.clearCart(); } catch {}
      const orderId = (orderResponse.data as { id?: string }).id || (orderResponse.data as { _id?: string })._id || '';
      try { analyticsService.trackFulfillmentOrderPlaced({ fulfillmentType: state.fulfillment.selectedType, storeId: state.store.id, orderId, cartValue: state.billSummary.itemTotal, paymentMethod: 'wallet' }); } catch {}
      refreshSharedWallet().catch(() => {});
      clearDraft();
      setState(prev => ({ ...prev, currentStep: 'success', loading: false }));
      router.replace(`/payment-success?orderId=${orderId}&transactionId=${transactionId}&paymentMethod=wallet`);
    } catch (error) {
      logger.error('💳 [Checkout] Wallet payment error:', error as Error);
      setState(prev => ({ ...prev, loading: false, error: error instanceof Error ? error.message : 'Wallet payment failed', currentStep: 'checkout' }));
    } finally { isSubmittingRef.current = false; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.coinSystem, state.billSummary, state.items, state.store, state.appliedPromoCode, state.selectedAddress, state.fulfillment]);

  const handleCODPayment = useCallback(async (coinValuesOverride?: {
    rezCoins: number; promoCoins: number; storePromoCoins: number; redemptionCode?: string; offerRedemptionCode?: string;
  }) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    if (!(await assertOnline())) { isSubmittingRef.current = false; return; }
    setState(prev => ({ ...prev, loading: true, currentStep: 'processing' }));
    try {
      if (state.fulfillment.selectedType === 'delivery' && !state.selectedAddress) { setState(prev => ({ ...prev, loading: false, error: 'Please select a delivery address', currentStep: 'checkout' })); isSubmittingRef.current = false; return; }
      const storeGroups = groupItemsByStore(state.items);
      const isMultiStore = storeGroups.length > 1;
      const rezCoinsValue = coinValuesOverride ? Number(coinValuesOverride.rezCoins) || 0 : Number(state.coinSystem.rezCoin.used) || 0;
      const promoCoinsValue = coinValuesOverride ? Number(coinValuesOverride.promoCoins) || 0 : Number(state.coinSystem.promoCoin.used) || 0;
      const storePromoCoinsValue = coinValuesOverride ? Number(coinValuesOverride.storePromoCoins) || 0 : Number(state.coinSystem.storePromoCoin.used) || 0;
      const totalCoins = { rezCoins: rezCoinsValue, promoCoins: promoCoinsValue, storePromoCoins: storePromoCoinsValue };
      const totalSubtotal = storeGroups.reduce((s, g) => s + g.subtotal, 0);
      const coinsDistribution = distributeCoinsProportionally(totalCoins, storeGroups, totalSubtotal);
      const createdOrderIds: string[] = [];
      const failedStores: string[] = [];
      for (const storeGroup of storeGroups) {
        const storeCoins = coinsDistribution.get(storeGroup.storeId) || { rezCoins: 0, promoCoins: 0, storePromoCoins: 0 };
        if (storeGroup.storeId === state.coinSystem.storePromoCoin?.storeId) storeCoins.storePromoCoins = storePromoCoinsValue;
        const coinsUsed = { rezCoins: storeCoins.rezCoins, promoCoins: storeCoins.promoCoins, storePromoCoins: storeCoins.storePromoCoins, totalCoinsValue: storeCoins.rezCoins + storeCoins.promoCoins + storeCoins.storePromoCoins };
        const storeOrderData = mapFrontendCheckoutToBackendOrder({
          deliveryAddress: state.selectedAddress ? { name: state.selectedAddress.name, phone: state.selectedAddress.phone, addressLine1: state.selectedAddress.addressLine1, addressLine2: state.selectedAddress.addressLine2, city: state.selectedAddress.city, state: state.selectedAddress.state, pincode: state.selectedAddress.pincode, country: state.selectedAddress.country || 'India' } : { name: 'Customer', phone: '', addressLine1: '', city: '', state: '', pincode: '' },
          paymentMethod: 'cod', specialInstructions: state.selectedAddress?.instructions || '',
          couponCode: isMultiStore && state.appliedPromoCode?.code ? (showToast({ message: `Promo code "${state.appliedPromoCode.code}" can't be applied to multi-store orders.`, type: 'warning' }), undefined) : state.appliedPromoCode?.code,
          storeId: storeGroup.storeId, fulfillmentType: state.fulfillment.selectedType,
          fulfillmentDetails: { tableNumber: state.fulfillment.tableNumber, vehicleInfo: state.fulfillment.vehicleInfo, pickupInstructions: state.fulfillment.pickupInstructions },
          items: storeGroup.items.map(i => ({ product: i.productId || i.id, quantity: i.quantity, price: i.price, name: i.name })), coinsUsed,
        });
        if (coinValuesOverride?.redemptionCode && storeGroups.indexOf(storeGroup) === 0) (storeOrderData as unknown as Record<string, unknown>).redemptionCode = coinValuesOverride.redemptionCode;
        if (coinValuesOverride?.offerRedemptionCode && storeGroups.indexOf(storeGroup) === 0) (storeOrderData as unknown as Record<string, unknown>).offerRedemptionCode = coinValuesOverride.offerRedemptionCode;
        if (state.billSummary?.lockFeeDiscount && state.billSummary.lockFeeDiscount > 0 && storeGroups.indexOf(storeGroup) === 0) (storeOrderData as unknown as Record<string, unknown>).lockFeeDiscount = state.billSummary.lockFeeDiscount;
        try {
          const storeOrderKey = `${orderIdempotencyKeyRef.current}-${storeGroup.storeId}`;
          const orderResponse = await ordersService.createOrder(storeOrderData as unknown as Parameters<typeof ordersService.createOrder>[0], storeOrderKey);
          if (orderResponse.success && orderResponse.data) {
            const orderId = (orderResponse.data as { id?: string }).id || (orderResponse.data as { _id?: string })._id || '';
            if (orderId) createdOrderIds.push(orderId);
          } else { failedStores.push(storeGroup.storeName); }
        } catch { failedStores.push(storeGroup.storeName); }
      }
      if (createdOrderIds.length === 0) {
        // All stores failed — clear cart and show error
        try { await cartService.clearCart(); await cartActions.clearCart(); } catch {}
        setState(prev => ({ ...prev, loading: false, error: 'Failed to create unknown orders. Please try again.', currentStep: 'checkout' }));
        isSubmittingRef.current = false;
        return;
      }
      if (failedStores.length > 0) {
        // CD-CRIT-03 FIX: Partial success — do NOT clear cart. Persist failed stores for retry.
        // User still has items in cart for the failed stores. Previously cart was cleared here,
        // silently losing the failed orders with no way to retry.
        showToast({ message: `Orders created for ${createdOrderIds.length} store(s). Retrying for: ${failedStores.join(', ')}`, type: 'warning', duration: 6000 });
        try {
          await AsyncStorage.setItem('@checkout:partial_order_failure', JSON.stringify({ failedStores, createdOrderIds, timestamp: Date.now() }));
        } catch (e) {
          logger.error('[Checkout] Failed to persist partial order failure data', e as Error);
        }
      } else {
        // All succeeded — clear cart
        try { await cartService.clearCart(); await cartActions.clearCart(); } catch {}
      }
      const transactionId = orderIdempotencyKeyRef.current || globalThis.crypto?.randomUUID?.() || `COD_${Date.now()}`;
      try { analyticsService.trackFulfillmentOrderPlaced({ fulfillmentType: state.fulfillment.selectedType, storeId: state.store.id, orderId: createdOrderIds[0] || '', cartValue: state.billSummary.itemTotal, paymentMethod: 'cod' }); } catch {}
      refreshSharedWallet().catch(() => {});
      clearDraft();
      setState(prev => ({ ...prev, currentStep: 'success', loading: false }));
      router.replace(`/payment-success?orderId=${createdOrderIds.join(',')}&transactionId=${transactionId}&paymentMethod=cod&multiStore=${isMultiStore}`);
    } catch (error) {
      logger.error('💵 [Checkout] COD payment error:', error as Error);
      setState(prev => ({ ...prev, loading: false, error: error instanceof Error ? error.message : 'COD order creation failed', currentStep: 'checkout' }));
    } finally { isSubmittingRef.current = false; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.items, state.store, state.appliedPromoCode, state.coinSystem, state.billSummary, state.selectedAddress, state.fulfillment]);

  const handleRazorpayPayment = useCallback(async (
    userInfo?: { name?: string; email?: string; phone?: string },
    coinValuesOverride?: { rezCoins: number; promoCoins: number; storePromoCoins: number; redemptionCode?: string; offerRedemptionCode?: string },
  ) => {
    if (state.fulfillment.selectedType === 'delivery' && !state.selectedAddress) { showToast({ message: 'Please select a delivery address', type: 'error' }); setState(prev => ({ ...prev, showAddressSection: true })); return; }
    const totalPayable = state.billSummary.totalPayable;
    if (totalPayable <= 0) { showToast({ message: 'Invalid order amount', type: 'error' }); return; }
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    if (!(await assertOnline())) { isSubmittingRef.current = false; return; }
    setState(prev => ({ ...prev, loading: true, currentStep: 'processing' }));
    try {
      const rezCoinsValue = coinValuesOverride ? Number(coinValuesOverride.rezCoins) || 0 : Number(state.coinSystem.rezCoin.used) || 0;
      const promoCoinsValue = coinValuesOverride ? Number(coinValuesOverride.promoCoins) || 0 : Number(state.coinSystem.promoCoin.used) || 0;
      const storePromoCoinsValue = coinValuesOverride ? Number(coinValuesOverride.storePromoCoins) || 0 : Number(state.coinSystem.storePromoCoin.used) || 0;
      const coinsUsed = { rezCoins: rezCoinsValue, promoCoins: promoCoinsValue, storePromoCoins: storePromoCoinsValue, totalCoinsValue: rezCoinsValue + promoCoinsValue + storePromoCoinsValue };
      const appliedCardOffer = state.appliedCardOffer;
      const { useCheckoutDraftStore } = require('@/stores/checkoutDraftStore');
      const saveDraft = useCheckoutDraftStore.getState().saveDraft;
      await createRazorpayPayment({
        amount: totalPayable,
        notes: { storeId: state.store.id, storeName: state.store.name, itemCount: state.items.length, couponCode: state.appliedPromoCode?.code || '', coinsUsed: JSON.stringify(coinsUsed), cardOfferId: appliedCardOffer?._id || '' },
        userInfo,
        onSuccess: async (paymentResponse) => {
          saveDraft({ paymentMethod: 'razorpay', razorpayPaymentId: paymentResponse.paymentId, razorpayOrderId: paymentResponse.orderId, razorpaySignature: paymentResponse.signature ?? null, pendingPaymentAmount: totalPayable, orderCreated: false });
          try {
            let appliedCardOfferData: typeof appliedCardOffer | undefined = undefined;
            if (paymentResponse.paymentMethod === 'card' || paymentResponse.paymentMethod?.includes('card')) {
              try {
                const cardOffersResponse = await discountsApi.getCardOffers({ storeId: state.store.id, orderValue: state.billSummary.totalPayable, page: 1, limit: 1 });
                if (cardOffersResponse.success && cardOffersResponse.data?.discounts?.[0]) {
                  const bestOffer = cardOffersResponse.data.discounts[0];
                  if (state.billSummary.totalPayable >= bestOffer.minOrderValue) {
                    const applyResponse = await discountsApi.applyCardOffer({ discountId: bestOffer._id });
                    if (applyResponse.success) appliedCardOfferData = bestOffer;
                  }
                }
              } catch {}
            }
            const orderData = mapFrontendCheckoutToBackendOrder({
              deliveryAddress: state.selectedAddress ? { name: state.selectedAddress.name, phone: state.selectedAddress.phone, addressLine1: state.selectedAddress.addressLine1, addressLine2: state.selectedAddress.addressLine2, city: state.selectedAddress.city, state: state.selectedAddress.state, pincode: state.selectedAddress.pincode, country: state.selectedAddress.country || 'India' } : { name: 'Customer', phone: '', addressLine1: '', city: '', state: '', pincode: '' },
              paymentMethod: 'razorpay', specialInstructions: state.selectedAddress?.instructions || '',
              couponCode: state.appliedPromoCode?.code, fulfillmentType: state.fulfillment.selectedType,
              fulfillmentDetails: { tableNumber: state.fulfillment.tableNumber, vehicleInfo: state.fulfillment.vehicleInfo, pickupInstructions: state.fulfillment.pickupInstructions },
            });
            (orderData as unknown as Record<string, unknown>).razorpayPaymentId = paymentResponse.paymentId;
            (orderData as unknown as Record<string, unknown>).razorpayOrderId = paymentResponse.orderId;
            (orderData as unknown as Record<string, unknown>).transactionId = paymentResponse.transactionId;
            (orderData as unknown as Record<string, unknown>).coinsUsed = coinsUsed;
            if (coinValuesOverride?.redemptionCode) (orderData as unknown as Record<string, unknown>).redemptionCode = coinValuesOverride.redemptionCode;
            if (coinValuesOverride?.offerRedemptionCode) (orderData as unknown as Record<string, unknown>).offerRedemptionCode = coinValuesOverride.offerRedemptionCode;
            if (state.billSummary?.lockFeeDiscount && state.billSummary.lockFeeDiscount > 0) (orderData as unknown as Record<string, unknown>).lockFeeDiscount = state.billSummary.lockFeeDiscount;
            if (appliedCardOfferData) {
              (orderData as unknown as Record<string, unknown>).cardOfferId = appliedCardOfferData._id;
              const discountAmt = appliedCardOfferData.type === 'percentage' ? Math.round((state.billSummary?.totalPayable || 0) * appliedCardOfferData.value / 100) : appliedCardOfferData.value;
              (orderData as unknown as Record<string, unknown>).cardOfferDiscount = Math.min(discountAmt, appliedCardOfferData.maxDiscountAmount || discountAmt);
            }
            // CD-CRIT-06 FIX: Persist payment data BEFORE attempting order creation.
            // If the app is killed between payment capture and order creation, the recovery
            // check on next launch will find this data and retry order creation.
            await persistRazorpayRecoveryData({
              razorpayPaymentId: paymentResponse.paymentId,
              razorpayOrderId: paymentResponse.orderId,
              transactionId: paymentResponse.transactionId,
              amount: paymentResponse.amount,
              timestamp: Date.now(),
            });

            const orderResponse = await ordersService.createOrder(orderData as unknown as Parameters<typeof ordersService.createOrder>[0], orderIdempotencyKeyRef.current);
            if (!orderResponse.success || !orderResponse.data) {
              // Payment captured but order creation failed. Keep recovery data for retry.
              showToast({ message: 'Payment received. Restoring your order...', type: 'warning', duration: 8000 });
              setState(prev => ({ ...prev, loading: false, error: 'Order creation in progress — please wait.', currentStep: 'checkout' }));
              return;
            }
            // Order created successfully — clear recovery data and cart
            await clearRazorpayRecoveryData();
            try { await cartService.clearCart(); await cartActions.clearCart(); } catch {}
            const orderId = (orderResponse.data as { id?: string }).id || (orderResponse.data as { _id?: string })._id || '';
            showToast({ message: 'Payment successful! Order placed', type: 'success' });
            try { analyticsService.trackFulfillmentOrderPlaced({ fulfillmentType: state.fulfillment.selectedType, storeId: state.store.id, orderId, cartValue: state.billSummary.itemTotal, paymentMethod: 'razorpay' }); } catch {}
            refreshSharedWallet().catch(() => {});
            clearDraft();
            setState(prev => ({ ...prev, currentStep: 'success', loading: false }));
            router.replace(`/payment-success?orderId=${orderId}&transactionId=${paymentResponse.transactionId}&paymentMethod=razorpay`);
          } catch (error) {
            logger.error('❌ [Checkout] Post-payment error:', error as Error);
            logger.error('[checkout] Order create failed after payment — backend will refund via webhook', error instanceof Error ? error : undefined, 'Checkout');
            showToast({ message: 'Your payment is being refunded — you\'ll see it in 3-5 business days', type: 'error' });
            setState(prev => ({ ...prev, loading: false, error: error instanceof Error ? error.message : 'Order creation failed', currentStep: 'checkout' }));
          }
        },
        onError: (error) => {
          logger.error('❌ [Checkout] Razorpay payment error:', error as Error);
          showToast({ message: error.message || 'Payment failed', type: 'error' });
          setState(prev => ({ ...prev, loading: false, error: error.message || 'Payment failed', currentStep: 'checkout' }));
        },
      });
    } catch (error) {
      logger.error('❌ [Checkout] Razorpay initialization error:', error as Error);
      showToast({ message: error instanceof Error ? error.message : 'Failed to initialize payment', type: 'error' });
      setState(prev => ({ ...prev, loading: false, error: error instanceof Error ? error.message : 'Failed to initialize payment', currentStep: 'checkout' }));
    } finally { isSubmittingRef.current = false; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.billSummary, state.items, state.store, state.appliedPromoCode, state.coinSystem, state.selectedAddress, state.fulfillment, state.appliedCardOffer]);

  // ── Combined handlers ────────────────────────────────────────────────────

  const handlePromoCodeApply = useCallback(async (code: string): Promise<{ success: boolean; message: string }> => {
    const existingPromo = state.availablePromoCodes.find(p => p.code === code && p.isActive);
    const itemTotal = state.items.reduce((t, i) => t + (i.price * i.quantity), 0);
    if (existingPromo) {
      if (itemTotal < existingPromo.minOrderValue) {
        const errorMsg = `Minimum order value ${currencySymbol}${existingPromo.minOrderValue} required for ${code}`;
        setState(prev => ({ ...prev, error: errorMsg })); return { success: false, message: errorMsg };
      }
      return await applyPromoCode(existingPromo);
    }
    const tempPromoCode: PromoCode = { id: code, code, title: code, description: 'Promo code', discountType: 'PERCENTAGE', discountValue: 0, maxDiscount: 0, minOrderValue: 0, validUntil: '', isActive: true, termsAndConditions: [] };
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const cartData = { items: state.items.map(i => { const c: Record<string, unknown> = { product: i.productId || i.id, quantity: i.quantity, price: i.price }; if (i.category?.trim()) c.category = i.category; if (i.storeId?.trim()) c.store = i.storeId; return c; }), subtotal: itemTotal };
      const response = await couponService.validateCoupon(code, cartData as unknown as Parameters<typeof couponService.validateCoupon>[1]);
      if (response.success && response.data) {
        tempPromoCode.discountType = ((response.data as unknown as { coupon?: { type: string } }).coupon?.type || 'PERCENTAGE') as PromoCode['discountType'];
        tempPromoCode.discountValue = (response.data as { coupon?: { value: number } }).coupon?.value || 0;
        const coinUsage = { rez: state.coinSystem.rezCoin.used, promo: state.coinSystem.promoCoin.used };
        const newBillSummary = CheckoutData.helpers.calculateBillSummary(state.items, state.store, tempPromoCode, coinUsage);
        newBillSummary.promoDiscount = (response.data as { discount?: number }).discount || 0;
        newBillSummary.savings = (newBillSummary.savings || 0) + newBillSummary.promoDiscount;
        const totalAfterDiscount = (newBillSummary.itemTotal + newBillSummary.platformFee + newBillSummary.deliveryFee + newBillSummary.taxes) - (newBillSummary.lockFeeDiscount || 0) - newBillSummary.promoDiscount - coinUsage.rez - coinUsage.promo;
        newBillSummary.totalPayable = Math.max(0, Math.round(totalAfterDiscount));
        setState(prev => ({ ...prev, appliedPromoCode: tempPromoCode, billSummary: newBillSummary, loading: false, showPromoCodeSection: false, error: null }));
        return { success: true, message: `${code} applied successfully!` };
      } else {
        const errorMsg = (response.message as string) || 'Invalid promo code';
        setState(prev => ({ ...prev, loading: false, error: errorMsg })); return { success: false, message: errorMsg };
      }
    } catch {
      setState(prev => ({ ...prev, loading: false, error: 'Failed to validate promo code' })); return { success: false, message: 'Failed to validate promo code' };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.availablePromoCodes, state.items, state.store, state.coinSystem, applyPromoCode]);

  const handleCoinToggle = useCallback((coinType: 'rez' | 'promo' | 'storePromo', enabled: boolean) => {
    if (coinType === 'rez') toggleRezCoin(enabled);
    else if (coinType === 'promo') togglePromoCoin(enabled);
    else if (coinType === 'storePromo') toggleStorePromoCoin(enabled);
  }, [toggleRezCoin, togglePromoCoin, toggleStorePromoCoin]);

  const handlePaymentMethodSelect = useCallback((method: PaymentMethod) => { selectPaymentMethod(method); }, [selectPaymentMethod]);

  return {
    updateBillSummary, applyPromoCode, removePromoCode,
    toggleRezCoin, togglePromoCoin, toggleStorePromoCoin, handleCustomCoinAmount,
    selectPaymentMethod, proceedToPayment, navigateToOtherPaymentMethods,
    applyCardOffer, removeCardOffer,
    setFulfillmentType, setFulfillmentDetails,
    selectAddress, handleAddressSelect, handleProceedToPayment, handleBackNavigation,
    processPayment, handleWalletPayment, handleCODPayment, handleRazorpayPayment,
    handlePromoCodeApply, handleCoinToggle, handlePaymentMethodSelect,
  };
};

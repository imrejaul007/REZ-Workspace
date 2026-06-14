// @ts-nocheck
/**
 * usePaymentFlow Hook
 * 
 * Manages the complete payment flow state including:
 * - Store info and membership
 * - Coin selection and auto-optimization
 * - Payment method selection
 * - Offers and savings calculations
 * - Payment processing
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import uuid from 'react-native-uuid';
import NetInfo from '@react-native-community/netinfo';
import storePaymentApi from '@/services/storePaymentApi';
import externalWalletApi from '@/services/externalWalletApi';
import { paymentService } from '@/services/paymentService';
import apiClient from '@/services/apiClient';
import { logger } from '@/utils/logger';
import { useIsAuthenticated, useAuthLoading } from '@/stores/selectors';
import {
  StorePaymentInfo,
  AppliedCoins,
  EnhancedPaymentMethod,
  StoreMembership,
  SavingsSummary,
  RewardsPreview,
  StorePaymentOffer,
  ExternalWallet,
  StorePaymentInitResponse,
  StoreDetailResponse,
  OffersDetailResponse,
} from '@/types/storePayment.types';

// ==================== TYPES ====================

interface PaymentFlowState {
  // Store info
  store: StorePaymentInfo | null;
  membership: StoreMembership | null;
  
  // Bill
  billAmount: number;
  taxesAndFees: number;
  
  // Coins
  appliedCoins: AppliedCoins;
  isAutoOptimized: boolean;
  maxCoinRedemptionPercent: number;
  
  // Offers
  selectedOffers: StorePaymentOffer[];
  discountAmount: number;
  
  // Payment
  paymentMethods: EnhancedPaymentMethod[];
  selectedPaymentMethod: EnhancedPaymentMethod | null;
  externalWallets: ExternalWallet[];
  
  // Calculations
  totalDiscount: number;
  amountToPay: number;
  savingsSummary: SavingsSummary;
  rewardsPreview: RewardsPreview;
  
  // Loading states
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
}

interface UsePaymentFlowParams {
  storeId: string;
  storeName: string;
  amount: number;
  selectedOfferIds?: string[];
}

interface UsePaymentFlowReturn extends PaymentFlowState {
  // Actions
  loadPaymentData: () => Promise<void>;
  autoOptimize: () => Promise<void>;
  toggleCoin: (coinType: 'rez' | 'promo' | 'branded', enabled: boolean) => void;
  setCoinAmount: (coinType: 'rez' | 'promo' | 'branded', amount: number) => void;
  selectPaymentMethod: (method: EnhancedPaymentMethod) => void;
  initiatePayment: (idempotencyKey?: string) => Promise<StorePaymentInitResponse | null>;
  reset: () => void;
  clearError: () => void;
}

// ==================== DEFAULT VALUES ====================

const DEFAULT_APPLIED_COINS: AppliedCoins = {
  rezCoins: { available: 0, using: 0, enabled: true },
  promoCoins: { available: 0, using: 0, enabled: true, expiringToday: false },
  brandedCoins: null,
  totalApplied: 0,
};

const DEFAULT_SAVINGS_SUMMARY: SavingsSummary = {
  coinsUsed: 0,
  bankOffers: 0,
  loyaltyBenefit: 0,
  totalSaved: 0,
};

const DEFAULT_REWARDS_PREVIEW: RewardsPreview = {
  cashback: 0,
  coinsToEarn: 0,
};

// ==================== HOOK ====================

export function usePaymentFlow(params: UsePaymentFlowParams): UsePaymentFlowReturn {
  const { storeId, storeName, amount, selectedOfferIds = [] } = params;
  const isAuthenticated = useIsAuthenticated();
  const authLoading = useAuthLoading();

  // Refs to prevent infinite loops
  const hasLoadedRef = useRef(false);
  const selectedOfferIdsRef = useRef(selectedOfferIds);

  // OG-D001 FIX: One idempotency key per hook mount so retries after a
  // network drop always re-use the same key and the backend deduplicates.
  const idempotencyKeyRef = useRef(
    `store-pay-${Date.now()}-${uuid.v4()}`
  );

  // OG-D002 FIX: In-flight lock prevents duplicate submissions from a
  // double-tap or a reconnect firing initiatePayment a second time while
  // the first request is still awaiting a response.
  const isSubmittingRef = useRef(false);

  // Update ref when selectedOfferIds changes
  selectedOfferIdsRef.current = selectedOfferIds;

  // OG-D003 FIX: assertOnline() — gate every mutating payment call so the
  // user gets a clear error message instead of a stuck spinner when offline.
  const assertOnline = useCallback(async (): Promise<boolean> => {
    const state = await NetInfo.fetch();
    const online = state.isConnected === true;
    if (!online) {
      setError('No internet connection. Please check your network and try again.');
    }
    return online;
  }, []);

  // State
  const [store, setStore] = useState<StorePaymentInfo | null>(null);
  const [membership, setMembership] = useState<StoreMembership | null>(null);
  const [appliedCoins, setAppliedCoins] = useState<AppliedCoins>(DEFAULT_APPLIED_COINS);
  const [isAutoOptimized, setIsAutoOptimized] = useState(false);
  const [maxCoinRedemptionPercent, setMaxCoinRedemptionPercent] = useState(100);
  const [selectedOffers, setSelectedOffers] = useState<StorePaymentOffer[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState<EnhancedPaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<EnhancedPaymentMethod | null>(null);
  const [externalWallets, setExternalWallets] = useState<ExternalWallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const billAmount = amount;
  const taxesAndFees = 0; // Can be passed from params if needed

  // Calculate initial rewards preview from store data
  const getInitialRewardsPreview = useCallback((): RewardsPreview => {
    const baseCashbackPercent = store?.rewardRules?.baseCashbackPercent ?? 0;
    const memberBonus = membership?.benefits.cashbackBonus || 0;
    const effectiveCashbackPercent = baseCashbackPercent + memberBonus;
    const cashback = Math.floor((billAmount * effectiveCashbackPercent) / 100);
    const baseRatePct = store?.rewardRules?.baseCashbackPercent ?? 2.5;
    const coinsToEarn = Math.floor((billAmount * baseRatePct) / 100);
    return { cashback, coinsToEarn };
  }, [billAmount, store, membership]);

  // ==================== CALCULATIONS ====================

  const totalDiscount = useMemo(() => discountAmount, [discountAmount]);

  // CRITICAL(F01-FINANCIAL): amountToPay is computed client-side for UI display only.
  // SECURITY REQUIREMENT: The server MUST independently verify the total from cart
  // contents before payment capture. A malicious user CAN modify this value before
  // submission. The server computes and validates the authoritative amount using
  // the actual cart stored on the backend. Client passes billAmount for reference
  // only - server ignores client-computed values during payment capture.
  const amountToPay = useMemo(() => {
    const afterDiscount = billAmount - totalDiscount;
    const afterCoins = afterDiscount - appliedCoins.totalApplied;
    return Math.max(0, afterCoins);
  }, [billAmount, totalDiscount, appliedCoins.totalApplied]);

  const savingsSummary = useMemo<SavingsSummary>(() => {
    const loyaltyBenefit = membership?.benefits.cashbackBonus
      ? Math.floor((billAmount * membership.benefits.cashbackBonus) / 100)
      : 0;

    return {
      coinsUsed: appliedCoins.totalApplied,
      bankOffers: 0, // Would come from selected offers
      loyaltyBenefit,
      totalSaved: appliedCoins.totalApplied + totalDiscount + loyaltyBenefit,
    };
  }, [appliedCoins.totalApplied, totalDiscount, membership, billAmount]);

  // rewardsPreview state - updated by server preview
  const [rewardsPreview, setRewardsPreview] = useState<RewardsPreview>({ cashback: 0, coinsToEarn: 0 });

  // Calculate initial rewardsPreview from store data (before server preview)
  const calculateInitialRewards = useCallback((): RewardsPreview => {
    const baseCashbackPercent = store?.rewardRules?.baseCashbackPercent ?? 0;
    const memberBonus = membership?.benefits.cashbackBonus || 0;
    const effectiveCashbackPercent = baseCashbackPercent + memberBonus;
    const cashback = Math.floor((billAmount * effectiveCashbackPercent) / 100);
    const baseRatePct = store?.rewardRules?.baseCashbackPercent ?? 2.5;
    const coinsToEarn = Math.floor((billAmount * baseRatePct) / 100);
    return { cashback, coinsToEarn };
  }, [billAmount, store, membership]);

  // Fetch accurate cashback preview from server
  const fetchCashbackPreview = useCallback(async () => {
    if (!storeId || !billAmount) return;

    try {
      const response = await paymentService.previewBillCashback({
        billAmount,
        storeId,
        category: store?.category,
      });

      if (response.success && response.data) {
        setRewardsPreview({
          cashback: response.data.estimatedCoins,
          coinsToEarn: response.data.estimatedCoins,
        });
      }
    } catch (error) {
      // Fallback to local calculation
      setRewardsPreview(calculateInitialRewards());
    }
  }, [storeId, billAmount, store?.category, calculateInitialRewards]);

  // ==================== ACTIONS ====================

  // Single entry point for loading all payment data
  const loadPaymentData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use Promise.allSettled to handle partial failures gracefully
      const results = await Promise.allSettled([
        storePaymentApi.getCoinsForStore(storeId),
        storePaymentApi.getEnhancedPaymentMethods(storeId, billAmount),
        storePaymentApi.getStoreMembership(storeId),
        apiClient.get(`/stores/${storeId}`),
        externalWalletApi.getLinkedWallets(),
      ]);

      const coinsResult = results[0];
      const paymentMethodsResult = results[1];
      const membershipResult = results[2];
      const storeResponseResult = results[3];
      const walletsResult = results[4];

      const coinsData = coinsResult.status === 'fulfilled' ? coinsResult.value : null;
      const paymentMethodsData = paymentMethodsResult.status === 'fulfilled' ? paymentMethodsResult.value : [];
      const membershipData = membershipResult.status === 'fulfilled' ? membershipResult.value : null;
      const storeResponse = storeResponseResult.status === 'fulfilled' ? storeResponseResult.value : null;
      const walletsData = walletsResult.status === 'fulfilled' ? walletsResult.value : [];

      // Log any failures for debugging
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const labels = ['coins', 'paymentMethods', 'membership', 'store', 'wallets'];
          logger.warn(`loadPaymentData partial failure: ${labels[index]}`, result.reason);
        }
      });

      if (coinsData) {
        setAppliedCoins(coinsData);
      }
      if (paymentMethodsData.length > 0) {
        setPaymentMethods(paymentMethodsData);
        setSelectedPaymentMethod(paymentMethodsData[0]);
      }
      if (membershipData) {
        setMembership(membershipData);
      }

      if (storeResponse?.success && storeResponse.data) {
        const storeData = storeResponse.data as unknown as StoreDetailResponse;
        const storeObj = storeData.store || storeData.data || null;
        if (storeObj) {
          setStore(storeObj);
          setMaxCoinRedemptionPercent(
            storeObj.paymentSettings?.maxCoinRedemptionPercent || 100
          );
        }
      }

      setExternalWallets(walletsData);

      // Calculate discount from selected offers
      const currentOfferIds = selectedOfferIdsRef.current;
      if (currentOfferIds.length > 0) {
        const offersResponse = await apiClient.get(`/store-payment/offers/${storeId}`, {
          amount: billAmount,
        });

        if (offersResponse.success && offersResponse.data) {
          const offersData = offersResponse.data as unknown as OffersDetailResponse;
          const allOffers: StorePaymentOffer[] = [
            ...(offersData.storeOffers || []),
            ...(offersData.bankOffers || []),
            ...(offersData.rezOffers || []),
          ];
          const selectedOffersList = allOffers.filter((o) =>
            currentOfferIds.includes(o.id)
          );
          setSelectedOffers(selectedOffersList);

          const totalDisc = selectedOffersList.reduce((sum: number, offer: StorePaymentOffer) => {
            if (offer.valueType === 'PERCENTAGE') {
              const discount = (billAmount * offer.value) / 100;
              return sum + (offer.maxDiscount ? Math.min(discount, offer.maxDiscount) : discount);
            }
            return sum + offer.value;
          }, 0);

          setDiscountAmount(totalDisc);
        }
      }

      // Set initial rewards preview
      setRewardsPreview(getInitialRewardsPreview());

      // Fetch accurate cashback preview from server
      await fetchCashbackPreview();

      hasLoadedRef.current = true;
    } catch (err) {
      setError('Failed to load payment information');
    } finally {
      setIsLoading(false);
    }
  }, [storeId, billAmount, fetchCashbackPreview, getInitialRewardsPreview]);

  const autoOptimize = useCallback(async () => {
    try {
      const optimizedCoins = await storePaymentApi.autoOptimizeCoins(storeId, billAmount);
      setAppliedCoins({
        rezCoins: optimizedCoins.rezCoins,
        promoCoins: optimizedCoins.promoCoins,
        brandedCoins: optimizedCoins.brandedCoins,
        totalApplied: optimizedCoins.totalApplied,
      });
      setIsAutoOptimized(true);
    } catch (err) {
      logger.error('autoOptimize failed', err, `storeId: ${storeId}, billAmount: ${billAmount}`);
    }
  }, [storeId, billAmount]);

  const toggleCoin = useCallback((coinType: 'rez' | 'promo' | 'branded', enabled: boolean) => {
    setAppliedCoins(prev => {
      // Use effective bill amount after discount
      const effectiveBillAmount = billAmount - discountAmount;
      const maxAllowed = Math.floor((effectiveBillAmount * maxCoinRedemptionPercent) / 100);

      const newCoins = { ...prev };

      if (coinType === 'rez') {
        newCoins.rezCoins = {
          ...prev.rezCoins,
          enabled,
          using: enabled ? Math.min(prev.rezCoins.available, maxAllowed) : 0,
        };
      } else if (coinType === 'promo') {
        newCoins.promoCoins = {
          ...prev.promoCoins,
          enabled,
          using: enabled ? Math.min(prev.promoCoins.available, maxAllowed) : 0,
        };
      } else if (coinType === 'branded' && prev.brandedCoins) {
        newCoins.brandedCoins = {
          ...prev.brandedCoins,
          enabled,
          using: enabled ? Math.min(prev.brandedCoins.available, maxAllowed) : 0,
        };
      }

      // FIX 5: Enforce total cap across all coin types. Individual caps above
      // limit each coin to maxAllowed independently, but the combined total can
      // still exceed maxAllowed when multiple coin types are enabled.
      let rezUsing = newCoins.rezCoins.using;
      let promoUsing = newCoins.promoCoins.using;
      let brandedUsing = newCoins.brandedCoins?.using || 0;
      const total = rezUsing + promoUsing + brandedUsing;

      if (total > maxAllowed && total > 0) {
        const ratio = maxAllowed / total;
        rezUsing = Math.floor(rezUsing * ratio);
        promoUsing = Math.floor(promoUsing * ratio);
        // Give remainder to branded to avoid rounding loss
        brandedUsing = maxAllowed - rezUsing - promoUsing;

        newCoins.rezCoins = { ...newCoins.rezCoins, using: rezUsing };
        newCoins.promoCoins = { ...newCoins.promoCoins, using: promoUsing };
        if (newCoins.brandedCoins) {
          newCoins.brandedCoins = { ...newCoins.brandedCoins, using: brandedUsing };
        }
      }

      // Recalculate total
      newCoins.totalApplied =
        newCoins.rezCoins.using +
        newCoins.promoCoins.using +
        (newCoins.brandedCoins?.using || 0);

      return newCoins;
    });
    setIsAutoOptimized(false);
  }, [billAmount, discountAmount, maxCoinRedemptionPercent]);

  const setCoinAmount = useCallback((coinType: 'rez' | 'promo' | 'branded', amount: number) => {
    setAppliedCoins(prev => {
      const newCoins = { ...prev };

      if (coinType === 'rez') {
        newCoins.rezCoins = { ...prev.rezCoins, using: Math.floor(amount) };
      } else if (coinType === 'promo') {
        newCoins.promoCoins = { ...prev.promoCoins, using: Math.floor(amount) };
      } else if (coinType === 'branded' && prev.brandedCoins) {
        newCoins.brandedCoins = { ...prev.brandedCoins, using: Math.floor(amount) };
      }

      // Recalculate total
      newCoins.totalApplied =
        newCoins.rezCoins.using +
        newCoins.promoCoins.using +
        (newCoins.brandedCoins?.using || 0);

      return newCoins;
    });
    setIsAutoOptimized(false);
  }, []);

  const selectPaymentMethod = useCallback((method: EnhancedPaymentMethod) => {
    setSelectedPaymentMethod(method);
  }, []);

  const initiatePayment = useCallback(async (idempotencyKey?: string): Promise<StorePaymentInitResponse | null> => {
    if (amountToPay > 0 && !selectedPaymentMethod) {
      setError('Please select a payment method');
      return null;
    }

    // OG-D002 FIX: Prevent concurrent duplicate submissions.
    if (isSubmittingRef.current) {
      return null;
    }
    isSubmittingRef.current = true;

    // OG-D003 FIX: Fail fast when offline — don't start a doomed in-flight request.
    if (!(await assertOnline())) {
      isSubmittingRef.current = false;
      return null;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // OG-D001 / CD-CRIT-09: Use the caller-supplied key when provided.
      // The key is now generated fresh per attempt in payment.tsx handlePayment(),
      // so retries get a new key and the backend processes each attempt freshly.
      const resolvedKey = idempotencyKey ?? idempotencyKeyRef.current;

      // Map rezCoins back to rezCoins for backend
      // SECURITY NOTE: billAmount is sent as a display hint only. The server MUST
      // independently verify the authoritative total from the cart contents stored
      // server-side before capturing payment. A malicious client can modify this value.
      const response: unknown = await apiClient.post('/store-payment/initiate', {
        storeId,
        amount: billAmount,
        paymentMethod: amountToPay > 0 ? selectedPaymentMethod?.type : 'coins_only',
        coinsToRedeem: {
          rezCoins: appliedCoins.rezCoins.using,  // Backend expects rezCoins
          promoCoins: appliedCoins.promoCoins.using,
          brandedCoins: appliedCoins.brandedCoins?.using || 0,
          totalAmount: appliedCoins.totalApplied,
        },
        offersApplied: selectedOfferIdsRef.current,
      }, {
        headers: { 'Idempotency-Key': resolvedKey },
      });

      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error || 'Failed to initiate payment');
        return null;
      }
    } catch (err) {
      setError(err.error || err.message || 'Payment failed. Please try again.');
      return null;
    } finally {
      setIsProcessing(false);
      // OG-D002 FIX: Always release the lock so the user can retry after a
      // genuine failure.
      isSubmittingRef.current = false;
    }
  }, [storeId, billAmount, amountToPay, selectedPaymentMethod, appliedCoins, assertOnline]);

  const reset = useCallback(() => {
    setAppliedCoins(DEFAULT_APPLIED_COINS);
    setIsAutoOptimized(false);
    setSelectedPaymentMethod(null);
    setError(null);
    // OG-D001 FIX: Regenerate the idempotency key when the user explicitly
    // resets — this represents a new payment intent, not a retry.
    // IDEMPOTENCY FIX: crypto.randomUUID() replaces Date.now() + Math.random() for collision-safe idempotency.
    idempotencyKeyRef.current = `store-pay-${crypto.randomUUID()}`;
    isSubmittingRef.current = false;
    // Allow loadPaymentData to be called again after a reset (new payment intent).
    hasLoadedRef.current = false;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ==================== EFFECTS ====================

  // Load payment data once when component mounts and auth is ready
  useEffect(() => {
    if (!storeId || !billAmount || hasLoadedRef.current) return;
    if (authLoading || !isAuthenticated) return;
    hasLoadedRef.current = true;
    loadPaymentData();
  }, [storeId, billAmount, authLoading, isAuthenticated, loadPaymentData]);

  // ==================== RETURN ====================

  return {
    // State
    store,
    membership,
    billAmount,
    taxesAndFees,
    appliedCoins,
    isAutoOptimized,
    maxCoinRedemptionPercent,
    selectedOffers,
    discountAmount,
    paymentMethods,
    selectedPaymentMethod,
    externalWallets,
    totalDiscount,
    amountToPay,
    savingsSummary,
    rewardsPreview,
    isLoading,
    isProcessing,
    error,
    
    // Actions
    loadPaymentData,
    autoOptimize,
    toggleCoin,
    setCoinAmount,
    selectPaymentMethod,
    initiatePayment,
    reset,
    clearError,
  };
}

export default usePaymentFlow;

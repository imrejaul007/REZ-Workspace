// @ts-nocheck
/**
 * Store Payment API Service
 *
 * Handles all API calls for the store payment flow including:
 * - QR code lookup
 * - Offers retrieval
 * - Payment initiation and confirmation
 * - Transaction history
 */

import apiClient from './apiClient';
import walletApi from './walletApi';
import {
  StorePaymentInfo,
  OffersResponse,
  StorePaymentRequest,
  StorePaymentInitResponse,
  StorePaymentConfirmRequest,
  StorePaymentConfirmResponse,
  PaymentHistoryResponse,
  QRLookupResponse,
  OffersApiResponse,
  PaymentInitApiResponse,
  PaymentConfirmApiResponse,
  PaymentHistoryApiResponse,
  AppliedCoins,
  EnhancedPaymentMethod,
  StoreMembership,
  AutoOptimizeResponse,
} from '@/types/storePayment.types';

const STORE_PAYMENT_BASE = '/store-payment';

/**
 * Map backend rezCoins response to frontend AppliedCoins shape
 */
function mapBackendToRezCoins(backendData): AppliedCoins {
  // Handle if data is null/undefined
  if (!backendData) {
    return {
      rezCoins: { available: 0, using: 0, enabled: true },
      promoCoins: { available: 0, using: 0, enabled: true, expiringToday: false },
      brandedCoins: null,
      totalApplied: 0,
    };
  }

  const rezCoins = backendData.rezCoins || { available: 0, using: 0, enabled: true };
  const promoCoins = backendData.promoCoins || { available: 0, using: 0, enabled: true, expiringToday: false };
  const brandedCoins = backendData.brandedCoins || null;

  return {
    rezCoins: {
      available: rezCoins.available || 0,
      using: rezCoins.using || 0,
      enabled: rezCoins.enabled !== false,
      color: rezCoins.color || '#ffcd57',
      icon: rezCoins.icon,
      description: rezCoins.description,
      expiryDays: rezCoins.expiryDays,
      redemptionCap: rezCoins.redemptionCap,
    },
    promoCoins: {
      available: promoCoins.available || 0,
      using: promoCoins.using || 0,
      enabled: promoCoins.enabled !== false,
      expiringToday: promoCoins.expiringToday || false,
      expiresIn: promoCoins.expiresIn,
      color: promoCoins.color || '#FFC857',
      icon: promoCoins.icon,
      description: promoCoins.description,
      redemptionCap: promoCoins.redemptionCap || 20,
    },
    brandedCoins: brandedCoins ? {
      available: brandedCoins.available || 0,
      using: brandedCoins.using || 0,
      enabled: brandedCoins.enabled !== false,
      storeName: brandedCoins.storeName || 'Store',
      storeId: brandedCoins.storeId || '',
      color: brandedCoins.color || '#6366F1',
      logo: brandedCoins.logo,
      icon: brandedCoins.icon,
      description: brandedCoins.description,
      redemptionCap: brandedCoins.redemptionCap,
    } : null,
    totalApplied: backendData.totalApplied || 0,
    usageOrder: backendData.usageOrder,
    usageOrderDescription: backendData.usageOrderDescription,
  };
}

/**
 * Store Payment API Service
 */
const storePaymentApi = {
  /**
   * Lookup store by QR code
   */
  async lookupByQR(qrCode: string): Promise<StorePaymentInfo> {
    const response = await apiClient.get<QRLookupResponse>(
      `${STORE_PAYMENT_BASE}/lookup/${encodeURIComponent(qrCode)}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Store not found');
    }

    return response.data as unknown;
  },

  /**
   * Lookup store by QR code (POST method - for JSON payload)
   */
  async lookupByQRPost(qrCode: string): Promise<StorePaymentInfo> {
    const response = await apiClient.post<QRLookupResponse>(
      `${STORE_PAYMENT_BASE}/lookup`,
      { qrCode }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Store not found');
    }

    return response.data as unknown;
  },

  /**
   * Get available offers for a store payment
   */
  async getOffers(storeId: string, amount: number): Promise<OffersResponse> {
    const response = await apiClient.get<OffersApiResponse>(
      `${STORE_PAYMENT_BASE}/offers/${storeId}`,
      { amount } as unknown
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to load offers');
    }

    return response.data as unknown;
  },

  /**
   * Initiate a store payment
   */
  async initiatePayment(request: StorePaymentRequest): Promise<StorePaymentInitResponse> {
    const response = await apiClient.post<PaymentInitApiResponse>(
      `${STORE_PAYMENT_BASE}/initiate`,
      request as unknown
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to initiate payment');
    }

    return response.data as unknown;
  },

  /**
   * Confirm a store payment
   */
  async confirmPayment(request: StorePaymentConfirmRequest): Promise<StorePaymentConfirmResponse> {
    const response = await apiClient.post<PaymentConfirmApiResponse>(
      `${STORE_PAYMENT_BASE}/confirm`,
      request as unknown
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to confirm payment');
    }

    return response.data as unknown;
  },

  /**
   * Get POS-only transaction history for the authenticated consumer.
   *
   * BUG FIX (P2-C3): Consumers who pay a POS bill at a physical store
   * had zero visibility into that transaction — the regular `getHistory`
   * endpoint only returns StorePayment records, not PosBill. This hits
   * the new `/store-payment/history/pos` endpoint which returns POS
   * bills linked to the consumer via `coinsCreditedUserId` (resolved
   * from the phone number entered at the POS register).
   */
  async getPosHistory(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaymentHistoryResponse> {
    try {
      const response = await apiClient.get<PaymentHistoryApiResponse>(
        `${STORE_PAYMENT_BASE}/history/pos`,
        params,
      );
      if (!response.success || !response.data) {
        return {
          transactions: [],
          pagination: {
            page: 1,
            limit: params?.limit || 20,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        };
      }
      return response.data as unknown;
    } catch {
      return {
        transactions: [],
        pagination: {
          page: 1,
          limit: params?.limit || 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
  },

  /**
   * Get payment transaction history
   */
  async getHistory(params?: {
    page?: number;
    limit?: number;
    storeId?: string;
  }): Promise<PaymentHistoryResponse> {
    try {
      const response = await apiClient.get<PaymentHistoryApiResponse>(
        `${STORE_PAYMENT_BASE}/history`,
        params
      );

      if (!response.success || !response.data) {
        // Return empty history instead of throwing - no history is valid
        return {
          transactions: [],
          pagination: {
            page: 1,
            limit: params?.limit || 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        };
      }

      return response.data as unknown;
    } catch (error) {
      // Return empty history on error - API might not be implemented yet
      return {
        transactions: [],
        pagination: {
          page: 1,
          limit: params?.limit || 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
  },

  /**
   * Get store payment details by paymentId
   */
  async getPaymentDetails(paymentId: string): Promise<{
    id: string;
    paymentId: string;
    storeId: string;
    storeName: string;
    storeLogo?: string;
    billAmount: number;
    discountAmount: number;
    coinRedemption: {
      rezCoins: number;
      promoCoins: number;
      totalAmount: number;
    };
    coinsUsed: number;
    remainingAmount: number;
    paymentMethod: string;
    offersApplied: string[];
    status: string;
    rewards?: {
      cashbackEarned: number;
      coinsEarned: number;
      bonusCoins: number;
    };
    transactionId?: string;
    createdAt: string;
    completedAt?: string;
  }> {
    const url = `${STORE_PAYMENT_BASE}/details/${encodeURIComponent(paymentId)}`;

    const response = await apiClient.get<unknown>(url);

    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || 'Payment not found');
    }

    return response.data;
  },

  /**
   * Get store payment info by store ID
   */
  async getStorePaymentInfo(storeId: string): Promise<StorePaymentInfo> {
    const response = await apiClient.get<QRLookupResponse>(
      `/stores/${storeId}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Store not found');
    }

    return response.data as unknown;
  },

  /**
   * Get user's coin balances for payment
   * Uses /wallet/balance endpoint which returns coin balances
   */
  async getCoinBalances(): Promise<{
    rezCoins: number;
    promoCoins: number;
  }> {
    try {
      const response = await walletApi.getBalance();

      if (!response.success) {
        // Return default values if endpoint fails
        return {
          rezCoins: 0,
          promoCoins: 0,
        };
      }

      // Backend returns: { balance: { total, available, pending, cashback }, coins: [...] }
      // The coins array contains 'rez' and 'promo' coin types
      const coins = response.data?.coins || [];

      // Get ReZ coins and Promo coins from the coins array
      const rezCoin = coins.find((c) => c.type === 'rez');
      const promoCoin = coins.find((c) => c.type === 'promo');

      return {
        rezCoins: rezCoin?.amount || 0,
        promoCoins: promoCoin?.amount || 0,
      };
    } catch (error) {
      // Return default values on error
      return {
        rezCoins: 0,
        promoCoins: 0,
      };
    }
  },

  /**
   * Calculate payment summary
   */
  calculatePaymentSummary(
    billAmount: number,
    discountAmount: number,
    coinsRedeemed: number,
    maxCoinPercent: number = 100
  ): {
    afterDiscount: number;
    maxCoinsAllowed: number;
    amountToPay: number;
    totalSavings: number;
  } {
    const afterDiscount = Math.max(0, billAmount - discountAmount);
    const maxCoinsAllowed = Math.floor((afterDiscount * maxCoinPercent) / 100);
    const effectiveCoins = Math.min(coinsRedeemed, maxCoinsAllowed);
    const amountToPay = Math.max(0, afterDiscount - effectiveCoins);
    const totalSavings = discountAmount + effectiveCoins;

    return {
      afterDiscount,
      maxCoinsAllowed,
      amountToPay,
      totalSavings,
    };
  },

  // ==================== NEW PREMIUM PAYMENT METHODS ====================

  /**
   * Get all available coins for user at a specific store
   * Maps backend rezCoins to frontend rezCoins
   */
  async getCoinsForStore(storeId: string): Promise<AppliedCoins> {
    try {
      const response = await apiClient.get<unknown>(`${STORE_PAYMENT_BASE}/coins/${storeId}`);

      if (!response.success || !response.data) {
        return mapBackendToRezCoins(null);
      }

      // Map rezCoins from backend to rezCoins for frontend
      return mapBackendToRezCoins(response.data);
    } catch (error) {
      return mapBackendToRezCoins(null);
    }
  },

  /**
   * Get enhanced payment methods with bank-specific offers
   */
  async getEnhancedPaymentMethods(storeId: string, amount?: number): Promise<EnhancedPaymentMethod[]> {
    try {
      const response = await apiClient.get<unknown>(
        `${STORE_PAYMENT_BASE}/payment-methods/${storeId}`,
        (amount ? { amount } : undefined) as unknown
      );

      if (!response.success || !response.data) {
        return [];
      }

      return response.data;
    } catch (error) {
      return [];
    }
  },

  /**
   * Auto-optimize coin allocation for maximum savings
   * Maps backend rezCoins to frontend rezCoins
   */
  async autoOptimizeCoins(storeId: string, billAmount: number): Promise<AutoOptimizeResponse> {
    const defaultResponse: AutoOptimizeResponse = {
      rezCoins: { available: 0, using: 0, enabled: false },
      promoCoins: { available: 0, using: 0, enabled: false, expiringToday: false },
      brandedCoins: null,
      totalApplied: 0,
      maxAllowed: 0,
      optimizationStrategy: 'none',
      savings: { coinsUsed: 0, percentOfBill: 0 },
    };

    try {
      const response = await apiClient.post<unknown>(`${STORE_PAYMENT_BASE}/auto-optimize`, {
        storeId,
        billAmount,
      });

      if (!response.success || !response.data) {
        return defaultResponse;
      }

      // Map rezCoins from backend to rezCoins for frontend
      const mappedCoins = mapBackendToRezCoins(response.data);
      return {
        ...mappedCoins,
        maxAllowed: response.data.maxAllowed || 0,
        optimizationStrategy: response.data.optimizationStrategy || 'none',
        savings: response.data.savings || { coinsUsed: 0, percentOfBill: 0 },
      };
    } catch (error) {
      return defaultResponse;
    }
  },

  /**
   * Get user's membership tier for a store
   */
  async getStoreMembership(storeId: string): Promise<StoreMembership | null> {
    try {
      const response = await apiClient.get<unknown>(`${STORE_PAYMENT_BASE}/membership/${storeId}`);

      if (!response.success || !response.data) {
        return null;
      }

      return response.data;
    } catch (error) {
      return null;
    }
  },
};

export default storePaymentApi;

// Named exports for tree-shaking
export const {
  lookupByQR,
  lookupByQRPost,
  getOffers,
  initiatePayment,
  confirmPayment,
  getHistory,
  getPaymentDetails,
  getStorePaymentInfo,
  getCoinBalances,
  calculatePaymentSummary,
} = storePaymentApi;

/**
 * Lookup a store by its URL slug (e.g. from menu.rez.money/<slug>).
 * Returns null when the store is not found or the request fails.
 */
export const lookupStoreBySlug = async (storeSlug: string): Promise<StorePaymentInfo | null> => {
  try {
    const response = await apiClient.get<StorePaymentInfo>(
      `${STORE_PAYMENT_BASE}/lookup-by-slug/${encodeURIComponent(storeSlug)}`
    );
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  } catch {
    return null;
  }
};

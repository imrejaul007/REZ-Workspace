// @ts-nocheck
// Payment Service
// Handles payment gateway integration for wallet topup

import apiClient, { ApiResponse } from './apiClient';
import { normalizePaymentStatus } from '../utils/statusCompat';
import { logger } from '@/utils/logger';
// Week-4: Response guards — validate backend payment responses at runtime.
// Uses no-zod guards from @rez/shared-types to keep the RN bundle small.
import { isPaymentResponse } from '@rez/shared-types';

// CA-PAY-023 FIX: Normalize payment method types before API submission
// Transform 'rezcoins' → 'wallet' as required by backend
export function normalizePaymentMethod(method: string): string {
  if (method === 'rezcoins') {
    return 'wallet';
  }
  return method;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'upi' | 'card' | 'wallet' | 'netbanking';
  gateway: string; // 'razorpay' | 'paypal'
  icon: string;
  isAvailable: boolean;
  processingFee?: number;
  processingTime?: string;
  description?: string;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  paymentMethod: string; // gateway name: 'razorpay' | 'paypal'
  paymentMethodType: string; // method type: 'card' | 'upi' | 'wallet' | 'netbanking'
  purpose?: 'wallet_topup' | 'order_payment' | 'event_booking' | 'financial_service' | 'other';
  paymentMethodId?: string;
  userDetails?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface PaymentResponse {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  gateway: string;
  paymentUrl?: string;
  qrCode?: string;
  upiId?: string;
  expiryTime?: string;
  transactionId?: string;
  gatewayResponse?;
}

export interface PaymentStatusResponse {
  paymentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  transactionId?: string;
  failureReason?: string;
  completedAt?: string;
}

export interface CashbackPreview {
  rechargeAmount: number;
  cashbackPercentage: number;
  cashback: number;
  maxCashback: number;
  cappedAt: number | null;
  // Discount fields (new)
  discountPercentage?: number;
  discountAmount?: number;
  payableAmount?: number;
}

class PaymentService {
  /**
   * Get available payment methods from backend
   */
  async getPaymentMethods(currency?: string, fiatCurrency?: string): Promise<ApiResponse<PaymentMethod[]>> {
    try {
      const params: Record<string, string> = {};
      if (currency) params.currency = currency;
      if (fiatCurrency) params.fiatCurrency = fiatCurrency;

      const response = await apiClient.get<PaymentMethod[]>('/wallet/payment-methods', params);

      if (response.success && response.data) {
        return response;
      }

      // Fallback only for dev if backend is down
      if (__DEV__) {
        logger.warn('[PAYMENT] Backend failed, using fallback methods (DEV)');
        return this.getFallbackPaymentMethods();
      }

      return {
        success: false,
        error: response.error || 'Failed to fetch payment methods.'
      };
    } catch (error) {

      if (__DEV__) {
        return this.getFallbackPaymentMethods();
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment service unavailable.'
      };
    }
  }

  /**
   * Fallback payment methods (dev only when backend is down)
   */
  private getFallbackPaymentMethods(): ApiResponse<PaymentMethod[]> {
    return {
      success: true,
      data: [
        {
          id: 'razorpay_upi',
          name: 'UPI',
          type: 'upi',
          gateway: 'razorpay',
          icon: '📱',
          isAvailable: true,
          processingFee: 0,
          processingTime: 'Instant'
        },
        // 'card' is intentionally excluded here and in loadPaymentMethods().
        // The card payment flow (PCI-DSS tokenisation via Razorpay Cards /
        // Stripe Elements) is not yet implemented.  Re-add once the card flow
        // is complete and tested end-to-end.
        {
          id: 'razorpay_wallet',
          name: 'Digital Wallet',
          type: 'wallet',
          gateway: 'razorpay',
          icon: '👛',
          isAvailable: true,
          processingFee: 0,
          processingTime: 'Instant'
        },
        {
          id: 'razorpay_netbanking',
          name: 'Net Banking',
          type: 'netbanking',
          gateway: 'razorpay',
          icon: '🏦',
          isAvailable: true,
          processingFee: 0,
          processingTime: '5-10 minutes'
        }
      ]
    };
  }

  /**
   * Initiate payment — always calls the real backend
   */
  async initiatePayment(paymentRequest: PaymentRequest): Promise<ApiResponse<PaymentResponse>> {
    try {
      // CA-PAY-023 FIX: Normalize payment method type before API submission
      const normalizedRequest = {
        ...paymentRequest,
        paymentMethodType: normalizePaymentMethod(paymentRequest.paymentMethodType),
      };
      const response = await apiClient.post<PaymentResponse>('/wallet/initiate-payment', normalizedRequest);

      // Week-4: Guard the payment response. A corrupted response would cause the
      // payment confirmation screen to show incorrect data.
      if (response.success && response.data && !isPaymentResponse(response.data)) {
        throw new Error('Malformed payment response from backend');
      }
      if (response.success && response.data) {
        return response;
      }

      return {
        success: false,
        error: response.error || 'Payment initiation failed. Please try again.'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment service error.'
      };
    }
  }

  /**
   * Check payment status — always calls the real backend
   */
  async checkPaymentStatus(paymentId: string, gateway: string): Promise<ApiResponse<PaymentStatusResponse>> {
    try {
      const response = await apiClient.get<PaymentStatusResponse>(`/wallet/payment-status/${paymentId}`, { gateway });

      if (response.success && response.data) {
        return response;
      }

      return {
        success: false,
        error: response.error || 'Failed to check payment status'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check payment status.'
      };
    }
  }

  /**
   * Poll payment status until terminal state.
   *
   * Terminal success states: 'completed' (canonical PaymentStatus) and 'paid'
   * (OrderPaymentStatus equivalent returned directly by some backend paths).
   * normalizePaymentStatus() maps both to 'paid' — we check the raw value first
   * to avoid false negatives when the backend returns 'paid' directly, then
   * fall back to normalization for unknown other legacy aliases.
   *
   * Safety net: maxAttempts * intervalMs (default: 30 * 3000ms = 90s) or
   * caller-supplied maxDurationMs.
   */
  async pollPaymentStatus(
    paymentId: string,
    gateway: string,
    options?: {
      maxAttempts?: number;
      intervalMs?: number;
      maxDurationMs?: number;
      onStatusChange?: (status: string) => void;
      shouldAbort?: () => boolean;
    }
  ): Promise<ApiResponse<PaymentStatusResponse>> {
    const maxAttempts = options?.maxAttempts ?? 30;
    const intervalMs = options?.intervalMs ?? 3000;
    const maxDurationMs = options?.maxDurationMs ?? 5 * 60 * 1000; // 5 minutes
    const startTime = Date.now();

    for (let i = 0; i < maxAttempts; i++) {
      if (Date.now() - startTime > maxDurationMs) {
        return {
          success: false,
          error: 'Payment status check timed out. Please check your transaction history.',
        };
      }

      if (options?.shouldAbort?.()) {
        return { success: false, error: 'Payment polling aborted.' };
      }

      const response = await this.checkPaymentStatus(paymentId, gateway);

      if (!response.success) {
        if (i < maxAttempts - 1) {
          await new Promise(r => setTimeout(r, intervalMs));
          continue;
        }
        return response;
      }

      const rawStatus = response.data?.status ?? '';
      const status = normalizePaymentStatus(rawStatus);
      options?.onStatusChange?.(rawStatus);

      // Terminal states after normalization:
      //   paid → payment succeeded (normalizePaymentStatus maps 'completed', 'success', 'captured' → 'paid')
      //   failed | cancelled | expired → terminal failure
      if (status === 'paid' || status === 'failed' || status === 'cancelled' || status === 'expired') {
        return response;
      }

      await new Promise(r => setTimeout(r, intervalMs));
    }

    return {
      success: false,
      error: 'Payment status check timed out. Please check your transaction history.',
    };
  }

  /**
   * Process UPI payment — sends correct gateway and method type
   */
  async processPayment(
    amount: number,
    currency: string,
    method: PaymentMethod,
    purpose: PaymentRequest['purpose'] = 'wallet_topup',
    metadata?: Record<string, unknown>
  ): Promise<ApiResponse<PaymentResponse>> {
    const paymentRequest: PaymentRequest = {
      amount,
      currency,
      paymentMethod: method.gateway, // 'razorpay' / 'stripe' / 'paypal'
      paymentMethodType: method.type, // 'upi' / 'card' / 'wallet' / 'netbanking'
      purpose,
      metadata: metadata || {}
    };

    return this.initiatePayment(paymentRequest);
  }

  /**
   * Confirm payment after Stripe payment gateway processing succeeds.
   * NOTE: Stripe is not currently active. This endpoint is disabled on the backend
   * and will return a 404. Do not call this method until Stripe is enabled.
   * Razorpay payments use lockDealApi.confirmBalancePayment instead.
   */
  async confirmPayment(_paymentIntentId: string): Promise<ApiResponse<{ status: string }>> {
    return {
      success: false,
      error: 'Stripe payments are not currently available. Please use Razorpay or wallet payment.',
    };
  }

  /**
   * Preview recharge cashback
   */
  async previewCashback(amount: number): Promise<ApiResponse<CashbackPreview>> {
    try {
      const response = await apiClient.get<CashbackPreview>('/wallet/recharge/preview', { amount: amount.toString() });
      if (response.success && response.data) {
        return response;
      }
      return { success: false, error: response.error || 'Failed to preview cashback' };
    } catch (error) {
      return { success: false, error: 'Failed to preview cashback' };
    }
  }

  /**
   * Preview bill cashback with store-specific rules
   * Replaces the flat formula in usePaymentFlow with accurate server-side calculation
   */
  async previewBillCashback(params: {
    billAmount: number;
    storeId: string;
    category?: string;
  }): Promise<ApiResponse<{
    estimatedCoins: number;
    appliedRate: number;
    multiplier: number;
    breakdown: {
      baseRate: number;
      categoryBonus: number;
      membershipBonus: number;
      privBonus: number;
    };
  }>> {
    try {
      // Try RABTUL wallet service endpoint
      const response = await apiClient.get<{
        estimatedCoins: number;
        appliedRate: number;
        multiplier: number;
        breakdown: {
          baseRate: number;
          categoryBonus: number;
          membershipBonus: number;
          privBonus: number;
        };
      }>('/api/wallet/cashback-preview', {
        billAmount: params.billAmount.toString(),
        storeId: params.storeId,
        category: params.category || '',
      });

      if (response.success && response.data) {
        return response;
      }
      return { success: false, error: response.error || 'Failed to preview bill cashback' };
    } catch (error) {
      logger.warn('[PaymentService] Cashback preview unavailable, using fallback:', error);
      return { success: false, error: 'Service unavailable' };
    }
  }

  /**
   * Detect card type from card number
   */
  detectCardType(cardNumber: string): string {
    const number = cardNumber.replace(/\D/g, '');
    if (number.startsWith('4')) return 'visa';
    const prefix2 = parseInt(number.substring(0, 2), 10);
    const prefix4 = parseInt(number.substring(0, 4), 10);
    if ((prefix2 >= 51 && prefix2 <= 55) || (prefix4 >= 2221 && prefix4 <= 2720)) return 'mastercard';
    if (number.startsWith('3')) return 'amex';
    if (number.startsWith('6')) return 'discover';
    return 'unknown';
  }

  /**
   * Validate UPI ID format
   */
  validateUPIId(upiId: string): boolean {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    return upiRegex.test(upiId);
  }

  /**
   * Validate card number (Luhn algorithm)
   */
  validateCardNumber(cardNumber: string): boolean {
    const number = cardNumber.replace(/\D/g, '');
    if (number.length < 13 || number.length > 19) return false;
    let sum = 0;
    let isEven = false;
    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number[i], 10);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  }

  /**
   * Format card number for display
   */
  formatCardNumber(cardNumber: string): string {
    const number = cardNumber.replace(/\D/g, '');
    return number.replace(/(\d{4})(?=\d)/g, '$1 ');
  }
}

const paymentService = new PaymentService();
export default paymentService;

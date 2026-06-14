// @ts-nocheck
// Payment Orchestrator Service
// Central service to manage all payment methods for REZ App

import razorpayService from './razorpayService';
import apiClient from './apiClient';
import type {
  PaymentMethod,
  PaymentRequest,
  PaymentResponse,
  PaymentMethodType,
  PaymentGateway,
  CODConfig,
  SavedCard,
  PaymentMethodPreference,
} from '@/types/payment.types';
import { logger } from '@/utils/logger';

// Environment configuration
const ENABLE_RAZORPAY = process.env.EXPO_PUBLIC_ENABLE_RAZORPAY === 'true';
const ENABLE_COD = process.env.EXPO_PUBLIC_ENABLE_COD === 'true';
const COD_FEE = Number(process.env.EXPO_PUBLIC_COD_FEE) || 50;
const COD_MIN_ORDER = Number(process.env.EXPO_PUBLIC_COD_MIN_ORDER) || 0;
const COD_MAX_ORDER = Number(process.env.EXPO_PUBLIC_COD_MAX_ORDER) || 50000;

// CONSUMER-HIGH-02 FIX: Payment retry configuration
const PAYMENT_RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

/**
 * Check if error is a timeout error
 */
function isTimeoutError(error): boolean {
  if (!error) return false;
  const message = error.message?.toLowerCase() || '';
  const code = error.code?.toString() || '';
  return (
    code === 'ETIMEDOUT' ||
    code === 'ECONNRESET' ||
    code === 'NETWORK_ERROR' ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    error.status === 408 ||
    (error.response && error.response.status === 408)
  );
}

/**
 * Delay helper with exponential backoff
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff
 * Returns delay in ms: baseDelay * 2^attempt (capped at maxDelay)
 */
function calculateBackoffDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  return Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
}

/**
 * Payment Orchestrator Service
 * Manages all payment methods and routes payments to appropriate gateways
 */
class PaymentOrchestratorService {
  private initialized = false;

  /**
   * Initialize payment services
   */
  async initialize(): Promise<void> {
    if (this.initialized) {

      return;
    }

    try {
      this.initialized = true;

    } catch (error) {
      // Re-throw so callers (and ultimately the UI) can surface the failure
      throw error;
    }
  }

  /**
   * Get all available payment methods
   * CA-PAY-043 FIX: Validate wallet balance before marking wallet as available
   */
  async getAvailablePaymentMethods(
    amount: number,
    currency: string = 'INR'
  ): Promise<PaymentMethod[]> {

    const methods: PaymentMethod[] = [];

    // CA-PAY-043 FIX: REZ Wallet - Check balance before marking as available
    // Fetch current balance to prevent users from paying with wallet they don't have balance for
    let walletBalance = 0;
    try {
      // Try to get wallet balance from API
      const walletRes = await apiClient.get<unknown>('/wallet/balance');
      if (walletRes.success && walletRes.data) {
        walletBalance = walletRes.data.balance?.available ?? walletRes.data.balance?.total ?? 0;
      }
    } catch (error) {
      // On error, assume wallet is not available (fail-safe)
      walletBalance = 0;
    }

    const hasWalletBalance = walletBalance >= amount;
    methods.push({
      id: 'wallet',
      name: 'ReZ Wallet',
      type: 'wallet',
      gateway: 'internal',
      icon: 'wallet',
      isAvailable: hasWalletBalance,
      processingFee: 0,
      processingTime: 'Instant',
      description: hasWalletBalance
        ? 'Pay using your ReZ wallet balance'
        : `Insufficient wallet balance (₹${walletBalance} < ₹${amount} needed)`,
      isDefault: hasWalletBalance,
    });

    // REZ Coins - Always available
    methods.push({
      id: 'rezcoins',
      name: 'REZ Coins',
      type: 'rezcoins',
      gateway: 'internal',
      icon: 'diamond',
      isAvailable: true,
      processingFee: 0,
      processingTime: 'Instant',
      description: 'Use your REZ coins for payment',
    });

    // Razorpay methods
    if (ENABLE_RAZORPAY && razorpayService.isConfigured()) {
      // UPI via Razorpay
      methods.push({
        id: 'razorpay_upi',
        name: 'UPI',
        type: 'upi',
        gateway: 'razorpay',
        icon: 'phone-portrait',
        isAvailable: true,
        processingFee: 0,
        processingTime: 'Instant',
        description: 'Pay using unknown UPI app (GPay, PhonePe, Paytm)',
        supportedCurrencies: ['INR'],
      });

      // Cards via Razorpay
      methods.push({
        id: 'razorpay_card',
        name: 'Credit/Debit Card',
        type: 'card',
        gateway: 'razorpay',
        icon: 'card',
        isAvailable: true,
        processingFee: 2,
        processingTime: '2-3 minutes',
        description: 'Visa, Mastercard, Amex, RuPay',
        supportedCurrencies: ['INR'],
      });

      // Net Banking via Razorpay
      methods.push({
        id: 'razorpay_netbanking',
        name: 'Net Banking',
        type: 'netbanking',
        gateway: 'razorpay',
        icon: 'business',
        isAvailable: true,
        processingFee: 0,
        processingTime: '5-10 minutes',
        description: 'Pay using your bank account',
        supportedCurrencies: ['INR'],
      });

      // Wallets via Razorpay
      methods.push({
        id: 'razorpay_wallet',
        name: 'Digital Wallets',
        type: 'wallet',
        gateway: 'razorpay',
        icon: 'wallet-outline',
        isAvailable: true,
        processingFee: 1.5,
        processingTime: 'Instant',
        description: 'Paytm, PhonePe, Amazon Pay, etc.',
        supportedCurrencies: ['INR'],
      });
    }

    // Cash on Delivery
    if (ENABLE_COD) {
      const codConfig = await this.getCODConfiguration();
      const isCODAvailable =
        codConfig.isAvailable &&
        amount >= codConfig.minOrderAmount &&
        amount <= codConfig.maxOrderAmount;

      methods.push({
        id: 'cod',
        name: 'Cash on Delivery',
        type: 'cod',
        gateway: 'none',
        icon: 'cash',
        isAvailable: isCODAvailable,
        processingFee: codConfig.fee,
        processingTime: 'On delivery',
        description: `₹${codConfig.fee} COD charges apply`,
        minAmount: codConfig.minOrderAmount,
        maxAmount: codConfig.maxOrderAmount,
      });
    }

    // CA-PAY-024 FIX: Filter all methods by amount and currency constraints
    return methods.filter(method => {
      // Check currency support if specified
      if (method.supportedCurrencies && !method.supportedCurrencies.includes(currency)) {
        return false;
      }
      // Check amount constraints
      if (method.minAmount !== undefined && amount < method.minAmount) {
        return false;
      }
      if (method.maxAmount !== undefined && amount > method.maxAmount) {
        return false;
      }
      return true;
    });
  }

  /**
   * Process payment using appropriate gateway
   * CONSUMER-HIGH-02 FIX: Added retry logic with exponential backoff for timeout errors
   */
  async processPayment(
    paymentRequest: PaymentRequest,
    userDetails?: {
      name?: string;
      email?: string;
      contact?: string;
    }
  ): Promise<PaymentResponse> {

    await this.initialize();

    let lastError: Error | null = null;
    const { maxAttempts, baseDelayMs, maxDelayMs } = PAYMENT_RETRY_CONFIG;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Route to appropriate gateway
        switch (paymentRequest.gateway) {
          case 'razorpay':
            return await this.processRazorpayPayment(paymentRequest, userDetails);

          case 'internal':
            return await this.processInternalPayment(paymentRequest);

          case 'none':
            if (paymentRequest.paymentMethod === 'cod') {
              return await this.processCODPayment(paymentRequest);
            }
            throw new Error(
              "Payment option is temporarily unavailable. Please try again or choose a different payment method."
            );

          default:
            throw new Error(
              `This payment method isn't supported right now. Please try a different option.`
            );
        }
      } catch (error) {
        lastError = error;

        // Only retry on timeout errors, and not on the last attempt
        if (isTimeoutError(error) && attempt < maxAttempts - 1) {
          const backoffDelay = calculateBackoffDelay(attempt, baseDelayMs, maxDelayMs);
          logger.warn(`[PaymentOrchestrator] Payment attempt ${attempt + 1} failed with timeout. Retrying in ${backoffDelay}ms...`);
          await delay(backoffDelay);
          continue;
        }

        // For non-timeout errors or last attempt, throw immediately
        throw error;
      }
    }

    // This should never be reached, but just in case
    throw lastError || new Error('Payment failed after all retry attempts');
  }

  /**
   * Process Razorpay payment
   */
  private async processRazorpayPayment(
    paymentRequest: PaymentRequest,
    userDetails?: {
      name?: string;
      email?: string;
      contact?: string;
    }
  ): Promise<PaymentResponse> {

    try {
      return await razorpayService.processPayment(paymentRequest, userDetails);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Process internal payment (ReZ Wallet, REZ Coins)
   */
  private async processInternalPayment(
    paymentRequest: PaymentRequest
  ): Promise<PaymentResponse> {

    try {
      const response = await apiClient.post<PaymentResponse>('/payment/internal/process', paymentRequest);

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(
          response.error ||
          "Your payment couldn't be completed. Your wallet wasn't charged. Please try again."
        );
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Process COD payment
   */
  private async processCODPayment(
    paymentRequest: PaymentRequest
  ): Promise<PaymentResponse> {

    try {
      const response = await apiClient.post<PaymentResponse>('/payment/cod/create', paymentRequest);

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(
          response.error ||
          "Your order couldn't be placed. Please try again or choose a different payment method."
        );
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get COD configuration
   */
  async getCODConfiguration(): Promise<CODConfig> {
    try {
      const response = await apiClient.get<unknown>('/payment/cod/config');

      if (response.success && response.data) {
        return response.data;
      }
    } catch (_error) {
      // silently handle
    }

    // Fallback to environment config
    return {
      isAvailable: ENABLE_COD,
      fee: COD_FEE,
      minOrderAmount: COD_MIN_ORDER,
      maxOrderAmount: COD_MAX_ORDER,
    };
  }

  /**
   * Get saved payment methods for user
   */
  async getSavedPaymentMethods(): Promise<{
    cards: SavedCard[];
    upiIds: string[];
  }> {

    try {
      const response = await apiClient.get<unknown>('/payment/saved-methods');

      if (response.success && response.data) {
        return response.data;
      }
    } catch (_error) {
      // silently handle
    }

    return { cards: [], upiIds: [] };
  }

  /**
   * Save payment method
   */
  async savePaymentMethod(
    type: PaymentMethodType,
    details: {
      cardToken?: string;
      last4?: string;
      brand?: string;
      expiryMonth?: number;
      expiryYear?: number;
      holderName?: string;
      upiId?: string;
      gateway?: PaymentGateway;
    }
  ): Promise<{ success: boolean; id?: string }> {

    try {
      const response = await apiClient.post<unknown>('/payment/save-method', {
        type,
        details,
      });

      if (response.success) {
        return { success: true, id: response.data?.id };
      }

      return { success: false };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * Delete saved payment method
   */
  async deleteSavedPaymentMethod(methodId: string): Promise<boolean> {

    try {
      const response = await apiClient.delete<unknown>(`/payment/saved-methods/${methodId}`);
      return response.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user's payment preferences
   */
  async getPaymentPreferences(): Promise<PaymentMethodPreference | null> {

    try {
      const response = await apiClient.get<unknown>('/payment/preferences');

      if (response.success && response.data) {
        return response.data;
      }
    } catch (_error) {
      // silently handle
    }

    return null;
  }

  /**
   * Update payment preferences
   */
  async updatePaymentPreferences(
    preferences: Partial<PaymentMethodPreference>
  ): Promise<boolean> {

    try {
      const response = await apiClient.put<unknown>('/payment/preferences', preferences);
      return response.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(paymentId: string, gateway: PaymentGateway): Promise<PaymentResponse> {

    try {
      switch (gateway) {
        case 'razorpay':
          return await razorpayService.checkPaymentStatus(paymentId);

        case 'internal':
        case 'none':
          const response = await apiClient.get<unknown>(`/payment/status/${paymentId}`);
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(
            "We couldn't verify your payment status. Please check your orders page."
          );

        default:
          throw new Error(
            "This payment method isn't supported. Please contact support if you need help."
          );
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate payment configuration
   */
  validateConfiguration(): {
    razorpay: { isValid: boolean; errors: string[] };
    cod: { isValid: boolean; errors: string[] };
  } {
    const razorpayValidation = razorpayService.validateConfiguration();
    const codValidation = {
      isValid: ENABLE_COD,
      errors: ENABLE_COD ? [] : ['COD is disabled'],
    };

    return {
      razorpay: razorpayValidation,
      cod: codValidation,
    };
  }

  /**
   * Get recommended payment method for user
   */
  async getRecommendedPaymentMethod(
    amount: number,
    currency: string = 'INR'
  ): Promise<PaymentMethod | null> {
    const methods = await this.getAvailablePaymentMethods(amount, currency);
    const preferences = await this.getPaymentPreferences();

    if (!methods.length) {
      return null;
    }

    // If user has a preferred method, use it
    if (preferences?.preferredMethod) {
      const preferredMethod = methods.find(
        (m) => m.type === preferences.preferredMethod && m.isAvailable
      );
      if (preferredMethod) {
        return preferredMethod;
      }
    }

    // If user has last used method, use it
    if (preferences?.lastUsedMethod) {
      const lastUsedMethod = methods.find(
        (m) => m.type === preferences.lastUsedMethod && m.isAvailable
      );
      if (lastUsedMethod) {
        return lastUsedMethod;
      }
    }

    // Return first available method (usually ReZ Wallet)
    return methods.find((m) => m.isAvailable && m.isDefault) || methods[0];
  }
}

// Export singleton instance
const paymentOrchestratorService = new PaymentOrchestratorService();
export default paymentOrchestratorService;

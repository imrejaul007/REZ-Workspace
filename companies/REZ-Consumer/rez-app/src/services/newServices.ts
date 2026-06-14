/**
 * REZ Consumer App - New Services Client
 * Express Checkout, Fraud Prevention, Multi-Currency, Loyalty
 */

import { API_ENDPOINTS } from './api';

// =============================================================================
// Type Definitions
// =============================================================================

// Express Checkout Types
export interface ExpressCheckoutRequest {
  items: ExpressCheckoutItem[];
  customerId: string;
  paymentMethod?: 'upi' | 'card' | 'wallet' | 'cod';
  billingAddress?: Address;
  shippingAddress?: Address;
  couponCode?: string;
  currency?: string;
}

export interface ExpressCheckoutItem {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  name: string;
  imageUrl?: string;
}

export interface ExpressCheckoutResponse {
  sessionId: string;
  paymentUrl?: string;
  amount: number;
  currency: string;
  expiresAt: string;
  qrCode?: string;
}

export interface ExpressCheckoutSession {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  amount: number;
  currency: string;
  customerId: string;
  items: ExpressCheckoutItem[];
  paymentMethod?: string;
  createdAt: string;
  expiresAt: string;
  completedAt?: string;
  failureReason?: string;
}

// Fraud Prevention Types
export interface FraudCheckRequest {
  orderId?: string;
  customerId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  customerData: FraudCustomerData;
  deviceData?: FraudDeviceData;
  orderData?: FraudOrderData;
}

export interface FraudCustomerData {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  isGuest: boolean;
  accountAge?: number;
  previousOrders?: number;
}

export interface FraudDeviceData {
  fingerprint: string;
  ipAddress: string;
  userAgent: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

export interface FraudOrderData {
  itemCount: number;
  isHighValue: boolean;
  isInternational: boolean;
  multipleShippingAddresses: boolean;
  firstTimeBuyer: boolean;
}

export interface FraudCheckResponse {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  flaggedReasons?: string[];
  transactionId: string;
  requiresVerification: boolean;
  verificationMethods?: ('otp' | 'email_verify' | 'phone_verify' | 'kyc')[];
}

// Multi-Currency Types
export interface CurrencyConvertRequest {
  amount: number;
  from: string;
  to: string;
}

export interface CurrencyConvertResponse {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  convertedCurrency: string;
  exchangeRate: number;
  validUntil: string;
}

export interface CurrencyRate {
  code: string;
  symbol: string;
  name: string;
  rate: number;
  lastUpdated: string;
}

export interface SupportedCurrency {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  decimalPlaces: number;
  minAmount: number;
  maxAmount: number;
}

// Loyalty Types
export interface LoyaltyBalanceResponse {
  customerId: string;
  points: number;
  pointsValue: number;
  tier: LoyaltyTier;
  tierProgress: {
    current: number;
    required: number;
    percentage: number;
  };
  expiresAt?: string;
  lifetimePoints: number;
}

export interface LoyaltyTier {
  name: string;
  level: number;
  benefits: string[];
  pointsMultiplier: number;
  nextTier?: string;
}

export interface LoyaltyRedeemRequest {
  customerId: string;
  points: number;
  orderId?: string;
  rewardId?: string;
}

export interface LoyaltyRedeemResponse {
  success: boolean;
  transactionId: string;
  pointsRedeemed: number;
  monetaryValue: number;
  newBalance: number;
  voucherCode?: string;
  voucherExpiry?: string;
}

export interface LoyaltyTransaction {
  id: string;
  type: 'earned' | 'redeemed' | 'expired' | 'adjusted' | 'bonus';
  points: number;
  description: string;
  orderId?: string;
  createdAt: string;
}

// Address Type
export interface Address {
  id?: string;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

// =============================================================================
// API Client Base
// =============================================================================

abstract class BaseApiClient {
  protected baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }
}

// =============================================================================
// Express Checkout Service
// =============================================================================

class ExpressCheckoutService extends BaseApiClient {
  constructor() {
    super(API_ENDPOINTS.checkout.express);
  }

  /**
   * Create a new express checkout session
   */
  async createSession(request: ExpressCheckoutRequest): Promise<ExpressCheckoutResponse> {
    return this.request<ExpressCheckoutResponse>(API_ENDPOINTS.checkout.express, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get express checkout session by ID
   */
  async getSession(sessionId: string): Promise<ExpressCheckoutSession> {
    return this.request<ExpressCheckoutSession>(
      API_ENDPOINTS.checkout.session(sessionId),
      { method: 'GET' }
    );
  }

  /**
   * Poll for session status updates
   */
  async pollSessionStatus(
    sessionId: string,
    intervalMs: number = 2000,
    maxAttempts: number = 15
  ): Promise<ExpressCheckoutSession> {
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const session = await this.getSession(sessionId);

          if (session.status === 'completed') {
            resolve(session);
            return;
          }

          if (session.status === 'failed' || session.status === 'expired') {
            reject(new Error(session.failureReason || 'Session expired'));
            return;
          }

          if (++attempts >= maxAttempts) {
            reject(new Error('Session polling timed out'));
            return;
          }

          setTimeout(poll, intervalMs);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }
}

// =============================================================================
// Fraud Prevention Service
// =============================================================================

class FraudPreventionService extends BaseApiClient {
  constructor() {
    super(API_ENDPOINTS.fraud.check);
  }

  /**
   * Check order for fraud risk
   */
  async checkFraud(request: FraudCheckRequest): Promise<FraudCheckResponse> {
    return this.request<FraudCheckResponse>(API_ENDPOINTS.fraud.check, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get fraud risk for COD orders
   */
  async checkCodRisk(
    customerId: string,
    amount: number,
    items: ExpressCheckoutItem[]
  ): Promise<{
    isHighRisk: boolean;
    riskLevel: string;
    recommendation: string;
  }> {
    const response = await this.checkFraud({
      customerId,
      amount,
      currency: 'INR',
      paymentMethod: 'cod',
      customerData: {
        email: '',
        phone: '',
        firstName: '',
        lastName: '',
        isGuest: true,
      },
      orderData: {
        itemCount: items.length,
        isHighValue: amount > 10000,
        isInternational: false,
        multipleShippingAddresses: false,
        firstTimeBuyer: true,
      },
    });

    return {
      isHighRisk: response.riskLevel === 'high' || response.riskLevel === 'critical',
      riskLevel: response.riskLevel,
      recommendation: response.recommendations[0] || 'Proceed with caution',
    };
  }

  /**
   * Report fraudulent activity
   */
  async reportFraud(report: {
    orderId: string;
    type: 'fake' | 'abuse' | 'chargeback' | 'refund_fraud';
    details: string;
  }): Promise<{ success: boolean; reportId: string }> {
    return this.request(API_ENDPOINTS.fraud.report, {
      method: 'POST',
      body: JSON.stringify(report),
    });
  }
}

// =============================================================================
// Multi-Currency Service
// =============================================================================

class MultiCurrencyService extends BaseApiClient {
  constructor() {
    super(API_ENDPOINTS.currency.convert);
  }

  /**
   * Convert amount between currencies
   */
  async convert(request: CurrencyConvertRequest): Promise<CurrencyConvertResponse> {
    return this.request<CurrencyConvertResponse>(API_ENDPOINTS.currency.convert, {
      method: 'GET',
    });
  }

  /**
   * Get current exchange rates
   */
  async getRates(baseCurrency: string = 'INR'): Promise<CurrencyRate[]> {
    return this.request<CurrencyRate[]>(
      `${API_ENDPOINTS.currency.rates}?base=${baseCurrency}`,
      { method: 'GET' }
    );
  }

  /**
   * Get list of supported currencies
   */
  async getSupportedCurrencies(): Promise<SupportedCurrency[]> {
    return this.request<SupportedCurrency[]>(API_ENDPOINTS.currency.supported, {
      method: 'GET',
    });
  }

  /**
   * Format amount with currency symbol
   */
  formatAmount(amount: number, currency: SupportedCurrency): string {
    const formatted = amount.toFixed(currency.decimalPlaces);
    return `${currency.symbol}${formatted}`;
  }
}

// =============================================================================
// Loyalty Service
// =============================================================================

class LoyaltyService extends BaseApiClient {
  constructor() {
    super(API_ENDPOINTS.loyalty.balance);
  }

  /**
   * Get customer's loyalty balance
   */
  async getBalance(customerId: string): Promise<LoyaltyBalanceResponse> {
    return this.request<LoyaltyBalanceResponse>(
      `${API_ENDPOINTS.loyalty.balance}?customerId=${customerId}`,
      { method: 'GET' }
    );
  }

  /**
   * Redeem loyalty points
   */
  async redeem(request: LoyaltyRedeemRequest): Promise<LoyaltyRedeemResponse> {
    return this.request<LoyaltyRedeemResponse>(API_ENDPOINTS.loyalty.redeem, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get loyalty points history
   */
  async getHistory(
    customerId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    transactions: LoyaltyTransaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  }> {
    return this.request(
      `${API_ENDPOINTS.loyalty.history}?customerId=${customerId}&page=${page}&limit=${limit}`,
      { method: 'GET' }
    );
  }

  /**
   * Get customer's loyalty tier info
   */
  async getTier(customerId: string): Promise<LoyaltyTier> {
    return this.request<LoyaltyTier>(
      `${API_ENDPOINTS.loyalty.tier}?customerId=${customerId}`,
      { method: 'GET' }
    );
  }

  /**
   * Calculate points value in currency
   */
  calculatePointsValue(points: number, ratePerPoint: number = 0.25): number {
    return points * ratePerPoint;
  }

  /**
   * Calculate points needed for redemption
   */
  calculatePointsNeeded(amount: number, ratePerPoint: number = 0.25): number {
    return Math.ceil(amount / ratePerPoint);
  }
}

// =============================================================================
// Service Exports
// =============================================================================

export const expressCheckoutService = new ExpressCheckoutService();
export const fraudPreventionService = new FraudPreventionService();
export const multiCurrencyService = new MultiCurrencyService();
export const loyaltyService = new LoyaltyService();

// =============================================================================
// Combined Store Service
// =============================================================================

export class CheckoutService {
  // Express Checkout
  async createExpressCheckout(items: ExpressCheckoutItem[], customerId: string) {
    const request: ExpressCheckoutRequest = {
      items,
      customerId,
      paymentMethod: 'upi',
    };

    return expressCheckoutService.createSession(request);
  }

  // Fraud Check
  async checkOrderRisk(
    customerId: string,
    amount: number,
    items: ExpressCheckoutItem[]
  ) {
    return fraudPreventionService.checkCodRisk(customerId, amount, items);
  }

  // Currency Conversion
  async convertPrice(amount: number, from: string, to: string) {
    return multiCurrencyService.convert({ amount, from, to });
  }

  // Loyalty
  async getLoyaltyInfo(customerId: string) {
    return loyaltyService.getBalance(customerId);
  }

  async redeemPoints(customerId: string, points: number, orderId?: string) {
    return loyaltyService.redeem({
      customerId,
      points,
      orderId,
    });
  }
}

export const checkoutService = new CheckoutService();

export default {
  expressCheckoutService,
  fraudPreventionService,
  multiCurrencyService,
  loyaltyService,
  checkoutService,
};

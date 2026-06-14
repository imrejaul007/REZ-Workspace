// @ts-nocheck
// Canonical types: @rez/shared-types — migrate imports when package is published
// Payment Types and Interfaces for REZ App
// Comprehensive payment system types

// NOTE: 'rezcoins' is a UI/display concept only.
// When sending payment method to the backend Order API, 'rezcoins' maps to 'wallet'.
// The /wallet/initiate-payment endpoint uses gateway names (e.g. 'razorpay'), not this type.
// Transform rule: rezcoins → 'wallet' before any API call that sends payment method to backend.
// CV-07 FIX: Aligned to lowercase to match consumer app's PaymentMethodType enum.
export type PaymentMethodType = 'upi' | 'card' | 'wallet' | 'netbanking' | 'cod' | 'rezcoins';
export type PaymentGateway = 'razorpay' | 'internal' | 'none';

/**
 * FIX 9: Compile-time enforced mapping from UI payment method to backend value.
 * 'rezcoins' is a UI/display concept; the backend Order API expects 'wallet'.
 * Use this helper before unknown API call that sends payment method to the backend.
 */
export function toBackendPaymentMethod(method: PaymentMethodType): string {
  if (method === 'rezcoins') return 'wallet';
  return method;
}

// Canonical reference: @rez/shared-types/src/enums/PaymentStatus
// Backend canonical: order.payment.status sub-document (rez-order-service/src/models/Order.ts)
// Canonical payment status (11 states + FSM)
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'refund_initiated'
  | 'refund_processing'
  | 'refunded'
  | 'refund_failed'
  | 'partially_refunded';

export type CardType = 'visa' | 'mastercard' | 'amex' | 'rupay' | 'unknown';

/**
 * Payment Method Interface
 */
export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  gateway: PaymentGateway;
  icon: string;
  isAvailable: boolean;
  processingFee?: number; // percentage
  processingTime?: string;
  description?: string;
  minAmount?: number;
  maxAmount?: number;
  supportedCurrencies?: string[];
  isDefault?: boolean;
}

/**
 * Saved Card Interface (Tokenized)
 */
export interface SavedCard {
  id: string;
  last4: string;
  brand: CardType;
  expiryMonth: number;
  expiryYear: number;
  holderName: string;
  isDefault: boolean;
  token: string; // Tokenized card reference
  gateway: PaymentGateway;
  createdAt: string;
}

/**
 * UPI Details
 */
export interface UPIDetails {
  vpa: string; // Virtual Payment Address (UPI ID)
  name?: string;
  app?: 'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'other';
}

/**
 * Card Details (Never store actual card numbers)
 */
export interface CardDetails {
  number: string; // Only for payment processing, never stored
  expiry: string; // MM/YY format
  cvv: string;
  name: string;
  saveCard?: boolean;
}

/**
 * Net Banking Details
 */
export interface NetBankingDetails {
  bankCode: string;
  bankName: string;
}

/**
 * Payment Request
 */
export interface PaymentRequest {
  orderId: string; // MongoDB order ID
  amount: number;
  currency: string;
  paymentMethod: PaymentMethodType;
  gateway: PaymentGateway;

  // Method-specific details
  upiDetails?: UPIDetails;
  cardDetails?: CardDetails;
  savedCardId?: string;
  netBankingDetails?: NetBankingDetails;
  walletType?: string;

  // Additional metadata
  metadata?: {
    userId?: string;
    storeId?: string;
    storeName?: string;
    items?: unknown[];
    deliveryAddress?;
    couponCode?: string;
  };
}

/**
 * Payment Response
 */
export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;

  // Gateway-specific data
  gatewayOrderId?: string; // Razorpay order ID
  gatewayPaymentId?: string;
  transactionId?: string;

  // Payment details
  paymentMethod: PaymentMethodType;
  gateway: PaymentGateway;

  // Additional data
  paymentUrl?: string; // For redirect-based payments
  qrCode?: string; // For UPI QR code
  expiryTime?: string;
  failureReason?: string;

  // Timestamps
  createdAt: string;
  completedAt?: string;
}

/**
 * Razorpay Order Response
 */
export interface RazorpayOrder {
  id: string; // Razorpay order ID
  amount: number; // in paise
  currency: string;
  receipt: string;
  status: string;
  key: string; // Razorpay key ID
}

/**
 * Razorpay Payment Success Data
 */
export interface RazorpayPaymentData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/**
 * COD Configuration
 */
export interface CODConfig {
  isAvailable: boolean;
  fee: number;
  minOrderAmount: number;
  maxOrderAmount: number;
  availableInPincodes?: string[];
  unavailableInPincodes?: string[];
}

/**
 * Payment Method Configuration
 */
export interface PaymentConfig {
  razorpay: {
    enabled: boolean;
    keyId: string;
  };
  cod: CODConfig;
  rezCoins: {
    enabled: boolean;
    maxUsagePercentage: number; // Max percentage of order that can be paid with coins
  };
}

/**
 * Payment Transaction
 * Canonical source: @rez/shared/src/types/order.types.ts (OrderPayment)
 */
export interface PaymentTransaction {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethodType;
  gateway: PaymentGateway;
  status: PaymentStatus;

  // Gateway references
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  gatewayTransactionId?: string;

  // Payment details
  last4?: string; // For card payments
  upiVpa?: string; // For UPI payments
  bankName?: string; // For net banking

  // Fees and taxes
  // Backend canonical field names (Transaction.ts: fees, tax, netAmount)
  fees?: number;           // backend canonical: total transaction fees
  tax?: number;            // backend canonical: tax deducted
  // Legacy consumer field names kept for backward compatibility
  processingFee?: number;
  gatewayFee?: number;
  taxes?: number;
  netAmount: number;

  // Metadata
  metadata?: Record<string, unknown>;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  failedAt?: string;

  // Failure details
  failureReason?: string;
  failureCode?: string;

  // Refund details
  isRefunded?: boolean;
  refundAmount?: number;
  refundedAt?: string;
  refundReason?: string;
}

/**
 * Payment Validation Result
 */
export interface PaymentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Payment Method Preference
 */
export interface PaymentMethodPreference {
  userId: string;
  preferredMethod: PaymentMethodType;
  preferredGateway: PaymentGateway;
  savedCards: SavedCard[];
  savedUPIIds: string[];
  autoSaveCards: boolean;
  lastUsedMethod?: PaymentMethodType;
  updatedAt: string;
}

/**
 * Payment Analytics
 */
export interface PaymentAnalytics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  successRate: number;
  totalAmount: number;
  averageAmount: number;
  methodBreakdown: Record<PaymentMethodType, number>;
  gatewayBreakdown: Record<PaymentGateway, number>;
}

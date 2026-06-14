/**
 * Payment Connector - RABTUL Payment Service Client
 *
 * Handles all payment-related operations including:
 * - Order creation
 * - Payment verification
 * - Refunds
 * - Payment methods
 * - QR code generation and verification
 *
 * @example
 * ```typescript
 * import { PaymentConnector } from '@rez/connector-sdk/payment';
 *
 * const payment = new PaymentConnector({
 *   baseUrl: 'http://localhost:4003',
 *   internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN,
 * });
 *
 * // Create an order
 * const order = await payment.createOrder({
 *   amount: 999.00,
 *   userId: 'user-123',
 *   merchantId: 'merchant-456',
 * });
 * ```
 */

import { BaseConnector } from '../core';
import {
  ApiError,
  CreateOrderParams,
  CreateOrderResponse,
  VerifyPaymentResponse,
  RefundResponse,
  PaymentMethodsResponse,
  QRCodeResponse,
  VerifyQRPaymentResponse,
  CreateOrderSchema,
  VerifyPaymentSchema,
  RefundSchema,
  GetPaymentMethodsSchema,
  GenerateQRCodeSchema,
  VerifyQRPaymentSchema,
} from '../types';

// ============================================================================
// Connector Configuration
// ============================================================================

export interface PaymentConnectorConfig {
  /** Payment service URL (defaults to PAYMENT_SERVICE_URL env var or http://localhost:4003) */
  baseUrl?: string;
  /** Internal service token for inter-service communication */
  internalServiceToken?: string;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Number of retry attempts (default: 3) */
  retries?: number;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

// ============================================================================
// Connector Class
// ============================================================================

export class PaymentConnector extends BaseConnector<PaymentConnectorConfig> {
  private static readonly SERVICE_NAME = 'payment';
  private static readonly DEFAULT_PORT = 4003;
  private static readonly ENV_VAR = 'PAYMENT_SERVICE_URL';

  constructor(config: PaymentConnectorConfig = {}) {
    const completeConfig: PaymentConnectorConfig = {
      baseUrl: config.baseUrl || process.env[PaymentConnector.ENV_VAR] || `http://localhost:${PaymentConnector.DEFAULT_PORT}`,
      internalServiceToken: config.internalServiceToken || process.env.INTERNAL_SERVICE_TOKEN,
      timeout: config.timeout ?? 30000,
      retries: config.retries ?? 3,
      debug: config.debug ?? false,
    };

    super(completeConfig, PaymentConnector.SERVICE_NAME);
  }

  // ============================================================================
  // Order Management
  // ============================================================================

  /**
   * Create a new payment order
   *
   * @param params - Order parameters
   * @param params.amount - Amount in smallest currency unit (e.g., paise for INR)
   * @param params.userId - User placing the order
   * @param params.merchantId - Merchant receiving the payment
   * @param params.metadata - Optional metadata to attach to order
   * @param params.currency - Currency code (default: INR)
   * @param params.description - Order description
   * @returns Order details including Razorpay order ID
   *
   * @example
   * ```typescript
   * const order = await payment.createOrder({
   *   amount: 99900, // Rs. 999.00 in paise
   *   userId: 'user-123',
   *   merchantId: 'merchant-456',
   *   metadata: { orderRef: 'ORD-001' },
   * });
   * console.log('Order ID:', order.orderId);
   * console.log('Razorpay Order ID:', order.razorpayOrderId);
   * ```
   */
  async createOrder(params: CreateOrderParams): Promise<CreateOrderResponse | null> {
    // Validate input with Zod
    const parsed = CreateOrderSchema.safeParse(params);
    if (!parsed.success) {
      return null;
    }

    const result = await this.safeCall<CreateOrderResponse>(async () => {
      return this.http.post<CreateOrderResponse>('/orders', params);
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Verify a payment using Razorpay signature
   *
   * @param orderId - Your internal order ID
   * @param razorpayPaymentId - Payment ID from Razorpay
   * @param razorpaySignature - Signature from Razorpay webhook
   * @returns Verification result
   *
   * @example
   * ```typescript
   * const verified = await payment.verifyPayment(
   *   'order-123',
   *   'pay_abc123',
   *   'signature_xyz'
   * );
   * if (verified.success) {
   *   console.log('Payment verified!');
   * }
   * ```
   */
  async verifyPayment(
    orderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<VerifyPaymentResponse | null> {
    // Validate input with Zod
    const parsed = VerifyPaymentSchema.safeParse({ orderId, razorpayPaymentId, razorpaySignature });
    if (!parsed.success) {
      return null;
    }

    const result = await this.safeCall<VerifyPaymentResponse>(async () => {
      return this.http.post<VerifyPaymentResponse>('/payments/verify', {
        orderId,
        razorpayPaymentId,
        razorpaySignature,
      });
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Get order details by order ID
   *
   * @param orderId - The order's unique identifier
   * @returns Order details
   *
   * @example
   * ```typescript
   * const order = await payment.getOrder('order-123');
   * if (order) {
   *   console.log('Status:', order.status);
   *   console.log('Amount:', order.amount);
   * }
   * ```
   */
  async getOrder(orderId: string): Promise<CreateOrderResponse | null> {
    const result = await this.safeCall<CreateOrderResponse>(async () => {
      return this.http.get<CreateOrderResponse>(`/orders/${orderId}`);
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Cancel an unpaid order
   *
   * @param orderId - The order's unique identifier
   * @returns Success status
   */
  async cancelOrder(orderId: string): Promise<{ success: boolean; error?: ApiError }> {
    return this.safeCall(async () => {
      return this.http.post<{ success: boolean }>(`/orders/${orderId}/cancel`);
    });
  }

  // ============================================================================
  // Refund Operations
  // ============================================================================

  /**
   * Process a refund for a payment
   *
   * @param paymentId - The original payment ID
   * @param amount - Amount to refund (partial refund supported)
   * @param reason - Reason for refund
   * @returns Refund details including refund ID
   *
   * @example
   * ```typescript
   * const refund = await payment.refund('payment-123', 50000, 'Customer request');
   * if (refund) {
   *   console.log('Refund ID:', refund.refundId);
   *   console.log('Status:', refund.status);
   * }
   * ```
   */
  async refund(
    paymentId: string,
    amount: number,
    reason: string
  ): Promise<RefundResponse | null> {
    // Validate input with Zod
    const parsed = RefundSchema.safeParse({ paymentId, amount, reason });
    if (!parsed.success) {
      return null;
    }

    const result = await this.safeCall<RefundResponse>(async () => {
      return this.http.post<RefundResponse>(`/payments/${paymentId}/refund`, {
        amount,
        reason,
      });
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Get refund details by refund ID
   *
   * @param refundId - The refund's unique identifier
   * @returns Refund details
   */
  async getRefund(refundId: string): Promise<RefundResponse | null> {
    const result = await this.safeCall<RefundResponse>(async () => {
      return this.http.get<RefundResponse>(`/refunds/${refundId}`);
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  // ============================================================================
  // Payment Methods
  // ============================================================================

  /**
   * Get user's saved payment methods
   *
   * @param userId - The user's unique identifier
   * @returns List of saved payment methods
   *
   * @example
   * ```typescript
   * const { methods } = await payment.getPaymentMethods('user-123');
   * for (const method of methods) {
   *   console.log(`${method.type}: ${method.name} (${method.last4})`);
   * }
   * ```
   */
  async getPaymentMethods(userId: string): Promise<PaymentMethodsResponse | null> {
    // Validate input with Zod
    const parsed = GetPaymentMethodsSchema.safeParse({ userId });
    if (!parsed.success) {
      return null;
    }

    const result = await this.safeCall<PaymentMethodsResponse>(async () => {
      return this.http.get<PaymentMethodsResponse>(`/users/${userId}/payment-methods`);
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Add a new payment method for a user
   *
   * @param userId - The user's unique identifier
   * @param methodDetails - Payment method details
   * @returns Created payment method
   */
  async addPaymentMethod(
    userId: string,
    methodDetails: {
      type: 'card' | 'upi' | 'wallet';
      token: string; // Encrypted token from payment processor
      isDefault?: boolean;
    }
  ): Promise<{
    success: boolean;
    method?: {
      id: string;
      type: string;
      name: string;
      last4?: string;
      isDefault: boolean;
    };
    error?: ApiError;
  }> {
    return this.safeCall(async () => {
      return this.http.post<{
        id: string;
        type: string;
        name: string;
        last4?: string;
        isDefault: boolean;
      }>(`/users/${userId}/payment-methods`, methodDetails);
    });
  }

  /**
   * Remove a payment method
   *
   * @param userId - The user's unique identifier
   * @param methodId - Payment method ID to remove
   * @returns Success status
   */
  async removePaymentMethod(
    userId: string,
    methodId: string
  ): Promise<{ success: boolean; error?: ApiError }> {
    return this.safeCall(async () => {
      return this.http.delete<void>(`/users/${userId}/payment-methods/${methodId}`);
    });
  }

  /**
   * Set a payment method as default
   *
   * @param userId - The user's unique identifier
   * @param methodId - Payment method ID to set as default
   * @returns Success status
   */
  async setDefaultPaymentMethod(
    userId: string,
    methodId: string
  ): Promise<{ success: boolean; error?: ApiError }> {
    return this.safeCall(async () => {
      return this.http.patch<void>(`/users/${userId}/payment-methods/${methodId}`, {
        isDefault: true,
      });
    });
  }

  // ============================================================================
  // QR Code Operations
  // ============================================================================

  /**
   * Generate a QR code for payment
   *
   * @param orderId - Associated order ID
   * @param amount - Amount to collect via QR
   * @returns QR code data and expiration info
   *
   * @example
   * ```typescript
   * const { qrCode, qrId, expiresAt } = await payment.generateQRCode('order-123', 50000);
   * // qrCode can be displayed as image or used to create QR
   * ```
   */
  async generateQRCode(orderId: string, amount: number): Promise<QRCodeResponse | null> {
    // Validate input with Zod
    const parsed = GenerateQRCodeSchema.safeParse({ orderId, amount });
    if (!parsed.success) {
      return null;
    }

    const result = await this.safeCall<QRCodeResponse>(async () => {
      return this.http.post<QRCodeResponse>('/qr/generate', { orderId, amount });
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Verify if a QR code payment has been completed
   *
   * @param qrId - QR code identifier
   * @returns Payment status and details
   *
   * @example
   * ```typescript
   * const status = await payment.verifyQRPayment('qr-123');
   * if (status.paid) {
   *   console.log('Payment received:', status.amount);
   * }
   * ```
   */
  async verifyQRPayment(qrId: string): Promise<VerifyQRPaymentResponse | null> {
    // Validate input with Zod
    const parsed = VerifyQRPaymentSchema.safeParse({ qrId });
    if (!parsed.success) {
      return null;
    }

    const result = await this.safeCall<VerifyQRPaymentResponse>(async () => {
      return this.http.get<VerifyQRPaymentResponse>(`/qr/${qrId}/status`);
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Invalidate an unused QR code
   *
   * @param qrId - QR code identifier
   * @returns Success status
   */
  async invalidateQRCode(qrId: string): Promise<{ success: boolean; error?: ApiError }> {
    return this.safeCall(async () => {
      return this.http.post<void>(`/qr/${qrId}/invalidate`);
    });
  }

  // ============================================================================
  // Webhook Support
  // ============================================================================

  /**
   * Register a webhook endpoint for payment events
   *
   * @param webhookUrl - URL to receive webhook events
   * @param events - List of events to subscribe to
   * @returns Webhook registration details
   */
  async registerWebhook(
    webhookUrl: string,
    events: Array<'payment.success' | 'payment.failed' | 'refund.processed' | 'order.expired'>
  ): Promise<{
    success: boolean;
    webhookId?: string;
    secret?: string;
    error?: ApiError;
  }> {
    return this.safeCall(async () => {
      return this.http.post<{ webhookId: string; secret: string }>('/webhooks', {
        url: webhookUrl,
        events,
      });
    });
  }

  /**
   * Verify webhook signature
   *
   * @param payload - Raw request body
   * @param signature - X-Razorpay-Signature header
   * @param secret - Webhook secret
   * @returns Whether signature is valid
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    // This should use crypto.createHmac in production
    // For now, we'll implement a basic check
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return signature === expectedSignature;
  }

  // ============================================================================
  // Health Check
  // ============================================================================

  /**
   * Check if the payment service is healthy
   *
   * @returns Health status
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number }> {
    const start = Date.now();
    try {
      const response = await this.http.get<{ status: string }>('/health');
      return {
        healthy: response.success,
        latency: Date.now() - start,
      };
    } catch {
      return { healthy: false };
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

let paymentInstance: PaymentConnector | null = null;

/**
 * Get or create a singleton PaymentConnector instance
 *
 * @param config - Optional configuration override
 * @returns PaymentConnector instance
 */
export function createPaymentConnector(config?: PaymentConnectorConfig): PaymentConnector {
  if (!paymentInstance) {
    paymentInstance = new PaymentConnector(config);
  } else if (config) {
    paymentInstance = new PaymentConnector(config);
  }
  return paymentInstance;
}

/**
 * Reset the singleton instance (mainly for testing)
 */
export function resetPaymentConnector(): void {
  paymentInstance = null;
}

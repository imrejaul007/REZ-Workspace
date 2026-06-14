/**
 * RABTUL Payment Service Client
 * Port: 4001
 *
 * Handles payments, refunds, and payment gateway integrations.
 */

import axios, { AxiosInstance } from 'axios';

export type PaymentGateway = 'razorpay' | 'stripe' | 'razorpay_qr';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  gateway: PaymentGateway;
  orderId: string;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  reason?: string;
  createdAt: Date;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'wallet' | 'netbanking' | 'qr';
  last4?: string;
  bank?: string;
  wallet?: string;
  isDefault: boolean;
}

export class RabtulPaymentClient {
  private client: AxiosInstance;

  constructor(
    private readonly baseUrl: string = process.env.RABTUL_PAYMENT_URL || 'http://localhost:4001',
    private readonly apiKey: string = process.env.RABTUL_PAYMENT_API_KEY || '',
  ) {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[RabtulPayment] API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  /**
   * Create a payment intent
   */
  async createIntent(
    orderId: string,
    amount: number,
    gateway: PaymentGateway = 'razorpay',
    metadata?: Record<string, string>
  ): Promise<PaymentIntent> {
    const response = await this.client.post<PaymentIntent>('/payments/intent', {
      orderId,
      amount,
      gateway,
      metadata,
    });
    return response.data;
  }

  /**
   * Confirm a payment
   */
  async confirmPayment(
    paymentId: string,
    gateway: PaymentGateway,
    gatewayResponse: Record<string, string>
  ): Promise<PaymentIntent> {
    const response = await this.client.post<PaymentIntent>(`/payments/${paymentId}/confirm`, {
      gateway,
      gatewayResponse,
    });
    return response.data;
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string): Promise<PaymentIntent> {
    const response = await this.client.get<PaymentIntent>(`/payments/${paymentId}`);
    return response.data;
  }

  /**
   * Get payments for an order
   */
  async getPaymentsByOrder(orderId: string): Promise<PaymentIntent[]> {
    const response = await this.client.get<PaymentIntent[]>(`/payments/order/${orderId}`);
    return response.data;
  }

  /**
   * Create a refund
   */
  async createRefund(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<Refund> {
    const response = await this.client.post<Refund>(`/payments/${paymentId}/refund`, {
      amount,
      reason,
    });
    return response.data;
  }

  /**
   * Get refund status
   */
  async getRefund(refundId: string): Promise<Refund> {
    const response = await this.client.get<Refund>(`/refunds/${refundId}`);
    return response.data;
  }

  /**
   * Get user's payment methods
   */
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    const response = await this.client.get<PaymentMethod[]>(`/users/${userId}/payment-methods`);
    return response.data;
  }

  /**
   * Add a payment method
   */
  async addPaymentMethod(
    userId: string,
    type: PaymentMethod['type'],
    gatewayToken: string
  ): Promise<PaymentMethod> {
    const response = await this.client.post<PaymentMethod>(`/users/${userId}/payment-methods`, {
      type,
      gatewayToken,
    });
    return response.data;
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(userId: string, methodId: string): Promise<void> {
    await this.client.patch(`/users/${userId}/payment-methods/${methodId}`, {
      isDefault: true,
    });
  }

  /**
   * Delete a payment method
   */
  async deletePaymentMethod(userId: string, methodId: string): Promise<void> {
    await this.client.delete(`/users/${userId}/payment-methods/${methodId}`);
  }

  /**
   * Generate QR code for payment
   */
  async generateQRCode(
    orderId: string,
    amount: number
  ): Promise<{ qrCode: string; qrId: string; expiresAt: Date }> {
    const response = await this.client.post('/payments/qr/generate', {
      orderId,
      amount,
    });
    return response.data;
  }

  /**
   * Verify QR payment status
   */
  async verifyQRPayment(qrId: string): Promise<{
    paid: boolean;
    amount?: number;
    paidAt?: Date;
  }> {
    const response = await this.client.get(`/payments/qr/${qrId}/status`);
    return response.data;
  }
}

// Singleton instance
let paymentClientInstance: RabtulPaymentClient | null = null;

export function getRabtulPaymentClient(): RabtulPaymentClient {
  if (!paymentClientInstance) {
    paymentClientInstance = new RabtulPaymentClient();
  }
  return paymentClientInstance;
}

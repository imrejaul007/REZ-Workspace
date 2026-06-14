/**
 * Payment Service Client for Analytics V2
 * Provides typed access to the payment service API
 */

import axios, { AxiosInstance } from 'axios';

// Configuration
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3002';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

// Types
export interface Payment {
  _id: string;
  paymentId: string;
  orderId: string;
  merchantId: string;
  storeId: string;
  customerId: string;
  amount: number;
  currency: string;
  method: 'cash' | 'card' | 'wallet' | 'bnpl' | 'bank_transfer';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
  provider?: string;
  providerReference?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface PaymentQueryParams {
  merchantId?: string;
  storeId?: string;
  orderId?: string;
  customerId?: string;
  status?: string;
  method?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface PaymentAnalytics {
  totalTransactions: number;
  totalVolume: number;
  successfulTransactions: number;
  failedTransactions: number;
  refundedTransactions: number;
  averageTransactionValue: number;
  byMethod: Record<string, { count: number; volume: number }>;
  byStatus: Record<string, number>;
  byMerchant: Record<string, { count: number; volume: number }>;
}

export class PaymentClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: PAYMENT_SERVICE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': INTERNAL_SERVICE_TOKEN,
        'x-internal-service': 'rez-analytics-v2',
      },
    });
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string): Promise<Payment> {
    const response = await this.client.get(`/payments/${paymentId}`);
    return response.data;
  }

  /**
   * Get payment by order ID
   */
  async getPaymentByOrder(orderId: string): Promise<Payment> {
    const response = await this.client.get(`/payments/order/${orderId}`);
    return response.data;
  }

  /**
   * Get payments with filters
   */
  async getPayments(params: PaymentQueryParams): Promise<Payment[]> {
    const response = await this.client.get('/payments', { params });
    return response.data.payments || response.data;
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(
    merchantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PaymentAnalytics> {
    const response = await this.client.get('/analytics/summary', {
      params: {
        merchantId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });

    return response.data;
  }

  /**
   * Get payment breakdown by method
   */
  async getPaymentMethodBreakdown(
    merchantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, { count: number; volume: number; percentage: number }>> {
    const response = await this.client.get('/analytics/methods', {
      params: {
        merchantId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });

    return response.data;
  }

  /**
   * Get refund data for a period
   */
  async getRefundData(
    merchantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRefunds: number;
    totalRefundAmount: number;
    refundRate: number;
    refunds: Payment[];
  }> {
    const refunds = await this.getPayments({
      merchantId,
      status: 'refunded',
      startDate,
      endDate,
    });

    const totalRefundAmount = refunds.reduce((sum, p) => sum + p.amount, 0);

    // Get total transactions for rate calculation
    const allPayments = await this.getPayments({
      merchantId,
      startDate,
      endDate,
    });

    return {
      totalRefunds: refunds.length,
      totalRefundAmount,
      refundRate: allPayments.length > 0 ? refunds.length / allPayments.length : 0,
      refunds,
    };
  }

  /**
   * Get BNPL (Buy Now Pay Later) analytics
   */
  async getBNPLAnalytics(
    merchantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalBNPLTransactions: number;
    totalBNPLVolume: number;
    byProvider: Record<string, { count: number; volume: number }>;
    defaultRate?: number;
  }> {
    const bnplPayments = await this.getPayments({
      merchantId,
      method: 'bnpl',
      startDate,
      endDate,
    });

    const byProvider: Record<string, { count: number; volume: number }> = {};

    for (const payment of bnplPayments) {
      const provider = payment.provider || 'unknown';
      if (!byProvider[provider]) {
        byProvider[provider] = { count: 0, volume: 0 };
      }
      byProvider[provider].count += 1;
      byProvider[provider].volume += payment.amount;
    }

    return {
      totalBNPLTransactions: bnplPayments.length,
      totalBNPLVolume: bnplPayments.reduce((sum, p) => sum + p.amount, 0),
      byProvider,
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'ok' || response.data.status === 'healthy';
    } catch {
      return false;
    }
  }
}

// Singleton instance
let paymentClient: PaymentClient | null = null;

export function getPaymentClient(): PaymentClient {
  if (!paymentClient) {
    paymentClient = new PaymentClient();
  }
  return paymentClient;
}

export default PaymentClient;

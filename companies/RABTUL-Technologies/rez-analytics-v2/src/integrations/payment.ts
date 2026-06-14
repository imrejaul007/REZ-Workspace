/**
 * Payment Service Integration for Analytics V2
 * Manages connection to the payment service
 */

import { getPaymentClient, PaymentClient } from '../clients/paymentClient';

export interface PaymentIntegrationConfig {
  serviceUrl: string;
  timeout: number;
  retries: number;
}

const defaultConfig: PaymentIntegrationConfig = {
  serviceUrl: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3002',
  timeout: 10000,
  retries: 3,
};

/**
 * Payment Integration class
 * Provides high-level integration with the payment service
 */
export class PaymentIntegration {
  private client: PaymentClient;
  private config: PaymentIntegrationConfig;

  constructor(config: Partial<PaymentIntegrationConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.client = getPaymentClient();
  }

  /**
   * Get the payment client instance
   */
  getClient(): PaymentClient {
    return this.client;
  }

  /**
   * Health check for the payment service
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    const start = Date.now();
    try {
      const healthy = await this.client.healthCheck();
      return {
        healthy,
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sync payment data for analytics
   */
  async syncPayments(
    merchantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    synced: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      const payments = await this.client.getPayments({
        merchantId,
        startDate,
        endDate,
        limit: 1000,
      });

      for (const payment of payments) {
        try {
          // Process payment for analytics
          // This is where you'd integrate with your analytics pipeline
          synced++;
        } catch (error) {
          errors.push(`Payment ${payment._id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { synced, errors };
  }

  /**
   * Get payment metrics for dashboard
   */
  async getPaymentMetrics(merchantId: string): Promise<{
    totalTransactions: number;
    totalVolume: number;
    successRate: number;
    refundRate: number;
    byMethod: Record<string, number>;
  }> {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    try {
      const analytics = await this.client.getPaymentAnalytics(merchantId, startOfDay, now);

      return {
        totalTransactions: analytics.totalTransactions,
        totalVolume: analytics.totalVolume,
        successRate: analytics.totalTransactions > 0
          ? analytics.successfulTransactions / analytics.totalTransactions
          : 0,
        refundRate: analytics.totalTransactions > 0
          ? analytics.refundedTransactions / analytics.totalTransactions
          : 0,
        byMethod: Object.fromEntries(
          Object.entries(analytics.byMethod).map(([method, data]) => [method, data.volume])
        ),
      };
    } catch (error) {
      console.error('[PaymentIntegration] Error getting metrics:', error);
      return {
        totalTransactions: 0,
        totalVolume: 0,
        successRate: 0,
        refundRate: 0,
        byMethod: {},
      };
    }
  }

  /**
   * Get BNPL analytics
   */
  async getBNPLMetrics(
    merchantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalBNPL: number;
    volume: number;
    byProvider: Record<string, number>;
  }> {
    try {
      const analytics = await this.client.getBNPLAnalytics(merchantId, startDate, endDate);

      return {
        totalBNPL: analytics.totalBNPLTransactions,
        volume: analytics.totalBNPLVolume,
        byProvider: Object.fromEntries(
          Object.entries(analytics.byProvider).map(([provider, data]) => [provider, data.volume])
        ),
      };
    } catch (error) {
      console.error('[PaymentIntegration] Error getting BNPL metrics:', error);
      return {
        totalBNPL: 0,
        volume: 0,
        byProvider: {},
      };
    }
  }
}

// Singleton instance
let paymentIntegration: PaymentIntegration | null = null;

export function getPaymentIntegration(): PaymentIntegration {
  if (!paymentIntegration) {
    paymentIntegration = new PaymentIntegration();
  }
  return paymentIntegration;
}

export default PaymentIntegration;

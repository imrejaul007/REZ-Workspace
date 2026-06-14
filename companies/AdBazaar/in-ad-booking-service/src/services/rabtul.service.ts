/**
 * RABTUL payment service integration
 * Handles wallet and payment operations with RABTUL
 */

import axios, { AxiosInstance } from 'axios';
import config from '../config';
import logger from '../utils/logger';

export interface PaymentRequest {
  userId: string;
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface WalletBalanceResponse {
  success: boolean;
  balance?: number;
  error?: string;
}

export class RabtulPaymentService {
  private client: AxiosInstance;
  private walletUrl: string;

  constructor() {
    this.walletUrl = config.rabtul.walletUrl;
    this.client = axios.create({
      baseURL: this.walletUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Process a payment through RABTUL wallet
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await this.client.post('/api/wallet/pay', {
        userId: request.userId,
        amount: request.amount,
        currency: request.currency || 'INR',
        description: request.description || 'In-ad booking payment',
        metadata: {
          ...request.metadata,
          source: 'in-ad-booking-service',
        },
      });

      if (response.data.success) {
        logger.info('Payment processed', { transactionId: response.data.transactionId, amount: request.amount });
        return {
          success: true,
          transactionId: response.data.transactionId,
        };
      }

      return { success: false, error: response.data.error || 'Payment failed' };
    } catch (error) {
      logger.error('Payment error', { error: error instanceof Error ? error.message : 'Unknown' });
      return { success: false, error: 'Failed to process payment' };
    }
  }

  /**
   * Process a refund through RABTUL wallet
   */
  async processRefund(transactionId: string, amount: number): Promise<PaymentResponse> {
    try {
      const response = await this.client.post('/api/wallet/refund', {
        transactionId,
        amount,
        reason: 'Booking cancelled',
        metadata: {
          source: 'in-ad-booking-service',
        },
      });

      if (response.data.success) {
        logger.info('Refund processed', { transactionId, amount });
        return {
          success: true,
          transactionId: response.data.refundId,
        };
      }

      return { success: false, error: response.data.error || 'Refund failed' };
    } catch (error) {
      logger.error('Refund error', { error: error instanceof Error ? error.message : 'Unknown' });
      return { success: false, error: 'Failed to process refund' };
    }
  }

  /**
   * Get user wallet balance
   */
  async getBalance(userId: string): Promise<WalletBalanceResponse> {
    try {
      const response = await this.client.get(`/api/wallet/balance/${userId}`);

      if (response.data.success) {
        return {
          success: true,
          balance: response.data.balance,
        };
      }

      return { success: false, error: response.data.error || 'Failed to get balance' };
    } catch (error) {
      logger.error('Get balance error', { error: error instanceof Error ? error.message : 'Unknown' });
      return { success: false, error: 'Failed to get balance' };
    }
  }

  /**
   * Check if user has sufficient balance
   */
  async hasSufficientBalance(userId: string, amount: number): Promise<boolean> {
    const result = await this.getBalance(userId);
    if (!result.success || result.balance === undefined) {
      return false;
    }
    return result.balance >= amount;
  }

  /**
   * Verify transaction status
   */
  async verifyTransaction(transactionId: string): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      const response = await this.client.get(`/api/wallet/transaction/${transactionId}`);

      if (response.data.success) {
        return {
          success: true,
          status: response.data.status,
        };
      }

      return { success: false, error: response.data.error || 'Transaction not found' };
    } catch (error) {
      logger.error('Verify transaction error', { error: error instanceof Error ? error.message : 'Unknown' });
      return { success: false, error: 'Failed to verify transaction' };
    }
  }
}

export const rabtulPaymentService = new RabtulPaymentService();
export default rabtulPaymentService;
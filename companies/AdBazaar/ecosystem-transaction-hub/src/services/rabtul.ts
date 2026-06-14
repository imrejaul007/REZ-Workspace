import axios, { AxiosInstance } from 'axios';
import config from '../config';
import { logger } from 'utils/logger.js';
import { externalApiCalls } from '../middleware/metrics';
import { PaymentMethod } from '../types';

interface WalletBalance {
  userId: string;
  balance: number;
  currency: string;
}

interface WalletDeductRequest {
  userId: string;
  amount: number;
  reference: string;
  description?: string;
}

interface WalletDeductResponse {
  success: boolean;
  transactionId?: string;
  newBalance?: number;
  error?: string;
}

interface PaymentInitRequest {
  amount: number;
  currency: string;
  userId: string;
  paymentMethod: PaymentMethod;
  metadata?: Record<string, unknown>;
}

interface PaymentInitResponse {
  success: boolean;
  paymentId?: string;
  paymentUrl?: string;
  checkoutToken?: string;
  error?: string;
}

interface PaymentVerifyResponse {
  success: boolean;
  paymentId?: string;
  status?: 'completed' | 'failed' | 'pending';
  error?: string;
}

class RabtulService {
  private walletClient: AxiosInstance;
  private paymentClient: AxiosInstance;

  constructor() {
    this.walletClient = axios.create({
      baseURL: config.rabtul.walletUrl,
      timeout: config.rabtul.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.paymentClient = axios.create({
      baseURL: config.rabtul.paymentUrl,
      timeout: config.rabtul.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getWalletBalance(userId: string): Promise<WalletBalance | null> {
    try {
      const response = await this.walletClient.get<WalletBalance>(`/api/wallet/${userId}/balance`);
      externalApiCalls.inc({ service: 'wallet', status: 'success' });
      return response.data;
    } catch (error) {
      externalApiCalls.inc({ service: 'wallet', status: 'error' });
      logger.error('Failed to get wallet balance', { userId, error });
      return null;
    }
  }

  async deductFromWallet(request: WalletDeductRequest): Promise<WalletDeductResponse> {
    try {
      const response = await this.walletClient.post<WalletDeductResponse>(
        `/api/wallet/${request.userId}/deduct`,
        request
      );
      externalApiCalls.inc({ service: 'wallet', status: 'success' });
      return response.data;
    } catch (error) {
      externalApiCalls.inc({ service: 'wallet', status: 'error' });
      logger.error('Failed to deduct from wallet', { userId: request.userId, error });

      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data?.error || 'Wallet deduction failed',
        };
      }

      return {
        success: false,
        error: 'Wallet service unavailable',
      };
    }
  }

  async refundToWallet(userId: string, amount: number, reference: string): Promise<WalletDeductResponse> {
    try {
      const response = await this.walletClient.post<WalletDeductResponse>(
        `/api/wallet/${userId}/refund`,
        { amount, reference }
      );
      externalApiCalls.inc({ service: 'wallet', status: 'success' });
      return response.data;
    } catch (error) {
      externalApiCalls.inc({ service: 'wallet', status: 'error' });
      logger.error('Failed to refund to wallet', { userId, error });

      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data?.error || 'Wallet refund failed',
        };
      }

      return {
        success: false,
        error: 'Wallet service unavailable',
      };
    }
  }

  async initiatePayment(request: PaymentInitRequest): Promise<PaymentInitResponse> {
    try {
      const response = await this.paymentClient.post<PaymentInitResponse>(
        '/api/payment/initiate',
        request
      );
      externalApiCalls.inc({ service: 'payment', status: 'success' });
      return response.data;
    } catch (error) {
      externalApiCalls.inc({ service: 'payment', status: 'error' });
      logger.error('Failed to initiate payment', { userId: request.userId, error });

      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data?.error || 'Payment initiation failed',
        };
      }

      return {
        success: false,
        error: 'Payment service unavailable',
      };
    }
  }

  async verifyPayment(paymentId: string): Promise<PaymentVerifyResponse> {
    try {
      const response = await this.paymentClient.get<PaymentVerifyResponse>(
        `/api/payment/${paymentId}/verify`
      );
      externalApiCalls.inc({ service: 'payment', status: 'success' });
      return response.data;
    } catch (error) {
      externalApiCalls.inc({ service: 'payment', status: 'error' });
      logger.error('Failed to verify payment', { paymentId, error });

      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data?.error || 'Payment verification failed',
        };
      }

      return {
        success: false,
        error: 'Payment service unavailable',
      };
    }
  }

  async processRefund(paymentId: string, amount: number): Promise<PaymentVerifyResponse> {
    try {
      const response = await this.paymentClient.post<PaymentVerifyResponse>(
        `/api/payment/${paymentId}/refund`,
        { amount }
      );
      externalApiCalls.inc({ service: 'payment', status: 'success' });
      return response.data;
    } catch (error) {
      externalApiCalls.inc({ service: 'payment', status: 'error' });
      logger.error('Failed to process refund', { paymentId, error });

      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data?.error || 'Refund processing failed',
        };
      }

      return {
        success: false,
        error: 'Payment service unavailable',
      };
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.walletClient.get('/health');
      await this.paymentClient.get('/health');
      return true;
    } catch {
      return false;
    }
  }
}

export const rabtulService = new RabtulService();
export default rabtulService;
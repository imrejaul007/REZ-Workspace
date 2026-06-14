import axios, { AxiosInstance } from 'axios';
import { validateEnv } from '../config/env';
import { logger } from '../utils/logger';

export interface WalletCreditResult {
  success: boolean;
  transactionId?: string;
  newBalance?: number;
  error?: string;
}

export interface WalletDebitResult {
  success: boolean;
  transactionId?: string;
  newBalance?: number;
  error?: string;
}

export interface WalletBalanceResult {
  success: boolean;
  balance?: number;
  coinType?: string;
  error?: string;
}

export class WalletIntegration {
  private client: AxiosInstance;
  private static instance: WalletIntegration;

  private constructor() {
    const env = validateEnv();
    this.client = axios.create({
      baseURL: env.WALLET_SERVICE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add internal auth header
    this.client.interceptors.request.use((config) => {
      const env = validateEnv();
      config.headers['X-Internal-Token'] = env.INTERNAL_SERVICE_TOKEN || '';
      config.headers['X-Internal-Service'] = 'rez-referral-os';
      return config;
    });
  }

  static getInstance(): WalletIntegration {
    if (!WalletIntegration.instance) {
      WalletIntegration.instance = new WalletIntegration();
    }
    return WalletIntegration.instance;
  }

  /**
   * Credit coins to a user's wallet
   */
  async creditCoins(
    userId: string,
    amount: number,
    coinType: string = 'referral',
    source: string = 'referral',
    idempotencyKey?: string
  ): Promise<WalletCreditResult> {
    try {
      const response = await this.client.post('/api/wallet/credit', {
        userId,
        amount,
        coinType,
        source,
        metadata: {
          service: 'rez-referral-os',
          creditedAt: new Date().toISOString(),
        },
        idempotencyKey,
      });

      logger.info('[WalletIntegration] Credit successful:', {
        userId,
        amount,
        transactionId: response.data.transactionId,
      });

      return {
        success: true,
        transactionId: response.data.transactionId,
        newBalance: response.data.newBalance,
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string }; status?: number }; message?: string };
      logger.error('[WalletIntegration] Credit failed:', {
        userId,
        amount,
        error: err.response?.data?.message || err.message,
      });

      return {
        success: false,
        error: err.response?.data?.message || 'Failed to credit wallet',
      };
    }
  }

  /**
   * Debit coins from a user's wallet (for payouts)
   */
  async debitCoins(
    userId: string,
    amount: number,
    coinType: string = 'referral',
    source: string = 'payout',
    idempotencyKey?: string
  ): Promise<WalletDebitResult> {
    try {
      const response = await this.client.post('/api/wallet/debit', {
        userId,
        amount,
        coinType,
        source,
        metadata: {
          service: 'rez-referral-os',
          debitedAt: new Date().toISOString(),
        },
        idempotencyKey,
      });

      logger.info('[WalletIntegration] Debit successful:', {
        userId,
        amount,
        transactionId: response.data.transactionId,
      });

      return {
        success: true,
        transactionId: response.data.transactionId,
        newBalance: response.data.newBalance,
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string }; status?: number }; message?: string };
      logger.error('[WalletIntegration] Debit failed:', {
        userId,
        amount,
        error: err.response?.data?.message || err.message,
      });

      return {
        success: false,
        error: err.response?.data?.message || 'Failed to debit wallet',
      };
    }
  }

  /**
   * Get user's wallet balance
   */
  async getBalance(userId: string, coinType: string = 'referral'): Promise<WalletBalanceResult> {
    try {
      const response = await this.client.get(`/api/wallet/balance/${userId}`, {
        params: { coinType },
      });

      return {
        success: true,
        balance: response.data.balance,
        coinType: response.data.coinType,
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      logger.error('[WalletIntegration] Get balance failed:', {
        userId,
        error: err.response?.data?.message || err.message,
      });

      return {
        success: false,
        error: err.response?.data?.message || 'Failed to get balance',
      };
    }
  }

  /**
   * Transfer coins between users
   */
  async transferCoins(
    fromUserId: string,
    toUserId: string,
    amount: number,
    coinType: string = 'referral',
    source: string = 'referral_bonus'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.client.post('/api/wallet/transfer', {
        fromUserId,
        toUserId,
        amount,
        coinType,
        source,
        metadata: {
          service: 'rez-referral-os',
          transferredAt: new Date().toISOString(),
        },
      });

      logger.info('[WalletIntegration] Transfer successful:', {
        fromUserId,
        toUserId,
        amount,
      });

      return { success: true };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      logger.error('[WalletIntegration] Transfer failed:', {
        fromUserId,
        toUserId,
        amount,
        error: err.response?.data?.message || err.message,
      });

      return {
        success: false,
        error: err.response?.data?.message || 'Failed to transfer',
      };
    }
  }

  /**
   * Check if user has sufficient balance
   */
  async hasBalance(userId: string, amount: number, coinType: string = 'referral'): Promise<boolean> {
    const result = await this.getBalance(userId, coinType);
    return result.success && (result.balance || 0) >= amount;
  }
}

// Singleton export
export const walletIntegration = WalletIntegration.getInstance();

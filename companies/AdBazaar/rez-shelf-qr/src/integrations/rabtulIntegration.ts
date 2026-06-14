/**
 * RABTUL Integration for Shelf QR
 *
 * Provides integration with RABTUL services:
 * - Auth Service (4002): User authentication
 * - Payment Service (4001): Payment processing
 * - Wallet Service (4004): Coin management
 * - Notification Service (4011): Push/email/SMS
 */

import axios, { AxiosInstance } from 'axios';

// ============================================================================
// Configuration
// ============================================================================

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4002';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:4001';
const WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL || 'http://localhost:4004';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

// ============================================================================
// Types
// ============================================================================

export interface RABTULUser {
  userId: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface CoinTransaction {
  userId: string;
  amount: number;
  type: 'credit' | 'debit';
  source: string;
  reference: string;
}

export interface NotificationPayload {
  userId: string;
  type: 'push' | 'email' | 'sms';
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

// ============================================================================
// RABTUL Integration Client
// ============================================================================

class RABTULIntegration {
  private authClient: AxiosInstance;
  private paymentClient: AxiosInstance;
  private walletClient: AxiosInstance;
  private notificationClient: AxiosInstance;

  constructor() {
    const headers = {
      'Content-Type': 'application/json',
      'X-Internal-Token': INTERNAL_TOKEN || '',
    };

    this.authClient = axios.create({ baseURL: AUTH_SERVICE_URL, timeout: 5000, headers });
    this.paymentClient = axios.create({ baseURL: PAYMENT_SERVICE_URL, timeout: 10000, headers });
    this.walletClient = axios.create({ baseURL: WALLET_SERVICE_URL, timeout: 5000, headers });
    this.notificationClient = axios.create({ baseURL: NOTIFICATION_SERVICE_URL, timeout: 5000, headers });
  }

  // ============================================
  // Authentication
  // ============================================

  /**
   * Verify user token
   */
  async verifyToken(token: string): Promise<{ valid: boolean; user?: RABTULUser }> {
    try {
      const response = await this.authClient.post<{ valid: boolean; user?: RABTULUser }>(
        '/api/auth/verify',
        { token }
      );
      return response.data;
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<RABTULUser | null> {
    try {
      const response = await this.authClient.get<RABTULUser>(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  // ============================================
  // Wallet / Coins
  // ============================================

  /**
   * Credit coins to user
   */
  async creditCoins(transaction: CoinTransaction): Promise<{ success: boolean; balance?: number }> {
    try {
      const response = await this.walletClient.post<{ success: boolean; balance?: number }>(
        '/api/wallet/credit',
        {
          userId: transaction.userId,
          amount: transaction.amount,
          type: transaction.type,
          source: transaction.source,
          reference: transaction.reference,
        }
      );
      return response.data;
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * Get user wallet balance
   */
  async getBalance(userId: string): Promise<number | null> {
    try {
      const response = await this.walletClient.get<{ balance: number }>(
        `/api/wallet/${userId}/balance`
      );
      return response.data.balance;
    } catch (error) {
      return null;
    }
  }

  /**
   * Debit coins from user
   */
  async debitCoins(transaction: CoinTransaction): Promise<{ success: boolean; balance?: number }> {
    try {
      const response = await this.walletClient.post<{ success: boolean; balance?: number }>(
        '/api/wallet/debit',
        {
          userId: transaction.userId,
          amount: transaction.amount,
          type: transaction.type,
          source: transaction.source,
          reference: transaction.reference,
        }
      );
      return response.data;
    } catch (error) {
      return { success: false };
    }
  }

  // ============================================
  // Notifications
  // ============================================

  /**
   * Send notification to user
   */
  async sendNotification(payload: NotificationPayload): Promise<{ success: boolean }> {
    try {
      await this.notificationClient.post('/api/notifications/send', payload);
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  // ============================================
  // QR-specific Features
  // ============================================

  /**
   * Reward user for scanning QR
   */
  async rewardQRscan(userId: string, qrId: string, merchantId: string): Promise<{
    success: boolean;
    coinsEarned: number;
    newBalance: number;
  }> {
    const coinsEarned = 5; // 5 coins per scan

    const creditResult = await this.creditCoins({
      userId,
      amount: coinsEarned,
      type: 'credit',
      source: 'qr_scan',
      reference: qrId,
    });

    if (creditResult.success) {
      await this.sendNotification({
        userId,
        type: 'push',
        title: 'Coins Earned! 🪙',
        message: `You earned ${coinsEarned} coins for scanning this QR!`,
        data: { qrId, merchantId },
      });

      return {
        success: true,
        coinsEarned,
        newBalance: creditResult.balance || 0,
      };
    }

    return { success: false, coinsEarned: 0, newBalance: 0 };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const rabtul = new RABTULIntegration();
export default rabtul;

/**
 * REZ Revenue AI - RABTUL Services Integration
 *
 * Connects REZ Revenue AI to RABTUL Core Services
 * - Auth Service (4002) - Authentication
 * - Payment Service (4001) - Payments
 * - Wallet Service (4004) - Coins/Cashback
 * - Notification Service (4011) - Push/SMS/WhatsApp
 */

import axios from 'axios';
import { logger } from '../config/logger';

// ============================================================
// RABTUL SERVICE URLs
// ============================================================

const RABTUL_SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com',
  payment: process.env.PAYMENT_SERVICE_URL || 'https://rez-payment-service.onrender.com',
  wallet: process.env.WALLET_SERVICE_URL || 'https://rez-wallet-service-36vo.onrender.com',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'https://rez-notifications-service.onrender.com',
  order: process.env.ORDER_SERVICE_URL || 'https://rez-order-service-hz18.onrender.com',
  catalog: process.env.CATALOG_SERVICE_URL || 'https://rez-catalog-service.onrender.com',
};

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-internal-token';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface AuthUser {
  userId: string;
  email: string;
  phone?: string;
  name?: string;
  role: string;
}

export interface PaymentResult {
  paymentId: string;
  status: 'success' | 'pending' | 'failed';
  amount: number;
  method: string;
  transactionId: string;
}

export interface WalletCredit {
  success: boolean;
  transactionId: string;
  newBalance: number;
  coinsCredited: number;
}

export interface NotificationResult {
  success: boolean;
  notificationId: string;
  channel: 'push' | 'sms' | 'whatsapp' | 'email';
}

// ============================================================
// RABTUL INTEGRATION CLASS
// ============================================================

export class RABTULIntegration {
  private authToken: string | null = null;

  /**
   * Set internal auth token
   */
  setInternalToken(token: string): void {
    this.authToken = token;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Internal-Token': this.authToken || INTERNAL_TOKEN,
    };
  }

  // ============================================================
  // AUTH SERVICE (4002)
  // ============================================================

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      const response = await axios.post(
        `${RABTUL_SERVICES.auth}/api/auth/verify`,
        { token },
        { headers: this.getHeaders(), timeout: 5000 }
      );

      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      logger.warn('[RABTUL Auth] Verification failed');
      return null;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<AuthUser | null> {
    try {
      const response = await axios.get(
        `${RABTUL_SERVICES.auth}/api/auth/user/${userId}`,
        { headers: this.getHeaders(), timeout: 5000 }
      );

      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      logger.warn('[RABTUL Auth] User lookup failed');
      return null;
    }
  }

  /**
   * Create service token
   */
  async createServiceToken(serviceName: string): Promise<string | null> {
    try {
      const response = await axios.post(
        `${RABTUL_SERVICES.auth}/api/auth/service-token`,
        { serviceName },
        { headers: this.getHeaders(), timeout: 5000 }
      );

      if (response.data.success) {
        return response.data.data.token;
      }
      return null;
    } catch (error) {
      logger.warn('[RABTUL Auth] Token creation failed');
      return null;
    }
  }

  // ============================================================
  // WALLET SERVICE (4004)
  // ============================================================

  /**
   * Credit cashback to user wallet
   */
  async creditCashback(params: {
    userId: string;
    amount: number;
    reason: string;
    merchantId?: string;
    orderId?: string;
  }): Promise<WalletCredit | null> {
    try {
      const response = await axios.post(
        `${RABTUL_SERVICES.wallet}/api/wallet/credit`,
        {
          userId: params.userId,
          amount: params.amount,
          type: 'cashback',
          reason: params.reason,
          metadata: {
            merchantId: params.merchantId,
            orderId: params.orderId,
            source: 'revenue_ai',
          },
        },
        { headers: this.getHeaders(), timeout: 10000 }
      );

      if (response.data.success) {
        return {
          success: true,
          transactionId: response.data.data.transactionId,
          newBalance: response.data.data.newBalance,
          coinsCredited: params.amount,
        };
      }
      return null;
    } catch (error) {
      logger.error('[RABTUL Wallet] Credit failed', error);
      return null;
    }
  }

  /**
   * Debit from user wallet
   */
  async debitWallet(params: {
    userId: string;
    amount: number;
    reason: string;
  }): Promise<{ success: boolean; transactionId?: string }> {
    try {
      const response = await axios.post(
        `${RABTUL_SERVICES.wallet}/api/wallet/debit`,
        {
          userId: params.userId,
          amount: params.amount,
          reason: params.reason,
        },
        { headers: this.getHeaders(), timeout: 10000 }
      );

      return {
        success: response.data.success,
        transactionId: response.data.data?.transactionId,
      };
    } catch (error) {
      logger.error('[RABTUL Wallet] Debit failed', error);
      return { success: false };
    }
  }

  /**
   * Get user wallet balance
   */
  async getBalance(userId: string): Promise<number> {
    try {
      const response = await axios.get(
        `${RABTUL_SERVICES.wallet}/api/wallet/balance/${userId}`,
        { headers: this.getHeaders(), timeout: 5000 }
      );

      if (response.data.success) {
        return response.data.data.balance || 0;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get transaction history
   */
  async getTransactions(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const response = await axios.get(
        `${RABTUL_SERVICES.wallet}/api/wallet/transactions/${userId}`,
        { params: { limit }, headers: this.getHeaders(), timeout: 5000 }
      );

      if (response.data.success) {
        return response.data.data.transactions || [];
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  // ============================================================
  // NOTIFICATION SERVICE (4011)
  // ============================================================

  /**
   * Send push notification
   */
  async sendPush(params: {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<NotificationResult> {
    try {
      const response = await axios.post(
        `${RABTUL_SERVICES.notification}/api/notifications/push`,
        {
          userId: params.userId,
          notification: {
            title: params.title,
            body: params.body,
            data: params.data,
          },
        },
        { headers: this.getHeaders(), timeout: 5000 }
      );

      return {
        success: response.data.success,
        notificationId: response.data.data?.notificationId || '',
        channel: 'push',
      };
    } catch (error) {
      logger.error('[RABTUL Notification] Push failed', error);
      return { success: false, notificationId: '', channel: 'push' };
    }
  }

  /**
   * Send SMS
   */
  async sendSMS(params: {
    phone: string;
    message: string;
  }): Promise<NotificationResult> {
    try {
      const response = await axios.post(
        `${RABTUL_SERVICES.notification}/api/notifications/sms`,
        {
          phone: params.phone,
          message: params.message,
        },
        { headers: this.getHeaders(), timeout: 5000 }
      );

      return {
        success: response.data.success,
        notificationId: response.data.data?.notificationId || '',
        channel: 'sms',
      };
    } catch (error) {
      logger.error('[RABTUL Notification] SMS failed', error);
      return { success: false, notificationId: '', channel: 'sms' };
    }
  }

  /**
   * Send WhatsApp message
   */
  async sendWhatsApp(params: {
    phone: string;
    template: string;
    variables?: Record<string, string>;
  }): Promise<NotificationResult> {
    try {
      const response = await axios.post(
        `${RABTUL_SERVICES.notification}/api/notifications/whatsapp`,
        {
          phone: params.phone,
          template: params.template,
          variables: params.variables,
        },
        { headers: this.getHeaders(), timeout: 5000 }
      );

      return {
        success: response.data.success,
        notificationId: response.data.data?.notificationId || '',
        channel: 'whatsapp',
      };
    } catch (error) {
      logger.error('[RABTUL Notification] WhatsApp failed', error);
      return { success: false, notificationId: '', channel: 'whatsapp' };
    }
  }

  /**
   * Send multi-channel notification
   */
  async sendMultiChannel(params: {
    userId: string;
    phone?: string;
    title: string;
    body: string;
    channels: ('push' | 'sms' | 'whatsapp')[];
    data?: Record<string, string>;
  }): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    for (const channel of params.channels) {
      if (channel === 'push') {
        results.push(await this.sendPush({
          userId: params.userId,
          title: params.title,
          body: params.body,
          data: params.data,
        }));
      } else if (channel === 'sms' && params.phone) {
        results.push(await this.sendSMS({
          phone: params.phone,
          message: params.body,
        }));
      } else if (channel === 'whatsapp' && params.phone) {
        results.push(await this.sendWhatsApp({
          phone: params.phone,
          template: 'notification',
          variables: { title: params.title, body: params.body },
        }));
      }
    }

    return results;
  }

  // ============================================================
  // PAYMENT SERVICE (4001)
  // ============================================================

  /**
   * Create payment order
   */
  async createPayment(params: {
    userId: string;
    amount: number;
    currency?: string;
    merchantId?: string;
    description?: string;
  }): Promise<{ success: boolean; paymentId?: string; checkoutUrl?: string }> {
    try {
      const response = await axios.post(
        `${RABTUL_SERVICES.payment}/api/payments/create`,
        {
          userId: params.userId,
          amount: params.amount,
          currency: params.currency || 'INR',
          merchantId: params.merchantId,
          description: params.description,
        },
        { headers: this.getHeaders(), timeout: 10000 }
      );

      if (response.data.success) {
        return {
          success: true,
          paymentId: response.data.data.paymentId,
          checkoutUrl: response.data.data.checkoutUrl,
        };
      }
      return { success: false };
    } catch (error) {
      logger.error('[RABTUL Payment] Create failed', error);
      return { success: false };
    }
  }

  /**
   * Verify payment
   */
  async verifyPayment(paymentId: string): Promise<PaymentResult | null> {
    try {
      const response = await axios.get(
        `${RABTUL_SERVICES.payment}/api/payments/${paymentId}/verify`,
        { headers: this.getHeaders(), timeout: 5000 }
      );

      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  /**
   * Execute cashback flow: Calculate → Credit → Notify
   */
  async executeCashbackFlow(params: {
    userId: string;
    phone?: string;
    cashbackAmount: number;
    reason: string;
    merchantId: string;
    orderId: string;
  }): Promise<{ success: boolean; transactionId?: string; notificationId?: string }> {
    // 1. Credit cashback
    const credit = await this.creditCashback({
      userId: params.userId,
      amount: params.cashbackAmount,
      reason: params.reason,
      merchantId: params.merchantId,
      orderId: params.orderId,
    });

    if (!credit || !credit.success) {
      return { success: false };
    }

    // 2. Send notification
    let notificationId = '';
    if (params.phone) {
      const notify = await this.sendSMS({
        phone: params.phone,
        message: `🎉 Cashback credited! ₹${params.cashbackAmount} added to your wallet for ${params.reason}. Transaction ID: ${credit.transactionId}`,
      });
      notificationId = notify.notificationId;
    }

    return {
      success: true,
      transactionId: credit.transactionId,
      notificationId,
    };
  }

  /**
   * Execute campaign notification flow
   */
  async executeCampaignFlow(params: {
    userIds: string[];
    campaignId: string;
    title: string;
    body: string;
    offer?: { type: string; value: number };
  }): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const userId of params.userIds) {
      try {
        await this.sendPush({
          userId,
          title: params.title,
          body: params.body,
          data: {
            campaignId: params.campaignId,
            offer: JSON.stringify(params.offer),
          },
        });
        sent++;
      } catch {
        failed++;
      }
    }

    return { sent, failed };
  }
}

// ============================================================
// SINGLETON EXPORT
// ============================================================

let instance: RABTULIntegration | null = null;

export function getRABTULIntegration(): RABTULIntegration {
  if (!instance) {
    instance = new RABTULIntegration();
  }
  return instance;
}

export default RABTULIntegration;

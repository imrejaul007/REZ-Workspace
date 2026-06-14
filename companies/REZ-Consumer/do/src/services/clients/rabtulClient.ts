/**
 * RABTUL Client for DO App
 *
 * Connect DO App to RABTUL (Auth, Wallet, Payment)
 */

import axios, { AxiosInstance } from 'axios';

const RABTUL_URL = process.env.RABTUL_URL || 'http://localhost:4002';

export class RABTULClient {
  private client: AxiosInstance;

  constructor(apiKey?: string) {
    this.client = axios.create({
      baseURL: RABTUL_URL,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    });
  }

  // =========================================================================
  // AUTH
  // =========================================================================

  async verifyToken(token: string) {
    try {
      const { data } = await this.client.post('/api/auth/verify', { token });
      return data;
    } catch (error) {
      console.error('RABTUL verifyToken error:', error);
      return null;
    }
  }

  async login(phone: string, otp?: string) {
    try {
      const { data } = await this.client.post('/api/auth/login', { phone, otp });
      return data;
    } catch (error) {
      console.error('RABTUL login error:', error);
      return null;
    }
  }

  async register(userData: {
    phone: string;
    name: string;
    email?: string;
  }) {
    try {
      const { data } = await this.client.post('/api/auth/register', userData);
      return data;
    } catch (error) {
      console.error('RABTUL register error:', error);
      return null;
    }
  }

  // =========================================================================
  // WALLET
  // =========================================================================

  async getBalance(userId: string) {
    try {
      const { data } = await this.client.get(`/api/wallet/${userId}/balance`);
      return data;
    } catch (error) {
      console.error('RABTUL getBalance error:', error);
      return null;
    }
  }

  async getTransactions(userId: string) {
    try {
      const { data } = await this.client.get(`/api/wallet/${userId}/transactions`);
      return data;
    } catch (error) {
      console.error('RABTUL getTransactions error:', error);
      return { transactions: [] };
    }
  }

  async pay(params: {
    from: string;
    to: string;
    amount: number;
    purpose?: string;
    remark?: string;
  }) {
    try {
      const { data } = await this.client.post('/api/wallet/pay', params);
      return data;
    } catch (error) {
      console.error('RABTUL pay error:', error);
      return null;
    }
  }

  async addMoney(userId: string, amount: number, source: 'upi' | 'card' | 'bank') {
    try {
      const { data } = await this.client.post('/api/wallet/add-money', {
        userId,
        amount,
        source,
      });
      return data;
    } catch (error) {
      console.error('RABTUL addMoney error:', error);
      return null;
    }
  }

  // =========================================================================
  // PAYMENTS
  // =========================================================================

  async initiatePayment(params: {
    userId: string;
    amount: number;
    provider: 'razorpay' | 'upi' | 'card';
    orderId?: string;
  }) {
    try {
      const { data } = await this.client.post('/api/payment/initiate', params);
      return data;
    } catch (error) {
      console.error('RABTUL initiatePayment error:', error);
      return null;
    }
  }

  async verifyPayment(paymentId: string) {
    try {
      const { data } = await this.client.post('/api/payment/verify', { paymentId });
      return data;
    } catch (error) {
      console.error('RABTUL verifyPayment error:', error);
      return null;
    }
  }

  // =========================================================================
  // COINS (REZ Coins)
  // =========================================================================

  async getCoins(userId: string) {
    try {
      const { data } = await this.client.get(`/api/coins/${userId}`);
      return data;
    } catch (error) {
      console.error('RABTUL getCoins error:', error);
      return null;
    }
  }

  async earnCoins(userId: string, amount: number, source: string) {
    try {
      const { data } = await this.client.post('/api/coins/earn', { userId, amount, source });
      return data;
    } catch (error) {
      console.error('RABTUL earnCoins error:', error);
      return null;
    }
  }

  async redeemCoins(userId: string, amount: number, item: string) {
    try {
      const { data } = await this.client.post('/api/coins/redeem', { userId, amount, item });
      return data;
    } catch (error) {
      console.error('RABTUL redeemCoins error:', error);
      return null;
    }
  }

  // =========================================================================
  // NOTIFICATIONS
  // =========================================================================

  async sendNotification(userId: string, notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
  }) {
    try {
      const { data } = await this.client.post('/api/notification/send', { userId, ...notification });
      return data;
    } catch (error) {
      console.error('RABTUL sendNotification error:', error);
      return null;
    }
  }

  // =========================================================================
  // DO APP SPECIFIC METHODS
  // =========================================================================

  async getDOAppDashboard(userId: string) {
    const [balance, coins, transactions] = await Promise.all([
      this.getBalance(userId),
      this.getCoins(userId),
      this.getTransactions(userId),
    ]);

    return {
      balance,
      coins,
      transactions,
      quickActions: {
        pay: true,
        addMoney: true,
        coins: true,
      },
    };
  }

  async processPayment(userId: string, amount: number, to: string) {
    // Pay via wallet
    const payResult = await this.pay({
      from: userId,
      to,
      amount,
      purpose: 'DO App Purchase',
    });

    if (payResult?.success) {
      // Send notification
      await this.sendNotification(userId, {
        title: 'Payment Successful',
        body: `₹${amount} sent to ${to}`,
      });
    }

    return payResult;
  }
}

// Export singleton
export const rabtulClient = new RABTULClient();

export default RABTULClient;
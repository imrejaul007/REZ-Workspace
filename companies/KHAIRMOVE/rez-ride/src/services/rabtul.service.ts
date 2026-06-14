/**
 * RABTUL Technologies Integration Service
 *
 * Shared infrastructure services for all ReZ products:
 * - Authentication
 * - Wallet
 * - Payments
 * - Notifications
 * - Profile
 * - Analytics
 */

import axios, { AxiosInstance } from 'axios';
import { Logger } from '@nestjs/common';
import { AppError } from '../common/exceptions';

export interface RABTULUser {
  id: string;
  phone: string;
  email?: string;
  name?: string;
  createdAt: Date;
}

export interface WalletBalance {
  balance: number;
  rideCredits: number;
  total: number;
  currency: string;
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  timestamp: Date;
  balanceAfter: number;
}

export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  channels?: ('push' | 'sms' | 'email' | 'whatsapp')[];
}

export class RABTULService {
  private readonly logger = new Logger('RABTULService');

  // RABTUL Service URLs
  private readonly AUTH_URL = process.env.REZ_AUTH_SERVICE_URL || 'http://localhost:4002';
  private readonly WALLET_URL = process.env.REZ_WALLET_SERVICE_URL || 'http://localhost:4004';
  private readonly PAYMENT_URL = process.env.REZ_PAYMENT_SERVICE_URL || 'http://localhost:4001';
  private readonly NOTIFY_URL = process.env.REZ_NOTIFICATIONS_URL || 'http://localhost:4011';
  private readonly PROFILE_URL = process.env.REZ_PROFILE_SERVICE_URL || 'http://localhost:4013';
  private readonly ANALYTICS_URL = process.env.REZ_ANALYTICS_URL || 'http://localhost:4016';

  private readonly INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      timeout: 10000,
      headers: {
        'X-Internal-Token': this.INTERNAL_TOKEN,
        'Content-Type': 'application/json',
      },
    });
  }

  // ===========================================
  // AUTHENTICATION (RABTUL :4002)
  // ===========================================

  /**
   * Verify user token with RABTUL auth
   */
  async verifyToken(token: string): Promise<RABTULUser | null> {
    try {
      const response = await this.http.post(`${this.AUTH_URL}/api/auth/verify-internal`, {
        token,
      });
      return response.data.user;
    } catch (error) {
      this.logger.warn(`Token verification failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Get user by phone
   */
  async getUserByPhone(phone: string): Promise<RABTULUser | null> {
    try {
      const response = await this.http.get(`${this.AUTH_URL}/api/users/phone/${phone}`);
      return response.data.user;
    } catch (error) {
      this.logger.warn(`User lookup failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Create or get user
   */
  async getOrCreateUser(phone: string, data?: Partial<RABTULUser>): Promise<RABTULUser> {
    try {
      const response = await this.http.post(`${this.AUTH_URL}/api/users`, {
        phone,
        ...data,
      });
      return response.data.user;
    } catch (error) {
      // User might exist, try to get
      const existing = await this.getUserByPhone(phone);
      if (existing) return existing;
      throw error;
    }
  }

  // ===========================================
  // WALLET (RABTUL :4004)
  // ===========================================

  /**
   * Get wallet balance
   */
  async getWalletBalance(userId: string): Promise<WalletBalance> {
    try {
      const response = await this.http.get(`${this.WALLET_URL}/api/wallet/${userId}`);
      return response.data;
    } catch (error) {
      this.logger.warn(`Wallet lookup failed: ${error.message}`);
      return { balance: 0, rideCredits: 0, total: 0, currency: 'INR' };
    }
  }

  /**
   * Debit wallet
   */
  async debitWallet(userId: string, amount: number, description: string): Promise<Transaction> {
    try {
      const response = await this.http.post(`${this.WALLET_URL}/api/wallet/debit`, {
        userId,
        amount,
        description,
      });
      return response.data.transaction;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Wallet debit failed: ${message}`);
      throw new AppError('Payment failed', 'PAYMENT_FAILED');
    }
  }

  /**
   * Credit wallet
   */
  async creditWallet(userId: string, amount: number, description: string, type: 'cashback' | 'refund' | 'recharge' = 'recharge'): Promise<Transaction> {
    try {
      const response = await this.http.post(`${this.WALLET_URL}/api/wallet/credit`, {
        userId,
        amount,
        description,
        type,
      });
      return response.data.transaction;
    } catch (error) {
      this.logger.error(`Wallet credit failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add cashback (special type)
   */
  async addCashback(userId: string, rideId: string, fare: number, percentage: number = 10): Promise<Transaction> {
    const cashbackAmount = Math.round(fare * (percentage / 100));
    return this.creditWallet(userId, cashbackAmount, `Cashback from ride ${rideId}`, 'cashback');
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(userId: string, limit: number = 20): Promise<Transaction[]> {
    try {
      const response = await this.http.get(`${this.WALLET_URL}/api/wallet/${userId}/transactions`, {
        params: { limit },
      });
      return response.data.transactions;
    } catch (error) {
      this.logger.warn(`Transaction history failed: ${error.message}`);
      return [];
    }
  }

  // ===========================================
  // PAYMENTS (RABTUL :4001)
  // ===========================================

  /**
   * Create payment order
   */
  async createPaymentOrder(userId: string, amount: number, purpose: string): Promise<{
    orderId: string;
    amount: number;
    status: string;
  }> {
    try {
      const response = await this.http.post(`${this.PAYMENT_URL}/api/orders`, {
        userId,
        amount,
        purpose,
        currency: 'INR',
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Payment order creation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify payment
   */
  async verifyPayment(orderId: string): Promise<boolean> {
    try {
      const response = await this.http.get(`${this.PAYMENT_URL}/api/orders/${orderId}/verify`);
      return response.data.verified;
    } catch (error) {
      this.logger.warn(`Payment verification failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Initiate refund
   */
  async initiateRefund(userId: string, amount: number, reason: string): Promise<{
    refundId: string;
    status: string;
  }> {
    try {
      const response = await this.http.post(`${this.PAYMENT_URL}/api/refunds`, {
        userId,
        amount,
        reason,
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Refund initiation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create virtual account for driver payout
   */
  async createDriverPayout(driverId: string, amount: number): Promise<{
    payoutId: string;
    status: string;
    transferId: string;
  }> {
    try {
      const response = await this.http.post(`${this.PAYMENT_URL}/api/payouts/driver`, {
        driverId,
        amount,
        method: 'razorpay',
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Driver payout failed: ${error.message}`);
      throw error;
    }
  }

  // ===========================================
  // NOTIFICATIONS (RABTUL :4011)
  // ===========================================

  /**
   * Send notification
   */
  async sendNotification(payload: NotificationPayload): Promise<void> {
    try {
      await this.http.post(`${this.NOTIFY_URL}/api/notifications/send`, payload);
    } catch (error) {
      this.logger.warn(`Notification send failed: ${error.message}`);
    }
  }

  /**
   * Send ride-related notifications
   */
  async notifyRideConfirmed(userId: string, driverName: string, eta: number): Promise<void> {
    await this.sendNotification({
      userId,
      title: 'Ride Confirmed!',
      body: `${driverName} will arrive in ${eta} minutes`,
      data: { type: 'ride_confirmed' },
      channels: ['push', 'sms'],
    });
  }

  async notifyDriverArrived(userId: string, driverName: string): Promise<void> {
    await this.sendNotification({
      userId,
      title: 'Driver Arrived',
      body: `${driverName} is waiting at pickup`,
      data: { type: 'driver_arrived' },
      channels: ['push'],
    });
  }

  async notifyRideStarted(userId: string, destination: string): Promise<void> {
    await this.sendNotification({
      userId,
      title: 'Ride Started',
      body: `Heading to ${destination}`,
      data: { type: 'ride_started' },
      channels: ['push'],
    });
  }

  async notifyRideCompleted(userId: string, fare: number, cashback: number): Promise<void> {
    await this.sendNotification({
      userId,
      title: 'Ride Completed',
      body: `₹${fare} charged. +₹${cashback} cashback!`,
      data: { type: 'ride_completed' },
      channels: ['push', 'sms'],
    });
  }

  async notifyNewRideRequest(driverId: string, pickup: string, fare: number): Promise<void> {
    await this.sendNotification({
      userId: driverId,
      title: 'New Ride Request!',
      body: `${pickup} - ₹${fare}`,
      data: { type: 'new_ride' },
      channels: ['push'],
    });
  }

  // ===========================================
  // PROFILE (RABTUL :4013)
  // ===========================================

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<any> {
    try {
      const response = await this.http.get(`${this.PROFILE_URL}/api/profiles/${userId}`);
      return response.data.profile;
    } catch (error) {
      this.logger.warn(`Profile lookup failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Update profile
   */
  async updateProfile(userId: string, data: Partial<{
    name: string;
    email: string;
    avatar: string;
  }>): Promise<void> {
    try {
      await this.http.patch(`${this.PROFILE_URL}/api/profiles/${userId}`, data);
    } catch (error) {
      this.logger.warn(`Profile update failed: ${error.message}`);
    }
  }

  // ===========================================
  // ANALYTICS (RABTUL :4016)
  // ===========================================

  /**
   * Track event
   */
  async trackEvent(event: {
    name: string;
    userId?: string;
    properties?: Record<string, any>;
  }): Promise<void> {
    try {
      await this.http.post(`${this.ANALYTICS_URL}/api/events`, {
        ...event,
        timestamp: new Date().toISOString(),
        source: 'rez-ride',
      });
    } catch (error) {
      this.logger.warn(`Analytics track failed: ${error.message}`);
    }
  }

  /**
   * Get analytics dashboard data
   */
  async getDashboardMetrics(): Promise<any> {
    try {
      const response = await this.http.get(`${this.ANALYTICS_URL}/api/dashboards/ride`);
      return response.data;
    } catch (error) {
      this.logger.warn(`Dashboard metrics failed: ${error.message}`);
      return null;
    }
  }
}

export const rabtulService = new RABTULService();

/**
 * RABTUL Integration Service
 * Connects RiderCircle to RABTUL Auth, Wallet, and Notifications
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../config/index';
import { logger } from '../utils/logger';

// RABTUL Service URLs
const RABTUL_SERVICES = {
  auth: process.env.REZ_AUTH_URL || 'http://localhost:4002',
  wallet: process.env.REZ_WALLET_URL || 'http://localhost:4004',
  notifications: process.env.REZ_NOTIFICATION_URL || 'http://localhost:4011',
};

export interface User {
  id: string;
  phone: string;
  email?: string;
  name?: string;
  avatar?: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface WalletBalance {
  coins: number;
  cash: number;
  total: number;
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  description: string;
  createdAt: Date;
}

export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  channel?: 'sos' | 'ride' | 'group' | 'event' | 'promo';
}

export class RABTULIntegration {
  private authClient: AxiosInstance;
  private walletClient: AxiosInstance;
  private notificationClient: AxiosInstance;

  constructor() {
    this.authClient = axios.create({
      baseURL: RABTUL_SERVICES.auth,
      timeout: 10000,
      headers: {
        'X-Internal-Token': config.rez.internalToken,
        'Content-Type': 'application/json',
      },
    });

    this.walletClient = axios.create({
      baseURL: RABTUL_SERVICES.wallet,
      timeout: 10000,
      headers: {
        'X-Internal-Token': config.rez.internalToken,
        'Content-Type': 'application/json',
      },
    });

    this.notificationClient = axios.create({
      baseURL: RABTUL_SERVICES.notifications,
      timeout: 10000,
      headers: {
        'X-Internal-Token': config.rez.internalToken,
        'Content-Type': 'application/json',
      },
    });
  }

  // ==========================================
  // AUTH SERVICE
  // ==========================================

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<User | null> {
    try {
      const response = await this.authClient.get('/api/auth/verify', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.valid) {
        return response.data.user;
      }
      return null;
    } catch (error) {
      logger.error('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<User | null> {
    try {
      const response = await this.authClient.get(`/api/users/${userId}`);
      return response.data.user;
    } catch (error) {
      logger.error('Get user failed:', error);
      return null;
    }
  }

  /**
   * Create user (called when new rider signs up)
   */
  async createUser(data: {
    phone: string;
    email?: string;
    name?: string;
  }): Promise<User | null> {
    try {
      const response = await this.authClient.post('/api/users', {
        ...data,
        source: 'ridercircle',
      });
      return response.data.user;
    } catch (error) {
      logger.error('Create user failed:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, data: Partial<User>): Promise<User | null> {
    try {
      const response = await this.authClient.put(`/api/users/${userId}`, data);
      return response.data.user;
    } catch (error) {
      logger.error('Update user failed:', error);
      return null;
    }
  }

  /**
   * Send OTP for login
   */
  async sendOTP(phone: string): Promise<{ success: boolean; messageId?: string }> {
    try {
      const response = await this.authClient.post('/api/auth/otp/send', {
        phone,
        channel: 'sms',
      });
      return {
        success: true,
        messageId: response.data.messageId,
      };
    } catch (error) {
      logger.error('Send OTP failed:', error);
      return { success: false };
    }
  }

  /**
   * Verify OTP and get tokens
   */
  async verifyOTP(
    phone: string,
    otp: string
  ): Promise<AuthToken | null> {
    try {
      const response = await this.authClient.post('/api/auth/otp/verify', {
        phone,
        otp,
      });

      if (response.data.tokens) {
        return {
          accessToken: response.data.tokens.accessToken,
          refreshToken: response.data.tokens.refreshToken,
          expiresAt: new Date(response.data.tokens.expiresAt),
        };
      }
      return null;
    } catch (error) {
      logger.error('Verify OTP failed:', error);
      return null;
    }
  }

  // ==========================================
  // WALLET SERVICE
  // ==========================================

  /**
   * Get wallet balance
   */
  async getBalance(userId: string): Promise<WalletBalance | null> {
    try {
      const response = await this.walletClient.get(`/api/wallet/${userId}/balance`);
      return response.data;
    } catch (error) {
      logger.error('Get balance failed:', error);
      return null;
    }
  }

  /**
   * Get transaction history
   */
  async getTransactions(
    userId: string,
    limit = 20
  ): Promise<Transaction[]> {
    try {
      const response = await this.walletClient.get(
        `/api/wallet/${userId}/transactions`,
        { params: { limit } }
      );
      return response.data.transactions || [];
    } catch (error) {
      logger.error('Get transactions failed:', error);
      return [];
    }
  }

  /**
   * Credit REZ Coins (rewards)
   */
  async creditCoins(
    userId: string,
    amount: number,
    description: string
  ): Promise<{ success: boolean; transactionId?: string }> {
    try {
      const response = await this.walletClient.post('/api/wallet/credit', {
        userId,
        amount,
        currency: 'REZ_COINS',
        description: `[RiderCircle] ${description}`,
        source: 'ridercircle',
      });

      return {
        success: true,
        transactionId: response.data.transactionId,
      };
    } catch (error) {
      logger.error('Credit coins failed:', error);
      return { success: false };
    }
  }

  /**
   * Debit REZ Coins (payments)
   */
  async debitCoins(
    userId: string,
    amount: number,
    description: string
  ): Promise<{ success: boolean; transactionId?: string }> {
    try {
      const response = await this.walletClient.post('/api/wallet/debit', {
        userId,
        amount,
        currency: 'REZ_COINS',
        description: `[RiderCircle] ${description}`,
        source: 'ridercircle',
      });

      return {
        success: true,
        transactionId: response.data.transactionId,
      };
    } catch (error) {
      logger.error('Debit coins failed:', error);
      return { success: false };
    }
  }

  /**
   * Award ride completion rewards
   */
  async awardRideReward(
    userId: string,
    distance: number,
    rideId: string
  ): Promise<{ coins: number; badge?: string }> {
    // Calculate coins based on distance
    const coinsPerKm = 1; // 1 coin per km
    const baseCoins = Math.round(distance * coinsPerKm);

    // Bonus for longer rides
    let bonusMultiplier = 1;
    if (distance >= 500) bonusMultiplier = 2;
    else if (distance >= 200) bonusMultiplier = 1.5;
    else if (distance >= 100) bonusMultiplier = 1.25;

    const totalCoins = Math.round(baseCoins * bonusMultiplier);

    // Credit coins
    await this.creditCoins(
      userId,
      totalCoins,
      `Ride completed: ${Math.round(distance)}km`
    );

    // Check for badges
    let badge: string | undefined;
    if (distance >= 500) badge = 'epic_rider';
    else if (distance >= 200) badge = 'long_ride_master';
    else if (distance >= 100) badge = 'century_rider';

    return { coins: totalCoins, badge };
  }

  /**
   * Award SOS response rewards
   */
  async awardSOSReward(
    responderUserId: string,
    sosId: string
  ): Promise<{ coins: number }> {
    const coins = 50; // Reward for responding to SOS

    await this.creditCoins(
      responderUserId,
      coins,
      `SOS Response Reward`
    );

    return { coins };
  }

  // ==========================================
  // NOTIFICATION SERVICE
  // ==========================================

  /**
   * Send push notification
   */
  async sendPush(
    payload: NotificationPayload
  ): Promise<{ success: boolean }> {
    try {
      await this.notificationClient.post('/api/notify', {
        type: 'push',
        userId: payload.userId,
        title: payload.title,
        body: payload.body,
        data: {
          ...payload.data,
          source: 'ridercircle',
        },
        channel: payload.channel || 'ride',
      });

      return { success: true };
    } catch (error) {
      logger.error('Send push failed:', error);
      return { success: false };
    }
  }

  /**
   * Send SMS
   */
  async sendSMS(
    phone: string,
    message: string
  ): Promise<{ success: boolean }> {
    try {
      await this.notificationClient.post('/api/notify', {
        type: 'sms',
        phone,
        message,
      });

      return { success: true };
    } catch (error) {
      logger.error('Send SMS failed:', error);
      return { success: false };
    }
  }

  /**
   * Notify emergency contacts (SOS)
   */
  async notifyEmergencyContacts(
    contacts: Array<{ name: string; phone: string }>,
    riderName: string,
    location: string,
    sosId: string
  ): Promise<void> {
    const message = `EMERGENCY: ${riderName} has triggered SOS at ${location}. Please check on them immediately.`;

    for (const contact of contacts) {
      await this.sendSMS(contact.phone, message);
    }
  }

  /**
   * Notify nearby riders of SOS
   */
  async notifyNearbyRiders(
    riderIds: string[],
    sosData: {
      sosId: string;
      riderName: string;
      type: string;
      severity: string;
      location: string;
    }
  ): Promise<void> {
    for (const riderId of riderIds) {
      await this.sendPush({
        userId: riderId,
        title: '🚨 SOS Alert Nearby',
        body: `${sosData.riderName} needs help! ${sosData.type} - ${sosData.severity} severity at ${sosData.location}`,
        data: {
          sosId: sosData.sosId,
          type: 'sos_alert',
        },
        channel: 'sos',
      });
    }
  }

  /**
   * Notify ride companions
   */
  async notifyRideUpdate(
    riderIds: string[],
    message: {
      title: string;
      body: string;
      rideId: string;
    }
  ): Promise<void> {
    for (const riderId of riderIds) {
      await this.sendPush({
        userId: riderId,
        title: message.title,
        body: message.body,
        data: {
          rideId: message.rideId,
          type: 'ride_update',
        },
        channel: 'ride',
      });
    }
  }

  /**
   * Notify group members
   */
  async notifyGroupMembers(
    riderIds: string[],
    data: {
      title: string;
      body: string;
      groupId: string;
    }
  ): Promise<void> {
    for (const riderId of riderIds) {
      await this.sendPush({
        userId: riderId,
        title: data.title,
        body: data.body,
        data: {
          groupId: data.groupId,
          type: 'group_update',
        },
        channel: 'group',
      });
    }
  }

  /**
   * Notify event participants
   */
  async notifyEventParticipants(
    riderIds: string[],
    data: {
      title: string;
      body: string;
      eventId: string;
    }
  ): Promise<void> {
    for (const riderId of riderIds) {
      await this.sendPush({
        userId: riderId,
        title: data.title,
        body: data.body,
        data: {
          eventId: data.eventId,
          type: 'event_update',
        },
        channel: 'event',
      });
    }
  }

  // ==========================================
  // BATCH OPERATIONS
  // ==========================================

  /**
   * Send bulk notifications
   */
  async sendBulk(
    notifications: NotificationPayload[]
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const notification of notifications) {
      const result = await this.sendPush(notification);
      if (result.success) sent++;
      else failed++;
    }

    return { sent, failed };
  }
}

// Singleton instance
let rabtulIntegration: RABTULIntegration | null = null;

export function getRABTULIntegration(): RABTULIntegration {
  if (!rabtulIntegration) {
    rabtulIntegration = new RABTULIntegration();
  }
  return rabtulIntegration;
}

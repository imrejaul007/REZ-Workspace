/**
 * RABTUL Platform Integration for ReZ Now
 *
 * This module provides access to shared RABTUL services:
 * - Auth (JWT verification, OTP)
 * - Payment (Razorpay integration)
 * - Wallet (Coins, Balance)
 * - Analytics (Event tracking)
 * - Notifications (Push, Email, SMS)
 * - Profile (User profiles)
 */

// RABTUL Service URLs
const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4002';
const PAYMENT_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:4001';
const WALLET_URL = process.env.WALLET_SERVICE_URL || 'http://localhost:4004';
const ANALYTICS_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:4016';
const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011';
const PROFILE_URL = process.env.PROFILE_SERVICE_URL || 'http://localhost:4013';

import axios from 'axios';

// Types
interface AuthSession {
  userId: string;
  token: string;
  expiresAt: string;
}

interface PaymentOrder {
  orderId: string;
  amount: number;
  status: string;
}

interface WalletBalance {
  userId: string;
  coins: number;
}

interface Transaction {
  transactionId: string;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
}

interface UserProfile {
  userId: string;
  email?: string;
  phone?: string;
  name?: string;
  avatar?: string;
}

// Helper for internal API calls
async function internalCall(baseUrl: string, endpoint: string, data?: Record<string, unknown>) {
  const response = await axios.post(`${baseUrl}${endpoint}`, data, {
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
    },
    timeout: 10000,
  });
  return response.data;
}

// Auth Service
export const authService = {
  async verifyToken(token: string): Promise<AuthSession> {
    return internalCall(AUTH_URL, '/api/auth/verify', { token });
  },

  async sendOTP(phone: string): Promise<{ sent: boolean }> {
    return internalCall(AUTH_URL, '/api/auth/send-otp', { phone });
  },

  async verifyOTP(phone: string, otp: string): Promise<AuthSession> {
    return internalCall(AUTH_URL, '/api/auth/verify-otp', { phone, otp });
  },
};

// Payment Service
export const paymentService = {
  async createOrder(amount: number, userId: string): Promise<PaymentOrder> {
    return internalCall(PAYMENT_URL, '/api/payment/create-order', { amount, userId });
  },

  async verifyPayment(orderId: string, paymentId: string, signature: string): Promise<boolean> {
    return internalCall(PAYMENT_URL, '/api/payment/verify', { orderId, paymentId, signature });
  },

  async refund(paymentId: string, amount?: number): Promise<{ refundId: string }> {
    return internalCall(PAYMENT_URL, '/api/payment/refund', { paymentId, amount });
  },
};

// Wallet Service
export const walletService = {
  async getBalance(userId: string): Promise<WalletBalance> {
    const response = await axios.get(`${WALLET_URL}/api/wallet/balance/${userId}`, {
      headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '' },
    });
    return response.data;
  },

  async addCoins(userId: string, amount: number, reason: string): Promise<Transaction> {
    return internalCall(WALLET_URL, '/api/wallet/add', { userId, amount, reason });
  },

  async deductCoins(userId: string, amount: number, reason: string): Promise<Transaction> {
    return internalCall(WALLET_URL, '/api/wallet/deduct', { userId, amount, reason });
  },

  async getTransactions(userId: string, limit = 20): Promise<Transaction[]> {
    const response = await axios.get(`${WALLET_URL}/api/wallet/transactions/${userId}?limit=${limit}`, {
      headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '' },
    });
    return response.data;
  },
};

// Analytics Service
export const analyticsService = {
  async track(event: string, properties?: Record<string, unknown>, userId?: string): Promise<void> {
    await internalCall(ANALYTICS_URL, '/api/events', {
      event,
      properties,
      userId,
      timestamp: new Date().toISOString(),
    });
  },

  // Pre-built event helpers
  async trackPurchase(userId: string, orderId: string, amount: number): Promise<void> {
    await this.track('purchase_completed', { orderId, amount }, userId);
  },

  async trackSignup(userId: string, method: string): Promise<void> {
    await this.track('user_signed_up', { method }, userId);
  },

  async trackLogin(userId: string, method: string): Promise<void> {
    await this.track('user_logged_in', { method }, userId);
  },

  async trackSearch(userId: string, query: string): Promise<void> {
    await this.track('searchPerformed', { query }, userId);
  },
};

// Notification Service
export const notificationService = {
  async send(params: {
    userId: string;
    type: 'push' | 'email' | 'sms' | 'whatsapp';
    title?: string;
    message: string;
    data?: Record<string, unknown>;
  }): Promise<{ notificationId: string }> {
    return internalCall(NOTIFICATION_URL, '/api/notifications/send', params);
  },

  async sendBulk(params: {
    userIds: string[];
    type: 'push' | 'email' | 'sms' | 'whatsapp';
    title?: string;
    message: string;
  }): Promise<{ sent: number }> {
    return internalCall(NOTIFICATION_URL, '/api/notifications/send-bulk', params);
  },
};

// Profile Service
export const profileService = {
  async get(userId: string): Promise<UserProfile> {
    const response = await axios.get(`${PROFILE_URL}/api/profiles/${userId}`, {
      headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '' },
    });
    return response.data;
  },

  async update(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    return internalCall(PROFILE_URL, '/api/profiles/update', { userId, ...data });
  },
};

// Export all services
export const rabtulPlatform = {
  auth: authService,
  payment: paymentService,
  wallet: walletService,
  analytics: analyticsService,
  notification: notificationService,
  profile: profileService,
};

export default rabtulPlatform;

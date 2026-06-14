/**
 * RABTUL Services Client
 * Auth, Wallet, Payment, Order, Booking, Notifications
 */

import axios, { AxiosInstance } from 'axios';
import { config, rabtulServices } from '../config';
import type { User, WalletBalance, Transaction, PaymentRequest, PaymentResult, APIResponse } from '../types';

// Create client factory
function createClient(baseURL: string, timeout: number = 10000): AxiosInstance {
  return axios.create({
    baseURL,
    timeout,
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': config.internalToken,
      'X-Service-Name': 'REZ-Consumer',
    },
  });
}

// Service clients
const authClient = createClient(rabtulServices.AUTH.url, rabtulServices.AUTH.timeout);
const paymentClient = createClient(rabtulServices.PAYMENT.url, rabtulServices.PAYMENT.timeout);
const walletClient = createClient(rabtulServices.WALLET.url, rabtulServices.WALLET.timeout);
const orderClient = createClient(rabtulServices.ORDER.url, rabtulServices.ORDER.timeout);
const bookingClient = createClient(rabtulServices.BOOKING.url, rabtulServices.BOOKING.timeout);
const notificationClient = createClient(rabtulServices.NOTIFICATIONS.url, rabtulServices.NOTIFICATIONS.timeout);

// Safe API call helper
async function safeCall<T>(
  client: AxiosInstance,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  data?: unknown
): Promise<APIResponse<T> | null> {
  try {
    const response = await client.request({ method, url: path, data });
    return response.data;
  } catch (error) {
    console.error(`RABTUL API Error [${method} ${path}]:`, error);
    return null;
  }
}

// ============================================
// AUTH SERVICE
// ============================================

export const authService = {
  async authenticateUser(phone: string, name?: string): Promise<APIResponse<User>> {
    return safeCall<User>(authClient, 'POST', '/api/users/auth', { phone, name }) || {
      success: false,
      error: 'Auth service unavailable',
      timestamp: new Date(),
    };
  },

  async verifyOTP(phone: string, otp: string): Promise<APIResponse<{ token: string; user: User }>> {
    return safeCall<{ token: string; user: User }>(authClient, 'POST', '/api/users/otp/verify', { phone, otp }) || {
      success: false,
      error: 'OTP verification failed',
      timestamp: new Date(),
    };
  },
};

// ============================================
// WALLET SERVICE
// ============================================

export const walletService = {
  async getBalance(userId: string): Promise<APIResponse<WalletBalance>> {
    return safeCall<WalletBalance>(walletClient, 'POST', '/api/wallet/balance', { user_id: userId }) || {
      success: false,
      error: 'Wallet service unavailable',
      timestamp: new Date(),
    };
  },

  async credit(userId: string, amount: number, source: string): Promise<APIResponse<Transaction>> {
    return safeCall<Transaction>(walletClient, 'POST', '/api/wallet/credit', { user_id: userId, amount, source }) || {
      success: false,
      error: 'Credit operation failed',
      timestamp: new Date(),
    };
  },

  async debit(userId: string, amount: number, source: string): Promise<APIResponse<Transaction>> {
    return safeCall<Transaction>(walletClient, 'POST', '/api/wallet/debit', { user_id: userId, amount, source }) || {
      success: false,
      error: 'Debit operation failed',
      timestamp: new Date(),
    };
  },

  async getTransactions(userId: string, limit: number = 20): Promise<APIResponse<Transaction[]>> {
    return safeCall<Transaction[]>(walletClient, 'POST', '/api/wallet/transactions', { user_id: userId, limit }) || {
      success: false,
      error: 'Failed to fetch transactions',
      timestamp: new Date(),
    };
  },
};

// ============================================
// PAYMENT SERVICE
// ============================================

export const paymentService = {
  async initiate(request: PaymentRequest): Promise<APIResponse<PaymentResult>> {
    return safeCall<PaymentResult>(paymentClient, 'POST', '/api/payments/initiate', request) || {
      success: false,
      error: 'Payment initiation failed',
      timestamp: new Date(),
    };
  },
};

// ============================================
// ORDER SERVICE
// ============================================

export const orderService = {
  async create(orderData: unknown): Promise<APIResponse<unknown>> {
    return safeCall<unknown>(orderClient, 'POST', '/api/orders/create', orderData) || {
      success: false,
      error: 'Order creation failed',
      timestamp: new Date(),
    };
  },

  async getStatus(orderId: string): Promise<APIResponse<unknown>> {
    return safeCall<unknown>(orderClient, 'GET', `/api/orders/${orderId}/status`) || {
      success: false,
      error: 'Failed to get order status',
      timestamp: new Date(),
    };
  },
};

// ============================================
// BOOKING SERVICE
// ============================================

export const bookingService = {
  async create(bookingData: unknown): Promise<APIResponse<unknown>> {
    return safeCall<unknown>(bookingClient, 'POST', '/api/bookings/create', bookingData) || {
      success: false,
      error: 'Booking creation failed',
      timestamp: new Date(),
    };
  },
};

// ============================================
// NOTIFICATION SERVICE
// ============================================

export const notificationService = {
  async send(userId: string, title: string, body: string, data?: unknown): Promise<APIResponse> {
    return safeCall(notificationClient, 'POST', '/api/notifications/send', { user_id: userId, title, body, data }) || {
      success: false,
      error: 'Notification failed',
      timestamp: new Date(),
    };
  },
};

// Export all as namespace for backward compatibility
export const rabtulServices = {
  auth: authService,
  wallet: walletService,
  payment: paymentService,
  order: orderService,
  booking: bookingService,
  notification: notificationService,
};

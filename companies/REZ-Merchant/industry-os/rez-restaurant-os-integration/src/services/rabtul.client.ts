/**
 * RABTUL Platform Service Adapters
 * Auth, Payment, Wallet, Notifications
 */

import axios from 'axios';
import { SERVICE_URLS } from '../config/services';

// Auth Service
const authClient = axios.create({
  baseURL: SERVICE_URLS.AUTH_SERVICE,
  timeout: 10000,
  headers: { 'X-Internal-Token': SERVICE_URLS.INTERNAL_TOKEN },
});

export const authService = {
  verifyToken: async (token: string) => {
    const response = await authClient.post('/api/auth/verify', { token });
    return response.data;
  },

  login: async (data) => {
    const response = await authClient.post('/api/auth/login', data);
    return response.data;
  },

  register: async (data) => {
    const response = await authClient.post('/api/auth/register', data);
    return response.data;
  },

  sendOTP: async (phone: string) => {
    const response = await authClient.post('/api/auth/otp/send', { phone });
    return response.data;
  },

  verifyOTP: async (phone: string, otp: string) => {
    const response = await authClient.post('/api/auth/otp/verify', { phone, otp });
    return response.data;
  },
};

// Payment Service
const paymentClient = axios.create({
  baseURL: SERVICE_URLS.PAYMENT_SERVICE,
  timeout: 15000,
  headers: { 'X-Internal-Token': SERVICE_URLS.INTERNAL_TOKEN },
});

export const paymentService = {
  createOrder: async (data) => {
    const response = await paymentClient.post('/api/payments/create', data);
    return response.data;
  },

  verifyPayment: async (paymentId: string) => {
    const response = await paymentClient.get(`/api/payments/${paymentId}/verify`);
    return response.data;
  },

  refund: async (data) => {
    const response = await paymentClient.post('/api/payments/refund', data);
    return response.data;
  },

  getPaymentStatus: async (paymentId: string) => {
    const response = await paymentClient.get(`/api/payments/${paymentId}`);
    return response.data;
  },
};

// Wallet Service
const walletClient = axios.create({
  baseURL: SERVICE_URLS.WALLET_SERVICE,
  timeout: 10000,
  headers: { 'X-Internal-Token': SERVICE_URLS.INTERNAL_TOKEN },
});

export const walletService = {
  getBalance: async (userId: string) => {
    const response = await walletClient.get(`/api/wallet/${userId}/balance`);
    return response.data;
  },

  addCoins: async (userId: string, amount: number, source: string) => {
    const response = await walletClient.post('/api/wallet/coins/add', { userId, amount, source });
    return response.data;
  },

  deductCoins: async (userId: string, amount: number, source: string) => {
    const response = await walletClient.post('/api/wallet/coins/deduct', { userId, amount, source });
    return response.data;
  },

  getTransactions: async (userId: string, params?) => {
    const response = await walletClient.get(`/api/wallet/${userId}/transactions`, { params });
    return response.data;
  },
};

// Notifications Service
const notificationClient = axios.create({
  baseURL: SERVICE_URLS.NOTIFICATIONS_SERVICE,
  timeout: 10000,
  headers: { 'X-Internal-Token': SERVICE_URLS.INTERNAL_TOKEN },
});

export const notificationService = {
  sendSMS: async (data: { phone: string; message: string }) => {
    const response = await notificationClient.post('/api/notifications/sms', data);
    return response.data;
  },

  sendEmail: async (data: { to: string; subject: string; body: string }) => {
    const response = await notificationClient.post('/api/notifications/email', data);
    return response.data;
  },

  sendPush: async (data: { userId: string; title: string; body: string; data?: unknown }) => {
    const response = await notificationClient.post('/api/notifications/push', data);
    return response.data;
  },

  sendWhatsApp: async (data: { phone: string; message: string }) => {
    const response = await notificationClient.post('/api/notifications/whatsapp', data);
    return response.data;
  },
};

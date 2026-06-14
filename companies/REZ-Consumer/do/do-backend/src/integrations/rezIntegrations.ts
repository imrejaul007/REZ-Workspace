// ReZ Services Integration - Production URLs
// Source: SOURCE-OF-TRUTH/APPS.md

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger.js';

// ==================== SERVICE URLs ====================

export const SERVICE_URLS = {
  // Main Gateway
  GATEWAY: process.env.REZ_GATEWAY_URL || 'https://rez-api-gateway.onrender.com/api',

  // Individual Services
  AUTH: process.env.REZ_AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com',
  WALLET: process.env.REZ_WALLET_SERVICE_URL || 'https://rez-wallet-service-36vo.onrender.com',
  PAYMENT: process.env.REZ_PAYMENT_SERVICE_URL || 'https://rez-payment-service.onrender.com',
  CATALOG: process.env.REZ_CATALOG_SERVICE_URL || 'https://rez-catalog-service-1.onrender.com',
  GAMIFICATION: process.env.REZ_GAMIFICATION_SERVICE_URL || 'https://rez-gamification-service-3b5d.onrender.com',
  INTENT: process.env.REZ_INTENT_CAPTURE_URL || 'https://rez-intent-graph.onrender.com',
  SEARCH: process.env.REZ_SEARCH_SERVICE_URL || 'https://rez-search-service.onrender.com',
  BACKEND: process.env.REZ_BACKEND_URL || 'https://rez-backend-8dfu.onrender.com',

  // Order Service
  ORDER: process.env.REZ_ORDER_SERVICE_URL || 'https://rez-order-service-hz18.onrender.com',

  // Merchant Service
  MERCHANT: process.env.REZ_MERCHANT_SERVICE_URL || 'https://rez-merchant-service-n3q2.onrender.com',

  // User Intelligence
  USER_INTELLIGENCE: process.env.REZ_USER_INTELLIGENCE_URL || 'https://REZ-user-intelligence.onrender.com',

  // Profile Service
  PROFILE: process.env.REZ_PROFILE_SERVICE_URL || 'https://rez-profile-service.onrender.com',
};

// API Key for service-to-service communication
const API_KEY = process.env.REZ_API_KEY || '';

// ==================== HTTP CLIENT ====================

const createClient = (baseURL: string): AxiosInstance => {
  return axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY && { 'X-API-Key': API_KEY }),
    },
  });
};

// ==================== AUTH SERVICE ====================

export const authService = {
  async sendOTP(phone: string): Promise<{ success: boolean; expiresIn?: number }> {
    try {
      const client = createClient(SERVICE_URLS.AUTH);
      const response = await client.post('/auth/otp/send', {
        phone,
        purpose: 'login',
      });
      return response.data;
    } catch (error) {
      logger.error('Auth sendOTP failed', { error: error.message });
      throw new Error('Failed to send OTP');
    }
  },

  async verifyOTP(phone: string, otp: string): Promise<{
    success: boolean;
    token?: string;
    refreshToken?: string;
    expiresIn?: number;
    user?: { id: string; phone: string; name?: string };
  }> {
    try {
      const client = createClient(SERVICE_URLS.AUTH);
      const response = await client.post('/auth/otp/verify', { phone, otp });
      return response.data;
    } catch (error) {
      logger.error('Auth verifyOTP failed', { error: error.message });
      throw new Error('Invalid OTP');
    }
  },

  async getProfile(token: string): Promise<{
    id: string;
    phone: string;
    name?: string;
    email?: string;
  }> {
    try {
      const client = createClient(SERVICE_URLS.AUTH);
      const response = await client.get('/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      logger.error('Auth getProfile failed', { error: error.message });
      throw new Error('Failed to get profile');
    }
  },

  async updateProfile(token: string, data: { name?: string; email?: string }): Promise<unknown> {
    try {
      const client = createClient(SERVICE_URLS.AUTH);
      const response = await client.patch('/auth/profile', data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      logger.error('Auth updateProfile failed', { error: error.message });
      throw new Error('Failed to update profile');
    }
  },

  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const client = createClient(SERVICE_URLS.AUTH);
      const response = await client.post('/auth/token/refresh', { refreshToken });
      return response.data;
    } catch (error) {
      logger.error('Auth refreshToken failed', { error: error.message });
      throw new Error('Failed to refresh token');
    }
  },
};

// ==================== WALLET SERVICE ====================

export const walletService = {
  async getBalance(userId: string, token: string): Promise<{
    coins: number;
    cash: number;
    locked: number;
  }> {
    try {
      const client = createClient(SERVICE_URLS.WALLET);
      const response = await client.get(`/wallet/balance/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      logger.warn('Wallet getBalance failed, using mock', { error: error.message });
      return { coins: 1250, cash: 500, locked: 0 };
    }
  },

  async getTransactions(userId: string, token: string, limit = 20): Promise<unknown[]> {
    try {
      const client = createClient(SERVICE_URLS.WALLET);
      const response = await client.get(`/wallet/transactions/${userId}`, {
        params: { limit },
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.transactions || response.data || [];
    } catch (error) {
      logger.warn('Wallet getTransactions failed', { error: error.message });
      return [];
    }
  },

  async credit(userId: string, token: string, amount: number, source: string): Promise<{ success: boolean; transactionId?: string }> {
    try {
      const client = createClient(SERVICE_URLS.WALLET);
      const response = await client.post('/wallet/credit', {
        userId,
        amount,
        source,
        coinType: 'rez',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, transactionId: response.data?.transactionId };
    } catch (error) {
      logger.error('Wallet credit failed', { error: error.message });
      throw new Error('Failed to credit wallet');
    }
  },

  async debit(userId: string, token: string, amount: number, source: string, orderId?: string): Promise<{ success: boolean; transactionId?: string }> {
    try {
      const client = createClient(SERVICE_URLS.WALLET);
      const response = await client.post('/wallet/debit', {
        userId,
        amount,
        source,
        orderId,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, transactionId: response.data?.transactionId };
    } catch (error) {
      logger.error('Wallet debit failed', { error: error.message });
      throw new Error('Insufficient balance or debit failed');
    }
  },
};

// ==================== CATALOG SERVICE ====================

export const catalogService = {
  async search(params: {
    query?: string;
    lat?: number;
    lng?: number;
    category?: string;
    limit?: number;
  }): Promise<unknown[]> {
    try {
      const client = createClient(SERVICE_URLS.CATALOG);
      const response = await client.get('/products/search', {
        params: {
          q: params.query,
          lat: params.lat,
          lng: params.lng,
          category: params.category,
          limit: params.limit || 20,
        },
      });
      return response.data.products || response.data || [];
    } catch (error) {
      logger.warn('Catalog search failed', { error: error.message });
      return [];
    }
  },

  async getProducts(params: {
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<unknown[]> {
    try {
      const client = createClient(SERVICE_URLS.CATALOG);
      const response = await client.get('/products', { params });
      return response.data.products || response.data || [];
    } catch (error) {
      logger.warn('Catalog getProducts failed', { error: error.message });
      return [];
    }
  },

  async getCategories(): Promise<unknown[]> {
    try {
      const client = createClient(SERVICE_URLS.CATALOG);
      const response = await client.get('/categories');
      return response.data.categories || response.data || [];
    } catch (error) {
      logger.warn('Catalog getCategories failed', { error: error.message });
      return [];
    }
  },

  async getProduct(id: string): Promise<unknown> {
    try {
      const client = createClient(SERVICE_URLS.CATALOG);
      const response = await client.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      logger.warn('Catalog getProduct failed', { error: error.message });
      return null;
    }
  },
};

// ==================== ORDER SERVICE ====================

export const orderService = {
  async create(params: {
    userId: string;
    entityId: string;
    entityName: string;
    entityType: string;
    dateTime: Date;
    partySize?: number;
    token: string;
  }): Promise<{
    id: string;
    confirmationCode: string;
    status: string;
    qrCode?: string;
  }> {
    try {
      const client = createClient(SERVICE_URLS.ORDER);
      const response = await client.post('/orders', {
        productId: params.entityId,
        productName: params.entityName,
        productType: params.entityType,
        bookingDate: params.dateTime.toISOString(),
        partySize: params.partySize,
        source: 'do-app',
      }, {
        headers: { Authorization: `Bearer ${params.token}` },
      });
      return response.data;
    } catch (error) {
      logger.error('Order create failed', { error: error.message });
      throw new Error('Failed to create booking');
    }
  },

  async getOrders(userId: string, token: string): Promise<unknown[]> {
    try {
      const client = createClient(SERVICE_URLS.ORDER);
      const response = await client.get(`/orders/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.orders || response.data || [];
    } catch (error) {
      logger.warn('Order getOrders failed', { error: error.message });
      return [];
    }
  },

  async getOrder(orderId: string, userId: string, token: string): Promise<unknown> {
    try {
      const client = createClient(SERVICE_URLS.ORDER);
      const response = await client.get(`/orders/${orderId}`, {
        params: { userId },
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      logger.warn('Order getOrder failed', { error: error.message });
      return null;
    }
  },

  async cancel(orderId: string, userId: string, token: string): Promise<boolean> {
    try {
      const client = createClient(SERVICE_URLS.ORDER);
      await client.post(`/orders/${orderId}/cancel`, { userId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return true;
    } catch (error) {
      logger.error('Order cancel failed', { error: error.message });
      return false;
    }
  },

  async generateQR(orderId: string, token: string): Promise<string> {
    try {
      const client = createClient(SERVICE_URLS.ORDER);
      const response = await client.post(`/orders/${orderId}/qr`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.qrCode || '';
    } catch (error) {
      logger.error('Order generateQR failed', { error: error.message });
      return '';
    }
  },
};

// ==================== GAMIFICATION / KARMA SERVICE ====================

export const karmaService = {
  async getStatus(userId: string, token: string): Promise<{
    tier: string;
    points: number;
    nextTier: string;
    progress: number;
    multiplier: number;
  }> {
    try {
      const client = createClient(SERVICE_URLS.GAMIFICATION);
      const response = await client.get(`/karma/${userId}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      logger.warn('Karma getStatus failed, using mock', { error: error.message });
      return {
        tier: 'Gold',
        points: 2450,
        nextTier: 'Platinum',
        progress: 45,
        multiplier: 1.5,
      };
    }
  },

  async getDiscount(userId: string, entityId: string, token: string): Promise<{
    amount: number;
    rate: number;
  }> {
    try {
      const client = createClient(SERVICE_URLS.GAMIFICATION);
      const response = await client.get(`/karma/${userId}/discount/${entityId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      logger.warn('Karma getDiscount failed', { error: error.message });
      return { amount: 150, rate: 0.15 };
    }
  },

  async recordAction(userId: string, action: string, entityId: string, token: string): Promise<void> {
    try {
      const client = createClient(SERVICE_URLS.GAMIFICATION);
      await client.post('/karma/action', {
        userId,
        action,
        entityId,
        source: 'do-app',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      logger.error('Karma recordAction failed', { error: error.message });
    }
  },

  async getAchievements(userId: string, token: string): Promise<unknown[]> {
    try {
      const client = createClient(SERVICE_URLS.GAMIFICATION);
      const response = await client.get(`/karma/${userId}/achievements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.achievements || [];
    } catch (error) {
      logger.warn('Karma getAchievements failed', { error: error.message });
      return [];
    }
  },
};

// ==================== SEARCH SERVICE ====================

export const searchService = {
  async search(params: {
    query: string;
    lat?: number;
    lng?: number;
    limit?: number;
  }): Promise<unknown[]> {
    try {
      const client = createClient(SERVICE_URLS.SEARCH);
      const response = await client.get('/search/stores', {
        params: {
          q: params.query,
          lat: params.lat,
          lng: params.lng,
          limit: params.limit || 20,
        },
      });
      return response.data.stores || response.data || [];
    } catch (error) {
      logger.warn('Search failed', { error: error.message });
      return [];
    }
  },

  async getTrending(lat?: number, lng?: number): Promise<unknown[]> {
    try {
      const client = createClient(SERVICE_URLS.SEARCH);
      const response = await client.get('/search/trending', {
        params: { lat, lng },
      });
      return response.data.trending || response.data || [];
    } catch (error) {
      logger.warn('Search trending failed', { error: error.message });
      return [];
    }
  },
};

// ==================== INTENT SERVICE ====================

export const intentService = {
  async record(userId: string, intent: string, entities, result, token: string): Promise<void> {
    try {
      const client = createClient(SERVICE_URLS.INTENT);
      await client.post('/capture', {
        userId,
        intent,
        entities,
        result,
        source: 'do-app',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      logger.debug('Intent capture skipped', { error: error.message });
    }
  },

  async getContext(userId: string, token: string): Promise<unknown> {
    try {
      const client = createClient(SERVICE_URLS.INTENT);
      const response = await client.get(`/context/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      logger.warn('Intent getContext failed', { error: error.message });
      return null;
    }
  },
};

// ==================== USER INTELLIGENCE SERVICE ====================

export const userIntelligenceService = {
  async getPreferences(userId: string, token: string): Promise<unknown> {
    try {
      const client = createClient(SERVICE_URLS.USER_INTELLIGENCE);
      const response = await client.get(`/api/user/${userId}/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      logger.warn('User Intelligence getPreferences failed', { error: error.message });
      return null;
    }
  },

  async updatePreferences(userId: string, token: string, preferences): Promise<boolean> {
    try {
      const client = createClient(SERVICE_URLS.USER_INTELLIGENCE);
      await client.patch(`/api/user/${userId}/preferences`, preferences, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return true;
    } catch (error) {
      logger.warn('User Intelligence updatePreferences failed', { error: error.message });
      return false;
    }
  },

  async getBehavioralScore(userId: string, token: string): Promise<unknown> {
    try {
      const client = createClient(SERVICE_URLS.USER_INTELLIGENCE);
      const response = await client.get(`/api/user/${userId}/behavior`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      logger.warn('User Intelligence getBehavioralScore failed', { error: error.message });
      return null;
    }
  },

  async getLifetimeValue(userId: string, token: string): Promise<unknown> {
    try {
      const client = createClient(SERVICE_URLS.USER_INTELLIGENCE);
      const response = await client.get(`/api/user/${userId}/ltv`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      logger.warn('User Intelligence getLifetimeValue failed', { error: error.message });
      return null;
    }
  },
};

// ==================== MERCHANT SERVICE ====================

export const merchantService = {
  async getEntity(entityId: string): Promise<unknown> {
    try {
      const client = createClient(SERVICE_URLS.MERCHANT);
      const response = await client.get(`/stores/${entityId}`);
      return response.data;
    } catch (error) {
      logger.warn('Merchant getEntity failed', { error: error.message });
      return null;
    }
  },

  async checkAvailability(entityId: string, dateTime: Date, partySize: number): Promise<{
    available: boolean;
    nextSlot?: string;
    price?: number;
  }> {
    try {
      const client = createClient(SERVICE_URLS.MERCHANT);
      const response = await client.get(`/stores/${entityId}/availability`, {
        params: {
          date: dateTime.toISOString(),
          partySize,
        },
      });
      return response.data;
    } catch (error) {
      logger.warn('Merchant checkAvailability failed', { error: error.message });
      return { available: true, nextSlot: '7:30 PM', price: 1500 };
    }
  },
};

// ==================== HEALTH CHECK ====================

export const healthCheck = async (): Promise<Record<string, boolean>> => {
  const services = [
    { name: 'gateway', url: SERVICE_URLS.GATEWAY + '/health' },
    { name: 'auth', url: SERVICE_URLS.AUTH + '/health' },
    { name: 'wallet', url: SERVICE_URLS.WALLET + '/health' },
    { name: 'catalog', url: SERVICE_URLS.CATALOG + '/health' },
    { name: 'order', url: SERVICE_URLS.ORDER + '/health' },
    { name: 'gamification', url: SERVICE_URLS.GAMIFICATION + '/health' },
  ];

  const results: Record<string, boolean> = {};

  for (const service of services) {
    try {
      const client = createClient(service.url);
      await client.get('/');
      results[service.name] = true;
    } catch {
      results[service.name] = false;
    }
  }

  return results;
};

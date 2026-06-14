// @ts-nocheck
/**
 * REZ App - Unified Hub Integration
 *
 * Mobile app connects to:
 * - RABTUL (Auth, Wallet)
 * - REZ Intelligence (Personalization, Signals)
 * - QR Services (Scan, Verify)
 * - REZ Media (Karma)
 */

import axios from 'axios';
import { logger } from '@/utils/logger';

// ============================================
// SERVICE URLs
// ============================================

export const SERVICES = {
  // RABTUL
  AUTH: 'https://rez-auth-service.onrender.com',
  WALLET: 'https://rez-wallet-service.onrender.com',
  ORDER: 'https://rez-order-service.onrender.com',
  NOTIFICATIONS: 'https://rez-notifications-service.onrender.com',

  // Intelligence
  PERSONAL: 'https://REZ-personalization-engine.onrender.com',
  SIGNAL: 'https://REZ-signal-aggregator.onrender.com',
  CDP: 'https://REZ-cdp-service.onrender.com',

  // QR Services
  VERIFY_QR: 'https://verify-qr.onrender.com',
  SAFE_QR: 'https://safe-qr.onrender.com',

  // Karma
  KARMA: 'https://rez-gamification-service.onrender.com',

  // Event Bus
  EVENT_BUS: 'https://REZ-event-bus.onrender.com'
};

// ============================================
// API HELPER
// ============================================

async function call(service: keyof typeof SERVICES, endpoint: string, method = 'POST', data?) {
  const url = `${SERVICES[service]}${endpoint}`;
  try {
    const response = await axios({
      method,
      url,
      data,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    logger.error(`[${service}] ${endpoint}:`, error);
    return null;
  }
}

// ============================================
// AUTH
// ============================================

export const auth = {
  async login(phone: string, otp?: string) {
    if (otp) {
      const response = await call('AUTH', '/api/auth/verify-otp', 'POST', { phone, otp });
      return response;
    }
    // Request OTP
    await call('AUTH', '/api/auth/request-otp', 'POST', { phone, purpose: 'login' });
    return { success: true, message: 'OTP sent' };
  },

  async verifyToken(token: string) {
    return call('AUTH', '/api/auth/verify', 'POST', { token });
  }
};

// ============================================
// WALLET
// ============================================

export const wallet = {
  async getBalance(userId: string) {
    return call('WALLET', `/api/wallet/${userId}/balance`, 'GET');
  },

  async getTransactions(userId: string, limit = 20) {
    return call('WALLET', `/api/wallet/${userId}/transactions?limit=${limit}`, 'GET');
  }
};

// ============================================
// PERSONALIZATION
// ============================================

export const personalization = {
  async getDashboard(userId: string) {
    return call('PERSONAL', '/api/dashboard', 'POST', { user_id: userId });
  },

  async getNotifications(userId: string, limit = 20) {
    return call('PERSONAL', '/api/notifications', 'POST', {
      user_id: userId,
      limit
    });
  },

  async getOffers(userId: string) {
    return call('PERSONAL', '/api/offers', 'POST', { user_id: userId });
  },

  async trackAction(userId: string, action: string, data) {
    return call('SIGNAL', '/api/track', 'POST', {
      user_id: userId,
      action,
      ...data
    });
  }
};

// ============================================
// QR SCANNING
// ============================================

export const qrScanner = {
  async scan(code: string, userId: string, location: { lat: number; lng: number }) {
    // Try each QR service
    const services = ['VERIFY_QR', 'SAFE_QR'];

    for (const service of services) {
      try {
        const result = await call(service as keyof typeof SERVICES, '/api/scan', 'POST', {
          code,
          user_id: userId,
          location
        });
        if (result) {
          // Track scan
          await call('SIGNAL', '/api/collect', 'POST', {
            service: 'mobile_app',
            event: 'qr_scanned',
            user_id: userId,
            entities: { qr_type: service, code }
          });

          // Publish event
          await call('EVENT_BUS', '/events', 'POST', {
            event_type: 'qr.scanned',
            source: 'rez_app',
            data: { code, user_id: userId, service }
          });

          return { ...result, service };
        }
      } catch (e) {
        continue;
      }
    }

    return { error: 'QR code not recognized' };
  },

  async verifyProduct(serialNumber: string, userId: string) {
    return call('VERIFY_QR', '/api/verify', 'POST', {
      serial_number: serialNumber,
      user_id: userId
    });
  },

  async activateWarranty(params: {
    serial_number: string;
    user_id: string;
    customer_name: string;
    customer_phone: string;
    purchase_date: string;
  }) {
    const result = await call('VERIFY_QR', '/api/activate-warranty', 'POST', params);

    // Award karma
    if (result?.cashback_earned) {
      await call('KARMA', '/api/points/award', 'POST', {
        user_id: params.user_id,
        points: result.cashback_earned,
        action: 'warranty_activation'
      });
    }

    return result;
  },

  async fileClaim(params: {
    warranty_id: string;
    issue_type: string;
    issue_description: string;
    user_id: string;
  }) {
    return call('VERIFY_QR', '/api/claim', 'POST', params);
  }
};

// ============================================
// ORDERS
// ============================================

export const orders = {
  async getOrders(userId: string) {
    return call('ORDER', `/api/orders?user_id=${userId}`, 'GET');
  },

  async getOrder(orderId: string) {
    return call('ORDER', `/api/orders/${orderId}`, 'GET');
  },

  async trackDelivery(orderId: string) {
    return call('ORDER', `/api/orders/${orderId}/track`, 'GET');
  }
};

// ============================================
// CUSTOMER PROFILE
// ============================================

export const customerProfile = {
  async getProfile(userId: string) {
    const [profile, karma, orders] = await Promise.all([
      call('CDP', '/api/profile', 'POST', { user_id: userId }),
      call('KARMA', '/api/balance', 'POST', { user_id: userId }),
      call('ORDER', `/api/orders?user_id=${userId}`, 'GET')
    ]);

    return {
      profile,
      karma: karma?.points || 0,
      karma_tier: karma?.tier || 'standard',
      total_orders: orders?.orders?.length || 0
    };
  },

  async updateProfile(userId: string, data) {
    return call('CDP', '/api/profile/update', 'POST', {
      user_id: userId,
      ...data
    });
  }
};

// ============================================
// NOTIFICATIONS
// ============================================

export const notifications = {
  async registerDevice(userId: string, token: string, platform: 'ios' | 'android') {
    return call('NOTIFICATIONS', '/api/devices/register', 'POST', {
      user_id: userId,
      device_token: token,
      platform,
      service: 'rez_app'
    });
  },

  async getNotifications(userId: string) {
    return call('NOTIFICATIONS', `/api/notifications?user_id=${userId}`, 'GET');
  }
};

// ============================================
// DEFAULT EXPORT
// ============================================

export const unifiedHub = {
  auth,
  wallet,
  personalization,
  qrScanner,
  orders,
  customerProfile,
  notifications,
  call,
  SERVICES
};

export default unifiedHub;

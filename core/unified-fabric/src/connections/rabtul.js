/**
 * RABTUL Services Connection Module
 * Connects RABTUL Auth, Payment, Wallet, Profile to RTMN Core
 */

import fetch from 'node-fetch';

const RABTUL_AUTH_URL = process.env.RABTUL_AUTH_URL || 'http://localhost:4002';
const RABTUL_PAYMENT_URL = process.env.RABTUL_PAYMENT_URL || 'http://localhost:4001';
const RABTUL_WALLET_URL = process.env.RABTUL_WALLET_URL || 'http://localhost:4004';
const RABTUL_PROFILE_URL = process.env.RABTUL_PROFILE_URL || 'http://localhost:4005';

/**
 * RABTUL Connection Interface
 */
export class RabtulConnection {
  constructor(config = {}) {
    this.logger = config.logger;
    this.token = config.token;
  }

  get headers() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` })
    };
  }

  // ============================================
  // AUTHENTICATION
  // ============================================
  async authenticate(credentials) {
    try {
      const response = await fetch(`${RABTUL_AUTH_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      if (!response.ok) return null;
      const data = await response.json();
      this.token = data.token;
      return data;
    } catch (error) {
      this.logger?.warn('Auth unavailable:', error.message);
      return null;
    }
  }

  async verifyToken(token) {
    try {
      const response = await fetch(`${RABTUL_AUTH_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Token verification unavailable:', error.message);
      return null;
    }
  }

  // ============================================
  // PAYMENTS
  // ============================================
  async createPayment(paymentData) {
    try {
      const response = await fetch(`${RABTUL_PAYMENT_URL}/api/payments/create`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(paymentData)
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Payment creation unavailable:', error.message);
      return null;
    }
  }

  async getPaymentStatus(paymentId) {
    try {
      const response = await fetch(`${RABTUL_PAYMENT_URL}/api/payments/${paymentId}`, {
        headers: this.headers
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Payment status unavailable:', error.message);
      return null;
    }
  }

  async refundPayment(paymentId, amount) {
    try {
      const response = await fetch(`${RABTUL_PAYMENT_URL}/api/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ amount })
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Refund unavailable:', error.message);
      return null;
    }
  }

  // ============================================
  // WALLET
  // ============================================
  async getBalance(userId) {
    try {
      const response = await fetch(`${RABTUL_WALLET_URL}/api/wallet/${userId}/balance`, {
        headers: this.headers
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Balance check unavailable:', error.message);
      return null;
    }
  }

  async transfer(fromUserId, toUserId, amount, currency = 'INR') {
    try {
      const response = await fetch(`${RABTUL_WALLET_URL}/api/wallet/transfer`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ fromUserId, toUserId, amount, currency })
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Transfer unavailable:', error.message);
      return null;
    }
  }

  async addFunds(userId, amount, paymentMethod) {
    try {
      const response = await fetch(`${RABTUL_WALLET_URL}/api/wallet/${userId}/add-funds`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ amount, paymentMethod })
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Add funds unavailable:', error.message);
      return null;
    }
  }

  // ============================================
  // PROFILE
  // ============================================
  async getProfile(userId) {
    try {
      const response = await fetch(`${RABTUL_PROFILE_URL}/api/profiles/${userId}`, {
        headers: this.headers
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Profile fetch unavailable:', error.message);
      return null;
    }
  }

  async updateProfile(userId, profileData) {
    try {
      const response = await fetch(`${RABTUL_PROFILE_URL}/api/profiles/${userId}`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify(profileData)
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('Profile update unavailable:', error.message);
      return null;
    }
  }

  async getUserFeatures(userId) {
    try {
      const response = await fetch(`${RABTUL_PROFILE_URL}/api/profiles/${userId}/features`, {
        headers: this.headers
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger?.warn('User features unavailable:', error.message);
      return null;
    }
  }
}

/**
 * RABTUL Integration Points
 */
export const RABTUL_INTEGRATION_POINTS = {
  // Business Copilot integration
  copilot: {
    service: 'rabtul-auth',
    port: 4002,
    purpose: 'User authentication for copilot sessions',
    endpoints: [
      '/api/auth/login',
      '/api/auth/verify',
      '/api/auth/refresh'
    ]
  },

  // SUTAR OS integration
  sutar: {
    service: 'rabtul-wallet',
    port: 4004,
    purpose: 'Payment processing for SUTAR contracts and marketplace',
    endpoints: [
      '/api/wallet/:userId/balance',
      '/api/wallet/transfer',
      '/api/wallet/:userId/add-funds'
    ]
  },

  // Nexha integration
  nexha: {
    service: 'rabtul-payment',
    port: 4001,
    purpose: 'BNPL and payment processing for commerce',
    endpoints: [
      '/api/payments/create',
      '/api/payments/:id',
      '/api/payments/:id/refund'
    ]
  },

  // AdBazaar integration
  adbazaar: {
    service: 'rabtul-wallet',
    port: 4004,
    purpose: 'Ad campaign payments and creator earnings',
    endpoints: [
      '/api/wallet/:userId/balance',
      '/api/wallet/:userId/payouts'
    ]
  },

  // Genie OS integration
  genie: {
    service: 'rabtul-profile',
    port: 4005,
    purpose: 'User profile for personalization',
    endpoints: [
      '/api/profiles/:userId',
      '/api/profiles/:userId/preferences',
      '/api/profiles/:userId/features'
    ]
  }
};

/**
 * Connection module for RABTUL Services
 */
export const RabtulConnectionModule = {
  name: 'RABTUL Services → Core Platform',
  version: '1.0.0',

  /**
   * Initialize RABTUL connections
   */
  async initialize(config = {}) {
    const { logger, token } = config;

    const connection = new RabtulConnection({ logger, token });

    // Test all RABTUL services
    const services = [
      { name: 'RABTUL Auth', url: RABTUL_AUTH_URL },
      { name: 'RABTUL Payment', url: RABTUL_PAYMENT_URL },
      { name: 'RABTUL Wallet', url: RABTUL_WALLET_URL },
      { name: 'RABTUL Profile', url: RABTUL_PROFILE_URL }
    ];

    const results = {};
    for (const service of services) {
      try {
        const response = await fetch(`${service.url}/health`);
        results[service.name] = response.ok;
      } catch {
        results[service.name] = false;
      }
    }

    logger?.info('RABTUL connections:', results);

    return { connection, results };
  },

  /**
   * Get RABTUL connection instance
   */
  getConnection(config) {
    return new RabtulConnection(config);
  },

  /**
   * Get integration points
   */
  getIntegrationPoints() {
    return RABTUL_INTEGRATION_POINTS;
  }
};

export default RabtulConnectionModule;

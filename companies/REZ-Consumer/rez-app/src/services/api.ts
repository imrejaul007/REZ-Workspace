/**
 * REZ Consumer App - Central API Configuration
 * Connects to RABTUL Core Services (4000-4030)
 */

// =============================================================================
// Environment Configuration
// =============================================================================

const API_GATEWAY = process.env.EXPO_PUBLIC_API_GATEWAY || 'https://api-gateway.rezapp.com';
const AUTH_SERVICE = process.env.EXPO_PUBLIC_AUTH_SERVICE || 'https://rez-auth-service.onrender.com';
const PAYMENT_SERVICE = process.env.EXPO_PUBLIC_PAYMENT_SERVICE || 'https://rez-payment-service.onrender.com';
const ORDER_SERVICE = process.env.EXPO_PUBLIC_ORDER_SERVICE || 'https://rez-order-service.onrender.com';
const WALLET_SERVICE = process.env.EXPO_PUBLIC_WALLET_SERVICE || 'https://rez-wallet-service.onrender.com';
const CATALOG_SERVICE = process.env.EXPO_PUBLIC_CATALOG_SERVICE || 'https://rez-catalog-service.onrender.com';
const DELIVERY_SERVICE = process.env.EXPO_PUBLIC_DELIVERY_SERVICE || 'https://rez-delivery-service.onrender.com';
const NOTIFICATIONS_SERVICE = process.env.EXPO_PUBLIC_NOTIFICATIONS_SERVICE || 'https://rez-notifications-service.onrender.com';
const ANALYTICS_SERVICE = process.env.EXPO_PUBLIC_ANALYTICS_SERVICE || 'https://rez-analytics-service.onrender.com';

// =============================================================================
// Service Endpoint Registry
// =============================================================================

export const API_ENDPOINTS = {
  // Auth Service (4002)
  auth: {
    login: `${AUTH_SERVICE}/api/auth/login`,
    register: `${AUTH_SERVICE}/api/auth/register`,
    verifyOtp: `${AUTH_SERVICE}/api/auth/verify-otp`,
    refreshToken: `${AUTH_SERVICE}/api/auth/refresh`,
    logout: `${AUTH_SERVICE}/api/auth/logout`,
    forgotPassword: `${AUTH_SERVICE}/api/auth/forgot-password`,
    resetPassword: `${AUTH_SERVICE}/api/auth/reset-password`,
    verifyEmail: `${AUTH_SERVICE}/api/auth/verify-email`,
    resendOtp: `${AUTH_SERVICE}/api/auth/resend-otp`,
  },

  // Payment Service (4001)
  payment: {
    base: `${PAYMENT_SERVICE}/api/v1/payments`,
    create: `${PAYMENT_SERVICE}/api/v1/payments/create`,
    verify: `${PAYMENT_SERVICE}/api/v1/payments/verify`,
    refund: `${PAYMENT_SERVICE}/api/v1/payments/refund`,
    webhook: `${PAYMENT_SERVICE}/api/v1/webhooks/razorpay`,
    expressCheckout: `${PAYMENT_SERVICE}/api/v1/checkout/express`,
    expressSession: `${PAYMENT_SERVICE}/api/v1/checkout/session`,
    fraudCheck: `${PAYMENT_SERVICE}/api/v1/fraud/check`,
  },

  // Order Service (4006)
  order: {
    base: `${ORDER_SERVICE}/api/v1/orders`,
    create: `${ORDER_SERVICE}/api/v1/orders/create`,
    get: (id: string) => `${ORDER_SERVICE}/api/v1/orders/${id}`,
    cancel: (id: string) => `${ORDER_SERVICE}/api/v1/orders/${id}/cancel`,
    track: (id: string) => `${ORDER_SERVICE}/api/v1/orders/${id}/track`,
    history: `${ORDER_SERVICE}/api/v1/orders/history`,
  },

  // Wallet Service (4004)
  wallet: {
    base: `${WALLET_SERVICE}/api/v1/wallet`,
    balance: `${WALLET_SERVICE}/api/v1/wallet/balance`,
    transactions: `${WALLET_SERVICE}/api/v1/wallet/transactions`,
    addMoney: `${WALLET_SERVICE}/api/v1/wallet/add`,
    withdraw: `${WALLET_SERVICE}/api/v1/wallet/withdraw`,
    loyalty: {
      balance: `${WALLET_SERVICE}/api/v1/loyalty/balance`,
      redeem: `${WALLET_SERVICE}/api/v1/loyalty/redeem`,
      history: `${WALLET_SERVICE}/api/v1/loyalty/history`,
    },
  },

  // Catalog Service (4007)
  catalog: {
    products: `${CATALOG_SERVICE}/api/v1/products`,
    search: `${CATALOG_SERVICE}/api/v1/products/search`,
    categories: `${CATALOG_SERVICE}/api/v1/categories`,
    featured: `${CATALOG_SERVICE}/api/v1/products/featured`,
    recommendations: `${CATALOG_SERVICE}/api/v1/products/recommendations`,
  },

  // Delivery Service (4009)
  delivery: {
    base: `${DELIVERY_SERVICE}/api/v1/delivery`,
    track: (id: string) => `${DELIVERY_SERVICE}/api/v1/delivery/${id}`,
    estimate: `${DELIVERY_SERVICE}/api/v1/delivery/estimate`,
    cancel: (id: string) => `${DELIVERY_SERVICE}/api/v1/delivery/${id}/cancel`,
  },

  // Notifications Service (4011)
  notifications: {
    base: `${NOTIFICATIONS_SERVICE}/api/v1/notifications`,
    markRead: (id: string) => `${NOTIFICATIONS_SERVICE}/api/v1/notifications/${id}/read`,
    markAllRead: `${NOTIFICATIONS_SERVICE}/api/v1/notifications/read-all`,
    settings: `${NOTIFICATIONS_SERVICE}/api/v1/notifications/settings`,
  },

  // Analytics Service (4016)
  analytics: {
    events: `${ANALYTICS_SERVICE}/api/v1/events`,
    track: `${ANALYTICS_SERVICE}/api/v1/track`,
    userMetrics: `${ANALYTICS_SERVICE}/api/v1/metrics/user`,
    engagement: `${ANALYTICS_SERVICE}/api/v1/metrics/engagement`,
  },

  // NEW: Express Checkout Endpoints
  checkout: {
    express: `${PAYMENT_SERVICE}/api/v1/checkout/express`,
    session: (id: string) => `${PAYMENT_SERVICE}/api/v1/checkout/session/${id}`,
  },

  // NEW: Fraud Prevention
  fraud: {
    check: `${PAYMENT_SERVICE}/api/v1/fraud/check`,
    report: `${PAYMENT_SERVICE}/api/v1/fraud/report`,
  },

  // NEW: Multi-Currency
  currency: {
    convert: `${CATALOG_SERVICE}/api/v1/currency/convert`,
    rates: `${CATALOG_SERVICE}/api/v1/currency/rates`,
    supported: `${CATALOG_SERVICE}/api/v1/currency/supported`,
  },

  // NEW: Loyalty Endpoints
  loyalty: {
    balance: `${WALLET_SERVICE}/api/v1/loyalty/balance`,
    redeem: `${WALLET_SERVICE}/api/v1/loyalty/redeem`,
    points: `${WALLET_SERVICE}/api/v1/loyalty/points`,
    history: `${WALLET_SERVICE}/api/v1/loyalty/history`,
    tier: `${WALLET_SERVICE}/api/v1/loyalty/tier`,
  },
};

// =============================================================================
// Type Definitions
// =============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =============================================================================
// HTTP Client Configuration
// =============================================================================

export const httpClientConfig = {
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Version': '3.0.0',
    'X-Platform': 'react-native',
  },
};

export default API_ENDPOINTS;

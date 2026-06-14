/**
 * REZ-Consumer Configuration
 *
 * Environment-based configuration for all consumer services
 */

import dotenv from 'dotenv';

dotenv.config();

// ============================================
// SERVICE CONFIGURATION
// ============================================

export const config = {
  // Service
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4200', 10),
  serviceName: 'REZ-Consumer',
  serviceVersion: '1.0.0',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logFormat: process.env.LOG_FORMAT || 'json',

  // Security
  // SECURITY: Required environment variables - no fallbacks allowed
  internalToken: (() => {
    const token = process.env.INTERNAL_SERVICE_TOKEN;
    if (!token) {
      throw new Error('INTERNAL_SERVICE_TOKEN environment variable is required');
    }
    return token;
  })(),
  jwtSecret: (() => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    return secret;
  })(),

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  authRateLimit: {
    windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10),
  },

  // CORS
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '*').split(','),

  // Database (optional - uses in-memory by default)
  mongodbUri: process.env.MONGODB_URI,
  mongodbOptions: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  },

  // Redis (optional)
  redisUrl: process.env.REDIS_URL,

  // Webhook
  webhookSecret: process.env.WEBHOOK_SECRET || '',

  // QR Configuration
  qr: {
    baseUrl: process.env.QR_BASE_URL || 'https://rez.app/s',
    secret: (() => {
      const s = process.env.QR_SECRET;
      if (!s) {
        throw new Error('QR_SECRET environment variable is required');
      }
      return s;
    })(),
    expiryHours: parseInt(process.env.QR_EXPIRY_HOURS || '24', 10),
  },

  // Session Configuration
  session: {
    expiryHours: parseInt(process.env.SESSION_EXPIRY_HOURS || '24', 10),
    refreshExpiryDays: parseInt(process.env.REFRESH_EXPIRY_DAYS || '30', 10),
  },

  // Pagination
  pagination: {
    defaultLimit: parseInt(process.env.DEFAULT_PAGE_SIZE || '20', 10),
    maxLimit: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),
  },
} as const;

// ============================================
// RABTUL SERVICES (Infrastructure)
// ============================================

export const rabtulServices = {
  AUTH: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  PAYMENT: {
    url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4001',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  WALLET: {
    url: process.env.WALLET_SERVICE_URL || 'http://localhost:4004',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  ORDER: {
    url: process.env.ORDER_SERVICE_URL || 'http://localhost:4006',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  CATALOG: {
    url: process.env.CATALOG_SERVICE_URL || 'http://localhost:4007',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  BOOKING: {
    url: process.env.BOOKING_SERVICE_URL || 'http://localhost:4020',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  NOTIFICATIONS: {
    url: process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:4011',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
} as const;

// ============================================
// HOJAI AI SERVICES (Intelligence)
// ============================================

export const hojaiServices = {
  // HOJAI Core (4500-4610)
  GATEWAY: {
    url: process.env.HOJAI_GATEWAY || 'http://localhost:4500',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  MEMORY: {
    url: process.env.HOJAI_MEMORY || 'http://localhost:4520',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  AGENTS: {
    url: process.env.HOJAI_AGENTS || 'http://localhost:4550',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },

  // Genie Personal AI (4703-4707)
  GENIE_MEMORY: {
    url: process.env.GENIE_MEMORY || 'http://localhost:4703',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  GENIE_RELATION: {
    url: process.env.GENIE_RELATION || 'http://localhost:4704',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  GENIE_BRIEFING: {
    url: process.env.GENIE_BRIEFING || 'http://localhost:4706',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },

  // Intelligence Suite (4750-4754)
  COMMERCE_AI: {
    url: process.env.COMMERCE_AI || 'http://localhost:4750',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  CUSTOMER_AI: {
    url: process.env.CUSTOMER_AI || 'http://localhost:4752',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  MARKETING_AI: {
    url: process.env.MARKETING_AI || 'http://localhost:4753',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  FINANCIAL_AI: {
    url: process.env.FINANCIAL_AI || 'http://localhost:4754',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },

  // Voice AI (4760-4780)
  VOICE_OS: {
    url: process.env.VOICE_OS || 'http://localhost:4760',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  VOICE_AGENTS: {
    url: process.env.VOICE_AGENTS || 'http://localhost:4780',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },

  // Web Intelligence (4595-4597)
  WEB_INTELLIGENCE: {
    url: process.env.WEB_INTELLIGENCE || 'http://localhost:4595',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  WEB_MONITORING: {
    url: process.env.WEB_MONITORING || 'http://localhost:4596',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
} as const;

// ============================================
// SUTAR OS SERVICES (Autonomous Business)
// ============================================

export const sutarServices = {
  GATEWAY: {
    url: process.env.SUTAR_GATEWAY || 'http://localhost:4140',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  TWIN_OS: {
    url: process.env.SUTAR_TWIN_OS || 'http://localhost:4142',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  DECISION: {
    url: process.env.SUTAR_DECISION || 'http://localhost:4240',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  GOAL: {
    url: process.env.SUTAR_GOAL || 'http://localhost:4242',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  SIMULATION: {
    url: process.env.SUTAR_SIMULATION || 'http://localhost:4241',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  MARKETPLACE: {
    url: process.env.SUTAR_MARKETPLACE || 'http://localhost:4250',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  INTENT_BUS: {
    url: process.env.SUTAR_INTENT_BUS || 'http://localhost:4154',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  DISCOVERY: {
    url: process.env.SUTAR_DISCOVERY || 'http://localhost:4149',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
} as const;

// ============================================
// REZ INTELLIGENCE SERVICES
// ============================================

export const rezIntelligenceServices = {
  FRAUD: {
    url: process.env.FRAUD_SERVICE_URL || 'http://localhost:4012',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  SIGNAL: {
    url: process.env.SIGNAL_SERVICE_URL || 'http://localhost:4013',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  INTENT: {
    url: process.env.INTENT_SERVICE_URL || 'http://localhost:4018',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  PREDICT: {
    url: process.env.PREDICT_SERVICE_URL || 'http://localhost:4123',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  MEMORY_LAYER: {
    url: process.env.MEMORY_LAYER_URL || 'http://localhost:4201',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
} as const;

// ============================================
// INTERNAL SERVICES (REZ-Consumer Microservices)
// ============================================

export const internalServices = {
  SAFE_QR: {
    url: process.env.SAFE_QR_SERVICE_URL || 'http://localhost:4001',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  VERIFY_QR: {
    url: process.env.VERIFY_QR_SERVICE_URL || 'http://localhost:4003',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  GO4FOOD: {
    url: process.env.GO4FOOD_API_URL || 'http://localhost:3002',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  RIDER_CIRCLE: {
    url: process.env.RIDER_CIRCLE_API_URL || 'http://localhost:4201',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  INBOX: {
    url: process.env.REZ_INBOX_URL || 'http://localhost:3003',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  ASSISTANT: {
    url: process.env.REZ_ASSISTANT_URL || 'http://localhost:3011',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
  NEARBY: {
    url: process.env.REZ_NEARBY_URL || 'http://localhost:3015',
    timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '10000', 10),
  },
} as const;

// ============================================
// EXPORT ALL CONFIGURATION
// ============================================

export default {
  config,
  rabtulServices,
  hojaiServices,
  sutarServices,
  rezIntelligenceServices,
  internalServices,
};

export type Config = typeof config;
export type RABTULServices = typeof rabtulServices;
export type HOJAIServices = typeof hojaiServices;
export type SUTARServices = typeof sutarServices;
export type REZIntelligenceServices = typeof rezIntelligenceServices;
export type InternalServices = typeof internalServices;
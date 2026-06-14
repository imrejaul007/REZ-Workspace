import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '4300', 10),
  env: process.env.NODE_ENV || 'development',

  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/qr-cloud',
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // Base URLs
  urls: {
    qrCloudBase: process.env.QR_CLOUD_URL || 'https://qr.rez.money',
    apiBase: process.env.API_BASE_URL || 'http://localhost:4300',
  },

  // RABTUL Services (for integrations)
  services: {
    auth: {
      url: process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com',
    },
    payment: {
      url: process.env.PAYMENT_SERVICE_URL || 'https://rez-payment-service.onrender.com',
    },
    wallet: {
      url: process.env.WALLET_SERVICE_URL || 'https://rez-wallet-service-36vo.onrender.com',
    },
    notifications: {
      url: process.env.NOTIFICATION_SERVICE_URL || 'https://rez-notifications-service.onrender.com',
    },
    eventBus: {
      url: process.env.EVENT_BUS_URL || 'http://localhost:4082',
    },
  },

  // API Keys
  apiKeys: {
    internal: process.env.INTERNAL_SERVICE_TOKEN || 'dev-internal-token',
  },

  // Security
  security: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // QR Code Settings
  qrCode: {
    defaultWidth: parseInt(process.env.QR_CODE_WIDTH || '400', 10),
    errorCorrectionLevel: 'H' as const,
  },
};

export type Config = typeof config;

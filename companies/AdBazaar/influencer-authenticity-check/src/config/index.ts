import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5111', 10),

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/influencer_authenticity',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011',
  },

  internalToken: process.env.INTERNAL_SERVICE_TOKEN || 'your-internal-service-token-here',

  analytics: {
    updateInterval: parseInt(process.env.ANALYTICS_UPDATE_INTERVAL || '3600000', 10),
  },
} as const;

export type Config = typeof config;
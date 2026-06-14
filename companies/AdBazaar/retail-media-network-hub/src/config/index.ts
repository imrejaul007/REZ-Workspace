import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4830', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/retail-media-network-hub',
 options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    keyPrefix: 'rmn:',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: '24h',
  },

  rezMerchant: {
    url: process.env.REZ_MERCHANT_URL || 'http://localhost:4000',
    timeout: 10000,
  },

  metrics: {
    enabled: process.env.ENABLE_METRICS !== 'false',
    path: '/metrics',
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
} as const;

export type Config = typeof config;

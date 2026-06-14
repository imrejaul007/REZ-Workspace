import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4850', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/website-ssp-sdk',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  sdk: {
    baseUrl: process.env.SDK_BASE_URL || 'http://localhost:4850',
    defaultMinCPM: parseFloat(process.env.DEFAULT_MIN_CPM || '1.00'),
    defaultPayoutRate: parseFloat(process.env.DEFAULT_PAYOUT_RATE || '0.70'),
  },

  metrics: {
    enabled: process.env.METRICS_ENABLED === 'true',
  },
} as const;

export type Config = typeof config;

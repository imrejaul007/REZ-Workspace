import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '4815', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/apartment-targeting',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    keyPrefix: 'apt:',
    ttl: {
      cache: 3600, // 1 hour
      session: 86400, // 24 hours
    },
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'apartment-targeting-secret-key-change-in-production',
    expiresIn: '24h',
    refreshExpiresIn: '7d',
  },

  // BuzzLocal Integration
  buzzLocal: {
    url: process.env.BUZZLOCAL_URL || 'http://localhost:3000',
    apiKey: process.env.BUZZLOCAL_API_KEY || '',
    timeout: parseInt(process.env.BUZZLOCAL_TIMEOUT || '5000', 10),
    syncEnabled: process.env.BUZZLOCAL_SYNC_ENABLED === 'true',
    syncInterval: parseInt(process.env.BUZZLOCAL_SYNC_INTERVAL || '60', 10), // minutes
  },

  // Prometheus Metrics
  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
    path: process.env.METRICS_PATH || '/metrics',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
  },
};

export type Config = typeof config;
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '4851', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mobile-ssp-sdk',
    user: process.env.MONGODB_USER || '',
    password: process.env.MONGODB_PASSWORD || '',
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD || '',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // SSP Settings
  ssp: {
    defaultECPM: parseFloat(process.env.DEFAULT_ECPM || '1.00'),
    minECPM: parseFloat(process.env.MIN_ECPM || '0.10'),
    maxECPM: parseFloat(process.env.MAX_ECPM || '100.00'),
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
} as const;

export type Config = typeof config;
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server Configuration
  port: parseInt(process.env.PORT || '4150', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB Configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-creator-commerce',
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  // Cache Configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300', 10), // 5 minutes default
    creatorTtl: parseInt(process.env.CACHE_CREATOR_TTL || '600', 10), // 10 minutes
    analyticsTtl: parseInt(process.env.CACHE_ANALYTICS_TTL || '60', 10), // 1 minute
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.NODE_ENV === 'production' ? 'json' : 'simple',
  },

  // Business Configuration
  business: {
    minPayoutAmount: parseFloat(process.env.MIN_PAYOUT_AMOUNT || '100'), // INR
    defaultCommission: parseFloat(process.env.DEFAULT_COMMISSION || '15'), // 15%
    maxCommission: parseFloat(process.env.MAX_COMMISSION || '50'), // 50%
    payoutProcessingDays: parseInt(process.env.PAYOUT_PROCESSING_DAYS || '3', 10),
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10), // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  // Pagination Defaults
  pagination: {
    defaultLimit: parseInt(process.env.PAGINATION_LIMIT || '20', 10),
    maxLimit: parseInt(process.env.PAGINATION_MAX_LIMIT || '100', 10),
  },
} as const;

export type Config = typeof config;

export default config;
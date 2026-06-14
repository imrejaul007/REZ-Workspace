import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '5000', 10),
  env: process.env.NODE_ENV || 'development',

  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/publisher-os',
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    }
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    keyPrefix: 'publisher-os:'
  },

  // Security
  security: {
    internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || '',
    adminToken: process.env.ADMIN_TOKEN || '',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['*']
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
  },

  // Business
  business: {
    defaultCurrency: 'USD',
    defaultRevenueShare: 70,
    defaultFloorPrice: 0.5,
    maxFloorPrice: 100,
    minFloorPrice: 0.01
  }
};

export default config;

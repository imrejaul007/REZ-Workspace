/**
 * Go4Food API - Configuration
 */

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3002', 10),

  // CORS
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3001').split(','),

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
  },

  // REZ Merchant Integration
  rezMerchant: {
    baseUrl: process.env.REZ_MERCHANT_URL || 'https://rez-merchant.rezapp.com',
    internalToken: process.env.INTERNAL_SERVICE_TOKEN || '',
    timeout: parseInt(process.env.REZ_MERCHANT_TIMEOUT || '30000', 10),
  },

  // External APIs (Food Aggregators)
  externalApis: {
    swiggy: {
      baseUrl: process.env.SWIGGY_API_URL || 'https://api.swiggy.com',
      apiKey: process.env.SWIGGY_API_KEY,
    },
    zomato: {
      baseUrl: process.env.ZOMATO_API_URL || 'https://api.zomato.com',
      apiKey: process.env.ZOMATO_API_KEY,
    },
    uberEats: {
      baseUrl: process.env.UBER_EATS_API_URL || 'https://api.uber.com',
      apiKey: process.env.UBER_EATS_API_KEY,
    },
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};

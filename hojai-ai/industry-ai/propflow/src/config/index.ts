/**
 * PROPFLOW - Real Estate AI Operating System
 * Configuration Index
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Environment configuration
export const config = {
  // Server
  port: parseInt(process.env.PORT || '4807', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/propflow',
  mongoUser: process.env.MONGODB_USER || '',
  mongoPassword: process.env.MONGODB_PASSWORD || '',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'propflow-jwt-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // AI Configuration
  aiPropertyMatchThreshold: parseInt(process.env.AI_PROPERTY_MATCH_THRESHOLD || '60', 10),
  aiLeadQualifyThreshold: parseInt(process.env.AI_LEAD_QUALIFY_THRESHOLD || '50', 10),

  // Internal Service Token
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || 'propflow-internal-token-change-in-production',

  // Email
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@propflow.ai'
  },

  // SMS
  sms: {
    apiKey: process.env.SMS_API_KEY || '',
    apiSecret: process.env.SMS_API_SECRET || ''
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logDir: process.env.LOG_DIR || 'logs',

  // Security
  bcryptRounds: 12,

  // Integrations
  integrations: {
    webhookServiceUrl: process.env.WEBHOOK_SERVICE_URL || 'http://localhost:4090',
    hojaiUrl: process.env.HOJAI_URL || 'http://localhost:4800',
    notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4095'
  }
};

export default config;
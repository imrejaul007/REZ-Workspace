/**
 * Service Configuration
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Service
  port: parseInt(process.env.PORT || '5103', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/crisis-alert-service',

  // Authentication
  serviceApiKey: process.env.SERVICE_API_KEY || 'default-service-key',
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || 'default-internal-token',
  skipAuth: process.env.SKIP_AUTH === 'true',

  // Slack
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || '',

  // Email
  email: {
    smtpHost: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseInt(process.env.EMAIL_SMTP_PORT || '587', 10),
    smtpSecure: process.env.EMAIL_SMTP_SECURE === 'true',
    from: process.env.EMAIL_FROM || 'alerts@adbazaar.com',
    username: process.env.EMAIL_USERNAME || '',
    password: process.env.EMAIL_PASSWORD || '',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};

export default config;

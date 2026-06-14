/**
 * REZ Outbound Service - Configuration
 */

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Server
  PORT: parseInt(process.env.PORT || '4130'),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-outbound-service',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),

  // Service Tokens
  SERVICE_TOKENS: {
    crm: process.env.CRM_TOKEN || 'crm-token-xxx',
    email: process.env.EMAIL_TOKEN || 'email-token-xxx',
    signal: process.env.SIGNAL_TOKEN || 'signal-token-xxx',
  },

  // Campaign Settings
  CAMPAIGN_CONFIG: {
    maxStepsPerSequence: parseInt(process.env.MAX_STEPS || '10'),
    minDelayHours: parseInt(process.env.MIN_DELAY_HOURS || '2'),
    maxDelayHours: parseInt(process.env.MAX_DELAY_HOURS || '72'),
    defaultWorkingHours: {
      start: 9,
      end: 17,
    },
    // Default time windows (in hours) for each channel
    channelDefaults: {
      email: { delay: 24, maxPerDay: 100 },
      linkedin: { delay: 48, maxPerDay: 50 },
      sms: { delay: 4, maxPerDay: 200 },
      call: { delay: 72, maxPerDay: 30 },
    },
  },

  // A/B Testing
  AB_TEST: {
    enabled: process.env.AB_TEST_ENABLED === 'true',
    defaultVariantCount: 2,
    minSampleSize: parseInt(process.env.AB_MIN_SAMPLE || '100'),
  },

  // Email Settings
  EMAIL_CONFIG: {
    fromName: process.env.EMAIL_FROM_NAME || 'REZ Sales',
    fromEmail: process.env.EMAIL_FROM_EMAIL || 'sales@rez.commerce',
    replyTo: process.env.EMAIL_REPLY_TO || 'sales@rez.commerce',
  },
};

export default config;

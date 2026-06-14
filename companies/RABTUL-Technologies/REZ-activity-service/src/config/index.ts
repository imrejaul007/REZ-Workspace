/**
 * REZ Activity Service - Configuration
 */

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: parseInt(process.env.PORT || '4132'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-activity-service',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  SERVICE_TOKENS: {
    deal: process.env.DEAL_TOKEN || 'deal-token-xxx',
    outbound: process.env.OUTBOUND_TOKEN || 'outbound-token-xxx',
    signal: process.env.SIGNAL_TOKEN || 'signal-token-xxx',
    crm: process.env.CRM_TOKEN || 'crm-token-xxx',
  },
};

export default config;

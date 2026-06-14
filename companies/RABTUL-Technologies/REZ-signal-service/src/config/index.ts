/**
 * REZ Signal Service - Configuration
 */

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Server
  PORT: parseInt(process.env.PORT || '4129'),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-signal-service',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),

  // Service Tokens (for internal service-to-service auth)
  SERVICE_TOKENS: {
    tamBuilder: process.env.TAM_BUILDER_TOKEN || 'tam-builder-token-xxx',
    revenueAi: process.env.REVENUE_AI_TOKEN || 'revenue-ai-token-xxx',
    crm: process.env.CRM_TOKEN || 'crm-token-xxx',
  },

  // Signal Detection
  SIGNAL_CONFIG: {
    // Minimum score to consider a signal active
    minSignalScore: parseInt(process.env.MIN_SIGNAL_SCORE || '30'),
    // Time window for trend calculation (days)
    trendWindowDays: parseInt(process.env.TREND_WINDOW_DAYS || '30'),
    // Decay rate for old signals (per day)
    decayRatePerDay: parseFloat(process.env.DECAY_RATE_PER_DAY || '0.02'),
    // Threshold for spike detection
    spikeThreshold: parseFloat(process.env.SPIKE_THRESHOLD || '2.0'),
  },

  // Intent Categories with weights
  INTENT_WEIGHTS: {
    productResearch: 0.3,
    competitorResearch: 0.25,
    pricingInquiry: 0.35,
    evaluation: 0.40,
    implementation: 0.45,
    contract: 0.50,
  },
};

export default config;

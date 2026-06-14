/**
 * REZ Deal Intelligence - Configuration
 */

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Server
  PORT: parseInt(process.env.PORT || '4131'),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-deal-intelligence',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),

  // Service Tokens
  SERVICE_TOKENS: {
    crm: process.env.CRM_TOKEN || 'crm-token-xxx',
    signal: process.env.SIGNAL_TOKEN || 'signal-token-xxx',
    outbound: process.env.OUTBOUND_TOKEN || 'outbound-token-xxx',
  },

  // Deal Scoring
  SCORING_CONFIG: {
    // Weights for different factors
    weights: {
      companyScore: 0.25,      // From TAM Builder
      signalScore: 0.25,      // From Signal Service
      engagementScore: 0.20,   // From Outbound Service
      activityScore: 0.15,    // CRM activities
      sentimentScore: 0.15,   // Conversation sentiment
    },
    // Thresholds
    thresholds: {
      hot: 75,
      warm: 50,
      cold: 25,
    },
  },

  // Prediction
  PREDICTION_CONFIG: {
    // Historical win rate lookback (days)
    lookbackDays: parseInt(process.env.PREDICTION_LOOKBACK || '90'),
    // Minimum data points for prediction
    minDataPoints: parseInt(process.env.MIN_DATA_POINTS || '10'),
    // Confidence threshold
    confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.7'),
  },

  // Recommendations
  RECOMMENDATION_CONFIG: {
    maxRecommendations: 5,
    // Priority weights
    priorityWeights: {
      urgency: 0.3,
      impact: 0.3,
      effort: 0.2,
      confidence: 0.2,
    },
  },
};

export default config;

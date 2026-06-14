/**
 * REZ TAM Builder - Configuration
 */

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Server
  PORT: parseInt(process.env.PORT || '4128'),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_tam_builder',

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),

  // Internal service tokens
  SERVICE_TOKENS: {
    REZ_INTELLIGENCE: process.env.REZ_INTELLIGENCE_TOKEN || 'rez-intelligence-token',
    CORPPERKS_CRM: process.env.CORPPERKS_CRM_TOKEN || 'corpperks-crm-token',
    RAZO: process.env.RAZO_TOKEN || 'razo-token',
  },

  // Signal service integration
  SIGNAL_SERVICE_URL: process.env.SIGNAL_SERVICE_URL || 'http://localhost:4129',

  // Company database settings
  COMPANY_DB_PAGE_SIZE: parseInt(process.env.COMPANY_DB_PAGE_SIZE || '100'),
  COMPANY_DB_MAX_RESULTS: parseInt(process.env.COMPANY_DB_MAX_RESULTS || '10000'),

  // Scoring weights
  SCORING_WEIGHTS: {
    industry: parseFloat(process.env.SCORE_INDUSTRY || '0.25'),
    size: parseFloat(process.env.SCORE_SIZE || '0.20'),
    location: parseFloat(process.env.SCORE_LOCATION || '0.15'),
    technology: parseFloat(process.env.SCORE_TECHNOLOGY || '0.20'),
    behavior: parseFloat(process.env.SCORE_BEHAVIOR || '0.20'),
  },

  // Cache settings
  CACHE_TTL_SECONDS: parseInt(process.env.CACHE_TTL_SECONDS || '3600'), // 1 hour
};

export default config;

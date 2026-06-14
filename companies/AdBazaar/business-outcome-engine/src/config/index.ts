import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '4931', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/business_outcome_engine',
    user: process.env.MONGODB_USER || '',
    password: process.env.MONGODB_PASSWORD || '',
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  // Service URLs
  services: {
    autonomousGrowthOrchestrator: process.env.AUTONOMOUS_GROWTH_ORCHESTRATOR_URL || 'http://localhost:4930',
    merchantInsightsOs: process.env.MERCHANT_INSIGHTS_OS_URL || 'http://localhost:4870',
    hojaiApi: process.env.HOJAI_API_URL || 'http://localhost:4800',
    hojaiApiKey: process.env.HOJAI_API_KEY || '',
    rezAuth: process.env.REZ_AUTH_URL || 'http://localhost:4002',
    rezAuthToken: process.env.REZ_AUTH_TOKEN || '',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  // Internal
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || 'business-outcome-engine-secret-token',

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
  },

  // Prediction Settings
  prediction: {
    confidenceThreshold: parseFloat(process.env.PREDICTION_CONFIDENCE_THRESHOLD || '0.7'),
    horizonDays: parseInt(process.env.PREDICTION_HORIZON_DAYS || '30', 10),
  },

  // Learning Settings
  learning: {
    minSamples: parseInt(process.env.LEARNING_MIN_SAMPLES || '100', 10),
    updateIntervalHours: parseInt(process.env.LEARNING_UPDATE_INTERVAL_HOURS || '24', 10),
  },

  // Paths
  paths: {
    root: path.resolve(__dirname, '../..'),
  },
};

export type Config = typeof config;
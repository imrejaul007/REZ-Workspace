import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5100', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/content_repurposing',
  },

  auth: {
    serviceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
    internalToken: process.env.INTERNAL_SERVICE_TOKEN || '',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
  },

  videoProcessing: {
    apiUrl: process.env.VIDEO_PROCESSING_API_URL || '',
    apiKey: process.env.VIDEO_PROCESSING_API_KEY || '',
  },

  storage: {
    url: process.env.STORAGE_URL || '',
    apiKey: process.env.STORAGE_API_KEY || '',
  },

  features: {
    aiHighlights: process.env.ENABLE_AI_HIGHLIGHTS !== 'false',
    batchProcessing: process.env.ENABLE_BATCH_PROCESSING !== 'false',
  },
} as const;

export type Config = typeof config;

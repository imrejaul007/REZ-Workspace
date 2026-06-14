/**
 * REZ Memory Cloud - Configuration
 */

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4210', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_memory_cloud',
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  auth: {
    apiKey: process.env.API_KEY || '',
    internalToken: process.env.INTERNAL_SERVICE_TOKEN || '',
  },

  cors: {
    origins: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'text-embedding-3-small',
  },

  pinecone: {
    apiKey: process.env.PINECONE_API_KEY || '',
    environment: process.env.PINECONE_ENVIRONMENT || '',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  rateLimit: {
    window: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  ttl: {
    default: parseInt(process.env.DEFAULT_MEMORY_TTL || '2592000', 10), // 30 days
    short: parseInt(process.env.SHORT_MEMORY_TTL || '86400', 10), // 1 day
    long: parseInt(process.env.LONG_MEMORY_TTL || '7776000', 10), // 90 days
  },
};

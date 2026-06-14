import logger from './utils/logger';

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '4012', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || '',  // REQUIRED: Set MONGODB_URI env var
    db: process.env.MONGODB_DB || 'merchant_intelligence',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    queues: {
      orders: process.env.ORDER_SERVICE_QUEUE || 'order_events',
      inventory: process.env.INVENTORY_EVENTS_QUEUE || 'inventory_events',
      feedback: process.env.FEEDBACK_EVENTS_QUEUE || 'feedback_events',
    },
  },

  services: {
    order: process.env.ORDER_SERVICE_URL || 'http://localhost:4003',
    inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:4004',
    feedback: process.env.FEEDBACK_SERVICE_URL || 'http://localhost:4005',
    merchant: process.env.MERCHANT_SERVICE_URL || 'http://localhost:4001',
  },

  jwt: {
    // CRITICAL: Require JWT_SECRET in production
    secret: process.env.JWT_SECRET || (() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET environment variable is required in production');
      }
      logger.warn('[Config] JWT_SECRET not set, using insecure default (development only)');
      return 'dev-only-secret-do-not-use-in-prod';
    })(),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  cache: {
    ttl: {
      profile: parseInt(process.env.CACHE_TTL_PROFILE || '300', 10),
      insights: parseInt(process.env.CACHE_TTL_INSIGHTS || '600', 10),
      scores: parseInt(process.env.CACHE_TTL_SCORES || '60', 10),
    },
  },

  scoring: {
    weights: {
      health: {
        revenue: parseFloat(process.env.HEALTH_WEIGHT_REVENUE || '0.25'),
        orders: parseFloat(process.env.HEALTH_WEIGHT_ORDERS || '0.20'),
        customers: parseFloat(process.env.HEALTH_WEIGHT_CUSTOMERS || '0.15'),
        inventory: parseFloat(process.env.HEALTH_WEIGHT_INVENTORY || '0.15'),
        feedback: parseFloat(process.env.HEALTH_WEIGHT_FEEDBACK || '0.15'),
        engagement: parseFloat(process.env.HEALTH_WEIGHT_ENGAGEMENT || '0.10'),
      },
    },
  },

  competitorAnalysis: {
    similarityThreshold: parseFloat(process.env.COMPETITOR_SIMILARITY_THRESHOLD || '0.7'),
    maxCompetitors: parseInt(process.env.MAX_COMPETITORS || '10', 10),
  },
};

export default config;

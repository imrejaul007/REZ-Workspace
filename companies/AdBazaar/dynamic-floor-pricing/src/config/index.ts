import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '4982', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/dynamic_floor_pricing',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    }
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined
  },

  // Internal Auth
  auth: {
    internalToken: process.env.INTERNAL_SERVICE_TOKEN || 'dev-internal-token'
  },

  // HOJAI AI Integration
  hojai: {
    apiUrl: process.env.HOJAI_API_URL || 'http://localhost:4800',
    apiKey: process.env.HOJAI_API_KEY || ''
  },

  // Floor Pricing Configuration
  floorPricing: {
    // Default floor types
    types: ['fixed', 'dynamic', 'market', 'competitor', 'ai_optimized'] as const,
    // Default statuses
    statuses: ['active', 'inactive', 'pending', 'archived'] as const,
    // Minimum floor price (in cents)
    minFloorPrice: 1,
    // Maximum floor price (in cents)
    maxFloorPrice: 1000000,
    // Default optimization interval (ms)
    optimizationIntervalMs: 3600000, // 1 hour
    // Maximum history retention (days)
    historyRetentionDays: 90
  },

  // Cache TTL (seconds)
  cache: {
    floorPrice: 300, // 5 minutes
    recommendations: 600, // 10 minutes
    performance: 60 // 1 minute
  }
};

export type FloorType = typeof config.floorPricing.types[number];
export type FloorStatus = typeof config.floorPricing.statuses[number];

export default config;
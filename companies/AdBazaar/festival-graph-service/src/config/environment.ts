import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '4882', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/festival-graph-service',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  // External Services
  services: {
    eventGraphService: process.env.EVENT_GRAPH_SERVICE_URL || 'http://localhost:4880',
    placeGraphIndex: process.env.PLACE_GRAPH_INDEX_URL || 'http://localhost:4816',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  // Metrics
  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
    path: process.env.METRICS_PATH || '/metrics',
  },

  // Festival Configuration
  festival: {
    defaultForecastDays: parseInt(process.env.FESTIVAL_FORECAST_DAYS || '90', 10),
    maxImpactRadius: parseFloat(process.env.MAX_IMPACT_RADIUS || '50'), // in km
  },

  // Internal Service Token
  internalToken: process.env.INTERNAL_SERVICE_TOKEN || 'festival-graph-internal-token',
} as const;

export type Config = typeof config;

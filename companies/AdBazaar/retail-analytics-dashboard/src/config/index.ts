import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4995', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/retail_analytics_dashboard',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || 'dev-token',

  services: {
    adbazaarApi: process.env.ADBAZAAR_API_URL || 'http://localhost:4000',
    intentGraph: process.env.INTENT_GRAPH_URL || 'http://localhost:4018',
    hojaiBrain: process.env.HOJAI_BRAIN_URL || 'http://localhost:4630',
  },

  dashboard: {
    cacheDuration: parseInt(process.env.DASHBOARD_CACHE_DURATION || '300', 10),
    refreshInterval: parseInt(process.env.DASHBOARD_REFRESH_INTERVAL || '60', 10),
    maxExportRows: parseInt(process.env.MAX_EXPORT_ROWS || '10000', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
};
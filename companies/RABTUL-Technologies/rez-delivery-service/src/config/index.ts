import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4010', 10),
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_delivery',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    keyPrefix: 'rez:delivery:'
  },
  env: process.env.NODE_ENV || 'development',
  tracking: {
    updateIntervalMs: 30000,
    maxHistoryPoints: 100
  },
  eta: {
    averageSpeedKmh: 30,
    trafficMultiplier: {
      low: 1.0,
      medium: 1.3,
      high: 1.8
    }
  },
  swiggy: {
    apiUrl: process.env.SWIGGY_API_URL,
    apiKey: process.env.SWIGGY_API_KEY,
    storeId: process.env.SWIGGY_STORE_ID,
    webhookSecret: process.env.SWIGGY_WEBHOOK_SECRET
  },
  zomato: {
    apiUrl: process.env.ZOMATO_API_URL,
    apiKey: process.env.ZOMATO_API_KEY,
    entityId: process.env.ZOMATO_ENTITY_ID,
    webhookSecret: process.env.ZOMATO_WEBHOOK_SECRET
  },
  ondc: {
    apiUrl: process.env.ONDC_API_URL,
    apiKey: process.env.ONDC_API_KEY,
    bppId: process.env.ONDC_BPP_ID,
    bppUri: process.env.ONDC_BPP_URI
  },
  mapbox: {
    apiKey: process.env.MAPBOX_API_KEY
  }
};

export default config;

import dotenv from 'dotenv';
import type { ServiceConfig } from '../types/index.js';

dotenv.config();

const config: ServiceConfig = {
  port: parseInt(process.env.PORT || '4870', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/merchant_insights',
    options: {
      maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE || '10', 10),
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_TIMEOUT || '5000', 10),
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT || '45000', 10),
    },
  },

  services: {
    hojaiApi: process.env.HOJAI_API_URL || 'http://localhost:4800',
    rabtulWallet: process.env.RABTUL_WALLET_URL || 'http://localhost:4004',
    rezMerchant: process.env.REZ_MERCHANT_URL || 'http://localhost:4000',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
    path: process.env.METRICS_PATH || '/metrics',
  },
};

export default config;

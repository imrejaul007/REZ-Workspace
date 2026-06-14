/**
 * Configuration loader - loads from environment variables
 */
import dotenv from 'dotenv';

// Load .env file if present
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  mongodbUri: string;
  jwtSecret: string;
  redisUrl: string;
  internalServiceToken: string;
  services: {
    auth: string;
    payment: string;
    wallet: string;
    notification: string;
    analytics: string;
    eventBus: string;
    intent: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

const config: Config = {
  port: parseInt(process.env['PORT'] ?? '3000', 10),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  mongodbUri: process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/finance-payables',
  jwtSecret: process.env['JWT_SECRET'] ?? 'CHANGE_ME_in_production',
  redisUrl: process.env['REDIS_URL'] ?? 'redis://localhost:6379',
  internalServiceToken: process.env['INTERNAL_SERVICE_TOKEN'] ?? 'internal-service-token',
  services: {
    auth: process.env['RABTUL_AUTH_URL'] ?? 'http://localhost:4002',
    payment: process.env['RABTUL_PAYMENT_URL'] ?? 'http://localhost:4001',
    wallet: process.env['RABTUL_WALLET_URL'] ?? 'http://localhost:4004',
    notification: process.env['RABTUL_NOTIFICATION_URL'] ?? 'http://localhost:4005',
    analytics: process.env['ANALYTICS_SERVICE_URL'] ?? 'http://localhost:4016',
    eventBus: process.env['EVENT_BUS_URL'] ?? 'http://localhost:4025',
    intent: process.env['INTENT_SERVICE_URL'] ?? 'http://localhost:4018',
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },
};

export default config;

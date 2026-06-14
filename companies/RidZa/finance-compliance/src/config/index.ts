/**
 * Configuration loader for Finance Compliance service
 * Loads environment variables with validation and defaults
 */
import dotenv from 'dotenv';

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
  };
}

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ?? defaultValue ?? '';
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return defaultValue;
  return parsed;
}

const config: Config = {
  port: getEnvNumber('PORT', 4902),
  nodeEnv: getEnv('NODE_ENV', 'development'),
  mongodbUri: getEnv('MONGODB_URI', 'mongodb://localhost:27017/finance-compliance'),
  jwtSecret: getEnv('JWT_SECRET', 'dev-secret-change-in-production'),
  redisUrl: getEnv('REDIS_URL', 'redis://localhost:6379'),
  internalServiceToken: getEnv('INTERNAL_SERVICE_TOKEN', 'internal-service-token'),
  services: {
    auth: getEnv('RABTUL_AUTH_URL', 'http://localhost:4002'),
    payment: getEnv('RABTUL_PAYMENT_URL', 'http://localhost:4001'),
    wallet: getEnv('RABTUL_WALLET_URL', 'http://localhost:4004'),
    notification: getEnv('RABTUL_NOTIFICATION_URL', 'http://localhost:4005'),
    analytics: getEnv('ANALYTICS_SERVICE_URL', 'http://localhost:4016'),
    eventBus: getEnv('EVENT_BUS_URL', 'http://localhost:4025'),
  },
};

export default config;

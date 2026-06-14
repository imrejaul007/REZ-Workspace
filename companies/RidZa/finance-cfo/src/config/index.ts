/**
 * Configuration Module
 * Loads environment variables and provides typed config
 */

import dotenv from 'dotenv';

// Load .env file
dotenv.config();

interface AppConfig {
  port: number;
  nodeEnv: string;
  mongodbUri: string;
  jwtSecret: string;
  redisUrl: string;
  service: {
    name: string;
    version: string;
  };
  auth: {
    internalToken: string;
    authServiceUrl: string;
  };
  services: {
    auth: string;
    payment: string;
    wallet: string;
    notification: string;
  };
}

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ?? defaultValue ?? '';
}

function getEnvNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (!value) {
    return defaultValue ?? 0;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid number for ${key}: ${value}`);
  }
  return parsed;
}

const config: AppConfig = {
  port: getEnvNumber('PORT', 3000),
  nodeEnv: getEnv('NODE_ENV', 'development'),
  mongodbUri: getEnv('MONGODB_URI', 'mongodb://localhost:27017/finance-cfo'),
  jwtSecret: getEnv('JWT_SECRET', 'dev-secret-change-in-production'),
  redisUrl: getEnv('REDIS_URL', 'redis://localhost:6379'),
  service: {
    name: 'finance-cfo',
    version: process.env.npm_package_version ?? '1.0.0',
  },
  auth: {
    internalToken: getEnv('INTERNAL_SERVICE_TOKEN', ''),
    authServiceUrl: getEnv('RABTUL_AUTH_URL', 'http://localhost:4002'),
  },
  services: {
    auth: getEnv('RABTUL_AUTH_URL', 'http://localhost:4002'),
    payment: getEnv('RABTUL_PAYMENT_URL', 'http://localhost:4001'),
    wallet: getEnv('RABTUL_WALLET_URL', 'http://localhost:4004'),
    notification: getEnv('RABTUL_NOTIFICATION_URL', 'http://localhost:4005'),
  },
};

export default config;
export type { AppConfig };

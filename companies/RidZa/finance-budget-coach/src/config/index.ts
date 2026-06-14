/**
 * Configuration Loader
 * Loads all environment variables with validation
 */

import dotenv from 'dotenv';
import path from 'path';

// Load .env file in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

interface Config {
  port: number;
  nodeEnv: string;
  mongodb: {
    uri: string;
    options: {
      maxPoolSize: number;
      serverSelectionTimeoutMS: number;
      socketTimeoutMS: number;
    };
  };
  redis: {
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  services: {
    auth: string;
    payment: string;
    wallet: string;
    notification: string;
    analytics: string;
    eventBus: string;
    intent: string;
  };
  logging: {
    level: string;
  };
}

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

function getOptionalEnvVar(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

function getOptionalEnvVarAsInt(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (value) {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new Error(`Environment variable ${name} must be a valid integer`);
    }
    return parsed;
  }
  return defaultValue;
}

export const config: Config = {
  port: getOptionalEnvVarAsInt('PORT', 3000),
  nodeEnv: getOptionalEnvVar('NODE_ENV', 'development'),

  mongodb: {
    uri: getRequiredEnvVar('MONGODB_URI'),
    options: {
      maxPoolSize: getOptionalEnvVarAsInt('MONGODB_POOL_SIZE', 10),
      serverSelectionTimeoutMS: getOptionalEnvVarAsInt('MONGODB_TIMEOUT', 5000),
      socketTimeoutMS: getOptionalEnvVarAsInt('MONGODB_SOCKET_TIMEOUT', 45000),
    },
  },

  redis: {
    url: getOptionalEnvVar('REDIS_URL', 'redis://localhost:6379'),
  },

  jwt: {
    secret: getRequiredEnvVar('JWT_SECRET'),
    expiresIn: getOptionalEnvVar('JWT_EXPIRES_IN', '24h'),
  },

  services: {
    auth: getOptionalEnvVar('RABTUL_AUTH_URL', 'http://localhost:4002'),
    payment: getOptionalEnvVar('RABTUL_PAYMENT_URL', 'http://localhost:4001'),
    wallet: getOptionalEnvVar('RABTUL_WALLET_URL', 'http://localhost:4004'),
    notification: getOptionalEnvVar('RABTUL_NOTIFICATION_URL', 'http://localhost:4005'),
    analytics: getOptionalEnvVar('ANALYTICS_SERVICE_URL', 'http://localhost:4016'),
    eventBus: getOptionalEnvVar('EVENT_BUS_URL', 'http://localhost:4025'),
    intent: getOptionalEnvVar('INTENT_SERVICE_URL', 'http://localhost:4018'),
  },

  logging: {
    level: getOptionalEnvVar('LOG_LEVEL', 'info'),
  },
};

export default config;

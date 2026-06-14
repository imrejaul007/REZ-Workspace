import dotenv from 'dotenv';
import { AppConfig } from '../types';

// Load environment variables
dotenv.config();

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '4800', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/intent-signal-aggregator',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret-change-me',
  internalServiceKey: process.env.INTERNAL_SERVICE_KEY || 'default-internal-key',
  signalDedupWindowMs: parseInt(process.env.SIGNAL_DEDUP_WINDOW_MS || '300000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
};

export function validateConfig(): void {
  const required = ['port', 'mongoUri', 'redisUrl', 'jwtSecret'];

  for (const key of required) {
    if (!config[key as keyof AppConfig]) {
      throw new Error(`Missing required config: ${key}`);
    }
  }

  if (config.jwtSecret === 'default-jwt-secret-change-me') {
    logger.warn('WARNING: Using default JWT secret. Set JWT_SECRET in production!');
  }

  if (config.internalServiceKey === 'default-internal-key') {
    logger.warn('WARNING: Using default internal service key. Set INTERNAL_SERVICE_KEY in production!');
  }
}
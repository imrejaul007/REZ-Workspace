import { logger } from '../../shared/logger';
/**
 * RisaCare Environment Validation
 * Validates required environment variables at startup
 */

import { z } from 'zod';

// ============================================
// SCHEMAS
// ============================================

export const ServiceEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().default('4700'),
  SERVICE_VERSION: z.string().default('1.0.0'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export const RezIntelligenceEnvSchema = z.object({
  REZ_INTELLIGENCE_URL: z.string().url().default('http://localhost:4018'),
  REZ_INTELLIGENCE_API_KEY: z.string().min(1),
  HEALTH_EXPERT_URL: z.string().url().default('http://localhost:3011'),
  MEMORY_LAYER_URL: z.string().url().default('http://localhost:4201'),
  SIGNAL_AGGREGATOR_URL: z.string().url().default('http://localhost:4142'),
});

export const RabtulEnvSchema = z.object({
  AUTH_SERVICE_URL: z.string().url().default('http://localhost:4002'),
  PAYMENT_SERVICE_URL: z.string().url().default('http://localhost:4001'),
  WALLET_SERVICE_URL: z.string().url().default('http://localhost:4004'),
  NOTIFICATION_SERVICE_URL: z.string().url().default('http://localhost:4011'),
  BOOKING_SERVICE_URL: z.string().url().default('http://localhost:4020'),
  PROFILE_SERVICE_URL: z.string().url().default('http://localhost:4013'),
  INTERNAL_SERVICE_TOKEN: z.string().min(1),
});

export const DatabaseEnvSchema = z.object({
  MONGODB_URI: z.string().url().default('mongodb://localhost:27017/risa_care'),
});

export const SecurityEnvSchema = z.object({
  JWT_SECRET: z.string().min(32).optional(),
  ENCRYPTION_KEY: z.string().min(32).optional(),
});

// ============================================
// VALIDATORS
// ============================================

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  env: Record<string, string>;
}

export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const env: Record<string, string> = {};

  // Validate Service env
  try {
    const serviceEnv = ServiceEnvSchema.parse({
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      SERVICE_VERSION: process.env.SERVICE_VERSION,
      LOG_LEVEL: process.env.LOG_LEVEL,
    });
    Object.assign(env, serviceEnv);
  } catch (e) {
    errors.push(`Service env: ${(e as Error).message}`);
  }

  // Validate REZ Intelligence env
  try {
    const rezEnv = RezIntelligenceEnvSchema.parse({
      REZ_INTELLIGENCE_URL: process.env.REZ_INTELLIGENCE_URL,
      REZ_INTELLIGENCE_API_KEY: process.env.REZ_INTELLIGENCE_API_KEY,
      HEALTH_EXPERT_URL: process.env.HEALTH_EXPERT_URL,
      MEMORY_LAYER_URL: process.env.MEMORY_LAYER_URL,
      SIGNAL_AGGREGATOR_URL: process.env.SIGNAL_AGGREGATOR_URL,
    });
    Object.assign(env, rezEnv);
  } catch (e) {
    errors.push(`REZ Intelligence env: ${(e as Error).message}`);
  }

  // Validate RABTUL env
  try {
    const rabtulEnv = RabtulEnvSchema.parse({
      AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL,
      PAYMENT_SERVICE_URL: process.env.PAYMENT_SERVICE_URL,
      WALLET_SERVICE_URL: process.env.WALLET_SERVICE_URL,
      NOTIFICATION_SERVICE_URL: process.env.NOTIFICATION_SERVICE_URL,
      BOOKING_SERVICE_URL: process.env.BOOKING_SERVICE_URL,
      PROFILE_SERVICE_URL: process.env.PROFILE_SERVICE_URL,
      INTERNAL_SERVICE_TOKEN: process.env.INTERNAL_SERVICE_TOKEN,
    });
    Object.assign(env, rabtulEnv);
  } catch (e) {
    errors.push(`RABTUL env: ${(e as Error).message}`);
  }

  // Validate Database env
  try {
    const dbEnv = DatabaseEnvSchema.parse({
      MONGODB_URI: process.env.MONGODB_URI,
    });
    Object.assign(env, dbEnv);
  } catch (e) {
    errors.push(`Database env: ${(e as Error).message}`);
  }

  // Warnings for production
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET) {
      warnings.push('JWT_SECRET not set in production');
    }
    if (!process.env.ENCRYPTION_KEY) {
      warnings.push('ENCRYPTION_KEY not set in production');
    }
    if (!process.env.SENTRY_DSN) {
      warnings.push('SENTRY_DSN not set - error tracking disabled');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    env,
  };
}

// ============================================
// HELPERS
// ============================================

export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

export function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

// ============================================
// INIT FUNCTION
// ============================================

export function initEnvironment(): void {
  const result = validateEnvironment();

  if (!result.valid) {
    logger.error('❌ Environment validation failed:');
    result.errors.forEach(e => logger.error(`  - ${e}`));
    process.exit(1);
  }

  if (result.warnings.length > 0) {
    logger.warn('⚠️  Environment warnings:');
    result.warnings.forEach(w => logger.warn(`  - ${w}`));
  }

  logger.info('✅ Environment validated successfully');
}

/**
 * Environment variable validation using Zod
 * Ensures all required config is present and properly typed at startup
 * Fails fast if validation fails, preventing runtime errors
 */

import { z } from 'zod';
import { logger } from './logger';

const envSchema = z.object({
  // === Core Service ===
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().transform(Number).default('3006'),
  HEALTH_PORT: z.string().transform(Number).default('0'),
  SERVICE_NAME: z.string().default('rez-order-service'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // === Database [REQUIRED] ===
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  // === Cache [REQUIRED] ===
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_SENTINEL_HOSTS: z.string().optional(),
  REDIS_SENTINEL_NAME: z.string().default('mymaster'),
  REDIS_TLS: z.enum(['true', 'false']).default('false'),

  // === Authentication [REQUIRED] ===
  JWT_SECRET: z.string()
    .min(32, 'JWT_SECRET must be at least 32 characters')
    .describe('Used to sign and verify JWT tokens for user authentication'),
  JWT_MERCHANT_SECRET: z.string()
    .min(32, 'JWT_MERCHANT_SECRET must be at least 32 characters')
    .describe('Used to sign and verify JWT tokens for merchant authentication'),
  JWT_ADMIN_SECRET: z.string()
    .min(32, 'JWT_ADMIN_SECRET must be at least 32 characters')
    .describe('Used to sign and verify JWT tokens for admin authentication'),

  // === Internal Service Auth [REQUIRED] ===
  // Must have either INTERNAL_SERVICE_TOKENS_JSON or INTERNAL_SERVICE_TOKEN
  INTERNAL_SERVICE_TOKENS_JSON: z.string().optional(),
  INTERNAL_SERVICE_TOKEN: z.string().optional(),
  INTERNAL_SERVICE_HMAC_SECRET: z.string()
    .min(32, 'INTERNAL_SERVICE_HMAC_SECRET must be at least 32 characters')
    .describe('HMAC secret for verifying internal service tokens — must be kept confidential'),

  // === CORS [REQUIRED] ===
  CORS_ORIGIN: z.string().default('https://rez.money'),

  // === Observability [OPTIONAL] ===
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.string().transform(Number).optional(),
});

type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates environment variables and returns parsed config
 * Throws if validation fails
 */
export function validateEnv(): EnvConfig {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = Object.entries(parsed.error.flatten().fieldErrors)
      .map(([field, messages]) => `${field}: ${messages?.join(', ')}`)
      .join('\n');
    throw new Error(`[FATAL] Environment validation failed:\n${errors}`);
  }

  // Additional validation: at least one internal service token format must be present
  const { INTERNAL_SERVICE_TOKENS_JSON, INTERNAL_SERVICE_TOKEN, INTERNAL_SERVICE_HMAC_SECRET } = parsed.data;
  if (!INTERNAL_SERVICE_TOKENS_JSON && !INTERNAL_SERVICE_TOKEN) {
    throw new Error('[FATAL] Must set either INTERNAL_SERVICE_TOKENS_JSON or INTERNAL_SERVICE_TOKEN');
  }
  // C9 FIX: HMAC secret is now required — fail fast if missing
  if (!INTERNAL_SERVICE_HMAC_SECRET) {
    throw new Error('[FATAL] INTERNAL_SERVICE_HMAC_SECRET is required for secure internal token verification');
  }

  return parsed.data;
}

/**
 * Pre-validated environment config
 * Safe to use throughout the application
 */
export const env = validateEnv();

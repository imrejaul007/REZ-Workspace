/**
 * Environment variable validation using Zod
 * Ensures all required config is present and properly typed at startup
 * Fails fast if validation fails, preventing runtime errors
 */

import { z } from 'zod';

const envSchema = z.object({
  // === Core Service ===
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().transform(Number).default('3005'),
  HEALTH_PORT: z.string().transform(Number).default('0'),
  SERVICE_NAME: z.string().default('rez-catalog-service'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // === Database [REQUIRED] ===
  MONGODB_URI: z.string().url('MONGODB_URI must be a valid MongoDB connection string'),
  MONGODB_QUERY_TIMEOUT_MS: z.string().transform(Number).default('30000'),

  // === Cache [REQUIRED] ===
  REDIS_URL: z.string().url('REDIS_URL must be a valid Redis connection string'),
  REDIS_TLS: z.string().transform(v => v === 'true').default('false'),

  // === Internal Service Auth [REQUIRED] ===
  // Must have either INTERNAL_SERVICE_TOKENS_JSON or INTERNAL_SERVICE_TOKEN
  INTERNAL_SERVICE_TOKENS_JSON: z.string().optional(),
  INTERNAL_SERVICE_TOKEN: z.string().optional(),

  // === CORS [REQUIRED] ===
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // === Observability [OPTIONAL] ===
  SENTRY_DSN: z.string().optional(),
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
  const { INTERNAL_SERVICE_TOKENS_JSON, INTERNAL_SERVICE_TOKEN } = parsed.data;
  if (!INTERNAL_SERVICE_TOKENS_JSON && !INTERNAL_SERVICE_TOKEN) {
    throw new Error('[FATAL] Must set either INTERNAL_SERVICE_TOKENS_JSON or INTERNAL_SERVICE_TOKEN');
  }

  return parsed.data;
}

/**
 * Pre-validated environment config
 * Safe to use throughout the application
 */
export const env = validateEnv();

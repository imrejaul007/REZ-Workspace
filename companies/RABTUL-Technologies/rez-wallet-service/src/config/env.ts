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
  PORT: z.string().transform(Number).default('4004'),
  SERVICE_NAME: z.string().default('rez-wallet-service'),
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

  // === Internal Service Auth [REQUIRED] ===
  // Must have either INTERNAL_SERVICE_TOKENS_JSON or INTERNAL_SERVICE_TOKEN
  INTERNAL_SERVICE_TOKENS_JSON: z.string().optional(),
  INTERNAL_SERVICE_TOKEN: z.string().optional(),

  // === Wallet Service [OPTIONAL] ===
  MERCHANT_WALLET_ENCRYPTION_KEY: z.string().optional(),
  COIN_TO_RUPEE_RATE: z.string().transform(Number).optional(),
  REZ_COIN_TO_RUPEE_RATE: z.string().transform(Number).optional(),

  // === Service Integration ===
  ANALYTICS_EVENTS_URL: z.string().optional(),
  REZ_PAYMENT_SERVICE_URL: z.string().optional(),
  REZ_MERCHANT_SERVICE_URL: z.string().optional(),
  REZ_ECONOMIC_ENGINE_URL: z.string().optional(),
  REE_SERVICE_URL: z.string().default('http://localhost:4000/api'),
  REE_SERVICE_KEY: z.string().optional(),
  MONOLITH_URL: z.string().url('MONOLITH_URL must be a valid URL (required for settlement event notifications)'),

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
  const { INTERNAL_SERVICE_TOKENS_JSON, INTERNAL_SERVICE_TOKEN } = parsed.data;
  if (!INTERNAL_SERVICE_TOKENS_JSON && !INTERNAL_SERVICE_TOKEN) {
    throw new Error('[FATAL] Must set either INTERNAL_SERVICE_TOKENS_JSON or INTERNAL_SERVICE_TOKEN');
  }

  // Warn if coin conversion rates are missing
  const { COIN_TO_RUPEE_RATE, REZ_COIN_TO_RUPEE_RATE } = parsed.data;
  if (!COIN_TO_RUPEE_RATE && !REZ_COIN_TO_RUPEE_RATE) {
    logger.warn('[STARTUP] Coin to Rupee conversion rates not configured — will default to 1:1');
  }

  return parsed.data;
}

/**
 * Deferred environment config — validates lazily on first property access.
 * Module will load without crashing even if env vars are missing; the error
 * surfaces when the service first tries to use the config.
 */
let _validatedEnv: EnvConfig | null = null;

function getValidatedEnv(): EnvConfig {
  if (_validatedEnv) return _validatedEnv;
  _validatedEnv = validateEnv();
  return _validatedEnv;
}

// Proxy that validates on first access rather than at module load time
export const env: EnvConfig = new Proxy({} as EnvConfig, {
  get(_target, prop: string) {
    const validated = getValidatedEnv();
    const value = (validated as unknown)[prop];
    if (value === undefined) {
      throw new Error(`[ENV] Undefined environment variable: ${String(prop)}`);
    }
    return value;
  },
});

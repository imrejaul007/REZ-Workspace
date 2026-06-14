/**
 * Environment variable validation using Zod
 * Ensures all required config is present and properly typed at startup
 * Fails fast if validation fails, preventing runtime errors
 */

import { z } from 'zod';
// Use a local fallback logger to avoid circular dependency issues
// The real logger from @rez/shared is imported later in index.ts
const log = {
  warn: (message: string, ...args: unknown[]) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { logger } = require('./logger') as { logger: unknown };
      logger?.warn?.(message, ...args);
    } catch {
      console.warn(`[ENV] ${message}`, ...args); // Keep as fallback - logger not available yet
    }
  },
};

const envSchema = z.object({
  // === Core Service ===
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4001),
  HEALTH_PORT: z.coerce.number().int().positive().default(4101),
  SERVICE_NAME: z.string().default('rez-payment-service'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // === Database [REQUIRED] ===
  MONGODB_URI: z.string().url('MONGODB_URI must be a valid MongoDB connection string'),

  // === Cache [REQUIRED] ===
  REDIS_URL: z.string().url('REDIS_URL must be a valid Redis connection string'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_SENTINEL_HOSTS: z.string().optional(),
  REDIS_SENTINEL_NAME: z.string().default('mymaster'),

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

  // === Razorpay Integration [OPTIONAL] ===
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_CURRENCY: z.string().default('INR'),

  // === Service Integration ===
  WALLET_SERVICE_URL: z.string().optional().refine(
    (v) => !v || /^https?:\/\/.+/.test(v),
    { message: 'WALLET_SERVICE_URL must be a valid absolute URL (e.g. https://wallet.rez.money)' },
  ),
  MONOLITH_URL: z.string().refine(
    (v) => !v || /^https?:\/\/.+/.test(v),
    { message: 'MONOLITH_URL must be a valid absolute URL (required for refund event emission and payment status sync)' },
  ),
  INTERNAL_WEBHOOK_SECRET: z.string().optional(),
  NBFC_PARTNER: z.string().optional(),

  // === CORS [REQUIRED] ===
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

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

  // Warn if Razorpay is partially configured
  const hasRazorpayId = !!process.env.RAZORPAY_KEY_ID;
  const hasRazorpaySecret = !!process.env.RAZORPAY_KEY_SECRET;
  if ((hasRazorpayId || hasRazorpaySecret) && (!hasRazorpayId || !hasRazorpaySecret)) {
    log.warn('[STARTUP] Razorpay partially configured — both RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET required for full integration');
  }
  if (hasRazorpayId && hasRazorpaySecret && !process.env.RAZORPAY_WEBHOOK_SECRET) {
    log.warn('[STARTUP] RAZORPAY_WEBHOOK_SECRET not set — webhook verification will fail');
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

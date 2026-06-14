import { z } from 'zod';

const log = {
  warn: (message: string, ...args: unknown[]) => {
    try {
      const { logger } = require('./logger') as { logger: unknown };
      if (logger && typeof logger === 'object' && 'warn' in logger) {
        (logger as { warn: (msg: string, ...args: unknown[]) => void }).warn(message, ...args);
      }
    } catch {
      console.warn(`[ENV] ${message}`, ...args);
    }
  },
};

const envSchema = z.object({
  // === Core Service ===
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4005),
  HEALTH_PORT: z.coerce.number().int().positive().default(4105),
  SERVICE_NAME: z.string().default('rez-hotel-pos-service'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // === Database [REQUIRED] ===
  MONGODB_URI: z.string().url('MONGODB_URI must be a valid MongoDB connection string'),

  // === Cache [REQUIRED] ===
  REDIS_URL: z.string().url('REDIS_URL must be a valid Redis connection string'),

  // === Authentication [REQUIRED] ===
  JWT_SECRET: z.string()
    .min(32, 'JWT_SECRET must be at least 32 characters')
    .describe('Used to sign and verify JWT tokens'),

  // === Internal Service Auth [REQUIRED] ===
  INTERNAL_SERVICE_TOKENS_JSON: z.string().optional(),

  // === Service Integration ===
  PAYMENT_SERVICE_URL: z.string().optional().refine(
    (v) => !v || /^https?:\/\/.+/.test(v),
    { message: 'PAYMENT_SERVICE_URL must be a valid absolute URL' },
  ),
  // RABTUL: Additional fallback payment URL
  AUTH_SERVICE_URL: z.string().optional(),
  PMS_SERVICE_URL: z.string().optional().refine(
    (v) => !v || /^https?:\/\/.+/.test(v),
    { message: 'PMS_SERVICE_URL must be a valid absolute URL' },
  ),
  // RABTUL: Internal service token
  INTERNAL_SERVICE_TOKEN: z.string().optional(),

  // === CORS [REQUIRED] ===
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // === Observability [OPTIONAL] ===
  SENTRY_DSN: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.string().transform(Number).optional(),
});

type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = Object.entries(parsed.error.flatten().fieldErrors)
      .map(([field, messages]) => `${field}: ${messages?.join(', ')}`)
      .join('\n');
    throw new Error(`[FATAL] Environment validation failed:\n${errors}`);
  }

  if (!process.env.INTERNAL_SERVICE_TOKENS_JSON) {
    log.warn('[STARTUP] INTERNAL_SERVICE_TOKENS_JSON not set — using empty token map');
  }

  if (!process.env.PAYMENT_SERVICE_URL) {
    log.warn('[STARTUP] PAYMENT_SERVICE_URL not set — payment processing will be limited');
  }

  if (!process.env.PMS_SERVICE_URL) {
    log.warn('[STARTUP] PMS_SERVICE_URL not set — PMS integration disabled');
  }

  return parsed.data;
}

let _validatedEnv: EnvConfig | null = null;

function getValidatedEnv(): EnvConfig {
  if (_validatedEnv) return _validatedEnv;
  _validatedEnv = validateEnv();
  return _validatedEnv;
}

export const env: EnvConfig = new Proxy({} as EnvConfig, {
  get(_target, prop: string) {
    const validated = getValidatedEnv();
    const value = (validated as Record<string, unknown>)[prop];
    if (value === undefined) {
      throw new Error(`[ENV] Undefined environment variable: ${String(prop)}`);
    }
    return value;
  },
});

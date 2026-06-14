import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().transform(Number).default('4019'),
  SERVICE_NAME: z.string().default('rez-referral-os'),

  // Database [REQUIRED]
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  // Cache [REQUIRED]
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  REDIS_PASSWORD: z.string().optional(),

  // Auth [REQUIRED]
  JWT_SECRET: z.string().min(32),
  JWT_MERCHANT_SECRET: z.string().min(32),

  // Internal Auth [REQUIRED]
  INTERNAL_SERVICE_TOKENS_JSON: z.string().optional(),
  INTERNAL_SERVICE_TOKEN: z.string().optional(),

  // Service URLs
  WALLET_SERVICE_URL: z.string().default('http://localhost:4004'),
  AUTH_SERVICE_URL: z.string().default('http://localhost:4002'),
  EVENT_BUS_URL: z.string().default('http://localhost:4025'),

  // Observability [OPTIONAL]
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().default('development'),

  // IP Allowlist [OPTIONAL]
  INTERNAL_IP_ALLOWLIST: z.string().default('127.0.0.1,::1,::ffff:127.0.0.1'),
});

export interface EnvConfig {
  NODE_ENV: 'development' | 'staging' | 'production';
  PORT: number;
  SERVICE_NAME: string;
  MONGODB_URI: string;
  REDIS_URL: string;
  REDIS_PASSWORD?: string;
  JWT_SECRET: string;
  JWT_MERCHANT_SECRET: string;
  INTERNAL_SERVICE_TOKENS_JSON?: string;
  INTERNAL_SERVICE_TOKEN?: string;
  WALLET_SERVICE_URL: string;
  AUTH_SERVICE_URL: string;
  EVENT_BUS_URL: string;
  SENTRY_DSN?: string;
  SENTRY_ENVIRONMENT: string;
  INTERNAL_IP_ALLOWLIST: string[];
}

let validatedEnv: EnvConfig | null = null;

export function validateEnv(): EnvConfig {
  if (validatedEnv) return validatedEnv;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const errors = Object.entries(parsed.error.flatten().fieldErrors)
      .map(([field, messages]) => `${field}: ${messages?.join(', ')}`)
      .join('\n');
    throw new Error(`[FATAL] Environment validation failed:\n${errors}`);
  }

  const raw = parsed.data;
  validatedEnv = {
    ...raw,
    PORT: typeof raw.PORT === 'string' ? parseInt(raw.PORT, 10) : raw.PORT,
    INTERNAL_IP_ALLOWLIST: raw.INTERNAL_IP_ALLOWLIST.split(',').map((ip) => ip.trim()),
  };

  return validatedEnv;
}

// Simple export that gets validated on first access
let _env: EnvConfig | null = null;
export const env: EnvConfig = new Proxy({} as EnvConfig, {
  get(_target, prop: keyof EnvConfig) {
    if (!_env) {
      _env = validateEnv();
    }
    return _env[prop];
  },
});

/**
 * Environment Configuration with Validation
 *
 * Features:
 * - Zod schema validation
 * - Required vs optional with defaults
 * - Cross-service configuration
 *
 * @module @adbazaar/shared-utils/config
 */

import { z } from 'zod';

// Base configuration schema
const BaseConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  SERVICE_NAME: z.string(),
  SERVICE_VERSION: z.string().optional(),
});

// MongoDB configuration
const MongoConfigSchema = z.object({
  MONGODB_URI: z.string().optional(),
  MONGO_URI: z.string().optional(),
  MONGODB_DATABASE: z.string().optional(),
});

// Redis configuration
const RedisConfigSchema = z.object({
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().transform(Number).optional(),
});

// JWT configuration
const JWTConfigSchema = z.object({
  JWT_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_ALGORITHM: z.enum(['HS256', 'HS384', 'HS512']).default('HS256'),
});

// External services
const ExternalServicesSchema = z.object({
  // RABTUL Services
  RABTUL_AUTH_URL: z.string().default('http://localhost:4002'),
  RABTUL_WALLET_URL: z.string().default('http://localhost:4004'),
  RABTUL_PAYMENT_URL: z.string().default('http://localhost:4001'),
  RABTUL_NOTIFICATION_URL: z.string().default('http://localhost:4005'),

  // HOJAI Services
  HOJAI_GATEWAY_URL: z.string().default('http://localhost:4500'),
  HOJAI_INTELLIGENCE_URL: z.string().default('http://localhost:4530'),

  // Internal services (NO DEFAULTS for production - must be set)
  ADS_SERVICE_URL: z.string().optional(),
  MARKETING_SERVICE_URL: z.string().optional(),
  DOOH_SERVICE_URL: z.string().optional(),
});

// Security configuration
const SecurityConfigSchema = z.object({
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
  BCRYPT_ROUNDS: z.string().transform(Number).default('10'),
});

// Monitoring configuration
const MonitoringConfigSchema = z.object({
  SENTRY_DSN: z.string().optional(),
  PROMETHEUS_ENABLED: z.string().transform(v => v === 'true').default('false'),
  HEALTH_CHECK_SECRET: z.string().optional(),
});

// Build combined schema
export const ConfigSchema = BaseConfigSchema
  .merge(MongoConfigSchema)
  .merge(RedisConfigSchema)
  .merge(JWTConfigSchema)
  .merge(ExternalServicesSchema)
  .merge(SecurityConfigSchema)
  .merge(MonitoringConfigSchema);

export type Config = z.infer<typeof ConfigSchema>;

let cachedConfig: Config | null = null;

/**
 * Load and validate configuration from environment
 */
export function loadConfig<T extends z.ZodTypeAny = typeof ConfigSchema>(
  schema: T = ConfigSchema as unknown as T
): z.infer<T> {
  if (cachedConfig) {
    return cachedConfig as z.infer<T>;
  }

  const result = schema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors.map(
      e => `  - ${e.path.join('.')}: ${e.message}`
    ).join('\n');

    throw new Error(
      `Configuration validation failed:\n${errors}\n\n` +
      'Please set the required environment variables or check your .env file.'
    );
  }

  cachedConfig = result.data;
  return cachedConfig as z.infer<T>;
}

/**
 * Get MongoDB connection URI
 */
export function getMongoURI(): string {
  const config = loadConfig();
  return (
    config.MONGODB_URI ||
    config.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    'mongodb://localhost:27017/adbazaar'
  );
}

/**
 * Get Redis connection URL
 */
export function getRedisURL(): string {
  const config = loadConfig();

  if (config.REDIS_URL) return config.REDIS_URL;

  const host = config.REDIS_HOST || 'localhost';
  const port = config.REDIS_PORT || 6379;

  return `redis://${host}:${port}`;
}

/**
 * Get service URL with fallback
 */
export function getServiceUrl(serviceName: keyof typeof ExternalServicesSchema.shape): string {
  const config = loadConfig();
  const envKey = `${serviceName.toUpperCase()}_URL`;
  return (config as Record<string, string>)[envKey] || process.env[envKey] || '';
}

/**
 * Clear cached configuration (useful for testing)
 */
export function clearConfigCache(): void {
  cachedConfig = null;
}

export default { loadConfig, getMongoURI, getRedisURL, getServiceUrl, clearConfigCache };
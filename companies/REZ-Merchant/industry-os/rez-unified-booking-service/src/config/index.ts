import { z } from 'zod';
import { logger } from '../utils/logger';

// Vertical service URL schema
const verticalUrlSchema = z
  .string()
  .url()
  .default(() => 'http://localhost:3001');

// Environment configuration schema
const envSchema = z.object({
  // Service Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1024).max(65535).default(4072),
  INTERNAL_API_KEY: z.string().min(32).optional(),

  // MongoDB
  MONGODB_URI: z.string().url().default('mongodb://localhost:27017/rez-unified-booking'),

  // Redis (optional)
  REDIS_URL: z.string().url().optional(),
  REDIS_ENABLED: z.boolean().default(false),

  // Vertical Service URLs
  RESTAURANT_BOOKING_URL: verticalUrlSchema,
  HOTEL_BOOKING_URL: verticalUrlSchema,
  SALON_BOOKING_URL: verticalUrlSchema,
  SPA_BOOKING_URL: verticalUrlSchema,
  GYM_BOOKING_URL: verticalUrlSchema,
  EDUCATION_BOOKING_URL: verticalUrlSchema,
  EVENTS_BOOKING_URL: verticalUrlSchema,
  AUTOMOTIVE_BOOKING_URL: verticalUrlSchema,
  MEDICAL_BOOKING_URL: verticalUrlSchema,
  TOURS_BOOKING_URL: verticalUrlSchema,
  RENTALS_BOOKING_URL: verticalUrlSchema,
  ENTERTAINMENT_BOOKING_URL: verticalUrlSchema,
  CLEANING_BOOKING_URL: verticalUrlSchema,
  REPAIR_BOOKING_URL: verticalUrlSchema,
  CHILDCARE_BOOKING_URL: verticalUrlSchema,
  PETCARE_BOOKING_URL: verticalUrlSchema,
  LEGAL_BOOKING_URL: verticalUrlSchema,

  // RABTUL Integration
  RABTUL_API_KEY: z.string().optional(),
  RABTUL_WEBHOOK_URL: z.string().url().optional(),
  RABTUL_ENABLED: z.boolean().default(false),

  // Payment Configuration
  PAYMENT_GATEWAY_URL: z.string().url().optional(),
  PAYMENT_GATEWAY_API_KEY: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().min(1).default(100),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'simple']).default('json'),

  // Timeouts
  VERTICAL_SERVICE_TIMEOUT_MS: z.coerce.number().int().min(1000).default(30000),
  VERTICAL_SERVICE_RETRY_COUNT: z.coerce.number().int().min(0).max(5).default(3),

  // Cache
  CACHE_TTL_SECONDS: z.coerce.number().int().min(0).default(300),
});

export type AppConfig = z.infer<typeof envSchema>;

let config: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (config) {
    return config;
  }

  try {
    // Load environment variables from .env file
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
      const errors = result.error.errors.map(
        (e) => `${e.path.join('.')}: ${e.message}`
      );
      logger.error('Configuration validation failed', {
        errors,
        env: process.env.NODE_ENV,
      });
      throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }

    config = result.data;

    logger.info('Configuration loaded successfully', {
      nodeEnv: config.NODE_ENV,
      port: config.PORT,
      verticalsConfigured: Object.keys(config).filter((k) =>
        k.endsWith('_BOOKING_URL')
      ).length,
    });

    return config;
  } catch (error) {
    logger.error('Failed to load configuration', { error });
    throw error;
  }
}

export function getConfig(): AppConfig {
  if (!config) {
    return loadConfig();
  }
  return config;
}

// Reset config for testing
export function resetConfig(): void {
  config = null;
}
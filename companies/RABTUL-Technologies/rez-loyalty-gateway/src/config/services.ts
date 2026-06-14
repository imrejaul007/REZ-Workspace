/**
 * Service Registry Configuration
 * Central configuration for all backend services
 */

import { z } from 'zod';
import { SERVICE_REGISTRY, ServiceConfig } from '../types/index.js';

export const ServiceRegistrySchema = z.object({
  wallet: ServiceConfig,
  unifiedLoyalty: ServiceConfig,
  prive: ServiceConfig,
  restaurantLoyalty: ServiceConfig,
  referralOS: ServiceConfig,
  cashbackService: ServiceConfig,
});

export type ServiceRegistry = z.infer<typeof ServiceRegistrySchema>;

// Environment validation
export const EnvSchema = z.object({
  PORT: z.string().default('4601'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // MongoDB
  MONGODB_URI: z.string().default('mongodb://localhost:27017/rez_loyalty_gateway'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Auth
  INTERNAL_SERVICE_TOKEN: z.string(),

  // Service URLs
  WALLET_SERVICE_URL: z.string().default('http://localhost:4004'),
  UNIFIED_LOYALTY_URL: z.string().default('http://localhost:4602'),
  PRIVE_SERVICE_URL: z.string().default('http://localhost:4070'),
  RESTAURANT_LOYALTY_URL: z.string().default('http://localhost:4301'),
  REFERRAL_OS_URL: z.string().default('http://localhost:4302'),
  CASHBACK_SERVICE_URL: z.string().default('http://localhost:4303'),

  // Sync Settings
  SYNC_CACHE_TTL: z.string().default('300'),
  SYNC_RETRY_ATTEMPTS: z.string().default('3'),
  SYNC_RETRY_DELAY: z.string().default('1000'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
});

export type Env = z.infer<typeof EnvSchema>;

export function getEnv(): Env {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.format());
    process.exit(1);
  }
  return result.data;
}

export const env = getEnv();

// Override service URLs from environment
export const serviceConfig: ServiceRegistry = {
  wallet: {
    ...SERVICE_REGISTRY.wallet,
    baseUrl: env.WALLET_SERVICE_URL,
  },
  unifiedLoyalty: {
    ...SERVICE_REGISTRY.unifiedLoyalty,
    baseUrl: env.UNIFIED_LOYALTY_URL,
  },
  prive: {
    ...SERVICE_REGISTRY.prive,
    baseUrl: env.PRIVE_SERVICE_URL,
  },
  restaurantLoyalty: {
    ...SERVICE_REGISTRY.restaurantLoyalty,
    baseUrl: env.RESTAURANT_LOYALTY_URL,
  },
  referralOS: {
    ...SERVICE_REGISTRY.referralOS,
    baseUrl: env.REFERRAL_OS_URL,
  },
  cashbackService: {
    ...SERVICE_REGISTRY.cashbackService,
    baseUrl: env.CASHBACK_SERVICE_URL,
  },
};

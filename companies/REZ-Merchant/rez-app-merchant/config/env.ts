import { logger } from '@/utils/logger';

const REQUIRED_PRODUCTION_ENV_VARS = [
  'EXPO_PUBLIC_API_BASE_URL',
  'EXPO_PUBLIC_RAZORPAY_KEY_ID',
  'EXPO_PUBLIC_SENTRY_DSN',
  'EXPO_PUBLIC_MERCHANT_SERVICE_URL',
] as const;

export function validateProductionEnv(): void {
  const isProduction = process.env.EXPO_PUBLIC_ENVIRONMENT === 'production';
  if (!isProduction) return;

  for (const key of REQUIRED_PRODUCTION_ENV_VARS) {
    if (!process.env[key]) {
      logger.warn(`[ENV] WARNING: Missing critical env var in production: ${key}`);
    }
  }
}

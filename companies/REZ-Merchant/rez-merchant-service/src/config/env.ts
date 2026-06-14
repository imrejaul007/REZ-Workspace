/**
 * Environment variable validation using Zod
 * Ensures all required config is present and properly typed at startup
 * Fails fast if validation fails, preventing runtime errors
 */

import { z } from 'zod';
import { logger } from './logger';

const envSchema = z.object({
  // === Core Service ===
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4005),
  SERVICE_NAME: z.string().default('rez-merchant-service'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // === Database [REQUIRED] ===
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  // === Cache [REQUIRED] ===
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  // === Authentication [REQUIRED] ===
  JWT_MERCHANT_SECRET: z.string()
    .min(32, 'JWT_MERCHANT_SECRET must be at least 32 characters')
    .describe('Used to sign and verify JWT tokens for merchant authentication'),

  // === JWT Token Expiry [OPTIONAL] ===
  JWT_MERCHANT_EXPIRES_IN: z.string().default('1h'),

  // === Encryption [REQUIRED] ===
  ENCRYPTION_KEY: z.string()
    .min(32, 'ENCRYPTION_KEY must be at least 32 characters')
    .describe('Used for encrypting sensitive merchant data'),

  // === Internal Service Auth [REQUIRED] ===
  // Must have either INTERNAL_SERVICE_TOKENS_JSON or INTERNAL_SERVICE_TOKEN
  INTERNAL_SERVICE_TOKENS_JSON: z.string().optional(),
  INTERNAL_SERVICE_TOKEN: z.string().optional(),

  // === Service URLs [REQUIRED for internal calls] ===
  REZ_AUTH_SERVICE_URL: z.string().url().default('http://localhost:4002'),
  // RABTUL: Primary auth service URL (overrides REZ_AUTH_SERVICE_URL when set)
  AUTH_SERVICE_URL: z.string().url().optional(),

  // === REZ OAuth2 Partner [OPTIONAL] ===
  PARTNER_REZ_MERCHANT_CLIENT_ID: z.string().optional(),
  PARTNER_REZ_MERCHANT_CLIENT_SECRET: z.string().optional(),
  PARTNER_REZ_MERCHANT_REDIRECT_URI: z.string().url().optional(),

  // === Additional Service URLs [OPTIONAL] ===
  KARMA_SERVICE_URL: z.string().url().optional(),
  REZ_KARMA_SERVICE_URL: z.string().url().optional(),
  BACKEND_URL: z.string().url().optional(),
  API_URL: z.string().url().optional(),
  // RABTUL: Notification service URL
  NOTIFICATION_SERVICE_URL: z.string().url().optional(),

  // === Bridge Service [OPTIONAL] ===
  INTERNAL_BRIDGE_TOKEN: z.string().optional(),

  // === Internal Webhook Secret [OPTIONAL] ===
  // Used to call the monolith's internal payment routes (merchant-suspend-notify, etc.)
  INTERNAL_WEBHOOK_SECRET: z.string().optional(),

  // === Nextabizz Webhook Secret [OPTIONAL] ===
  NEXTABIZZ_WEBHOOK_SECRET: z.string()
    .min(32, 'NEXTABIZZ_WEBHOOK_SECRET must be at least 32 characters')
    .optional(),

  // === Razorpay [OPTIONAL] ===
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),

  // === Network [OPTIONAL] ===
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(1),

  // === Business Rules [OPTIONAL] ===
  PLATFORM_COMMISSION_RATE: z.coerce.number().min(0).max(1).default(0.05),

  // === SMS Service [OPTIONAL] ===
  MSG91_API_KEY: z.string().optional(),
  MSG91_TEMPLATE_ID: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),

  // === OTP Security [OPTIONAL but RECOMMENDED] ===
  // Server-side pepper for OTP hashing - makes rainbow tables ineffective
  // Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  OTP_PEPPER: z.string().min(32).optional(),

  // === File Upload [OPTIONAL] ===
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // === QR Code [REQUIRED] ===
  QR_SECRET: z.string().min(32, 'QR_SECRET must be at least 32 characters'),

  // === CORS [OPTIONAL] ===
  CORS_ALLOWED_ORIGINS: z.string().default(''),

  // === Observability [OPTIONAL] ===
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).optional(),
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

  // Warn if SMS provider is partially configured
  const hasMsg91Key = !!process.env.MSG91_API_KEY;
  const hasTwilio = !!process.env.TWILIO_ACCOUNT_SID;
  if (!hasMsg91Key && !hasTwilio) {
    logger.warn('[STARTUP] No SMS provider configured — SMS operations will fail');
  }

  // Warn if Cloudinary is partially configured
  const hasCloudinaryName = !!process.env.CLOUDINARY_CLOUD_NAME;
  const hasCloudinaryKey = !!process.env.CLOUDINARY_API_KEY;
  const hasCloudinarySecret = !!process.env.CLOUDINARY_API_SECRET;
  if ((hasCloudinaryName || hasCloudinaryKey || hasCloudinarySecret) &&
      (!hasCloudinaryName || !hasCloudinaryKey || !hasCloudinarySecret)) {
    logger.warn('[STARTUP] Cloudinary partially configured — file uploads will fail');
  }

  // FIX-STARTUP-001: Detect weak/development secrets in production
  // SECURITY FIX: Changed pattern to check full value, not just prefix.
  // Previously /^pattern/ only matched values STARTING with weak words, allowing
  // values like "test-abc" to pass if the weak word wasn't at the start.
  if (process.env.NODE_ENV === 'production') {
    const weakValuePatterns = [
      /test/i,
      /dev/i,
      /development/i,
      /^secret$/i,
      /^password$/i,
      /changeme/i,
    ];

    const secretsToCheck = [
      'JWT_MERCHANT_SECRET',
      'ENCRYPTION_KEY',
      'INTERNAL_SERVICE_TOKEN',
      'INTERNAL_SERVICE_TOKENS_JSON',
    ];

    for (const key of secretsToCheck) {
      const value = process.env[key];
      if (value) {
        // Check if value CONTAINS any weak pattern anywhere in the string
        for (const pattern of weakValuePatterns) {
          if (pattern.test(value)) {
            logger.error(`[FATAL] ${key} appears to contain a weak/development value in production`);
            throw new Error(`[FATAL] ${key} contains a weak value (matched pattern "${pattern}"). Set a strong secret in production.`);
          }
        }
      }
    }
  }

  return parsed.data;
}

/**
 * Pre-validated environment config
 * Safe to use throughout the application
 */
export const env = validateEnv();

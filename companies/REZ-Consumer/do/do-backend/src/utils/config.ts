import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  REZ_API_URL: z.string().default('http://localhost:3000'),
  REZ_API_KEY: z.string().default(''),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().refine(
    (val) => val === '*' || val.startsWith('http'),
    { message: 'CORS_ORIGIN must be a valid URL or * for development' }
  ),
  RATE_LIMIT_WINDOW_MS: z.string().default('60000'),
  RATE_LIMIT_MAX: z.string().default('100'),
  OTP_SECRET: z.string().min(32, 'OTP_SECRET must be at least 32 characters'),
});

// Development defaults (NOT for production)
const devDefaults = {
  JWT_SECRET: 'dev-only-not-for-production-minimum-32-chars',
  OTP_SECRET: 'dev-otp-secret-not-for-production-32chars',
  CORS_ORIGIN: '*',
};

const parsed = envSchema.safeParse({
  ...process.env,
  // Apply dev defaults only if not in production and not set
  ...(process.env.NODE_ENV !== 'production' && !process.env.JWT_SECRET ? devDefaults : {}),
});

if (!parsed.success) {
  logger.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

// Critical check: Ensure production has proper secrets
if (parsed.data.NODE_ENV === 'production') {
  const missingSecrets: string[] = [];

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === devDefaults.JWT_SECRET) {
    missingSecrets.push('JWT_SECRET');
  }
  if (!process.env.OTP_SECRET || process.env.OTP_SECRET === devDefaults.OTP_SECRET) {
    missingSecrets.push('OTP_SECRET');
  }
  if (process.env.CORS_ORIGIN === '*') {
    missingSecrets.push('CORS_ORIGIN (cannot be * in production)');
  }

  if (missingSecrets.length > 0) {
    logger.error('PRODUCTION SECURITY ERROR: Missing required environment variables:', missingSecrets);
    process.exit(1);
  }
}

export const config = parsed.data;

export const isProduction = config.NODE_ENV === 'production';
export const isDevelopment = config.NODE_ENV === 'development';
